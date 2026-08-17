# ── Stage 1: build deps ──────────────────────────────────────────────────────
FROM python:3.11-slim AS builder

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY server/requirements.txt .

# CPU-only torch shrinks image from ~4GB to ~1.5GB
RUN pip install --no-cache-dir \
    torch --index-url https://download.pytorch.org/whl/cpu \
 && pip install --no-cache-dir --no-compile -r requirements.txt

# pre-download the embedding model so first request is cold-start-free
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('all-MiniLM-L6-v2')"

# ── Stage 2: runtime ─────────────────────────────────────────────────────────
FROM python:3.11-slim AS runtime

RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin/uvicorn /usr/local/bin/uvicorn
COPY --from=builder /root/.cache/huggingface /root/.cache/huggingface

# engine (vendored) + server code
COPY server/memory_os ./memory_os
COPY server/app.py server/chat.py server/mapping.py ./
COPY server/providers ./providers

# ── Render Free 512MB tuning ─────────────────────────────────────────────────
ENV HF_HOME=/root/.cache/huggingface \
    PYTHONDONTWRITEBYTECODE=1 \
    MALLOC_ARENA_MAX=2 \
    OMP_NUM_THREADS=2 \
    TOKENIZERS_PARALLELISM=false

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/healthz')"

# Single worker (never 2+ — each loads torch, would OOM 512MB). Lazy engine
# init keeps baseline low; embedder loads on first request.
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1", "--limit-concurrency", "10", "--backlog", "5", "--timeout-keep-alive", "30"]
