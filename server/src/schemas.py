from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field


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


class OnlineRecipeLocation(BaseModel):
    location: Literal["online"]
    url: str


class CookbookRecipeLocation(BaseModel):
    location: Literal["cookbook"]
    cookbook_name: str
    page_number: int


class MadeUpRecipeLocation(BaseModel):
    location: Literal["made_up"]


class RecipeLocation(BaseModel):
    location: CookbookRecipeLocation | OnlineRecipeLocation | MadeUpRecipeLocation = (
        Field(discriminator="location")
    )
