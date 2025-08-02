from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class OnlineRecipeLocation(BaseModel):
    location: Literal["online"]
    url: str


class CookbookRecipeLocation(BaseModel):
    location: Literal["cookbook"]
    cookbook_name: str
    page_number: int


class RecipeLocation(BaseModel):
    location: CookbookRecipeLocation | OnlineRecipeLocation = Field(
        discriminator="location"
    )


class Recipe(BaseModel):
    id: int
    name: str
    cuisine: str
    tags: list[str]
    location: RecipeLocation
    notes: str | None
    saved_at: datetime
    updated_at: datetime


class RecipePatch(BaseModel):
    name: str | None = None
    cuisine: str | None = None
    tags: list[str] | None = None
    location: RecipeLocation | None = None
    notes: str | None = None
