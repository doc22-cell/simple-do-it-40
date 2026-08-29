from datetime import datetime, timezone
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Todo, User
from ..schemas import TodoCreate, TodoOut, TodoUpdate
from ..security import get_current_user

router = APIRouter(prefix="/api/todos", tags=["todos"])


def _owned_todo(todo_id: str, user: User, db: Session) -> Todo:
    todo = db.get(Todo, todo_id)
    # 404 (not 403) so IDs of other users' todos are not enumerable.
    if todo is None or todo.user_id != user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Todo not found")
    return todo


@router.get("", response_model=list[TodoOut])
def list_todos(
    status_filter: Literal["all", "active", "completed"] = Query("all", alias="status"),
    search: str = Query("", max_length=200),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[Todo]:
    query = db.query(Todo).filter(Todo.user_id == user.id)
    if status_filter == "active":
        query = query.filter(Todo.completed.is_(False))
    elif status_filter == "completed":
        query = query.filter(Todo.completed.is_(True))
    if search.strip():
        query = query.filter(Todo.title.ilike(f"%{search.strip()}%"))
    return query.order_by(Todo.completed, Todo.created_at.desc()).limit(limit).offset(offset).all()


@router.post("", response_model=TodoOut, status_code=status.HTTP_201_CREATED)
def create_todo(
    payload: TodoCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> Todo:
    todo = Todo(user_id=user.id, **payload.model_dump())
    db.add(todo)
    db.commit()
    db.refresh(todo)
    return todo


@router.get("/{todo_id}", response_model=TodoOut)
def get_todo(
    todo_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> Todo:
    return _owned_todo(todo_id, user, db)


@router.patch("/{todo_id}", response_model=TodoOut)
def update_todo(
    todo_id: str,
    payload: TodoUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Todo:
    todo = _owned_todo(todo_id, user, db)
    patch = payload.model_dump(exclude_unset=True)
    if not patch:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Nothing to update")
    if "completed" in patch:
        todo.completed_at = datetime.now(timezone.utc) if patch["completed"] else None
    for key, value in patch.items():
        setattr(todo, key, value)
    db.commit()
    db.refresh(todo)
    return todo


@router.delete("/{todo_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_todo(
    todo_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> Response:
    todo = _owned_todo(todo_id, user, db)
    db.delete(todo)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
