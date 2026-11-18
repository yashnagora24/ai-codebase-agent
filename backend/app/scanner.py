import os
from pathlib import Path


IGNORED_DIRS = {
    ".git",
    ".venv",
    "venv",
    "node_modules",
    "__pycache__",
    ".next",
    "dist",
    "build",
}

ALLOWED_EXTENSIONS = {
    ".py",
    ".js",
    ".jsx",
    ".ts",
    ".tsx",
    ".java",
    ".cpp",
    ".c",
    ".cs",
    ".go",
    ".rs",
    ".php",
}

IGNORED_FILES = {
    ".env",
    ".env.local",
    ".env.production",
    "id_rsa",
    "credentials.json",
}

MAX_FILES = 2000
MAX_RESULTS = 500

def scan_repo(folder: str = ".", project_root: Path | None = None,) -> dict:

    if project_root is None:
        raise ValueError("A GitHub repository workspace is required.")

    base_root = Path(project_root).resolve()

    if not base_root.is_dir():
        raise ValueError("Project workspace does not exist.")
    
    requested_path = Path(folder)

    if requested_path.is_absolute() or ".." in requested_path.parts:
        raise ValueError("Please provide a relative folder path.")

    root = (base_root / requested_path).resolve()

    if not root.is_relative_to(base_root):
        raise ValueError("Folder must be inside the project workspace.")

    if not root.is_dir():
        raise ValueError("Selected folder does not exist.")

    files = []
    total_found = 0
    truncated = False

    for current_dir, directories, filenames in os.walk(
        root,
        followlinks= False,
    ):

        directories[:] = [
            name
            for name in directories
            if name not in IGNORED_DIRS
            and not (Path(current_dir)/ name).is_symlink()
        ]

        for filename in filenames:
            path = Path(current_dir) / filename

            if filename.lower() in IGNORED_FILES:
                continue

            if path.is_symlink():
                continue

            if path.suffix.lower() not in ALLOWED_EXTENSIONS:
                continue

            total_found += 1

            if len(files) < MAX_RESULTS:
                files.append({
                    "path": path.relative_to(root).as_posix(),
                    "extension": path.suffix.lower(),
                })

            if total_found >= MAX_FILES:
                truncated = True
                break

        if truncated:
            break


    return {
        "folder": root.relative_to(base_root).as_posix()
        if root != base_root else ".",
        "total_files_found": total_found,
        "results_returned": len(files),
        "truncated": truncated,
        "files": files,
    }