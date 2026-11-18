
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch

from app.main import app
from app.workspace_manager import register_workspace

client = TestClient(app)


@pytest.fixture
def workspace_id(tmp_path):
    app_folder = tmp_path / "app"
    app_folder.mkdir()

    (app_folder / "main.py").write_text(
        "from fastapi import FastAPI\napp = FastAPI()\n",
        encoding="utf-8",
    )

    (tmp_path / "scanner.py").write_text(
        "def scan_repo():\n    # Repository scanning logic\n    pass\n",
        encoding="utf-8",
    )

    return register_workspace(str(tmp_path))


def test_health():
    response = client.get("/health")
    assert response.status_code == 200


def test_scan(workspace_id):
    response = client.post(
        "/scan",
        json={
            "folder": ".",
            "workspace_id": workspace_id,
        },
    )

    assert response.status_code == 200
    assert response.json()["total_files_found"] > 0


def test_read_file(workspace_id):
    response = client.post(
        "/read-file",
        json={
            "path": "app/main.py",
            "workspace_id": workspace_id,
        },
    )

    assert response.status_code == 200
    assert "FastAPI" in response.json()["content"]


def test_read_file_rejects_invalid_path(workspace_id):
    response = client.post(
        "/read-file",
        json={
            "path": "../secret.txt",
            "workspace_id": workspace_id,
        },
    )

    assert response.status_code == 400


def test_collect(workspace_id):
    response = client.post(
        "/collect",
        json={
            "folder": ".",
            "workspace_id": workspace_id,
        },
    )

    assert response.status_code == 200
    assert response.json()["files_collected"] > 0


def test_ask_ai(workspace_id):
    with patch("app.main.ask_gemini") as mock_ai:
        mock_ai.return_value = (
            "Repository scanning is handled in scanner.py"
        )

        response = client.post(
            "/ask-ai",
            json={
                "prompt": "Where is repository scanning handled?",
                "workspace_id": workspace_id,
            },
        )

    assert response.status_code == 200

    data = response.json()
    assert "answer" in data
    assert data["files_analyzed"] > 0
    assert "relevant_files" in data
    assert data["truncated"] is False
    mock_ai.assert_called_once()


def test_ask_ai_rejects_empty_request():
    response = client.post("/ask-ai", json={})
    assert response.status_code == 422


def test_ask_ai_handles_ai_failure(workspace_id):
    with patch("app.main.ask_gemini") as mock_ai:
        mock_ai.side_effect = Exception("AI provider unavailable")

        response = client.post(
            "/ask-ai",
            json={
                "prompt": "Where is repository scanning handled?",
                "workspace_id": workspace_id,
            },
        )

    assert response.status_code == 500
    assert "AI request failed" in response.json()["detail"]


def test_scan_requires_workspace():
    response = client.post("/scan", json={"folder": "."})
    assert response.status_code == 400
