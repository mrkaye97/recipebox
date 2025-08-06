from pydantic import BaseModel


class UserRegistration(BaseModel):
    """Schema for user registration - includes password which isn't stored directly in User model."""

    email: str
    name: str
    password: str


class Token(BaseModel):
    """JWT token response schema."""

    access_token: str
    token_type: str
