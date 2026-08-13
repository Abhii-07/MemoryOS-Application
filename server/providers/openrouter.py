"""OpenRouter — prod default. One key, free-tier models available, model
swapped via env without code changes."""

from __future__ import annotations

import os
from typing import Any

from .base import Provider

DEFAULT_MODEL = "meta-llama/llama-3.3-70b-instruct:free"
ENDPOINT = "https://openrouter.ai/api/v1/chat/completions"


class OpenRouterProvider(Provider):
    name = "openrouter"

    def __init__(self, api_key: str | None = None, model: str | None = None):
        self.api_key = api_key or os.environ.get("OPENROUTER_API_KEY", "")
        self.model = model or os.environ.get("OPENROUTER_MODEL") or DEFAULT_MODEL

    def is_configured(self) -> bool:
        return bool(self.api_key)

    def generate(self, *, system: str, user: str,
                 memories: list[dict[str, Any]], timeout: float = 60.0) -> str:
        import urllib.request

        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            "temperature": 0.2,
        }
        req = urllib.request.Request(
            ENDPOINT,
            data=__import__("json").dumps(payload).encode(),
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self.api_key}",
            },
        )
        with urllib.request.urlopen(req, timeout=timeout) as r:
            body = __import__("json").loads(r.read().decode())
        return body["choices"][0]["message"]["content"].strip()