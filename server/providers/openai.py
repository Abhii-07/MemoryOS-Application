"""OpenAI — cloud provider, env-key gated."""

from __future__ import annotations

import os
from typing import Any

from .base import Provider

DEFAULT_MODEL = "gpt-4o-mini"
ENDPOINT = "https://api.openai.com/v1/chat/completions"


class OpenAIProvider(Provider):
    name = "openai"

    def __init__(self, api_key: str | None = None, model: str | None = None):
        self.api_key = api_key or os.environ.get("OPENAI_API_KEY", "")
        self.model = model or os.environ.get("OPENAI_MODEL") or DEFAULT_MODEL

    def is_configured(self) -> bool:
        return bool(self.api_key)

    def generate(self, *, system: str, user: str,
                 memories: list[dict[str, Any]], timeout: float = 60.0) -> str:
        import json
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
            data=json.dumps(payload).encode(),
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self.api_key}",
            },
        )
        with urllib.request.urlopen(req, timeout=timeout) as r:
            body = json.loads(r.read().decode())
        return body["choices"][0]["message"]["content"].strip()