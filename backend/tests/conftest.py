import os

# The application reads these at import time. Force dummy values so the suite
# is independent of a local .env file or the developer's shell, and never
# calls the real provider.
os.environ["OPENROUTER_API_KEY"] = "test-openrouter-key"
os.environ["BACKEND_API_KEY"] = "test-backend-key"

import pytest  # noqa: E402

from app.security import reset_rate_limits  # noqa: E402


@pytest.fixture(autouse=True)
def _reset_rate_limit_state():
    reset_rate_limits()
    yield
    reset_rate_limits()
