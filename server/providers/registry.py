"""Provider registry — env-switched, dev fallback to Ollama.

MEMORYOS_ASSIST_PROVIDER=openrouter|openai|anthropic (prod)
if unset: openrouter if key present, else ollama if reachable, else none.
"""

from __future__ import annotations

import os

from .anthropic import AnthropicProvider
from .base import Provider, with_fallback
from .ollama import OllamaProvider
from .openai import OpenAIProvider
from .openrouter import OpenRouterProvider

_REGISTRY: dict[str, Provider] = {}


def register_all() -> dict[str, Provider]:
    if not _REGISTRY:
        for provider in (
            OllamaProvider(),
            OpenRouterProvider(),
            OpenAIProvider(),
            AnthropicProvider(),
        ):
            _REGISTRY[provider.name] = provider
    return _REGISTRY


def get_provider(name: str | None = None) -> Provider | None:
    """Resolve the assistant provider. Explicit name wins; otherwise prod
    (configured cloud provider) beats dev (Ollama)."""
    registry = register_all()
    if name:
        return registry.get(name)
    env = os.environ.get("MEMORYOS_ASSIST_PROVIDER", "").lower()
    if env:
        return registry.get(env)
    for preferred in ("openrouter", "openai", "anthropic"):
        if registry[preferred].is_configured():
            return registry[preferred]
    if with_fallback(registry["ollama"].is_configured, default=False):
        return registry["ollama"]
    return None


def available_providers() -> list[dict[str, str]]:
    """Configured providers for the UI: provider name + model."""
    out: list[dict[str, str]] = []
    for name, provider in register_all().items():
        if provider.is_configured():
            out.append({"name": provider.name, "model": provider.model})
    return out