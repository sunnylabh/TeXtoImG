# Manim scene rendered by server.py. The job parameters (LaTeX, style, theme)
# are read from the JSON file named in MANIM_JOB, so user input is never
# interpolated into Python source.

import json
import os
import re

from manim import (
    DOWN,
    UP,
    Circumscribe,
    FadeIn,
    LaggedStart,
    MathTex,
    DR,
    Scene,
    Text,
    Write,
    config,
)

THEMES = {
    "light": {"background": "#ffffff", "text": "#000000", "accent": "#6366f1", "mark": "#8a8a8a"},
    "dark": {"background": "#000000", "text": "#ffffff", "accent": "#a5b4fc", "mark": "#8a8a8a"},
}

WATERMARK = "TextoImg"

# Multi-line environments that can be split into rows, mapped to the
# top-level environment Manim should compile the rows in.
SPLITTABLE_ENVS = {
    "aligned": "align*",
    "align": "align*",
    "align*": "align*",
    "gathered": "gather*",
    "gather": "gather*",
    "gather*": "gather*",
}


def strip_delimiters(latex: str) -> str:
    """Remove \\[...\\], $$...$$ or $...$ wrappers, mirroring the web preview."""
    s = latex.strip()
    for start, end in (("\\[", "\\]"), ("$$", "$$"), ("$", "$")):
        if len(s) > len(start) + len(end) and s.startswith(start) and s.endswith(end):
            return s[len(start) : -len(end)].strip()
    return s


def split_rows(body: str) -> list[str]:
    """Split on top-level \\\\ (ignoring rows of nested matrices, cases, ...)."""
    rows, current, depth, i = [], [], 0, 0
    while i < len(body):
        if body.startswith("\\\\", i) and depth == 0:
            i += 2
            # Optional spacing argument, e.g. \\[4pt]
            m = re.match(r"\s*\[[^\]]*\]", body[i:])
            if m:
                i += m.end()
            rows.append("".join(current).strip())
            current = []
            continue
        if body[i] == "\\" and i + 1 < len(body):
            # Escaped characters such as \{ or \\ never change the nesting depth
            if body.startswith("\\begin{", i):
                depth += 1
            elif body.startswith("\\end{", i):
                depth -= 1
            elif body[i + 1] in "{}\\":
                current.append(body[i : i + 2])
                i += 2
                continue
        elif body[i] == "{":
            depth += 1
        elif body[i] == "}":
            depth -= 1
        current.append(body[i])
        i += 1
    rows.append("".join(current).strip())
    return [r for r in rows if r]


def build_equation(latex: str, color: str) -> tuple[MathTex, bool]:
    """Return the equation mobject and whether its submobjects are separate rows."""
    m = re.fullmatch(r"\\begin\{(\w+\*?)\}(.*)\\end\{\1\}", latex, re.S)
    if m and m.group(1) in SPLITTABLE_ENVS:
        rows = split_rows(m.group(2))
        if len(rows) > 1:
            parts = [row + r" \\" for row in rows[:-1]] + [rows[-1]]
            try:
                eq = MathTex(*parts, tex_environment=SPLITTABLE_ENVS[m.group(1)], color=color)
                if len(eq.submobjects) == len(rows):
                    return eq, True
            except Exception:
                pass  # fall back to rendering the equation as one piece
    return MathTex(latex, color=color), False


class EquationScene(Scene):
    def construct(self):
        with open(os.environ["MANIM_JOB"], encoding="utf-8") as f:
            job = json.load(f)

        theme = THEMES.get(job.get("theme"), THEMES["light"])
        style = job.get("style", "write")
        self.camera.background_color = theme["background"]

        # Small watermark, present from the first frame to the last
        mark = Text(WATERMARK, font_size=14, color=theme["mark"]).set_opacity(0.7)
        mark.to_corner(DR, buff=0.2)
        self.add(mark)

        eq, has_rows = build_equation(strip_delimiters(job["latex"]), theme["text"])

        # Fill the frame with a margin, without blowing short equations up too far
        max_w, max_h = config.frame_width * 0.86, config.frame_height * 0.8
        eq.scale(min(max_w / eq.width, max_h / eq.height, 2.5))
        eq.move_to([0, 0, 0])

        # Longer equations get a little more time, within sensible bounds
        write_time = min(max(1.2, len(eq.family_members_with_points()) * 0.04), 4.0)

        if style == "fade":
            self.play(FadeIn(eq, shift=UP * 0.3, scale=0.95), run_time=1.2)
        elif style == "lines" and has_rows:
            per_row = min(max(0.8, write_time / len(eq.submobjects)), 2.0)
            for row in eq.submobjects:
                self.play(Write(row), run_time=per_row)
        elif style == "lines":
            # Single-line input: reveal symbol by symbol instead
            glyphs = eq.family_members_with_points()
            self.play(
                LaggedStart(*[FadeIn(g, shift=DOWN * 0.15) for g in glyphs], lag_ratio=0.08),
                run_time=write_time,
            )
        elif style == "highlight":
            self.play(Write(eq), run_time=write_time)
            self.play(Circumscribe(eq, color=theme["accent"], buff=0.2), run_time=1.2)
        else:
            self.play(Write(eq), run_time=write_time)

        self.wait(1.5)
