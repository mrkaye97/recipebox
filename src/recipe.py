from datetime import datetime
from typing import Literal
from uuid import UUID, uuid4

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
    id: UUID = Field(default_factory=uuid4)
    name: str
    cuisine: str
    tags: list[str]
    location: RecipeLocation
    saved_at: datetime
    updated_at: datetime
