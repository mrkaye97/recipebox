import asyncio
from datetime import UTC, datetime, timedelta
from typing import Literal
from uuid import UUID

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, model_validator

from src.crud.models import RecipeShareRequest
from src.crud.recipes import AsyncQuerier as Recipes
from src.crud.sharing import AsyncQuerier as Sharing
from src.crud.sharing import ListPendingRecipeShareRequestsRow
from src.crud.users import AsyncQuerier as Users
from src.dependencies import Connection, User
from src.logger import get_logger
from src.services.notifications import (
    PushNotificationPayload,
    PushNotificationRedirectDestination,
    send_push_message,
)

sharing = APIRouter(prefix="/sharing")
logger = get_logger(__name__)


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
    users = Users(conn)

    recipe_owner_user_id = (
        user.id if body.source == "outbound_share" else body.source_user_id
    )
    recipient = await users.find_user_by_id(userid=body.to_user_id)

    if not recipe_owner_user_id or not recipient:
        raise HTTPException(status_code=400, detail="recipient or owner not found")

    recipe = await recipes.get_recipe(recipeid=body.recipe_id)

    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")

    request = await sharing.create_recipe_share_request(
        recipeid=recipe.id,
        touserid=body.to_user_id,
        expiresat=datetime.now(UTC) + timedelta(days=7),
    )

    if body.source == "outbound_share" and recipient.expo_push_token:
        await asyncio.to_thread(
            send_push_message,
            recipient=recipient,
            message=f"{user.name} shared a recipe with you",
            payload=PushNotificationPayload(
                navigate_to=PushNotificationRedirectDestination.SHARED_RECIPES
            ),
        )

    return request


class ActOnShareRequestBody(BaseModel):
    token: str


@sharing.delete("/{recipe_id}")
async def delete_share_request(
    conn: Connection,
    user: User,
    recipe_id: UUID,
) -> RecipeShareRequest | None:
    sharing = Sharing(conn)
    return await sharing.delete_sharing_request(recipeid=recipe_id, touserid=user.id)
