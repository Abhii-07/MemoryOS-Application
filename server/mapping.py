"""Mapping: real engine rows/outcomes -> site MemoryEngine contract shapes.

Kept out of app.py so the FastAPI module stays a thin transport layer. The
contract (site/lib/engine/MemoryEngine.ts) is the UI's single shape:
  Memory { id, type, key, value, source, confidence, status, createdAt,
           updatedAt, provenance }
"""

from __future__ import annotations

from typing import Any

from memory_os.admission.patterns import slot_key
from memory_os.db.store import MemoryStore

# Slot prefix -> MemoryType (the engine stores statements, not extracted atoms;
# the slot key is collision detection, the statement is the memory).
_SLOT_TYPE: dict[str, str] = {
    "preference": "preference",
    "tool": "fact",
    "project": "project",
    "event": "fact",
}

PROVENANCE_LABEL: dict[str, str] = {
    "user_stated": "user stated",
    "assistant_generated": "assistant generated",
    "tool_derived": "tool derived",
    "retrieved_document": "retrieved document",
}


def slot_type(key: str | None) -> str:
    if not key:
        return "fact"
    prefix = key.split(":", 1)[0]
    return _SLOT_TYPE.get(prefix, "fact")


def memory_from_row(row: dict[str, Any]) -> dict[str, Any]:
    """Map one `memories` table row to the contract Memory shape."""
    key = slot_key(row["text"])
    created = row.get("valid_from")
    updated = row.get("updated_at") or row.get("valid_from")
    active = row.get("status") == "active" and row.get("valid_until") is None
    return {
        "id": str(row["id"]),
        "type": slot_type(key),
        "key": key or "fact.general",
        "value": row["text"],
        "source": row.get("provenance", "user_stated"),
        "confidence": float(row.get("confidence") or 0.0),
        "status": "ACTIVE" if active else "SUPERSEDED",
        "createdAt": created.isoformat() if created else "",
        "updatedAt": updated.isoformat() if updated else "",
        "provenance": provenance_label(row.get("provenance"), row["text"]),
    }


def memory_to_contract(hit: dict[str, Any], *,
                       created_at: Any = None,
                       updated_at: Any = None) -> dict[str, Any]:
    """Map a HybridRetriever hit to the contract Memory shape."""
    key = slot_key(hit["text"])
    return {
        "id": str(hit["id"]),
        "type": slot_type(key),
        "key": key or "fact.general",
        "value": hit["text"],
        "source": hit.get("provenance", "user_stated"),
        "confidence": float(hit.get("confidence") or 0.0),
        "status": "ACTIVE",
        "createdAt": created_at.isoformat() if created_at else "",
        "updatedAt": (updated_at or created_at).isoformat() if updated_at or created_at else "",
        "provenance": provenance_label(hit.get("provenance"), hit["text"]),
    }


def provenance_label(source: str | None, text: str) -> str:
    label = PROVENANCE_LABEL.get(source or "", source or "unknown")
    return f'{label}: "{text}"'


def build_events(input_text: str, result: Any) -> list[dict[str, Any]]:
    """Derive the contract MemoryEvent stream from one AdmissionResult.

    Mirrors DemoMemoryEngine's event kinds (ingest/extract/pii/conflict/
    resolution/update/noop) but driven by the real engine's outcome.
    """
    events: list[dict[str, Any]] = [{"kind": "ingest", "detail": f'ingest: "{input_text}"'}]

    op = result.admission_op
    if op == "NOOP":
        events.append({"kind": "extract", "detail": "no long-term memory detected"})
        events.append({"kind": "noop", "detail": "chit-chat \u00b7 admission: NOOP"})
        return events

    key = slot_key(input_text)

    if result.pii_scan_result == "redacted":
        hits = ", ".join(result.pii_rule_hits) or "PII"
        events.append(
            {"kind": "pii", "detail": f"pii scan \u2192 {hits} masked", "slotKey": key}
        )

    if op == "DELETE":
        events.append(
            {"kind": "update", "detail": f"consent purge \u00b7 deleted {result.superseded_id or 'record(s)'}",
             "slotKey": key}
        )
        return events

    if key:
        events.append(
            {"kind": "extract", "detail": f"extract \u2192 {key}", "slotKey": key}
        )

    if op == "ADD":
        events.append(
            {"kind": "update", "detail": f"NEW stored \u00b7 \"{input_text}\"",
             "slotKey": key, "newValue": input_text}
        )
    elif op == "UPDATE":
        if result.superseded_id:
            events.append(
                {"kind": "conflict", "detail": "conflict \u00b7 slot already holds a memory",
                 "slotKey": key}
            )
            events.append(
                {"kind": "resolution",
                 "detail": "resolution \u00b7 newer explicit user statement wins",
                 "slotKey": key}
            )
        events.append(
            {"kind": "update", "detail": "superseded prior \u2192 current statement active",
             "slotKey": key, "newValue": input_text}
        )

    events.append(
        {"kind": "update",
         "detail": f"provenance: {result.provenance or 'user_stated'} \u00b7 "
                   f"confidence {'0.95' if op == 'UPDATE' else '1.0'}"}
    )
    return events


def audit_trail(store: MemoryStore, *, memory_id: str,
                tenant_id: str) -> list[dict[str, Any]]:
    """Deterministic lifecycle trail for one memory (contract AuditEvent[]).

    The slot key groups the memory's history: every row for the same
    (tenant, user, slot) ordered by valid_from becomes CREATED / SUPERSEDED /
    ACTIVE events — the same semantics DemoMemoryEngine.audit reproduces.
    """
    with store.connect() as conn:
        current = conn.execute(
            "SELECT id, tenant_id, user_id, text, provenance, confidence, "
            "       status, valid_from, valid_until "
            "  FROM memories WHERE id = %s AND tenant_id = %s",
            (memory_id, tenant_id),
        ).fetchone()
        if current is None:
            return []

        key = slot_key(current["text"])
        sql = (
            "SELECT id, user_id, text, provenance, confidence, status, "
            "       valid_from, valid_until "
            "  FROM memories WHERE tenant_id = %s AND user_id = %s "
        )
        params: list[Any] = [tenant_id, current["user_id"]]
        if key:
            sql += " AND text::text <> '' "
        sql += " ORDER BY valid_from"
        rows = conn.execute(sql, params).fetchall()

    if key is not None:
        history = [r for r in rows if slot_key(r["text"]) == key]
    else:
        history = [current]

    events: list[dict[str, Any]] = []
    mid = str(current["id"])
    for r in history:
        rid = str(r["id"])
        closed = r.get("valid_until") is not None
        at = r["valid_from"].isoformat()
        if rid == mid and not closed:
            events.append({
                "memoryId": mid, "action": "ACTIVE", "at": at,
                "detail": f"latest update \u00b7 confidence {r.get('confidence')}",
            })
        elif rid == mid:
            events.append({
                "memoryId": mid, "action": "SUPERSEDED", "at": r["valid_until"].isoformat(),
                "detail": f'"{r["text"]}" \u2192 superseded',
            })
        else:
            events.append({
                "memoryId": mid, "action": "SUPERSEDED", "at": at,
                "detail": f'"{r["text"]}" \u2192 superseded',
            })
    if not any(e["action"] == "CREATED" for e in events):
        events.insert(0, {
            "memoryId": mid, "action": "CREATED", "at": current["valid_from"].isoformat(),
            "detail": f'"{current["text"]}"',
        })
    return events