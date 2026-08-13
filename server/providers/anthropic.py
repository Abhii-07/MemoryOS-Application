"""Anthropic — cloud provider, env-key gated."""

from __future__ import annotations

import os
from typing import Any

from .base import Provider

DEFAULT_MODEL = "claude-3-5-haiku-latest"
ENDPOINT = "https://api.anthropic.com/v1/messages"


class AnthropicProvider(Provider):
    name = "anthropic"

    def __init__(self, api_key: str | None = None, model: str | None = None):
        self.api_key = api_key or os.environ.get("ANTHROPIC_API_KEY", "")
        self.model = model or os.environ.get("ANTHROPIC_MODEL") or DEFAULT_MODEL

    def is_configured(self) -> bool:
        return bool(self.api_key)

    def generate(self, *, system: str, user: str,
                 memories: list[dict[str, Any]], timeout: float = 60.0) -> str:
        import json
        import urllib.request

        payload = {
            "model": self.model,
            "max_tokens": 1024,
            "system": system,
            "messages": [{"role": "user", "content": user}],
        }
        req = urllib.request.Request(
            ENDPOINT,
            data=json.dumps(payload).encode(),
            headers={
                "Content-Type": "application/json",
                "x-api-key": self.api_key,
                "anthropic-version": "2023-06-01",
            },
        )
        with urllib.request.urlopen(req, timeout=timeout) as r:
            body = json.loads(r.read().decode())
        return "".join(b.get("text", "") for b in body.get("content", [])).strip()