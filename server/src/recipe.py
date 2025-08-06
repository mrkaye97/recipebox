from typing import Literal

from pydantic import BaseModel, Field


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
