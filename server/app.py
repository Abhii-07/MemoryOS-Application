r"""MemoryOS Phase 5 — FastAPI service wrapping the real memory_os engine.

Endpoints (docs/STATUS.md Phase 5):
  POST /ingest  {input}             -> ingestion events (ADD | UPDATE | DELETE | NOOP)
  POST /ask     {query}             -> hybrid retrieval memories + explanation
  GET  /memory  ?tenant_id&user_id  -> active memories
  GET  /audit   ?memory_id          -> lifecycle trail for one memory
  GET  /healthz                     -> readiness probe (no model load)

The service maps real engine rows onto the site's MemoryEngine contract.
Landing page stays on DemoMemoryEngine forever; this serves /playground only.

Startup is fast on purpose: the embedder (sentence-transformers, ~3 s weight
load) is lazy — admitted/retriever objects are built on first request, never at
import. run.ps1 polls /healthz for readiness instead of guess-timing.

Run:
  $env:MEMORYOS_DB_DSN = "postgresql://memoryos@localhost:5433/memoryos"
  .venv\Scripts\python.exe -m uvicorn app:app --port 8000
"""

from __future__ import annotations

import os
import threading
import time
from typing import Any

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from memory_os.admission.admitter import Admitter, AdmissionResult
from memory_os.db.store import MemoryStore
from memory_os.retrieval.hybrid import HybridRetriever, NoRelevantMemory

from mapping import (
    audit_trail,
    build_events,
    memory_from_row,
    memory_to_contract,
    slot_type,
)

DEFAULT_DSN = os.environ.get(
    "MEMORYOS_DB_DSN", "postgresql://memoryos@localhost:5433/memoryos"
)
DEFAULT_TENANT = "playground"
DEFAULT_USER = "demo"

# store only at import — no model load, no blocking. Engine objects are built
# on first use (embedder weights load then, once; transformers caches them).
store = MemoryStore(dsn=DEFAULT_DSN)

_engine_lock = threading.Lock()
_engine_ready = False
_admitter: Admitter | None = None
_retriever: HybridRetriever | None = None


def _get_engine() -> tuple[Admitter, HybridRetriever]:
    """Lazy, once: first request pays the embedder load, later ones free."""
    global _engine_ready, _admitter, _retriever
    if not _engine_ready:
        with _engine_lock:
            if not _engine_ready:
                _admitter = Admitter(store)
                _retriever = HybridRetriever(store)
                _engine_ready = True
    assert _admitter is not None and _retriever is not None
    return _admitter, _retriever


