from datetime import datetime
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


@activity.delete("/{recipe_id}")
async def delete_recipe_cooked_log(
    conn: Connection, user: User, cooked_at: datetime, recipe_id: UUID
) -> None:
    querier = ActivityQuerier(conn)

    await querier.delete_recipe_cooking_log_entry(
        recipeid=recipe_id,
        userid=user.id,
        cookedat=cooked_at,
    )


@activity.get("")
async def list_recent_activity(
    conn: Connection,
    user: User,
    who: Literal["me", "friends", "both"],
    limit: int,
    offset: int,
) -> list[ListRecentRecipeCooksRow]:
    activity = ActivityQuerier(conn)
    users = UserQuerier(conn)

    if who == "me":
        cooks = activity.list_recent_recipe_cooks(
            userids=[user.id], recentcookslimit=limit, recentcooksoffset=offset
        )

        return [c async for c in cooks]

    user_ids = [u.id async for u in users.list_friends(userid=user.id)]

    if who == "both":
        user_ids.append(user.id)

    cooks = activity.list_recent_recipe_cooks(
        userids=user_ids, recentcookslimit=limit, recentcooksoffset=offset
    )

    return [c async for c in cooks]
