from uuid import UUID

from fastapi import APIRouter
from pydantic import BaseModel

from src.crud.activity import AsyncQuerier, ListRecentRecipeCooksRow
from src.crud.models import Recipe
from src.dependencies import Connection, User
from src.logger import get_logger

activity = APIRouter(prefix="/activity")
logger = get_logger(__name__)


@activity.get("/me")
async def list_recent_activity(
    conn: Connection,
    user: User,
) -> list[ListRecentRecipeCooksRow]:
    querier = AsyncQuerier(conn)
    cooks = querier.list_recent_recipe_cooks(
        userid=user.id, recentcookslimit=10, recentcooksoffset=0
    )

    return [c async for c in cooks]


class MarkRecipeCookedBody(BaseModel):
    recipe_id: UUID


@activity.post("")
async def mark_recipe_cooked(
    conn: Connection,
    user: User,
    body: MarkRecipeCookedBody,
) -> Recipe | None:
    querier = AsyncQuerier(conn)

    return await querier.mark_recipe_cooked(
        recipeid=body.recipe_id,
        userid=user.id,
    )
