from datetime import date, datetime
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

Priority = Literal["low", "medium", "high"]
Title = Annotated[str, Field(min_length=1, max_length=200)]


class Credentials(BaseModel):
    email: EmailStr
    password: Annotated[str, Field(min_length=8, max_length=72)]


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    email: EmailStr


class TodoCreate(BaseModel):
    title: Title
    notes: Annotated[str | None, Field(default=None, max_length=2000)]
    priority: Priority = "medium"
    due_date: date | None = None

    @field_validator("title")
    @classmethod
    def strip_title(cls, value: str) -> str:
        stripped = value.strip()
        if not stripped:
            raise ValueError("Title is required")
        return stripped

    @field_validator("notes")
    @classmethod
    def blank_notes_to_none(cls, value: str | None) -> str | None:
        if value is None:
            return None
        stripped = value.strip()
        return stripped or None


class TodoUpdate(BaseModel):
    title: Title | None = None
    notes: Annotated[str | None, Field(default=None, max_length=2000)]
    priority: Priority | None = None
    due_date: date | None = None
    completed: bool | None = None

    @field_validator("title")
    @classmethod
    def strip_title(cls, value: str | None) -> str | None:
        if value is None:
            return None
        stripped = value.strip()
        if not stripped:
            raise ValueError("Title is required")
        return stripped


class TodoOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    notes: str | None
    priority: Priority
    due_date: date | None
    completed: bool
    completed_at: datetime | None
    created_at: datetime
    updated_at: datetime


class ErrorResponse(BaseModel):
    detail: str
