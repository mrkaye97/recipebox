import secrets
from datetime import UTC, datetime, timedelta
from typing import Literal
from uuid import UUID

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, model_validator

from src.crud.models import RecipeShareRequest
from src.crud.recipes import AsyncQuerier as Recipes
from src.crud.sharing import AsyncQuerier as Sharing
from src.crud.sharing import ListPendingRecipeShareRequestsRow
from src.dependencies import Connection, User
from src.logger import get_logger
from src.schemas import Recipe, RecipeLocation
from src.services.recipe import ingest_recipe

sharing = APIRouter(prefix="/sharing")
logger = get_logger(__name__)


def create_share_token() -> str:
    return secrets.token_urlsafe(32)


@sharing.get("")
async def list_pending_recipe_share_requests(
    conn: Connection,
    user: User,
) -> list[ListPendingRecipeShareRequestsRow]:
    db = Sharing(conn)
    requests = db.list_pending_recipe_share_requests(touserid=user.id)

    return [r async for r in requests]


class ShareRecipeBody(BaseModel):
    recipe_id: UUID
    to_user_id: UUID
    source: Literal["outbound_share", "download_button"]
    source_user_id: UUID | None = None

    @model_validator(mode="after")
    def validate_source_user_id(self) -> "ShareRecipeBody":
        if self.source == "download_button" and not self.source_user_id:
            raise ValueError(
                "source_user_id is required when source is download_button"
            )

        return self


@sharing.post("")
async def create_recipe_share_link(
    conn: Connection,
    user: User,
    body: ShareRecipeBody,
) -> RecipeShareRequest | None:
    recipes = Recipes(conn)
    sharing = Sharing(conn)
    user_id = user.id if body.source == "outbound_share" else body.source_user_id

    if not user_id:
        raise HTTPException(status_code=400, detail="source_user_id is required")

    recipe = await recipes.get_recipe(recipeid=body.recipe_id, userid=user.id)

    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")

    return await sharing.create_recipe_share_request(
        recipeid=recipe.id,
        token=create_share_token(),
        touserid=body.to_user_id,
        expiresat=datetime.now(UTC) + timedelta(days=7),
    )


class ActOnShareRequestBody(BaseModel):
    token: str


@sharing.delete("")
async def deny_share_request(
    conn: Connection,
    user: User,
    body: ActOnShareRequestBody,
) -> RecipeShareRequest | None:
    sharing = Sharing(conn)
    return await sharing.delete_sharing_request(token=body.token, touserid=user.id)


@sharing.post("/accept")
async def accept_recipe_share_request(
    conn: Connection,
    user: User,
    body: ActOnShareRequestBody,
) -> Recipe | None:
    sharing = Sharing(conn)
    recipes = Recipes(conn)

    recipe = await sharing.accept_recipe_share_request(
        token=body.token,
    )

    if not recipe:
        raise HTTPException(
            status_code=404, detail="Share request not found or expired"
        )

    dietary_restrictions = recipes.list_recipe_dietary_restrictions_met(
        recipeids=[recipe.id]
    )
    instructions = recipes.list_recipe_instructions(recipeids=[recipe.id])
    ingredients = recipes.list_recipe_ingredients(recipeids=[recipe.id])
    tags = recipes.list_recipe_tags(recipeids=[recipe.id])
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
        db=recipes,
        user=user,
        params=db_recipe,
        location=RecipeLocation.model_validate(recipe.location),
        notes=None,
        parent_recipe_id=recipe.id,
    )
