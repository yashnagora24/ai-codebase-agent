
import pytest

from app.file_collector import collect_repository_files


def test_collect_project_root(tmp_path):
    sample_file = tmp_path / "sample.py"
    sample_file.write_text(
        "print('Hello repository')",
        encoding="utf-8",
    )

    result = collect_repository_files(
        ".",
        project_root=tmp_path,
    )

    assert isinstance(result, dict)
    assert result["files_collected"] > 0
    assert result["total_bytes"] > 0
    assert result["total_bytes"] <= result["max_total_bytes"]


def test_reject_parent_directory(tmp_path):
    with pytest.raises(ValueError):
        collect_repository_files(
            "..",
            project_root=tmp_path,
        )


def test_reject_absolute_path(tmp_path):
    with pytest.raises(ValueError):
        collect_repository_files(
            "C:\\Windows",
            project_root=tmp_path,
        )


def test_reject_nonexistent_folder(tmp_path):
    with pytest.raises(ValueError):
        collect_repository_files(
            "folder_that_does_not_exist_12345",
            project_root=tmp_path,
        )


def test_collect_requires_workspace():
    with pytest.raises(ValueError):
        collect_repository_files(".", project_root=None)
