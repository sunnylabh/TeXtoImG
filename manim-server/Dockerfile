# Manim render server for TexToImg. Deploy anywhere that runs containers
# (Render, Fly.io, Railway, Hugging Face Spaces, ...).
FROM python:3.12-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
        ffmpeg build-essential pkg-config libcairo2-dev libpango1.0-dev \
        texlive-latex-base texlive-latex-extra texlive-fonts-recommended \
        texlive-science dvisvgm \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY scene.py server.py ./

ENV PORT=8000
EXPOSE 8000
CMD ["python", "server.py"]
