from datetime import UTC, datetime
from typing import Literal
from uuid import UUID

from fastapi import APIRouter, Form, HTTPException, UploadFile
from pydantic import BaseModel

from src.crud.models import DietaryRestriction, Meal, RecipeType
from src.crud.recipes import (
    AsyncQuerier,
    ListRecipeFilterOptionsRow,
    UpdateRecipeParams,
)
from src.dependencies import Connection, User
from src.logger import get_logger
from src.parsing import (
    extract_recipe_markdown_from_url,
    image_to_recipe,
    markdown_to_recipe,
)
from src.schemas import (
    CookbookRecipeLocation,
    CreateMadeUpRecipeLocation,
    CreateOnlineRecipeLocation,
    MadeUpRecipeLocation,
    OnlineRecipeLocation,
    Recipe,
    RecipeIngredient,
    RecipeInstruction,
    RecipeLocation,
)
from src.services.recipe import ingest_recipe, populate_recipe_data

recipes = APIRouter(prefix="/recipes")
logger = get_logger(__name__)

ingredient_to_peak_months = {
    "apples": [8, 9, 10, 11, 12, 1, 2, 3],
    "arugula": [4, 5, 6, 9, 10, 11],
    "asparagus": [4, 5],
    "basil": [6, 7, 8, 9],
    "beans": [7, 8, 9],
    "beets": [1, 2, 3, 4, 6, 7, 8, 9, 10, 11, 12],
    "blackberries": [7, 8],
    "blueberries": [7, 8, 9],
    "bok_choy": [4, 5, 9, 10, 11],
    "broccoli": [5, 6, 9, 10, 11],
    "brussels": [4, 5, 9, 10, 11],
    "brussels_sprouts": [9, 10, 11, 12, 1],
    "butternut_squash": [9, 10, 11, 12, 1, 2],
    "cabbage": [1, 2, 6, 7, 8, 9, 10, 11, 12],
    "carrots": [1, 2, 3, 4, 6, 7, 8, 9, 10, 11, 12],
    "cauliflower": [6, 7, 8, 9, 10, 11],
    "celeriac": [10, 11, 12, 1, 2],
    "celery": [7, 8, 9, 10],
    "chard": [5, 6, 7, 8, 9, 10, 11],
    "chives": [4, 5, 6, 7, 8, 9, 10],
    "cilantro": [5, 6, 7, 8, 9, 10],
    "collard_greens": [1, 2, 6, 7, 8, 9, 10, 11, 12],
    "corn": [7, 8, 9],
    "cranberries": [10, 11],
    "cucumber": [7, 8, 9],
    "currants": [7],
    "dill": [6, 7, 8, 9],
    "eggplant": [7, 8, 9],
    "endive": [9, 10, 11],
    "escarole": [9, 10, 11],
    "fennel": [8, 9, 10, 11],
    "figs": [8, 9],
    "garlic": [7, 8, 9],
    "garlic_scapes": [6],
    "gooseberries": [7],
    "green_beans": [7, 8, 9],
    "herbs": [5, 6, 7, 8, 9, 10],
    "jerusalem_artichokes": [10, 11, 12, 1],
    "kale": [1, 2, 3, 4, 5, 6, 9, 10, 11, 12],
    "kohlrabi": [6, 7, 8, 9, 10],
    "leeks": [8, 9, 10, 11, 12, 1, 2],
    "lettuce": [5, 6, 7, 8, 9, 10],
    "maple_syrup": [3, 4],
    "mesclun": [4, 5, 6, 9, 10],
    "mint": [6, 7, 8, 9],
    "mushrooms": [9, 10, 11],
    "mustard_greens": [4, 5, 9, 10, 11],
    "okra": [8, 9],
    "onions": [1, 2, 3, 7, 8, 9, 10, 11, 12],
    "oregano": [6, 7, 8, 9],
    "parsley": [5, 6, 7, 8, 9, 10, 11],
    "parsnips": [1, 2, 3, 4, 10, 11, 12],
    "peaches": [8, 9],
    "pears": [9, 10, 11],
    "peas": [5, 6],
    "peppers": [7, 8, 9, 10],
    "plums": [8, 9],
    "potatoes": [1, 2, 3, 7, 8, 9, 10, 11, 12],
    "pumpkins": [9, 10, 11],
    "radishes": [4, 5, 6, 9, 10, 11],
    "ramps": [4, 5],
    "raspberries": [7, 8],
    "rhubarb": [5, 6, 7],
    "rosemary": [6, 7, 8, 9, 10, 11],
    "rutabaga": [10, 11, 12, 1, 2],
    "sage": [6, 7, 8, 9, 10, 11],
    "scallions": [4, 5, 6, 7, 8, 9, 10],
    "shallots": [7, 8, 9],
    "snap_peas": [5, 6, 7],
    "spinach": [4, 5, 6, 9, 10, 11],
    "strawberries": [6, 7],
    "summer_squash": [6, 7, 8, 9],
    "sweet_corn": [7, 8, 9],
    "sweet_potatoes": [9, 10, 11, 12],
    "swiss_chard": [5, 6, 7, 8, 9, 10, 11],
    "tatsoi": [4, 5, 9, 10, 11],
    "thyme": [6, 7, 8, 9, 10],
    "tomatoes": [7, 8, 9, 10],
    "turnips": [1, 2, 3, 4, 6, 7, 8, 9, 10, 11, 12],
    "watercress": [4, 5, 6, 9, 10],
    "winter_squash": [1, 2, 9, 10, 11, 12],
    "zucchini": [6, 7, 8, 9],
}

