"""Manim render server for TexToImg.

POST /api/animate  {latex, style, format, quality, theme}  ->  GIF or MP4 bytes

Manim needs Python, a LaTeX distribution and ffmpeg, so it cannot run inside
the Cloudflare/Vercel functions that serve the rest of the app. Run this
server next to the frontend (see README) and point VITE_MANIM_API_URL at it.
"""

import asyncio
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path
from typing import Literal

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

HERE = Path(__file__).resolve().parent
CACHE_DIR = Path(os.environ.get("MANIM_CACHE_DIR", Path(tempfile.gettempdir()) / "textoimg-manim-cache"))
CACHE_DIR.mkdir(parents=True, exist_ok=True)
MAX_CACHE_FILES = 200
RENDER_TIMEOUT = int(os.environ.get("MANIM_RENDER_TIMEOUT", "120"))
# Rendering is CPU-heavy; queue requests beyond this many at once
render_slots = asyncio.Semaphore(int(os.environ.get("MANIM_CONCURRENCY", "2")))

QUALITY_FLAGS = {"low": "l", "medium": "m", "high": "h"}
MEDIA_TYPES = {"gif": "image/gif", "mp4": "video/mp4"}

# Commands that read/write files or change TeX's parsing rules. Equations never
# need them, and blocking them keeps the server's files out of rendered output.
FORBIDDEN_TEX = re.compile(
    r"\\(input|include|includegraphics|openin|openout|read|write|immediate|"
    r"catcode|csname|def|edef|gdef|xdef|let|newcommand|renewcommand|"
    r"usepackage|documentclass|special|directlua|jobname|loop|verbatiminput)(?![a-zA-Z])"
)


class AnimateRequest(BaseModel):
    latex: str = Field(min_length=1, max_length=2000)
    style: Literal["write", "lines", "fade", "highlight"] = "write"
    format: Literal["gif", "mp4"] = "gif"
    quality: Literal["low", "medium", "high"] = "medium"
    theme: Literal["light", "dark"] = "light"


app = FastAPI(title="TexToImg Manim server")
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.environ.get("ALLOWED_ORIGINS", "*").split(","),
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


@app.get("/api/health")
def health():
    return {"ok": True}


@app.post("/api/animate")
async def animate(req: AnimateRequest):
    if FORBIDDEN_TEX.search(req.latex):
        raise HTTPException(400, "This LaTeX uses a command that is not allowed for animations.")

    key = hashlib.sha256(req.model_dump_json().encode()).hexdigest()[:32]
    cached = CACHE_DIR / f"{key}.{req.format}"
    if not cached.exists():
        async with render_slots:
            if not cached.exists():
                await asyncio.to_thread(render, req, cached)
        prune_cache()

    return FileResponse(
        cached,
        media_type=MEDIA_TYPES[req.format],
        filename=f"equation.{req.format}",
        headers={"Cache-Control": "public, max-age=86400"},
    )


def render(req: AnimateRequest, dest: Path) -> None:
    with tempfile.TemporaryDirectory(prefix="manim-") as tmp:
        job_file = Path(tmp) / "job.json"
        job_file.write_text(json.dumps({"latex": req.latex, "style": req.style, "theme": req.theme}))

        env = {
            **os.environ,
            "MANIM_JOB": str(job_file),
            # TeX Live settings: no shell escape, and only read/write files
            # in the working directory (paranoid mode).
            "shell_escape": "f",
            "openin_any": "p",
            "openout_any": "p",
        }
        cmd = [
            sys.executable, "-m", "manim", "render",
            f"-q{QUALITY_FLAGS[req.quality]}",
            # Always render MP4: Manim's own GIFs carry per-frame noise that makes
            # them ~20x larger than the palette-optimised conversion below.
            "--format", "mp4",
            "--media_dir", tmp,
            "--disable_caching",
            "--progress_bar", "none",
            "-o", "equation",
            str(HERE / "scene.py"), "EquationScene",
        ]
        try:
            proc = subprocess.run(
                cmd, cwd=tmp, env=env, capture_output=True, text=True, timeout=RENDER_TIMEOUT
            )
        except subprocess.TimeoutExpired:
            raise HTTPException(504, "Rendering took too long. Try a shorter equation or lower quality.")

        outputs = list(Path(tmp).rglob("equation*.mp4"))
        if proc.returncode != 0 or not outputs:
            raise HTTPException(422, explain_failure(Path(tmp), proc.stdout + proc.stderr))

        tmp_dest = dest.with_suffix(".part")
        if req.format == "gif":
            to_gif(outputs[0], tmp_dest)
        else:
            shutil.move(outputs[0], tmp_dest)
        tmp_dest.replace(dest)


def to_gif(src: Path, dest: Path) -> None:
    # A small shared palette suits monochrome equations; skipping dithering
    # keeps flat backgrounds flat and the file small.
    palette = (
        "split[a][b];[a]palettegen=max_colors=32:stats_mode=diff[p];"
        "[b][p]paletteuse=dither=none:diff_mode=rectangle"
    )
    proc = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", str(src), "-vf", palette, "-loop", "0", "-f", "gif", "-y", str(dest)],
        capture_output=True, text=True, timeout=RENDER_TIMEOUT,
    )
    if proc.returncode != 0:
        print(proc.stderr, file=sys.stderr)
        raise HTTPException(500, "Could not convert the animation to GIF.")


def explain_failure(workdir: Path, output: str) -> str:
    """Pull the first error message out of the LaTeX log (or Manim's output)."""
    print(output, file=sys.stderr)
    logs = "\n".join(p.read_text(errors="replace") for p in workdir.rglob("*.log"))
    m = re.search(r"^! (.+)$", logs, re.M) or re.search(r"(\w*Error: .+)$", output, re.M)
    if m:
        return f"Manim could not render this LaTeX: {m.group(1).strip()}"
    return "Manim could not render this LaTeX."


def prune_cache() -> None:
    files = sorted(CACHE_DIR.iterdir(), key=lambda p: p.stat().st_mtime)
    for old in files[:-MAX_CACHE_FILES]:
        old.unlink(missing_ok=True)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", "8000")))
