
import pytest

from app.file_reader import read_repo_file


def test_reject_parent_path(tmp_path):
    with pytest.raises(ValueError):
        read_repo_file("../secret.txt", project_root=tmp_path)


def test_reject_absolute_path(tmp_path):
    with pytest.raises(ValueError):
        read_repo_file(
            "C:\\Windows\\win.ini",
            project_root=tmp_path,
        )


def test_reject_missing_file(tmp_path):
    with pytest.raises(ValueError):
        read_repo_file(
            "fake_file_123.py",
            project_root=tmp_path,
        )


def test_read_file_from_workspace(tmp_path):
    sample_file = tmp_path / "sample.py"
    sample_file.write_text("print('Hello')", encoding="utf-8")

    result = read_repo_file(
        "sample.py",
        project_root=tmp_path,
    )

    assert result["path"] == "sample.py"
    assert result["content"] == "print('Hello')"
    assert result["size_bytes"] > 0


def test_read_file_requires_workspace():
    with pytest.raises(ValueError):
        read_repo_file("sample.py", project_root=None)
