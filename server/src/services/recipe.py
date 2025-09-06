from collections import defaultdict
from typing import overload
from uuid import UUID

from fastapi import APIRouter, HTTPException, status

from src.crud.models import DietaryRestriction, RecipeIngredient, RecipeInstruction
from src.crud.models import Recipe as RecipeModel
from src.crud.recipes import AsyncQuerier, CreateRecipeParams
from src.dependencies import User
from src.logger import get_logger
from src.schemas import BaseRecipeCreate, Recipe, RecipeLocation

recipes = APIRouter(prefix="/recipes")
logger = get_logger(__name__)


@overload
async def populate_recipe_data(
    db: AsyncQuerier, user_id: UUID, recipes: RecipeModel
) -> Recipe: ...


@overload
async def populate_recipe_data(
    db: AsyncQuerier, user_id: UUID, recipes: list[RecipeModel]
) -> list[Recipe]: ...


async def populate_recipe_data(
    db: AsyncQuerier, user_id: UUID, recipes: list[RecipeModel] | RecipeModel
) -> list[Recipe] | Recipe:
    wants_single = isinstance(recipes, RecipeModel)

    if isinstance(recipes, RecipeModel):
        recipes = [recipes]

    recipe_ids = [recipe.id for recipe in recipes]

    recipe_id_to_tags = defaultdict[UUID, list[str]](list)
    async for tag in db.list_recipe_tags(recipeids=recipe_ids):
        recipe_id_to_tags[tag.recipe_id].append(tag.tag)

    recipe_id_to_dietary_restrictions_met = defaultdict[UUID, list[DietaryRestriction]](
        list
    )
    async for dr in db.list_recipe_dietary_restrictions_met(recipeids=recipe_ids):
        recipe_id_to_dietary_restrictions_met[dr.recipe_id].append(
            dr.dietary_restriction
        )

    recipe_id_to_ingredients = defaultdict[UUID, list[RecipeIngredient]](list)
    async for ingredient in db.list_recipe_ingredients(recipeids=recipe_ids):
        recipe_id_to_ingredients[ingredient.recipe_id].append(ingredient)

    recipe_id_to_instructions = defaultdict[UUID, list[RecipeInstruction]](list)
    async for instruction in db.list_recipe_instructions(recipeids=recipe_ids):
        recipe_id_to_instructions[instruction.recipe_id].append(instruction)

    to_return = [
        Recipe.from_db(
            recipe=recipe,
            ingredients=recipe_id_to_ingredients[recipe.id],
            dietary_restrictions_met=recipe_id_to_dietary_restrictions_met[recipe.id],
            instructions=recipe_id_to_instructions[recipe.id],
            tags=recipe_id_to_tags[recipe.id],
        )
        for recipe in recipes
    ]

    if wants_single:
        return to_return[0]

    return to_return


async def ingest_recipe(
    db: AsyncQuerier,
    user: User,
    params: BaseRecipeCreate,
    location: RecipeLocation,
    notes: str | None,
) -> Recipe:
    recipe = await db.create_recipe(
        CreateRecipeParams(
            userid=user.id,
            name=params.name,
            author=params.author,
            cuisine=params.cuisine,
            location=location.model_dump_json(),
            timeestimateminutes=params.time_estimate_minutes,
            notes=notes,
            meal=params.meal,
            type=params.type,
        )
    )

    if not recipe:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Could not create recipe"
        )

    ingredients = db.create_recipe_ingredients(
        recipeid=recipe.id,
        names=[i.name for i in params.ingredients],
        quantities=[i.quantity for i in params.ingredients],
        units=[i.units or "" for i in params.ingredients],
    )

    dietary_restrictions_met = db.create_recipe_dietary_restrictions_met(
        recipeid=recipe.id,
        dietaryrestrictionsmets=params.dietary_restrictions_met,
    )

    instructions = db.create_recipe_instructions(
        recipeid=recipe.id,
        stepnumbers=[i.step_number for i in params.instructions],
        contents=[i.content for i in params.instructions],
    )

    tags = db.create_recipe_tags(
        recipeid=recipe.id,
        tags=params.tags,
    )

    return Recipe.from_db(
        recipe=recipe,
        ingredients=[i async for i in ingredients],
        dietary_restrictions_met=[
            d.dietary_restriction async for d in dietary_restrictions_met
        ],
        instructions=[i async for i in instructions],
        tags=[t.tag async for t in tags],
    )
