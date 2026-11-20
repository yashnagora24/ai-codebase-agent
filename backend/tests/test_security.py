from fastapi.testclient import TestClient
import pytest

from app.main import app, IS_PRODUCTION

AUTH_HEADERS = {"X-Backend-Key": "test-backend-key"}

client = TestClient(app, headers=AUTH_HEADERS)


@pytest.mark.skipif(IS_PRODUCTION, reason="API docs are disabled in production")
def test_docs_are_public_in_development():
    anonymous = TestClient(app)

    assert anonymous.get("/docs").status_code == 200
    assert anonymous.get("/openapi.json").status_code == 200


def test_health_does_not_require_key():
    anonymous = TestClient(app)
    response = anonymous.get("/health")

    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_missing_key_returns_401():
    anonymous = TestClient(app)
    response = anonymous.post("/analyze", json={"workspace_id": None})

    assert response.status_code == 401
    assert response.json()["detail"] == "Unauthorized."


def test_wrong_key_returns_401():
    anonymous = TestClient(app, headers={"X-Backend-Key": "not-the-key"})
    response = anonymous.post("/download-repo", json={"url": "x"})

    assert response.status_code == 401


def test_body_size_limit_returns_413():
    oversized = b'{"url":"' + b"a" * 70000 + b'"}'

    response = client.post(
        "/download-repo",
        content=oversized,
        headers={"Content-Type": "application/json"},
    )

    assert response.status_code == 413
    assert response.json()["detail"] == "Request body is too large."


def test_prompt_length_limit_returns_422():
    response = client.post(
        "/ask-ai",
        json={"prompt": "a" * 4001},
    )

    assert response.status_code == 422


def test_ai_rate_limit_returns_429():
    # Default budget is 10 AI requests per hour per client.
    for _ in range(10):
        response = client.post("/ask-ai", json={"prompt": "hello"})
        assert response.status_code == 400

    limited = client.post("/ask-ai", json={"prompt": "hello"})

    assert limited.status_code == 429
    assert limited.headers.get("retry-after")
    assert limited.json()["detail"].startswith("Too many requests")


def test_clone_rate_limit_returns_429():
    # Default budget is 5 clone requests per hour per client.
    for _ in range(5):
        response = client.post("/download-repo", json={"url": "not-a-repo"})
        assert response.status_code == 400

    limited = client.post("/download-repo", json={"url": "not-a-repo"})

    assert limited.status_code == 429
    assert limited.headers.get("retry-after")
