from app.retriever import retrieve_relevant_files

def test_retrieves_relevant_files():
    files = [
        {
            "path": "app/database.py",
            "content": "def connect_database(): pass",
        },

        {
            "path": "app/home.py",
            "content": "Welcome to the home page",
        }
    ]

    result = retrieve_relevant_files(
        "database connection",
        files,
    )

    assert len(result) == 1
    assert result[0]["path"] == "app/database.py"

def test_returns_empty_when_no_match():
    files = [
        {
            "path": "app/home.py",
            "content": "Welcome to the home page",
        }
    ]

    result = retrieve_relevant_files(
        "payment gateway",
        files,
    )

    assert result == []


def test_respects_max_files():
        files = [
            {
                "path": f"app/database_{i}.py",
                "content": "database connection logic",
            }
            for i in range(3)
        ]

        result = retrieve_relevant_files(
            "database connection",
            files,
            max_files= 2,
        )

        assert len(result) == 2

        
