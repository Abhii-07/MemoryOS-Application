"""Ollama — local dev provider. No key. Requires http://127.0.0.1:11434.

Not intended for hosted deployment (no Ollama in the cloud); prod uses
OpenRouter/OpenAI/Anthropic via MEMORYOS_ASSIST_PROVIDER.
"""

from __future__ import annotations

import json
import os
import urllib.request
from typing import Any

from .base import Provider, with_fallback

DEFAULT_MODEL = "llama3.2"
DEFAULT_ENDPOINT = "http://127.0.0.1:11434"


class OllamaProvider(Provider):
    name = "ollama"

    def __init__(self, endpoint: str | None = None, model: str | None = None):
        self.endpoint = (endpoint or os.environ.get("MEMORYOS_OLLAMA_ENDPOINT")
                         or DEFAULT_ENDPOINT).rstrip("/")
        self.model = model or os.environ.get("MEMORYOS_OLLAMA_MODEL") or DEFAULT_MODEL

    def is_configured(self) -> bool:
        return with_fallback(self._has_model, default=False)

    def _has_model(self) -> bool:
        with urllib.request.urlopen(f"{self.endpoint}/api/tags", timeout=3) as r:
            tags = json.loads(r.read().decode()).get("models", [])
        return any(t["name"].split(":")[0] == self.model.split(":")[0]
                   for t in tags)

    def generate(self, *, system: str, user: str,
                 memories: list[dict[str, Any]], timeout: float = 60.0) -> str:
        payload = {
            "model": self.model,
            "prompt": f"{system}\n\n{user}",
            "stream": False,
            "options": {"temperature": 0.2},
        }
        req = urllib.request.Request(
            f"{self.endpoint}/api/generate",
            data=json.dumps(payload).encode(),
            headers={"Content-Type": "application/json"},
        )
        with urllib.request.urlopen(req, timeout=timeout) as r:
            body = json.loads(r.read().decode())
        return str(body.get("response", "")).strip()