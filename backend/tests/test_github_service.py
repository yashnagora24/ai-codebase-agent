import pytest

from app.github_service import (
    validate_github_url,
    download_github_repo,
)

def test_valid_github_url():
    url = "https://github.com/owner/repository"

    result = validate_github_url(url)

    assert result == "https://github.com/owner/repository.git"


def test_invalid_github_url():
    with pytest.raises(ValueError):
        validate_github_url("https://example.com/repository")


def test_github_url_with_git_extension():
    url = "https://github.com/owner/repository.git"

    result = validate_github_url(url)

    assert result == "https://github.com/owner/repository.git"


def test_download_github_repo():
    result = download_github_repo(
        "https://github.com/octocat/Hello-World"
    )

    assert result["message"] == "Repository downloaded successfully."

    assert result["repository_url"].endswith(".git")