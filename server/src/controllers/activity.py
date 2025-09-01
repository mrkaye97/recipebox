from typing import Literal
from uuid import UUID

from fastapi import APIRouter
from pydantic import BaseModel

from src.crud.activity import AsyncQuerier as ActivityQuerier
from src.crud.activity import ListRecentRecipeCooksRow
from src.crud.models import Recipe
from src.crud.users import AsyncQuerier as UserQuerier
from src.dependencies import Connection, User
from src.logger import get_logger

activity = APIRouter(prefix="/activity")
logger = get_logger(__name__)


class MarkRecipeCookedBody(BaseModel):
    recipe_id: UUID


@activity.post("")
async def mark_recipe_cooked(
    conn: Connection,
    user: User,
    body: MarkRecipeCookedBody,
) -> Recipe | None:
    querier = ActivityQuerier(conn)

    return await querier.mark_recipe_cooked(
        recipeid=body.recipe_id,
        userid=user.id,
    )


@activity.get("")
async def list_recent_activity(
    conn: Connection, user: User, who: Literal["me", "friends", "both"]
) -> list[ListRecentRecipeCooksRow]:
    activity = ActivityQuerier(conn)
    users = UserQuerier(conn)

    if who == "me":
        cooks = activity.list_recent_recipe_cooks(
            userids=[user.id], recentcookslimit=10, recentcooksoffset=0
        )

        return [c async for c in cooks]

    user_ids = [u.id async for u in users.list_friends(userid=user.id)]

    if who == "both":
        user_ids.append(user.id)

    cooks = activity.list_recent_recipe_cooks(
        userids=user_ids, recentcookslimit=10, recentcooksoffset=0
    )

    return [c async for c in cooks]
