r"""Chat loop — retrieval → grounded LLM answer → candidate facts.

Confirm-to-remember (S-014): the model extracts candidate user-personal facts
each turn; the client decides (POST /ingest) — nothing is auto-written.

Query rewrite (S-015): the LLM rephrases the user query into keyword-rich
variants which compete at retrieval (max score wins). The deterministic floor
(EC-13) still applies — variants only widen the funnel toward it. If the
provider is down, the raw query is searched, so the loop degrades gracefully.
"""

from __future__ import annotations

import json
import re
import threading
import time
from typing import Any

from memory_os.admission.admitter import Admitter
from memory_os.db.store import MemoryStore
from memory_os.retrieval.hybrid import HybridRetriever, NoRelevantMemory

from providers import get_provider
from providers.base import Provider

# ── session state (in-process only: demo-grade, no persistence) ─────────────
_MAX_SESSIONS = 64
_MAX_TURNS = 12
_turns_shown = 6  # last N turns fed to the model

_sessions: dict[str, list[dict[str, str]]] = {}
_sessions_lock = threading.Lock()


def _history(session_id: str, role: str, text: str) -> list[dict[str, str]]:
    with _sessions_lock:
        if session_id not in _sessions:
            while len(_sessions) >= _MAX_SESSIONS:
                _sessions.pop(next(iter(_sessions)))
            _sessions[session_id] = []
        turns = _sessions[session_id]
        if role == "user" and len(turns) >= _MAX_TURNS * 2:
            del turns[:2]  # drop the oldest user+assistant pair
        turns.append({"role": role, "text": text})
        return turns[-_turns_shown * 2:]


# ── query rewrite (S-015) ────────────────────────────────────────────────────
_REWRITE_SYSTEM = (
    "You rewrite user queries for a keyword-sensitive memory retrieval "
    "engine. The engine matches exact nouns, so keep the query's key nouns "
    "verbatim. You also see the user's recent conversation: borrow key nouns "
    "from it that the current query clearly refers to (e.g. if they mentioned "
    "chai and now ask \"what do I drink?\", use \"chai\" and \"drink\"). "
    "Rewrite the query as TWO short keyword-rich variants (noun-heavy short "
    "phrases, 2-6 words, never a single word, no filler). Reply with ONLY a "
    "single JSON array of exactly two strings, e.g. "
    '["chai drinking habit", "what I drink"].'
)


def _parse_json_list(raw: str) -> list[str] | None:
    """Lenient JSON list parse: exact array, or fall back to quoted tokens
    (models occasionally emit `["a","b"], ["c","d"]` or fence the JSON)."""
    match = re.search(r"\[.*\]", raw, re.S)
    if not match:
        return None
    blob = match.group(0)
    try:
        parsed = json.loads(blob)
        if isinstance(parsed, list):
            return [str(x).strip() for x in parsed if isinstance(x, str)]
    except (ValueError, TypeError):
        pass
    tokens = re.findall(r'"([^"]+)"', blob)
    return [t.strip() for t in tokens if t.strip()]


def rewrite_variants(provider: Provider, query: str,
                     context: str = "", attempts: int = 2) -> list[str]:
    """LLM query rewrite with hard fallback: any failure → raw query only.
    `context` = recent conversation text; the model may borrow key nouns from
    it (context-aware query expansion, S-015). Two stochastic draws are
    unioned so a single bad draw cannot kill the rewrite."""
    variants: list[str] = []
    for _ in range(attempts):
        try:
            raw = provider.generate(
                system=_REWRITE_SYSTEM,
                user=(f"Recent conversation:\n{context}\n\n" if context else "")
                    + f"Original query: {query}",
                memories=[],
                timeout=20.0,
            )
        except Exception:  # noqa: BLE001 — rewrite is best-effort
            continue
        drawn = _parse_json_list(raw)
        if drawn:
            variants.extend(v for v in drawn if 2 < len(v) <= 300)
    variants = list(dict.fromkeys(variants))[:3]
    return variants or [query]


def search_with_rewrite(retriever: HybridRetriever, *, provider: Provider,
                        tenant_id: str, user_id: str, query: str,
                        limit: int,
                        context: str = "",
                        aux_queries: list[str] | None = None
                        ) -> tuple[list[dict[str, Any]], str]:
    """Best-of retrieval: raw query + up to 2 rewritten variants + prior user
    texts (natural phrases clear the relevance floor far more reliably than
    single LLM-extracted keywords). Max top score wins; floor still applies."""
    queries = [query] + rewrite_variants(provider, query, context=context)
    if aux_queries:
        queries += [q for q in aux_queries if 2 < len(q) <= 300]
    best_hits: list[dict[str, Any]] = []
    best_query = query
    best_score = -1.0
    for q in queries:
        try:
            hits = retriever.search(
                tenant_id=tenant_id, query=q, limit=limit, user_id=user_id,
            )
        except NoRelevantMemory:
            hits = []
        if not hits:
            continue
        top = max(
            float(hits[0].get("cosine_sim") or 0.0),
            float(hits[0].get("bm25") or 0.0),
        )
        if top > best_score:
            best_score = top
            best_hits = hits
            best_query = q
    return best_hits, best_query


