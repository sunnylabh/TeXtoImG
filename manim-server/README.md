# TexToImg Manim server

Renders LaTeX equations as GIF/MP4 animations with [Manim](https://www.manim.community/) for [TexToImg](https://github.com/sunnylabh/TeXtoImG).

`POST /api/animate` with JSON `{latex, style, format, quality, theme}` returns the animation. `GET /api/health` is a health check.

Deployed on Render's free tier through `render.yaml` in the repository root. See the main README for running it locally.