month_to_ingredients = {
    month: [
        ingredient.replace("_", " ")
        for ingredient, peak_months in ingredient_to_peak_months.items()
        if month in peak_months
    ]
    for month in range(1, 13)
}


async def list_recipes_from_db(
    user_id: UUID, search: str | None, only_user: bool, db: AsyncQuerier
) -> list[Recipe]:
    recipes = [
        r
        async for r in db.list_recipes(
            user_id=user_id if only_user else None, search=search
        )
    ]

    return await populate_recipe_data(db=db, recipes=recipes)


@recipes.get("")
async def list_recipes(
    user: User, conn: Connection, search: str | None = None, only_user: bool = False
) -> list[Recipe]:
    db = AsyncQuerier(conn)
    return await list_recipes_from_db(
        user_id=user.id, only_user=only_user, db=db, search=search
    )


def get_seasonal_search_query() -> str:
    month = datetime.now(UTC).month

    seasonal_ingredients = month_to_ingredients[month]

    return " OR ".join([f"name:{ingredient}" for ingredient in seasonal_ingredients])


@recipes.get("/recommendation")
async def recommend_recipe(
    conn: Connection,
    user: User,
) -> Recipe:
    db = AsyncQuerier(conn)
    recipe = await db.recommend_recipe(
        userid=user.id, seasonalingredients=get_seasonal_search_query()
    )

    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")

    await db.log_recipe_recommendation(recipeid=recipe.id, userid=user.id)
    return await populate_recipe_data(
        db=db,
        recipes=recipe,
    )


class RecipeFilterOptions(BaseModel):
    meals: list[Meal]
    types: list[RecipeType]
    cuisines: list[str]


@recipes.get("/filter-options")
async def list_filter_options(
    conn: Connection,
    user: User,
) -> ListRecipeFilterOptionsRow | None:
    db = AsyncQuerier(conn)
    return await db.list_recipe_filter_options(userid=user.id)


@recipes.get("/{id}")
async def get_recipe(
    conn: Connection,
    _: User,
    id: UUID,
) -> Recipe:
    db = AsyncQuerier(conn)
    recipe = await db.get_recipe(recipeid=id)

    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")

    return await populate_recipe_data(
        db=db,
        recipes=recipe,
    )


class RecipePatch(BaseModel):
    name: str | None = None
    author: str | None = None
    cuisine: str | None = None
    location: RecipeLocation | None = None
    time_estimate_minutes: int | None = None
    notes: str | None = None

    ingredients: list[RecipeIngredient] | None = None
    instructions: list[RecipeInstruction] | None = None
    tags: list[str] | None = None
    dietary_restrictions_met: list[DietaryRestriction] | None = None
    meal: Meal | None = None
    type: RecipeType | None = None


