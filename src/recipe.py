from datetime import datetime
from enum import Enum
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


class DietaryRestriction(str, Enum):
    VEGETARIAN = "Vegetarian"
    VEGAN = "Vegan"
    PESCATARIAN = "Pescatarian"


class RecipeCreate(BaseModel):
    name: str
    author: str
    cuisine: str
    tags: list[str]
    location: RecipeLocation
    dietary_restrictions_met: list[DietaryRestriction]
    time_estimate_minutes: int
    notes: str | None
    saved_at: datetime
    updated_at: datetime


class Recipe(RecipeCreate):
    id: int


class RecipePatch(BaseModel):
    name: str | None = None
    author: str | None = None
    cuisine: str | None = None
    tags: list[str] | None = None
    location: RecipeLocation | None = None
    dietary_restrictions_met: list[DietaryRestriction] | None = None
    time_estimate_minutes: int | None = None
    notes: str | None = None
