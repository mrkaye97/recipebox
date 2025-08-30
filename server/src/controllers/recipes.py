from datetime import datetime
from typing import Literal
from uuid import UUID

from fastapi import APIRouter, Form, HTTPException, UploadFile
from pydantic import BaseModel

from src.crud.recipes import AsyncQuerier, UpdateRecipeParams
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
    RecipeLocation,
)
from src.services.recipe import ingest_recipe, populate_recipe_data

recipes = APIRouter(prefix="/recipes")
logger = get_logger(__name__)


async def list_recipes_from_db(user_id: UUID, db: AsyncQuerier) -> list[Recipe]:
    recipes = [r async for r in db.list_recipes(userid=user_id)]

    return await populate_recipe_data(db=db, user_id=user_id, recipes=recipes)


@recipes.get("")
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
