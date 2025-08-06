from collections.abc import AsyncIterator
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


class RecipeIngredient(BaseModel):
    name: str
    quantity: float
    units: str

    @classmethod
    async def from_db(cls, ingredient: models.RecipeIngredient) -> "RecipeIngredient":
        return cls(
            name=ingredient.name,
            quantity=ingredient.quantity,
            units=ingredient.units,
        )


class RecipeInstruction(BaseModel):
    step_number: int
    content: str

    @classmethod
    async def from_db(
        cls, instruction: models.RecipeInstruction
    ) -> "RecipeInstruction":
        return cls(
            step_number=instruction.step_number,
            content=instruction.content,
        )


class RecipeCreate(BaseModel):
    name: str
    author: str
    cuisine: str
    location: RecipeLocation
    time_estimate_minutes: int
    notes: str | None
    tags: list[str]
    dietary_restrictions_met: list[models.DietaryRestriction]
    ingredients: list[RecipeIngredient]
    instructions: list[RecipeInstruction]


class Recipe(RecipeCreate):
    id: UUID

    @classmethod
    async def from_db(
        cls,
        recipe: models.Recipe,
        ingredients: AsyncIterator[models.RecipeIngredient],
        dietary_restrictions_met: AsyncIterator[models.RecipeDietaryRestrictionMet],
        instructions: AsyncIterator[models.RecipeInstruction],
        tags: AsyncIterator[models.RecipeTag],
    ) -> "Recipe":
        return cls(
            id=recipe.id,
            name=recipe.name,
            author=recipe.author,
            cuisine=recipe.cuisine,
            location=RecipeLocation.model_validate(recipe.location),
            time_estimate_minutes=recipe.time_estimate_minutes,
            notes=recipe.notes,
            tags=[tag.tag async for tag in tags],
            dietary_restrictions_met=[
                dr.dietary_restriction async for dr in dietary_restrictions_met
            ],
            ingredients=[await RecipeIngredient.from_db(i) async for i in ingredients],
            instructions=[
                await RecipeInstruction.from_db(i) async for i in instructions
            ],
        )
