from pathlib import Path

from app.scanner import ( 
    ALLOWED_EXTENSIONS,
    IGNORED_FILES,
)

MAX_FILE_SIZE = 200_000


def read_repo_file(file_path: str, project_root: Path) -> dict:

    if project_root is None:
        raise ValueError("A GitHub repository workspace is required.")
    
    requested_path = Path(file_path)

    if requested_path.is_absolute() or ".." in requested_path.parts:
        raise ValueError("Please provider a relative file path.")

    base_root = Path(project_root).resolve()

    if not base_root.is_dir():
        raise ValueError("project workspace does not exist.")


    candidate = base_root / requested_path

    current = candidate

    while current != base_root:
        if current.is_symlink():
            raise ValueError("Symbolic links are not allowed.")
        current = current.parent

    root = candidate.resolve()


    if not root.is_relative_to(base_root):
        raise ValueError("File must be inside the project workspace.")



    if not root.is_file():
        raise ValueError("Selected file does not exist.")

    if root.name.lower() in IGNORED_FILES:
        raise ValueError("This file is not allowed.")

    if root.suffix.lower() not in ALLOWED_EXTENSIONS:
        raise ValueError("This file type is not supported.")

    file_size = root.stat().st_size

    if file_size > MAX_FILE_SIZE:
        raise ValueError("File is too large to read.")

    try:
        content = root.read_text(encoding="utf-8")

    except UnicodeDecodeError as error:
        raise ValueError("File must use UTF-8 text encoding.") from error

    return {
        "path": root.relative_to(base_root).as_posix(),
        "size_bytes": file_size,
        "content": content,
    }


