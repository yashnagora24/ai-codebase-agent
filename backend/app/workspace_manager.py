from pathlib import Path
from uuid import uuid4
import os
import shutil
import time


MAX_WORKSPACES = int(os.getenv("MAX_WORKSPACES", "50"))
WORKSPACE_TTL_SECONDS = int(os.getenv("WORKSPACE_TTL_SECONDS", "3600"))

workspaces = {}
_created_at = {}


def cleanup_expired_workspaces(max_age_seconds: int | None = None) -> None:
    """Delete workspaces older than the TTL to keep the ephemeral disk bounded."""
    max_age = (
        WORKSPACE_TTL_SECONDS
        if max_age_seconds is None
        else max_age_seconds
    )

    now = time.time()

    for workspace_id in list(workspaces):
        created = _created_at.get(workspace_id, now)

        if now - created > max_age:
            try:
                remove_workspace(workspace_id)
            except ValueError:
                continue


def register_workspace(workspace_path: str) -> str:
    cleanup_expired_workspaces()

    if len(workspaces) >= MAX_WORKSPACES and _created_at:
        oldest_id = min(_created_at, key=_created_at.get)
        try:
            remove_workspace(oldest_id)
        except ValueError:
            pass

    workspace_id = str(uuid4())

    workspaces[workspace_id] = Path(workspace_path).resolve()
    _created_at[workspace_id] = time.time()

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

    shutil.rmtree(workspace_path, ignore_errors=True)

    del workspaces[workspace_id]
    _created_at.pop(workspace_id, None)
