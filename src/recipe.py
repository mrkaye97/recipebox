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
    GLUTEN_FREE = "Gluten Free"
    DAIRY_FREE = "Dairy Free"
    NUT_FREE = "Nut Free"


class RecipeCreate(BaseModel):
    name: str
    cuisine: str
    tags: list[str]
    location: RecipeLocation
    dietary_restrictions_met: list[DietaryRestriction]
    notes: str | None
    saved_at: datetime
    updated_at: datetime


class Recipe(RecipeCreate):
    id: int


class RecipePatch(BaseModel):
    name: str | None = None
    cuisine: str | None = None
    tags: list[str] | None = None
    location: RecipeLocation | None = None
    dietary_restrictions_met: list[DietaryRestriction] | None = None
    notes: str | None = None
