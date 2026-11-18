from pathlib import Path
import os

from app.scanner import (
    IGNORED_DIRS,
    ALLOWED_EXTENSIONS,
    IGNORED_FILES,
    MAX_FILES,
)

from app.file_reader import read_repo_file

MAX_TOTAL_BYTES = 500_000

def collect_repository_files(
    folder: str = ".",
    project_root: Path | None = None,
) -> dict:

    if project_root is None:
        raise ValueError("A GitHub repository workspace is required.")

    base_root = Path(project_root).resolve()

    if not base_root.is_dir():
        raise ValueError("Project workspace does not exist.")

    requested_folder = Path(folder)

    if(
        requested_folder.is_absolute()
        or ".." in requested_folder.parts
    ):
        raise ValueError("Please provide a relative folder path.")

    root = (base_root / requested_folder).resolve()

    if not root.is_relative_to(base_root):
        raise ValueError("Folder must be inside the project workspace.")

    if not root.is_dir():
        raise ValueError("Selected folder does not exist.")

    collected_files = []
    total_bytes = 0
    skipped_files = 0
    truncated = False

    for currnet_dir, directories, filenames in os.walk(root, followlinks= False,):
        directories[:] = [
            name 
            for name in directories
            if name not in IGNORED_DIRS
            and not (Path(currnet_dir) / name).is_symlink()
        ]

        for filename in filenames:
            path = Path(currnet_dir) / filename

            if path.is_symlink():
                skipped_files += 1
                continue

            if filename.lower() in IGNORED_FILES:
                continue

            if path.suffix.lower() not in ALLOWED_EXTENSIONS:
                continue

            if len(collected_files) >= MAX_FILES:
                truncated = True
                break

            relative_path = path.relative_to(base_root).as_posix()

            try:
                file_data = read_repo_file(relative_path, project_root=base_root,)

            except (ValueError, OSError):
                skipped_files += 1
                continue

            content = file_data["content"]
            content_bytes = len(content.encode("utf-8"))

            if total_bytes + content_bytes > MAX_TOTAL_BYTES:
                truncated = True
                break

            collected_files.append({
                "path": file_data["path"],
                "size_bytes": content_bytes,
                "content": content,
            })

            total_bytes += content_bytes

        if truncated:
            break

    return {
        "folder": root.relative_to(base_root).as_posix()
        if root != base_root else ".",
        "files_collected": len(collected_files),
        "total_bytes": total_bytes,
        "max_total_bytes": MAX_TOTAL_BYTES,
        "skipped_files": skipped_files,
        "truncated": truncated,
        "files": collected_files,
    }