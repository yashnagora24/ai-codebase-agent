# AI Codebase Agent

A full-stack developer tool that clones a public GitHub repository, lets you browse its source files, and uses an LLM to answer questions, suggest fixes, and produce a structured code review.

The frontend is a Next.js dashboard. The backend is a FastAPI service that downloads repositories into isolated temporary workspaces and grounds every AI request in actual repository code.

> **Status:** prepared for free-tier deployment on Render (backend) + Vercel (frontend). It is **not deployed** by this repository. Follow the deployment steps below.

---

## Table of Contents

1. [What It Does](#1-what-it-does)
2. [Features](#2-features)
3. [Tech Stack](#3-tech-stack)
4. [How It Works](#4-how-it-works)
5. [Repository Structure](#5-repository-structure)
6. [Local Development](#6-local-development)
7. [Environment Variables](#7-environment-variables)
8. [Security Model](#8-security-model)
9. [API Reference](#9-api-reference)
10. [Deploying](#10-deploying)
11. [Free-Tier Limitations](#11-free-tier-limitations)
12. [Known Limitations](#12-known-limitations)
13. [Manual Steps Checklist](#13-manual-steps-checklist)

---

## 1. What It Does

1. You paste a public GitHub repository URL.
2. The backend validates the URL and performs a shallow `git clone --depth 1` into the OS temp directory.
3. The clone is registered as an in-memory **workspace**, and a `workspace_id` (UUID) is returned.
4. The frontend scans that workspace, lists supported source files, and opens files on demand.
5. AI actions retrieve the most relevant files and send a grounded prompt to an OpenRouter model through the OpenAI-compatible SDK.
6. Results render as Markdown with syntax-highlighted code blocks and copy buttons.

The browser never talks to the backend directly. It calls same-origin Next.js Route Handlers under `/api/backend/*`, and the Next.js server forwards the request to FastAPI with a shared secret.

---

## 2. Features

### Repository handling
- Public GitHub repository connection with URL validation (`https://github.com/<owner>/<repo>`).
- Isolated shallow clones: no submodules, LFS smudging disabled, git hooks and global config isolated per download.
- Temporary workspaces keyed by UUID; the frontend never sends a filesystem path for the repository root.
- Path-traversal protection: absolute paths, `..` segments, and symlinks are rejected for scans and file reads.
- Post-clone repository size cap (default **150 MB**).
- Temporary workspaces expire after **1 hour** and are evicted when more than **50** exist.

### Code exploration
- Repository scanning with an extension whitelist and ignored directories (`.git`, `node_modules`, `__pycache__`, `.next`, `dist`, `build`, virtualenvs).
- File explorer with total-files and results-shown counters plus a truncation warning.
- Syntax-highlighted file viewer (Prism, `vscDarkPlus`) with file size and loading/error states.
- Clickable relevant-files list to jump from an AI answer into the viewer.

### AI capabilities
- **Ask AI** — answers questions using the top 5 retrieved files.
- **Suggest Fix** — structured bug analysis (cause, fix, explanation, verification) from retrieved files.
- **Analyze Repository** — structured code review over the collected repository.
- **Analyze File** — question answering scoped to a single selected file.
- Prompts instruct the model to treat repository content as untrusted and never follow instructions found inside files.
- Markdown rendering with GitHub-flavored Markdown and highlighted fenced code blocks.

### Deployment and security
- Server-to-server authentication with a shared `BACKEND_API_KEY` (constant-time comparison).
- Request body cap and per-field input length limits.
- In-memory rate limiting for AI and clone operations.
- Configurable CORS via `ALLOWED_ORIGINS`.
- API docs disabled automatically in production.
- Same-origin Next.js proxy with an endpoint allowlist and a 64 KB body cap.
- Generic error responses; provider and internal details are not leaked to clients.

---

## 3. Tech Stack

### Frontend

| Layer | Technology |
| --- | --- |
| Framework | Next.js **16.4.5** (App Router, Turbopack) |
| UI runtime | React **19.3.0**, React DOM **19.3.0** |
| Language | TypeScript **5** (strict mode) |
| Styling | Tailwind CSS **v4** via `@tailwindcss/turbopack` |
| Markdown | `react-markdown`, `remark-gfm`, `rehype-highlight`, `highlight.js` |
| Code viewer | `react-syntax-highlighter` (Prism, `vscDarkPlus`) |
| Fonts | Geist Sans / Geist Mono via `next/font/google` |
| Linting | ESLint 9 + `eslint-config-next` **16.4.3** |
| HTTP | Native `fetch` through the same-origin proxy |

### Backend

| Layer | Technology |
| --- | --- |
| Language | Python **3.10+** (developed and tested on 3.14) |
| Framework | FastAPI **0.143.1** |
| Server | Uvicorn `[standard]` **0.54.0** |
| Validation | Pydantic **2.14.1** |
| AI provider | OpenRouter via `openai` **3.37.0** (`base_url=https://openrouter.ai/api/v1`) |
| Config | `python-dotenv` **1.2.4** (`backend/.env`) |
| Repository access | System `git` executable |
| Tests | `pytest` + FastAPI `TestClient` (uses `httpx`) |

**Not used:** Docker, databases, Redis, ORM, message queues, embedding/vector stores, user accounts, or a full authentication system.

---

## 4. How It Works

```text
Browser (Vercel origin)
   │  POST /api/backend/<endpoint>          same-origin, no secrets
   ▼
Next.js Route Handler (server)
   │  POST https://<render-service>/<endpoint>
   │  X-Backend-Key: BACKEND_API_KEY
   │  X-Client-IP: <original client IP>
   ▼
FastAPI (Render)
   ├─ auth middleware        (except GET /health and OPTIONS)
   ├─ body-size middleware
   ├─ rate limiting          (AI + clone)
   ├─ workspace resolution   (workspace_id → temp clone path)
   ├─ scanner / reader / collector / retriever
   └─ OpenRouter chat completion
```

The proxy only accepts the eight endpoints listed in [API Reference](#9-api-reference). It also rejects request bodies larger than 64 KB before forwarding.

### Request lifecycle

1. The browser sends JSON to `/api/backend/<endpoint>` on the same origin.
2. The Next.js Route Handler checks the endpoint against its allowlist and forwards the body to `BACKEND_URL` with `X-Backend-Key`.
3. The backend verifies the key, enforces the body cap, and applies rate limits where relevant.
4. `workspace_manager` resolves `workspace_id` to the local clone path.
5. Scanner/reader/collector operate **inside** that path and reject escapes.
6. `retriever.py` scores files by path keywords (weight 5), content keywords (weight 1), and `def function_name(` matches (weight 20), returning the top files.
7. A grounded prompt is sent to OpenRouter; the JSON response is rendered as Markdown in the browser.

---

## 5. Repository Structure

```text
.
├── README.md
├── .gitignore
├── backend/
│   ├── .env.example            # documented backend variables (no secrets)
│   ├── requirements.txt        # pinned runtime dependencies
│   ├── app/
│   │   ├── main.py             # FastAPI app, middleware, endpoints
│   │   ├── security.py         # API key, body cap, rate limiting
│   │   ├── ai_service.py       # OpenRouter client
│   │   ├── github_service.py   # URL validation + shallow clone + size cap
│   │   ├── workspace_manager.py# in-memory registry + TTL cleanup
│   │   ├── scanner.py          # scan limits + extension whitelist
│   │   ├── file_reader.py      # safe file reads
│   │   ├── file_collector.py   # full-content collection
│   │   └── retriever.py        # relevance ranking
│   └── tests/                  # pytest suite
└── frontend/
    ├── .env.example            # documented server-only variables
    ├── package.json
    ├── next.config.ts
    ├── tsconfig.json
    └── src/
        ├── app/
        │   ├── page.tsx        # client state + handlers
        │   ├── layout.tsx
        │   ├── globals.css
        │   └── api/backend/[...path]/route.ts   # same-origin proxy
        ├── components/         # layout / repo / explorer / actions / viewer / results / ui
        └── lib/                # types, formatting, classnames
```

---

## 6. Local Development

### Prerequisites

| Requirement | Notes |
| --- | --- |
| Python 3.10+ | `str \| None` syntax and `Path.is_relative_to` are used |
| Node.js 20+ | Next.js 16 requires a modern Node runtime; Node 22 LTS is recommended |
| Git on `PATH` | The backend shells out to `git` to clone repositories |
| OpenRouter API key | Read at backend startup |
| A shared backend key | Required locally too; see below |

### 6.1 Backend setup

From the repository root:

```powershell
cd backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1

python -m pip install --upgrade pip
pip install -r requirements.txt
```

For the test suite, also install the test-only packages:

```powershell
pip install pytest httpx
```

Create `backend/.env` from the example:

```powershell
Copy-Item .env.example .env
```

Then fill in at least these values:

```dotenv
OPENROUTER_API_KEY=your_openrouter_api_key
BACKEND_API_KEY=your_shared_backend_key
ALLOWED_ORIGINS=http://localhost:3000
```

Generate a suitable shared key with:

```powershell
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

> **Important:** authentication fails closed. If `BACKEND_API_KEY` is empty, every endpoint except `GET /health` returns `503 Server authentication is not configured.`

Start the API:

```powershell
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

- Health check: <http://127.0.0.1:8000/health>
- API docs (local only): <http://127.0.0.1:8000/docs>

Run `uvicorn` from `backend/` so `app.*` imports and `load_dotenv()` resolve correctly.

### 6.2 Frontend setup

In a second terminal:

```powershell
cd frontend
npm install
Copy-Item .env.example .env.local
```

Set the two server-only values in `frontend/.env.local`:

```dotenv
BACKEND_URL=http://127.0.0.1:8000
BACKEND_API_KEY=the_same_shared_backend_key
```

`BACKEND_API_KEY` must be byte-for-byte identical to the value in `backend/.env`.

Start the frontend:

```powershell
npm run dev
```

Open **<http://localhost:3000>**.

> Do **not** prefix these variables with `NEXT_PUBLIC_`. The proxy reads them on the server; a `NEXT_PUBLIC_` prefix would ship the secret to the browser.

### 6.3 Running the tests

Backend:

```powershell
cd backend
python -m pytest
```

The test configuration sets dummy keys through `tests/conftest.py` and mocks the AI call, so the suite never calls the real provider.

Frontend checks:

```powershell
cd frontend
npx tsc --noEmit
npm run lint
npm run build
```

### 6.4 Useful scripts

| Directory | Command | Purpose |
| --- | --- | --- |
| `backend` | `uvicorn app.main:app --reload --port 8000` | Development API server |
| `backend` | `python -m pytest` | Backend tests |
| `frontend` | `npm run dev` | Next.js dev server (Turbopack) |
| `frontend` | `npm run build` | Production build |
| `frontend` | `npm start` | Serve the production build |
| `frontend` | `npm run lint` | ESLint |

---

## 7. Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `OPENROUTER_API_KEY` | **Yes** | — | Authenticates the OpenRouter client |
| `BACKEND_API_KEY` | **Yes** | — | Shared secret expected in `X-Backend-Key`; must match the frontend |
| `ALLOWED_ORIGINS` | No | `http://localhost:3000` | Comma-separated CORS origins |
| `ENVIRONMENT` | No | — | Set to `production` to disable `/docs`, `/redoc`, `/openapi.json` |
| `MAX_BODY_BYTES` | No | `65536` | Maximum accepted JSON body size |
| `AI_LIMIT_PER_HOUR` | No | `10` | AI requests per client per hour |
| `AI_LIMIT_PER_DAY` | No | `30` | AI requests per client per day |
| `AI_GLOBAL_PER_DAY` | No | `50` | AI requests across all clients per day |
| `CLONE_LIMIT_PER_HOUR` | No | `5` | Clone requests per client per hour |
| `CLONE_LIMIT_PER_DAY` | No | `20` | Clone requests per client per day |
| `CLONE_GLOBAL_PER_DAY` | No | `30` | Clone requests across all clients per day |
| `MAX_REPO_BYTES` | No | `157286400` (150 MB) | Post-clone repository size cap |
| `WORKSPACE_TTL_SECONDS` | No | `3600` | Temporary workspace lifetime |
| `MAX_WORKSPACES` | No | `50` | Maximum registered workspaces |
| `OPENROUTER_TIMEOUT_SECONDS` | No | `120` | Provider request timeout |
| `OPENROUTER_MAX_RETRIES` | No | `1` | Provider retry count |
| `OPENROUTER_MODEL` | No | `openrouter/free` | OpenRouter model ID |

Render sets the `RENDER` environment variable automatically, which also disables API docs in production.

### Frontend (`frontend/.env.local`, or Vercel project settings)

| Variable | Required | Purpose |
| --- | --- | --- |
| `BACKEND_URL` | **Yes** | Base URL of the FastAPI service (no trailing slash needed) |
| `BACKEND_API_KEY` | **Yes** | Shared secret forwarded as `X-Backend-Key` |

Both values are read only by `src/app/api/backend/[...path]/route.ts` on the server. There are no `NEXT_PUBLIC_*` variables in this project.

---

## 8. Security Model

| Control | Implementation |
| --- | --- |
| Server-to-server auth | Every endpoint except `GET /health` and CORS preflight requires `X-Backend-Key` |
| Fail closed | If `BACKEND_API_KEY` is unset, protected endpoints return `503` |
| Constant-time comparison | `hmac.compare_digest` in `backend/app/security.py` |
| Browser secrecy | The key exists only in Vercel server env; the browser calls `/api/backend/*` |
| CORS | Explicit origin list from `ALLOWED_ORIGINS`; wildcard is rejected |
| Body cap | 64 KB at the proxy and at the backend |
| Input limits | Pydantic `max_length` on prompts, paths, URLs, folders, questions, and workspace IDs |
| Rate limiting | Sliding windows per client and globally for AI and clone operations |
| Repo cap | Post-clone directory size check (default 150 MB) |
| Workspace cleanup | 1-hour TTL and eviction above 50 workspaces |
| Error hygiene | Generic `500` messages; provider/internal details stay in server logs |
| Docs gating | `/docs`, `/redoc`, `/openapi.json` disabled when `RENDER` is set or `ENVIRONMENT=production` |
| Proxy allowlist | Only the eight UI endpoints are reachable through Next.js |

### Important limitation: no user login

This is a public portfolio demo, not a multi-user service. The Next.js proxy is publicly reachable, so anyone who finds the site can use the AI features within the configured quotas. The shared backend key prevents direct access to the Render service, but it does **not** identify or block individual visitors.

Abuse is bounded by:
- per-client hourly and daily limits (keyed by forwarded client IP),
- global daily limits,
- body and repository size caps.

These counters are **process-local and in-memory**. They reset when the backend restarts and are not shared across instances. If you need stronger protection, add an access-code gate or a platform-level WAF rate-limit rule (see [Deploying](#10-deploying)).

---

## 9. API Reference

Base URL (local): `http://127.0.0.1:8000`

All endpoints are `POST` except `GET /health`. All `POST` endpoints require the `X-Backend-Key` header. Browser clients reach them through `/api/backend/<endpoint>`.

| Method | Path | Request body | Response (key fields) |
| --- | --- | --- | --- |
| GET | `/health` | — | `status`, `message` (public) |
| POST | `/download-repo` | `url` | `message`, `workspace_id`, `repository_url` |
| POST | `/scan` | `folder` (default `"."`), `workspace_id` | `folder`, `total_files_found`, `results_returned`, `truncated`, `files[]` |
| POST | `/read-file` | `path`, `workspace_id` | `path`, `size_bytes`, `content` |
| POST | `/collect` | `folder` (default `"."`), `workspace_id` | `folder`, `files_collected`, `total_bytes`, `max_total_bytes`, `skipped_files`, `truncated`, `files[]` |
| POST | `/ask-ai` | `prompt`, `workspace_id` | `answer`, `files_analyzed`, `relevant_files[]`, `truncated` |
| POST | `/suggest-fix` | `bug_description`, `workspace_id` | `bug_description`, `suggestion`, `files_analyzed`, `relevant_files[]`, `truncated` |
| POST | `/analyze` | `workspace_id` | `analysis`, `files_analyzed`, `total_bytes`, `truncated` |
| POST | `/analyze-file` | `path`, `question`, `workspace_id` | `path`, `answer`, `size_bytes` |

Input limits:

| Field | Maximum length |
| --- | --- |
| `prompt` | 4,000 characters |
| `bug_description` | 2,000 characters |
| `question` | 2,000 characters |
| `path` | 512 characters |
| `url` | 512 characters |
| `folder` | 256 characters |
| `workspace_id` | 64 characters |

### Error responses

| Status | When |
| --- | --- |
| `400` | Missing/unknown workspace, invalid GitHub URL, invalid path, unsupported or oversized file, repository over the size cap, empty question/description, no files found |
| `401` | Missing or incorrect `X-Backend-Key` |
| `404` | No relevant files matched, or the proxy endpoint is not allowlisted |
| `413` | Request body exceeds 64 KB, or collected content exceeds the analysis budget |
| `422` | Pydantic validation failure (missing field, over-length input) |
| `429` | Rate limit exceeded; includes `Retry-After` |
| `500` | Unexpected server error (generic message) |
| `502` | Proxy reached the backend, but the backend rejected its key |
| `503` | Backend key not configured, or the proxy could not reach the backend |
| `504` | Proxy timed out waiting for the backend |

Errors use the standard FastAPI shape:

```json
{ "detail": "Please connect a GitHub repository first." }
```

---

## 10. Deploying

Deploy the backend first so you can copy its public URL into Vercel.

### 10.1 Render (Free Web Service)

Create a new **Web Service** from the GitHub repository and use:

| Setting | Value |
| --- | --- |
| Root Directory | `backend` |
| Build Command | `pip install -r requirements.txt` |
| Start Command | `python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
| Health Check Path | `/health` |

Environment variables:

| Variable | Value |
| --- | --- |
| `OPENROUTER_API_KEY` | Your OpenRouter key |
| `BACKEND_API_KEY` | A long random secret |
| `ALLOWED_ORIGINS` | Your Vercel origin, e.g. `https://your-project.vercel.app` |
| `ENVIRONMENT` | Optional; set to `production` for clarity (Render's `RENDER` already disables docs) |

Notes:

- Render sets `$PORT` automatically; the start command above uses it.
- `git` must be available at runtime for repository cloning. Render's native Python environment provides it; if a clone fails with `git: command not found`, use an environment that includes `git`.
- The free instance sleeps after inactivity, so the first request after a pause can take tens of seconds. The proxy waits up to **280 seconds** for a response.
- Temporary clones live on ephemeral disk and are lost on restart or redeploy.

After the service is healthy, verify:

```powershell
curl.exe https://YOUR-SERVICE.onrender.com/health
```

Then test a protected endpoint with the key (the key stays on your machine):

```powershell
curl.exe -X POST https://YOUR-SERVICE.onrender.com/scan `
  -H "Content-Type: application/json" `
  -H "X-Backend-Key: YOUR_BACKEND_API_KEY" `
  -d "{\"folder\":\".\",\"workspace_id\":null}"
```

A missing or wrong key should return `401`.

### 10.2 Vercel (Hobby)

Import the same repository and use:

| Setting | Value |
| --- | --- |
| Root Directory | `frontend` |
| Framework Preset | Next.js |
| Build Command | `npm run build` (default) |
| Install Command | `npm install` (default) |

Environment variables (Production, Preview, and Development as needed):

| Variable | Value |
| --- | --- |
| `BACKEND_URL` | `https://YOUR-SERVICE.onrender.com` |
| `BACKEND_API_KEY` | The same secret used on Render |

Do **not** add `NEXT_PUBLIC_API_URL` or any `NEXT_PUBLIC_*` secret. After changing environment variables, redeploy so the server picks them up.

The Route Handler exports `maxDuration = 300`, which is the Hobby plan's maximum function duration. The upstream fetch itself aborts at 280 seconds to leave headroom.

### 10.3 Optional platform-level protection

Vercel's WAF rate-limit rules can add a coarse per-IP limit in front of the whole site or `/api/backend/*`. The in-memory backend limits remain the authoritative per-operation quota.

### 10.4 Post-deploy checklist

1. `GET https://YOUR-SERVICE.onrender.com/health` returns `200`.
2. `POST` to a protected Render endpoint without `X-Backend-Key` returns `401`.
3. The Vercel site loads and `POST /api/backend/scan` returns `404` for an unknown endpoint.
4. Connecting a repository, scanning, reading a file, and each AI action work end to end.
5. `/docs` is not reachable on the Render service.
6. Browser DevTools shows only same-origin `/api/backend/*` requests and no backend key.

---

## 11. Free-Tier Limitations

| Area | Limitation |
| --- | --- |
| Render compute | Free instances have limited CPU/RAM, sleep after inactivity, and cold-start slowly |
| Render disk | Ephemeral; clones and in-memory workspace IDs disappear on restart or redeploy |
| Render scaling | Single instance by default; in-memory rate limits are per process |
| Vercel functions | Hobby functions run for at most 300 seconds; this project uses 280 seconds of upstream wait |
| Vercel payload | Hobby request/response bodies are capped at 4.5 MB; the proxy caps requests at 64 KB |
| Vercel usage | Hobby is intended for personal/non-commercial projects; check current Vercel terms |
| OpenRouter free model | Shared free capacity can be slow, rate-limited, or temporarily unavailable |
| AI latency | No streaming; a large repository analysis can take a long time or hit the proxy timeout |

Large repositories may exceed the free instance's memory even below the 150 MB cap. The cap is a guardrail, not a guarantee.

---

## 12. Known Limitations

- **No user accounts or access gate.** The proxy is public and quotas bound abuse rather than preventing it.
- **In-memory rate limits reset on restart** and are not shared across multiple backend instances.
- **Workspace IDs are lost on restart**; cloned folders are removed by TTL/eviction or lost with the ephemeral disk.
- **Public GitHub only** — no private repos, tokens, branches, tags, or submodules.
- **Fixed extension whitelist** — HTML, CSS, JSON, YAML, Markdown, SQL, shell, Kotlin, Swift, Ruby, Dart, and others are not scanned or analyzed.
- **UTF-8 only** for file reads.
- **Size and count caps** — 2,000 files scanned, 500 results returned, 200 KB per file, 500 KB total AI context, 150 MB per clone.
- **Keyword retrieval, not embeddings** — semantically related files can be missed.
- **Top 5 files** for Ask AI and Suggest Fix.
- **No streaming, cancellation, or UI retry controls.**
- **Suggestions are advisory** — the app never writes changes to repository files.
- **Pre-existing lint warning** — `scanError` is assigned but not rendered in `page.tsx`; scan failures can appear silent.
- **No frontend automated tests.**
- **Stale per-file AI output** — switching files does not clear the previous file's answer.
- **Clipboard writes need a secure context/permission**; failures show a browser alert.

---

## 13. Manual Steps Checklist

These are the steps that cannot be done by editing tracked files:

1. Generate a shared backend key:
   ```powershell
   python -c "import secrets; print(secrets.token_urlsafe(32))"
   ```
2. Add `BACKEND_API_KEY` to `backend/.env` (local development).
3. Create `frontend/.env.local` with `BACKEND_URL=http://127.0.0.1:8000` and the same `BACKEND_API_KEY`.
4. Restart both servers.
5. Commit and push the changes when you are ready (this repository does not commit or push automatically).
6. Create the Render Web Service with the settings in [10.1](#101-render-free-web-service), and copy its URL.
7. Create the Vercel project with the settings in [10.2](#102-vercel-hobby), using the Render URL and the same backend key.
8. Set `ALLOWED_ORIGINS` on Render to the final Vercel origin(s), then redeploy if you changed it.
9. Run the [post-deploy checklist](#104-post-deploy-checklist).
10. Optionally add a Vercel WAF rate-limit rule for `/api/backend/*`.

---

<p align="center">
  Built with Next.js, FastAPI, and OpenRouter.
</p>
