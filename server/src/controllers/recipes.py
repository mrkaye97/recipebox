import secrets
from collections import defaultdict
from datetime import UTC, datetime, timedelta
from typing import Literal, overload
from uuid import UUID

from fastapi import APIRouter, Form, HTTPException, UploadFile, status
from pydantic import BaseModel

from src.crud.models import (
    DietaryRestriction,
    RecipeIngredient,
    RecipeInstruction,
    RecipeShareRequest,
)
from src.crud.models import Recipe as RecipeModel
from src.crud.recipes import (
    AsyncQuerier,
    CreateRecipeIngredientsParams,
    CreateRecipeParams,
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
    BaseRecipeCreate,
    CookbookRecipeLocation,
    CreateMadeUpRecipeLocation,
    CreateOnlineRecipeLocation,
    MadeUpRecipeLocation,
    OnlineRecipeLocation,
    Recipe,
    RecipeLocation,
)

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
    async for tag in db.list_recipe_tags(recipeids=recipe_ids, userid=user_id):
        recipe_id_to_tags[tag.recipe_id].append(tag.tag)

    recipe_id_to_dietary_restrictions_met = defaultdict[UUID, list[DietaryRestriction]](
        list
    )
    async for dr in db.list_recipe_dietary_restrictions_met(
        recipeids=recipe_ids, userid=user_id
    ):
        recipe_id_to_dietary_restrictions_met[dr.recipe_id].append(
            dr.dietary_restriction
        )

    recipe_id_to_ingredients = defaultdict[UUID, list[RecipeIngredient]](list)
    async for ingredient in db.list_recipe_ingredients(
        recipeids=recipe_ids, userid=user_id
    ):
        recipe_id_to_ingredients[ingredient.recipe_id].append(ingredient)

    recipe_id_to_instructions = defaultdict[UUID, list[RecipeInstruction]](list)
    async for instruction in db.list_recipe_instructions(
        recipeids=recipe_ids, userid=user_id
    ):
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


async def list_recipes_from_db(user_id: UUID, db: AsyncQuerier) -> list[Recipe]:
    recipes = [r async for r in db.list_recipes(userid=user_id)]

    return await populate_recipe_data(db=db, user_id=user_id, recipes=recipes)


@recipes.get("/recipes")
async def list_recipes(user: User, conn: Connection) -> list[Recipe]:
    db = AsyncQuerier(conn)
    return await list_recipes_from_db(user_id=user.id, db=db)


@recipes.get("/{id}")
async def get_recipe(
    conn: Connection,
    user: User,
    id: UUID,
) -> Recipe:
    db = AsyncQuerier(conn)
    recipe = await db.get_recipe(recipeid=id, userid=user.id)

    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")

    return await populate_recipe_data(
        db=db,
        user_id=user.id,
        recipes=recipe,
    )


class RecipePatch(BaseModel):
    name: str | None = None
    author: str | None = None
    cuisine: str | None = None
    location: RecipeLocation | None = None
    time_estimate_minutes: int | None = None
    notes: str | None = None
    last_made_at: datetime | None = None


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
            last_made_at=body.last_made_at,
            recipeid=id,
            userid=user.id,
        )
    )

    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")

    return await populate_recipe_data(
        db=db,
        user_id=user.id,
        recipes=recipe,
    )


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
        )
    )

    if not recipe:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Could not create recipe"
        )

    ingredients = db.create_recipe_ingredients(
        CreateRecipeIngredientsParams(
            recipeid=recipe.id,
            userid=user.id,
            names=[i.name for i in params.ingredients],
            quantities=[i.quantity for i in params.ingredients],
            units=[i.units or "" for i in params.ingredients],
        )
    )

    dietary_restrictions_met = db.create_recipe_dietary_restrictions_met(
        recipeid=recipe.id,
        userid=user.id,
        dietaryrestrictionsmets=params.dietary_restrictions_met,
    )

    instructions = db.create_recipe_instructions(
        recipeid=recipe.id,
        userid=user.id,
        stepnumbers=[i.step_number for i in params.instructions],
        contents=[i.content for i in params.instructions],
    )

    tags = db.create_recipe_tags(
        recipeid=recipe.id,
        tags=params.tags,
        userid=user.id,
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
    location = RecipeLocation(location=MadeUpRecipeLocation(location="made_up"))

    return await ingest_recipe(
        db=db, user=user, params=base, notes=params.notes, location=location
    )


@recipes.post("/cookbook")
async def create_cookbook_recipe(
    user: User,
    conn: Connection,
    file: UploadFile,
    location: Literal["cookbook"] = Form("cookbook"),
    author: str = Form(...),
    cookbook_name: str = Form(...),
    page_number: int = Form(...),
    notes: str | None = Form(None),
) -> Recipe | None:
    db = AsyncQuerier(conn)

    image_bytes = await file.read()

    base = await image_to_recipe(image_bytes)
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
async def delete_recipe(conn: Connection, user: User, id: UUID) -> UUID:
    db = AsyncQuerier(conn)

    await db.delete_recipe(recipeid=id, userid=user.id)

    return id


def create_share_token() -> str:
    return secrets.token_urlsafe(32)


@recipes.post("/{id}/share")
async def create_recipe_share_link(
    conn: Connection,
    user: User,
    id: UUID,
) -> RecipeShareRequest | None:
    db = AsyncQuerier(conn)
    recipe = await db.get_recipe(recipeid=id, userid=user.id)

    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")

    return await db.create_recipe_share_request(
        recipeid=recipe.id,
        token=create_share_token(),
        expiresat=datetime.now(UTC) + timedelta(days=7),
    )


class AcceptShareRequestBody(BaseModel):
    token: str


@recipes.post("/share/accept")
async def accept_recipe_share_request(
    conn: Connection,
    user: User,
    body: AcceptShareRequestBody,
) -> Recipe | None:
    db = AsyncQuerier(conn)

    recipe = await db.accept_recipe_share_request(
        token=body.token,
    )

    if not recipe:
        raise HTTPException(
            status_code=404, detail="Share request not found or expired"
        )

    dietary_restrictions = db.list_recipe_dietary_restrictions_met(
        recipeids=[recipe.id], userid=recipe.user_id
    )
    instructions = db.list_recipe_instructions(
        recipeids=[recipe.id], userid=recipe.user_id
    )
    ingredients = db.list_recipe_ingredients(
        recipeids=[recipe.id], userid=recipe.user_id
    )
    tags = db.list_recipe_tags(recipeids=[recipe.id], userid=recipe.user_id)
    db_recipe = Recipe.from_db(
        recipe=recipe,
        ingredients=[i async for i in ingredients],
        dietary_restrictions_met=[
            d.dietary_restriction async for d in dietary_restrictions
        ],
        instructions=[i async for i in instructions],
        tags=[t.tag async for t in tags],
    )

    return await ingest_recipe(
        db=db,
        user=user,
        params=db_recipe,
        location=RecipeLocation.model_validate(recipe.location),
        notes=None,
    )
