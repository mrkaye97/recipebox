from fastapi import APIRouter

from src.crud.activity import AsyncQuerier, ListRecentRecipeCooksRow
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
