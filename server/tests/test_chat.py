"""Chat loop tests — rewrite fallback, best-of retrieval, candidate parsing.

Unit-level: providers and retriever are mocked; no Postgres, no model.
Run: python -m pytest tests -q   (from server/)
"""

from __future__ import annotations

from typing import Any

import chat as chat_loop
from providers.base import Provider


class FakeProvider(Provider):
    name = "fake"
    model = "fake-1"

    def __init__(self, output: str = "[]") -> None:
        self.output = output
        self.calls: list[dict[str, Any]] = []

    def is_configured(self) -> bool:
        return True

    def generate(self, *, system: str, user: str,
                 memories: list[dict[str, Any]],
                 timeout: float = 60.0) -> str:
        self.calls.append({"system": system, "user": user})
        if "rewrite" in system.lower():
            return self.output
        if "extract" in system.lower():
            return "[\"prefers chai\"]"
        return "The evidence says tea."


class FakeRetriever:
    def __init__(self, hits_by_query: dict[str, list[dict[str, Any]]]) -> None:
        self.hits_by_query = hits_by_query

    def search(self, *, tenant_id: str, query: str, limit: int,
               user_id: str) -> list[dict[str, Any]]:
        try:
            return self.hits_by_query[query]
        except KeyError:
            from memory_os.retrieval.hybrid import NoRelevantMemory
            raise NoRelevantMemory()


def _hit(score: float) -> dict[str, Any]:
    return {"id": 1, "text": "x", "cosine_sim": score, "bm25": score}


# ── rewrite ──────────────────────────────────────────────────────────────────
def test_rewrite_parses_json_array() -> None:
    p = FakeProvider(output='["chai habit", "what I drink"]')
    assert chat_loop.rewrite_variants(p, "what do I drink?") == [
        "chai habit", "what I drink"]


def test_rewrite_falls_back_on_garbage() -> None:
    for bad in ("no brackets here", "[not json", "{}", ""):
        p = FakeProvider(output=bad)
        assert chat_loop.rewrite_variants(p, "q") == ["q"]


def test_rewrite_falls_back_on_provider_error() -> None:
    class Boom(FakeProvider):
        def generate(self, **kw: Any) -> str:
            raise RuntimeError("down")

    assert chat_loop.rewrite_variants(Boom("[]"), "q") == ["q"]


def test_rewrite_dedupes_and_caps() -> None:
    p = FakeProvider(output='["tea habit", "tea habit", "juice habit", "water habit"]')
    out = chat_loop.rewrite_variants(p, "q")
    assert out == ["tea habit", "juice habit", "water habit"]


# ── best-of retrieval ────────────────────────────────────────────────────────
def test_best_of_picks_winning_variant() -> None:
    p = FakeProvider(output='["tea variant"]')
    r = FakeRetriever({
        "what do I drink?": [_hit(0.3)],       # raw query below floor-ish
        "tea variant": [_hit(0.9)],
    })
    hits, used = chat_loop.search_with_rewrite(
        r, provider=p, tenant_id="t", user_id="u",
        query="what do I drink?", limit=5)
    assert used == "tea variant"
    assert hits[0]["cosine_sim"] == 0.9


def test_best_of_keeps_raw_on_rewrite_failure() -> None:
    p = FakeProvider(output="no json here")
    r = FakeRetriever({"what do I drink?": [_hit(0.9)]})
    hits, used = chat_loop.search_with_rewrite(
        r, provider=p, tenant_id="t", user_id="u",
        query="what do I drink?", limit=5)
    assert used == "what do I drink?"
    assert hits and hits[0]["cosine_sim"] == 0.9


def test_best_of_no_hits_returns_empty() -> None:
    p = FakeProvider(output='["tea variant"]')
    r = FakeRetriever({})  # every query throws NoRelevantMemory
    hits, used = chat_loop.search_with_rewrite(
        r, provider=p, tenant_id="t", user_id="u",
        query="nothing here", limit=5)
    assert hits == []
    assert used == "nothing here"


# ── extraction (two-stage, format-independent) ───────────────────────────────
def test_extract_parses_json() -> None:
    class Extract(FakeProvider):
        def generate(self, **kw: Any) -> str:
            return '[\"prefers chai\", \"trains March\"]'

    p = Extract()
    assert chat_loop._extract_candidates(p, "I prefer chai") == [
        "prefers chai", "trains March"]


def test_extract_falls_back_on_garbage() -> None:
    gated = (("no brackets", []), ("[oops", []), ("{}", []), ("[]", []))
    for bad, expected in gated:
        class E(FakeProvider):
            def generate(self, **kw: Any) -> str:
                return bad
        assert chat_loop._extract_candidates(E(), "x") == expected


def test_extract_provider_error_returns_empty() -> None:
    class Boom(FakeProvider):
        def generate(self, **kw: Any) -> str:
            raise RuntimeError("down")

    assert chat_loop._extract_candidates(Boom(), "x") == []


# ── full turn ────────────────────────────────────────────────────────────────
def test_handle_turn_roundtrip() -> None:
    long_str = "t" * 400
    p = FakeProvider(output='["tea", "tea", "' + long_str + '"]')
    r = FakeRetriever({"what do I drink?": [_hit(0.8)], "tea": [_hit(0.95)]})
    out = chat_loop.handle_turn(
        admitter=None, retriever=r, provider=p, session_id="s1",
        text="what do I drink?", tenant_id="t", user_id="u")
    assert out["answer"] == "The evidence says tea."
    assert out["candidates"] == ["prefers chai"]
    assert out["memories"]
    assert out["rewritten"] is True
    assert out["latency_ms"] >= 0


def test_history_keeps_pairs() -> None:
    p = FakeProvider()
    r = FakeRetriever({"first": [], "second": []})
    chat_loop._sessions.pop("s2", None)
    chat_loop.handle_turn(admitter=None, retriever=r, provider=p,
                          session_id="s2", text="first", tenant_id="t",
                          user_id="u")
    chat_loop.handle_turn(admitter=None, retriever=r, provider=p,
                          session_id="s2", text="second", tenant_id="t",
                          user_id="u")
    with chat_loop._sessions_lock:
        history = chat_loop._sessions["s2"]
    roles = [t["role"] for t in history]
    assert roles == ["user", "assistant", "user", "assistant"]