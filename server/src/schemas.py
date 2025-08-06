from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class UserRegistration(BaseModel):
    email: str
    name: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    user_id: UUID | None
    expires_at: datetime | None
