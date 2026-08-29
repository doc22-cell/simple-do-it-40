import os

os.environ.setdefault("DATABASE_URL", "sqlite:///./test_todos.db")

import pytest
from fastapi.testclient import TestClient

from app.database import Base, engine
from app.main import app


@pytest.fixture(autouse=True)
def clean_db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield


@pytest.fixture
def client():
    return TestClient(app)


def auth_headers(client: TestClient, email: str = "a@example.com") -> dict[str, str]:
    res = client.post("/api/auth/register", json={"email": email, "password": "supersecret"})
    assert res.status_code == 201
    return {"Authorization": f"Bearer {res.json()['access_token']}"}


def test_health(client):
    assert client.get("/api/health").json() == {"status": "ok"}


def test_requires_auth(client):
    assert client.get("/api/todos").status_code == 401


def test_rejects_short_password(client):
    res = client.post("/api/auth/register", json={"email": "b@example.com", "password": "short"})
    assert res.status_code == 422
    assert "password" in res.json()["fields"]


def test_duplicate_email(client):
    auth_headers(client)
    res = client.post("/api/auth/register", json={"email": "a@example.com", "password": "supersecret"})
    assert res.status_code == 409


def test_todo_crud(client):
    headers = auth_headers(client)
    created = client.post(
        "/api/todos",
        json={"title": "  Buy milk  ", "priority": "high", "due_date": "2026-12-31"},
        headers=headers,
    )
    assert created.status_code == 201
    todo = created.json()
    assert todo["title"] == "Buy milk"

    patched = client.patch(f"/api/todos/{todo['id']}", json={"completed": True}, headers=headers)
    assert patched.status_code == 200
    assert patched.json()["completed"] is True
    assert patched.json()["completed_at"] is not None

    assert len(client.get("/api/todos?status=completed", headers=headers).json()) == 1
    assert client.get("/api/todos?status=active", headers=headers).json() == []

    assert client.delete(f"/api/todos/{todo['id']}", headers=headers).status_code == 204
    assert client.get(f"/api/todos/{todo['id']}", headers=headers).status_code == 404


def test_rejects_blank_title(client):
    headers = auth_headers(client)
    res = client.post("/api/todos", json={"title": "   "}, headers=headers)
    assert res.status_code == 422


def test_rejects_long_title(client):
    headers = auth_headers(client)
    res = client.post("/api/todos", json={"title": "x" * 201}, headers=headers)
    assert res.status_code == 422


def test_users_cannot_touch_each_others_todos(client):
    alice = auth_headers(client, "alice@example.com")
    bob = auth_headers(client, "bob@example.com")
    todo_id = client.post("/api/todos", json={"title": "Alice task"}, headers=alice).json()["id"]

    assert client.get(f"/api/todos/{todo_id}", headers=bob).status_code == 404
    assert client.patch(f"/api/todos/{todo_id}", json={"title": "hi"}, headers=bob).status_code == 404
    assert client.delete(f"/api/todos/{todo_id}", headers=bob).status_code == 404
    assert client.get("/api/todos", headers=bob).json() == []