# ── chat turn ────────────────────────────────────────────────────────────────
_CHAT_SYSTEM = (
    "You are MemoryOS, a memory-assisted assistant. Answer the user's question "
    "using ONLY the retrieved memory evidence. Quote evidence when relevant. "
    "When evidence is present, use it - never claim there is no evidence unless "
    "the evidence list is truly empty. Never imitate or repeat your own previous "
    "replies. If the evidence has nothing useful, say so plainly - never invent, "
    "guess, or recall anything not in the evidence. Be concise (1-3 sentences)."
)

_EXTRACT_SYSTEM = (
    "You extract personal facts for a memory system. Only extract when the "
    "user's latest message describes their own situation (I/my/we statements: "
    "preferences, habits, names, plans, constraints). Questions and requests "
    "for the assistant are NOT facts - return [] for those. Never invent or "
    "infer - only what was literally stated. Reply with ONLY a JSON array of "
    'strings (max 5). Example: "I prefer chai every morning" -> '
    '["prefers chai every morning"].'
)


def _extract_candidates(provider: Provider, text: str) -> list[str]:
    """Second LLM call: facts extraction is format-independent and never
    coupled to how the answer happened to be phrased."""
    try:
        raw = provider.generate(
            system=_EXTRACT_SYSTEM, user=text, memories=[], timeout=20.0,
        )
    except Exception:  # noqa: BLE001 — extraction is best-effort
        return []
    variants = _parse_json_list(raw)
    if variants is None:
        return []
    candidates = [v for v in variants if 2 < len(v) <= 300]
    return list(dict.fromkeys(candidates))[:5]


def handle_turn(*, admitter: Admitter, retriever: HybridRetriever,
                provider: Provider, session_id: str, text: str,
                tenant_id: str, user_id: str,
                limit: int = 5) -> dict[str, Any]:
    t0 = time.perf_counter()
    _history(session_id, "user", text)
    with _sessions_lock:
        past = list(_sessions.get(session_id, []))[:-1]
    context = "\n".join(
        f"{'You' if t['role'] == 'user' else 'Assistant'}: {t['text']}"
        for t in past[-_turns_shown * 2:]
    )
    hits, used_query = search_with_rewrite(
        retriever, provider=provider, tenant_id=tenant_id, user_id=user_id,
        query=text, limit=limit, context=context,
        aux_queries=[t["text"] for t in past if t["role"] == "user"],
    )
    ret_ms = int((time.perf_counter() - t0) * 1000)

    evidence = [
        {"memory": h["text"], "provenance": h.get("provenance"),
         "confidence": float(h.get("confidence") or 0.0),
         "cosine_sim": round(float(h.get("cosine_sim") or 0.0), 3),
         "bm25": round(float(h.get("bm25") or 0.0), 3)}
        for h in hits
    ]
    history: list[dict[str, str]] = list(past)

    transcript_entries = history[-(_turns_shown * 2):]
    if transcript_entries and transcript_entries[-1]["role"] == "assistant":
        transcript_entries = transcript_entries[:-1]  # drop our own last reply
    transcript = "\n".join(
        f"{'You' if t['role'] == 'user' else 'Assistant'}: {t['text']}"
        for t in transcript_entries
    )
    prompt = (
        f"Retrieved memory evidence:\n"
        + (json.dumps(evidence, indent=2) if evidence else "  (none - no relevant memory)")
        + f"\n\nConversation so far:\n{transcript or '  (none)'}"
        + f"\n\nUser's latest message: {text}"
    )
    try:
        raw = provider.generate(
            system=_CHAT_SYSTEM, user=prompt, memories=hits, timeout=60.0,
        )
    except Exception as exc:  # noqa: BLE001 — provider errors are user-facing
        raise RuntimeError(f"assistant error: {exc!r}") from exc

    answer = raw.strip()
    candidates = _extract_candidates(provider, text)
    _history(session_id, "assistant", answer)
    return {
        "answer": answer,
        "candidates": candidates,
        "memories": hits,
        "rewrite": used_query if used_query != text else text,
        "rewritten": used_query != text,
        "provider": provider.name,
        "model": provider.model,
        "latency_ms": ret_ms + int((time.perf_counter() - t0) * 1000),
    }