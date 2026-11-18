from pathlib import Path
from app.workspace_manager import (
    register_workspace,
    get_workspace,
    remove_workspace,
)


def test_workspace_lifecycle(tmp_path):
    repo_path = tmp_path / "repo"
    repo_path.mkdir()

    workspace_id = register_workspace(str(repo_path))

    assert get_workspace(workspace_id) == repo_path.resolve()

    remove_workspace(workspace_id)
    assert not repo_path.exists()