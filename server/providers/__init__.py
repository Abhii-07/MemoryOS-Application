"""Assistant providers — see base.py for the interface."""

from .anthropic import AnthropicProvider
from .base import Provider
from .ollama import OllamaProvider
from .openai import OpenAIProvider
from .openrouter import OpenRouterProvider
from .registry import available_providers, get_provider, register_all

__all__ = [
    "Provider",
    "OllamaProvider",
    "OpenRouterProvider",
    "OpenAIProvider",
    "AnthropicProvider",
    "register_all",
    "get_provider",
    "available_providers",
]