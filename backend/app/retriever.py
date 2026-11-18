import re


def retrieve_relevant_files(
    question: str,
    files: list[dict],
    max_files: int = 5,
) -> list[dict]:

    question_lower = question.lower()

    question_words = set(
        re.findall(r"\b[a-zA-Z0-9_]+\b", question_lower)
    )

    related_words = {
        "scanning": {"scanner", "scan"},
        "scanner": {"scanning", "scan"},
        "scan": {"scanner", "scanning"},
        "handled": {"handle"},
        "handling": {"handle"},
        "repository": {"repo"},
        "connection": {"connect"},
        "connected": {"connect"},
        "connecting": {"connect"},
    }

    expanded_words = set(question_words)

    for word in question_words:
        expanded_words.update(related_words.get(word, set()))

    
    scored_files = []

    function_name = set(
        re.findall(
            r"\b([a-zA-Z_]\w*)\s*\(\s*\)",
            question_lower,
        )
    )

    for file in files:
        path = file.get("path", "").lower()
        content = file.get("content", "").lower()

        normalized_path = re.sub(r"[/\\_.-]+", " ", path)
        path_words = set(
            re.findall(r"\b[a-zA-Z0-9]+\b", normalized_path)
        )

        content_words = set(
            re.findall(r"\b[a-zA-Z0-9_]+\b", content)
        )

        path_score = sum(
            5 for word in expanded_words
            if len(word) > 2 and word in path_words
        )

        content_score = sum(
            1 for word in expanded_words
            if len(word) > 2 and word in content_words
        )

        function_score = 0

        for name in function_name:
            pattern = rf"\bdef\s+{re.escape(name)}\s*\("
            if re.search(pattern, content):
                function_score += 20

        score = path_score + content_score + function_score

        if score > 0:
            scored_files.append((score, file))

    scored_files.sort(
        key=lambda item: item[0],
        reverse=True,
    )


    return [
        file for score, file in scored_files[:max_files]
    ]