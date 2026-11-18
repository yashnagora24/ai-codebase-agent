import re
import os
import shutil
import subprocess
import tempfile
from pathlib import Path

def validate_github_url(url: str) -> str:
    pattern = (
        r"^https://github\.com/"
        r"([A-Za-z0-9_.-]+)/"
        r"([A-Za-z0-9_.-]+)/?$"
    )

    match = re.fullmatch(pattern, url.strip())

    if not match:
        raise ValueError("Invalid Github repository URL.")

    owner, repo = match.groups()

    repo = repo.removesuffix(".git")

    if not owner or not repo:
        raise ValueError("Invalid GitHub repository URL.")

    return f"https://github.com/{owner}/{repo}.git"

def download_github_repo(url: str) -> dict:
    repo_url = validate_github_url(url)

    temp_dir = Path(tempfile.mkdtemp(prefix = "ai_codebase_"))

    workspace_path = temp_dir / "repo"

    try:

        empty_config = temp_dir / "gitconfig"
        empty_config.touch()

        empty_hooks = temp_dir / "empty_hooks"
        empty_hooks.mkdir()

        git_env = os.environ.copy()
        git_env["GIT_CONFIG_NOSYSTEM"] = "1"
        git_env["GIT_CONFIG_GLOBAL"] = str(empty_config)
        git_env["GIT_TERMINAL_PROMPT"] = "0"
        git_env["GIT_LFS_SKIP_SMUDGE"] = "1"

        result = subprocess.run(
            [
                "git",
                "-c",
                f"core.hooksPath={empty_hooks}",
                "clone",
                "--depth",
                "1",
                "--no-recurse-submodules",
                "--",
                repo_url,
                str(workspace_path),
            ],
            capture_output=True,
            text=True,
            timeout=120,
            check=False,
            env=git_env,
        )

        if result.returncode !=0:
            raise ValueError("Could not download GitHub repository.")

        return {
            "repository_url": repo_url,
            "local_path": str(workspace_path.resolve()),
            "message": "Repository downloaded successfully.",
        }

    except subprocess.TimeoutExpired as error:
        shutil.rmtree(temp_dir, ignore_errors=True)
        raise ValueError("Repository download timed out.") from error

    except Exception:
        shutil.rmtree(temp_dir, ignore_errors=True)
        raise
