from pathlib import Path
from uuid import uuid4
import shutil


workspaces = {}

def register_workspace(workspace_path: str) -> str:
    workspace_id = str(uuid4())

    workspaces[workspace_id] = Path(workspace_path).resolve()

    return workspace_id


def get_workspace(workspace_id: str) -> Path:
    workspace_path = workspaces.get(workspace_id)

    if workspace_path is None:
        raise ValueError("Workspace not found.")


    return workspace_path


def remove_workspace(workspace_id: str) -> None:
    workspace_path = workspaces.get(workspace_id)

    if workspace_path is None:
        raise ValueError("workspace not found.")

    shutil.rmtree(workspace_path)

    del workspaces[workspace_id]
    

