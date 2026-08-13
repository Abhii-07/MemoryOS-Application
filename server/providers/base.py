"""Provider interface — one contract for every assistant backend.

Cloud-first: prod picks whatever's free via MEMORYOS_ASSIST_PROVIDER.
Ollama is dev-only. Keys come from server-side env, never the client.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any


class Provider(ABC):
    """Assistant backend. generate() receives the retrieval evidence block
    verbatim + instructions to answer from it and never invent."""

    name: str
    model: str = ""

    @abstractmethod
    def is_configured(self) -> bool:
        """True when this provider can run right now (key set, endpoint up)."""

    @abstractmethod
    def generate(self, *, system: str, user: str, memories: list[dict[str, Any]],
                 timeout: float = 60.0) -> str:
        """Model answer for `user` given retrieved `memories` evidence."""


def with_fallback(fn, *args, timeout: float = 3.0, default: Any = None):
    """Probe helper: reachability check must never hang an endpoint."""
    import threading

    result: list[Any] = [default]
    errored: list[Exception] = []

    def run():
        try:
            result[0] = fn(*args)
        except Exception as exc:  # noqa: BLE001
            errored.append(exc)

    t = threading.Thread(target=run, daemon=True)
    t.start()
    t.join(timeout)
    if t.is_alive() or errored:
        return default
    return result[0]