app = FastAPI(title="MemoryOS Live Engine", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def _startup() -> None:
    # Schema is idempotent; a DB outage at boot must not take the API down —
    # apply_schema is retried on the first ingest if this attempt fails.
    try:
        store.apply_schema()
    except Exception as exc:  # noqa: BLE001 — boot must survive PG hiccups
        print(f"[startup] apply_schema deferred ({exc!r}); retried on first ingest", flush=True)


@app.get("/healthz")
def healthz() -> dict[str, str]:
    """Readiness: process up AND Postgres reachable. No embedder involved."""
    try:
        with store.connect() as conn:
            conn.execute("SELECT 1")
    except Exception as exc:  # noqa: BLE001 — report, do not 500-ify the probe
        raise HTTPException(status_code=503, detail=f"pg unreachable: {exc!r}")
    return {"status": "ok"}


# ── request / response models ────────────────────────────────────────────────
class IngestRequest(BaseModel):
    input: str = Field(min_length=1, max_length=2000)


class AskRequest(BaseModel):
    query: str = Field(min_length=1, max_length=2000)


class EventOut(BaseModel):
    kind: str
    detail: str
    slotKey: str | None = None
    oldValue: str | None = None
    newValue: str | None = None


class IngestResponse(BaseModel):
    admission_op: str
    record_id: str | None = None
    superseded_id: str | None = None
    reason: str | None = None
    provenance: str | None = None
    pii_scan_result: str
    pii_rule_hits: list[str] = []
    events: list[EventOut]


class MemoryOut(BaseModel):
    id: str
    type: str
    key: str
    value: str
    source: str
    confidence: float
    status: str
    createdAt: str
    updatedAt: str
    provenance: str


class ExplanationOut(BaseModel):
    memoryId: str
    score: float
    reasons: list[str]


class AskResponse(BaseModel):
    query: str
    memories: list[MemoryOut]
    explanation: list[ExplanationOut]
    latency_ms: int


class MemoryListResponse(BaseModel):
    memories: list[MemoryOut]


class AuditOut(BaseModel):
    memoryId: str
    action: str
    at: str
    detail: str


class AuditResponse(BaseModel):
    events: list[AuditOut]


# ── endpoints ────────────────────────────────────────────────────────────────
@app.post("/ingest", response_model=IngestResponse)
def ingest(body: IngestRequest,
           tenant_id: str = Query(DEFAULT_TENANT),
           user_id: str = Query(DEFAULT_USER)) -> dict[str, Any]:
    admitter, _ = _get_engine()
    with _engine_lock:
        result: AdmissionResult = admitter.admit(
            tenant_id=tenant_id, user_id=user_id, text=body.input,
            turn_type="user",
        )
    return {
        "admission_op": result.admission_op,
        "record_id": str(result.record_id) if result.record_id else None,
        "superseded_id": str(result.superseded_id) if result.superseded_id else None,
        "reason": result.reason,
        "provenance": result.provenance,
        "pii_scan_result": result.pii_scan_result,
        "pii_rule_hits": list(result.pii_rule_hits),
        "events": build_events(body.input, result),
    }


@app.post("/ask", response_model=AskResponse)
def ask(body: AskRequest,
        tenant_id: str = Query(DEFAULT_TENANT),
        user_id: str = Query(DEFAULT_USER),
        limit: int = Query(5, ge=1, le=10)) -> dict[str, Any]:
    _, retriever = _get_engine()
    t0 = time.perf_counter()
    with _engine_lock:
        try:
            hits = retriever.search(
                tenant_id=tenant_id, query=body.query, limit=limit,
                user_id=user_id,
            )
        except NoRelevantMemory:
            hits = []
    latency_ms = int((time.perf_counter() - t0) * 1000)

    stamps = _timestamps_by_id(hits) if hits else {}
    memories = [
        memory_to_contract(h, created_at=stamps.get(str(h["id"]), (None, None))[0],
                           updated_at=stamps.get(str(h["id"]), (None, None))[1])
        for h in hits
    ]
    explanation = [
        {
            "memoryId": str(h["id"]),
            "score": round(min(0.98, max(0.5, float(h.get("cosine_sim") or 0.5))), 3),
            "reasons": _reasons_for(h),
        }
        for h in hits
    ][:3]
    return {
        "query": body.query,
        "memories": memories,
        "explanation": explanation,
        "latency_ms": latency_ms,
    }


@app.get("/memory", response_model=MemoryListResponse)
def get_memories(tenant_id: str = Query(DEFAULT_TENANT),
                 user_id: str | None = None) -> dict[str, Any]:
    with _engine_lock:
        rows = store.get_active(tenant_id=tenant_id, limit=200, user_id=user_id)
    return {"memories": [memory_from_row(r) for r in rows]}


@app.get("/audit", response_model=AuditResponse)
def audit(memory_id: str,
          tenant_id: str = Query(DEFAULT_TENANT)) -> dict[str, Any]:
    with _engine_lock:
        events = audit_trail(store, memory_id=memory_id, tenant_id=tenant_id)
    if not events:
        raise HTTPException(status_code=404, detail="memory not found")
    return {"events": events}


def _timestamps_by_id(hits: list[dict[str, Any]]) -> dict[str, tuple[Any, Any]]:
    """Batch-fetch created_at/updated_at for retrieval hits (search_dense does
    not carry them; one extra query keeps contract timestamps populated)."""
    ids = [str(h["id"]) for h in hits]
    if not ids:
        return {}
    with store.session() as conn:
        rows = conn.execute(
            "SELECT id, created_at, updated_at FROM memories WHERE id = ANY(%s)",
            (ids,),
        ).fetchall()
    return {str(r["id"]): (r["created_at"], r["updated_at"]) for r in rows}


def _reasons_for(hit: dict[str, Any]) -> list[str]:
    reasons: list[str] = []
    if hit.get("cosine_sim") is not None:
        reasons.append(
            f"dense cosine {hit['cosine_sim']:.3f} \u2265 floor "
            f"{_get_engine()[1].floor}"
        )
    if hit.get("bm25") is not None and hit["bm25"] > 0:
        reasons.append(f"BM25 {hit['bm25']:.3f}")
    prov = hit.get("provenance", "user_stated")
    reasons.append(f"provenance: {prov}")
    return reasons