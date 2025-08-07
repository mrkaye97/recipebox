from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field

from src.crud import models


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


class RecipeIngredient(BaseModel):
    name: str
    quantity: float
    units: str

    @classmethod
    def from_db(cls, ingredient: models.RecipeIngredient) -> "RecipeIngredient":
        return cls(
            name=ingredient.name,
            quantity=ingredient.quantity,
            units=ingredient.units,
        )


class RecipeInstruction(BaseModel):
    step_number: int
    content: str

    @classmethod
    def from_db(cls, instruction: models.RecipeInstruction) -> "RecipeInstruction":
        return cls(
            step_number=instruction.step_number,
            content=instruction.content,
        )


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


class CreateOnlineRecipeLocation(OnlineRecipeLocation):
    pass


class CreateCookbookRecipeLocation(CookbookRecipeLocation):
    author: str


class CreateMadeUpRecipeLocation(MadeUpRecipeLocation):
    name: str
    author: str
    cuisine: str
    time_estimate_minutes: int
    tags: list[str]
    dietary_restrictions_met: list[models.DietaryRestriction]
    ingredients: list[RecipeIngredient]
    instructions: list[RecipeInstruction]


class CreateRecipeLocation(BaseModel):
    params: (
        CreateCookbookRecipeLocation
        | CreateOnlineRecipeLocation
        | CreateMadeUpRecipeLocation
    ) = Field(discriminator="location")
    notes: str | None


class BaseRecipeCreate(BaseModel):
    name: str
    author: str
    cuisine: str
    time_estimate_minutes: int
    tags: list[str]
    dietary_restrictions_met: list[models.DietaryRestriction]
    ingredients: list[RecipeIngredient]
    instructions: list[RecipeInstruction]


class RecipeCreate(BaseRecipeCreate):
    location: RecipeLocation
    notes: str | None


class Recipe(RecipeCreate):
    id: UUID

    @classmethod
    def from_db(
        cls,
        recipe: models.Recipe,
        ingredients: list[models.RecipeIngredient],
        dietary_restrictions_met: list[models.DietaryRestriction],
        instructions: list[models.RecipeInstruction],
        tags: list[str],
    ) -> "Recipe":
        return cls(
            id=recipe.id,
            name=recipe.name,
            author=recipe.author,
            cuisine=recipe.cuisine,
            location=RecipeLocation.model_validate(recipe.location),
            time_estimate_minutes=recipe.time_estimate_minutes,
            notes=recipe.notes,
            tags=tags,
            dietary_restrictions_met=dietary_restrictions_met,
            ingredients=[RecipeIngredient.from_db(i) for i in ingredients],
            instructions=[RecipeInstruction.from_db(i) for i in instructions],
        )
