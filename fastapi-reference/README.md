# Tasklet — FastAPI + HTML reference implementation

A standalone, runnable Python version of the same Todo app. It is **not** served by the
Lovable preview (that app is the TanStack Start build in `src/`); run it locally.

## Folder structure

```text
fastapi-reference/
├── app/
│   ├── config.py          # env-driven settings (pydantic-settings)
│   ├── database.py        # SQLAlchemy engine/session, Base, get_db dependency
│   ├── models.py          # User, Todo ORM models
│   ├── schemas.py         # Pydantic request/response validation
│   ├── security.py        # password hashing, JWT issue/verify, current-user dep
│   ├── main.py            # app factory, CORS, error handlers, static mount
│   └── routers/
│       ├── auth.py        # /api/auth/*
│       └── todos.py       # /api/todos/*
├── static/index.html      # responsive vanilla-HTML/JS frontend
├── tests/test_api.py      # pytest + httpx integration tests
├── requirements.txt
└── .env.example
```

## Setup

```bash
cd fastapi-reference
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env            # then set JWT_SECRET
uvicorn app.main:app --reload
```

Open http://localhost:8000 for the UI, http://localhost:8000/docs for Swagger.

## Environment variables

| Name | Default | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | `sqlite:///./todos.db` | SQLAlchemy URL; use `postgresql+psycopg://…` in production |
| `JWT_SECRET` | `change-me-in-production` | HMAC signing key — `openssl rand -hex 32` |
| `JWT_ALGORITHM` | `HS256` | JWT algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `1440` | Access-token lifetime |
| `CORS_ORIGINS` | `http://localhost:5173` | Comma-separated allowed browser origins |

## API

All `/api/todos` endpoints require `Authorization: Bearer <token>` and only ever
touch rows owned by the token's user.

| Method | Path | Body / query | Returns |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | `{email, password}` (password ≥ 8) | `201 {access_token, token_type}` |
| POST | `/api/auth/login` | form: `username`, `password` | `200 {access_token, token_type}` |
| GET | `/api/auth/me` | — | `200 {id, email}` |
| GET | `/api/todos` | `status=all\|active\|completed`, `search`, `limit≤500`, `offset` | `200 [Todo]` |
| POST | `/api/todos` | `{title, notes?, priority?, due_date?}` | `201 Todo` |
| GET | `/api/todos/{id}` | — | `200 Todo` |
| PATCH | `/api/todos/{id}` | any subset of the create fields + `completed` | `200 Todo` |
| DELETE | `/api/todos/{id}` | — | `204` |
| GET | `/api/health` | — | `200 {status:"ok"}` |

`Todo`: `{id, title, notes, priority, due_date, completed, completed_at, created_at, updated_at}`

Errors: `401` bad/absent token, `404` missing **or not owned**, `409` duplicate email,
`422 {detail, fields:{field: message}}` validation, `500 {detail:"Internal server error"}`
(details logged server-side only).

## Testing

```bash
cd fastapi-reference
pytest -q
```

Covers auth, validation failures, full CRUD, and cross-user isolation.
