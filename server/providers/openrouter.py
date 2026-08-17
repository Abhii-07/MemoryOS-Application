"""OpenRouter — prod default. One key, free-tier models available, model
swapped via env without code changes.

Free-tier roster rotates on OpenRouter's discretion (delisted models 404
with "No endpoints found"). If the configured model 404s, we fall back to
the `openrouter/free` auto-router so the app self-heals without a deploy."""

from __future__ import annotations

import json
import os
import urllib.error
import urllib.request
from typing import Any

from .base import Provider

DEFAULT_MODEL = "google/gemma-4-31b-it:free"
FALLBACK_MODEL = "openrouter/free"
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
        try:
            return self._call(self.model, system, user, timeout)
        except urllib.error.HTTPError as e:
            if e.code == 404 and self.model != FALLBACK_MODEL:
                return self._call(FALLBACK_MODEL, system, user, timeout)
            raise

    def _call(self, model: str, system: str, user: str, timeout: float) -> str:
        payload = {
            "model": model,
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            "temperature": 0.2,
        }
        req = urllib.request.Request(
            ENDPOINT,
            data=json.dumps(payload).encode(),
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self.api_key}",
            },
        )
        with urllib.request.urlopen(req, timeout=timeout) as r:
            body = json.loads(r.read().decode())
        return body["choices"][0]["message"]["content"].strip()