@recipes.patch("/{id}")
async def update_recipe(
    conn: Connection,
    user: User,
    id: UUID,
    body: RecipePatch,
) -> Recipe | None:
    db = AsyncQuerier(conn)
    recipe = await db.update_recipe(
        UpdateRecipeParams(
            name=body.name,
            author=body.author,
            cuisine=body.cuisine,
            location=body.location.model_dump_json() if body.location else None,
            time_estimate_minutes=body.time_estimate_minutes,
            notes=body.notes,
            recipeid=id,
            meal=body.meal,
            type=body.type,
        )
    )

    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")

    if body.tags:
        await db.delete_recipe_tags_by_recipe_id(recipeid=id)
        [_ async for _ in db.create_recipe_tags(recipeid=id, tags=body.tags)]

    if body.dietary_restrictions_met:
        await db.delete_recipe_dietary_restrictions_met_by_recipe_id(recipeid=id)
        [
            _
            async for _ in db.create_recipe_dietary_restrictions_met(
                recipeid=id,
                dietaryrestrictionsmets=body.dietary_restrictions_met,
            )
        ]

    if body.ingredients:
        await db.delete_recipe_ingredients_by_recipe_id(recipeid=id)

        [
            _
            async for _ in db.create_recipe_ingredients(
                recipeid=id,
                names=[ingredient.name for ingredient in body.ingredients],
                quantities=[ingredient.quantity for ingredient in body.ingredients],
                units=[ingredient.units for ingredient in body.ingredients],
            )
        ]

    if body.instructions:
        await db.delete_recipe_instructions_by_recipe_id(recipeid=id)

        [
            _
            async for _ in db.create_recipe_instructions(
                recipeid=id,
                stepnumbers=[inst.step_number for inst in body.instructions],
                contents=[inst.content for inst in body.instructions],
            )
        ]

    return await populate_recipe_data(
        db=db,
        recipes=recipe,
    )


@recipes.post("/made-up")
async def create_made_up_recipe(
    params: CreateMadeUpRecipeLocation, user: User, conn: Connection
) -> Recipe | None:
    db = AsyncQuerier(conn)
    md = f"""
        # {params.name}

        # Cuisine:
        {params.cuisine}

        ## Author
        {params.author}

        ## Time Estimate
        {params.time_estimate_minutes} minutes

        ## Tags
        {", ".join(params.tags)}

        ## Dietary Restrictions Met
        {", ".join([dr.value for dr in params.dietary_restrictions_met])}

        ## Ingredients
        {params.ingredients}

        ## Instructions
        {params.instructions}
    """

    base = await markdown_to_recipe(md)

    if not base:
        raise HTTPException(status_code=400, detail="Could not parse recipe from input")

    location = RecipeLocation(location=MadeUpRecipeLocation(location="made_up"))

    return await ingest_recipe(
        db=db, user=user, params=base, notes=params.notes, location=location
    )


@recipes.post("/cookbook")
async def create_cookbook_recipe(
    user: User,
    conn: Connection,
    files: list[UploadFile],
    location: Literal["cookbook"] = Form("cookbook"),
    author: str = Form(...),
    cookbook_name: str = Form(...),
    page_number: int = Form(...),
    notes: str | None = Form(None),
) -> Recipe | None:
    db = AsyncQuerier(conn)

    image_bytes = [await file.read() for file in files]

    base = await image_to_recipe(image_bytes)

    if not base:
        raise HTTPException(status_code=400, detail="Could not parse recipe from image")

    base.author = author

    created_location = RecipeLocation(
        location=CookbookRecipeLocation(
            location=location,
            cookbook_name=cookbook_name,
            page_number=page_number,
        )
    )

    return await ingest_recipe(
        db=db, user=user, params=base, notes=notes, location=created_location
    )


@recipes.post("/online")
async def create_online_recipe(
    params: CreateOnlineRecipeLocation, user: User, conn: Connection
) -> Recipe | None:
    db = AsyncQuerier(conn)
    md = await extract_recipe_markdown_from_url(params.url)
    base = await markdown_to_recipe(md)

    if not base:
        raise HTTPException(status_code=400, detail="Could not parse recipe from URL")

    location = RecipeLocation(
        location=OnlineRecipeLocation(
            location="online",
            url=params.url,
        )
    )

    return await ingest_recipe(
        db=db, user=user, params=base, notes=params.notes, location=location
    )


@recipes.delete("/{id}")
async def delete_recipe(conn: Connection, _: User, id: UUID) -> UUID:
    db = AsyncQuerier(conn)

    await db.delete_recipe(recipeid=id)

    return id
