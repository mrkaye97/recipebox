from pydantic import BaseModel, Field
from datetime import datetime
from typing import Literal

class OnlineRecipeLocation(BaseModel):
    location: Literal["online"]
    url: str

class CookbookRecipeLocation(BaseModel):
    location: Literal["cookbook"]
    cookbook_name: str
    page_number: int


class RecipeLocation(BaseModel):
    location: CookbookRecipeLocation | OnlineRecipeLocation = Field(discriminator="location")


class Recipe(BaseModel):
    name: str
    cuisine: str
    tags: list[str]
    saved_at: datetime
    updated_at: datetime