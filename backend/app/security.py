"""Shared security helpers: API key checks, size limits, and in-memory rate limiting.

The limiter is intentionally process-local. It is accurate for the single
Render Free instance this project targets and needs no database or Redis.
"""

import hmac
import os
import time
from collections import deque
from threading import Lock

from fastapi import HTTPException, Request


# Request body cap (bytes). Real payloads are only a few KB.
MAX_BODY_BYTES = int(os.getenv("MAX_BODY_BYTES", "65536"))

# Expensive AI operations.
AI_LIMIT_PER_HOUR = int(os.getenv("AI_LIMIT_PER_HOUR", "10"))
AI_LIMIT_PER_DAY = int(os.getenv("AI_LIMIT_PER_DAY", "30"))
AI_GLOBAL_PER_DAY = int(os.getenv("AI_GLOBAL_PER_DAY", "50"))

# Repository cloning.
CLONE_LIMIT_PER_HOUR = int(os.getenv("CLONE_LIMIT_PER_HOUR", "5"))
CLONE_LIMIT_PER_DAY = int(os.getenv("CLONE_LIMIT_PER_DAY", "20"))
CLONE_GLOBAL_PER_DAY = int(os.getenv("CLONE_GLOBAL_PER_DAY", "30"))

# Paths that stay public (Render health checks).
PUBLIC_PATHS = {"/health"}

_lock = Lock()
_key_hits: dict[tuple[str, str], deque[float]] = {}
_global_hits: dict[str, deque[float]] = {}


def secret_matches(provided: str, expected: str) -> bool:
    """Constant-time comparison for the shared backend key."""
    return hmac.compare_digest(provided.encode("utf-8"), expected.encode("utf-8"))


def get_client_id(request: Request) -> str:
    """Identify the caller for rate limiting.

    The Next.js proxy sends x-client-ip with the original client address.
    Direct callers fall back to their socket address.
    """
    forwarded = request.headers.get("x-client-ip") or request.headers.get(
        "x-forwarded-for", ""
    )
    candidate = forwarded.split(",")[0].strip()
    if not candidate:
        candidate = request.client.host if request.client else "unknown"
    return candidate[:64] or "unknown"


def _consume(
    store: dict,
    key,
    limit: int,
    window_seconds: int,
) -> int:
    """Record a hit. Returns 0 when allowed, else seconds until a retry."""
    now = time.monotonic()
    with _lock:
        hits = store.setdefault(key, deque())
        cutoff = now - window_seconds
        while hits and hits[0] < cutoff:
            hits.popleft()

        if len(hits) >= limit:
            return max(1, int(hits[0] + window_seconds - now) + 1)

        hits.append(now)
        return 0


def _too_many(retry_after: int) -> HTTPException:
    return HTTPException(
        status_code=429,
        detail="Too many requests. Please try again later.",
        headers={"Retry-After": str(retry_after)},
    )


def _enforce(
    request: Request,
    bucket: str,
    per_hour: int,
    per_day: int,
    global_per_day: int,
) -> None:
    client = get_client_id(request)

    retry = _consume(_key_hits, (f"{bucket}:hour", client), per_hour, 3600)
    if retry:
        raise _too_many(retry)

    retry = _consume(_key_hits, (f"{bucket}:day", client), per_day, 86400)
    if retry:
        raise _too_many(retry)

    retry = _consume(_global_hits, f"{bucket}:day", global_per_day, 86400)
    if retry:
        raise _too_many(retry)


def check_ai_rate_limit(request: Request) -> None:
    _enforce(
        request,
        bucket="ai",
        per_hour=AI_LIMIT_PER_HOUR,
        per_day=AI_LIMIT_PER_DAY,
        global_per_day=AI_GLOBAL_PER_DAY,
    )


def check_clone_rate_limit(request: Request) -> None:
    _enforce(
        request,
        bucket="clone",
        per_hour=CLONE_LIMIT_PER_HOUR,
        per_day=CLONE_LIMIT_PER_DAY,
        global_per_day=CLONE_GLOBAL_PER_DAY,
    )


def reset_rate_limits() -> None:
    """Clear all counters (used by tests)."""
    with _lock:
        _key_hits.clear()
        _global_hits.clear()
