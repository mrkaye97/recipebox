from fastapi import APIRouter

from src.crud.users import AsyncQuerier
from src.dependencies import Connection
from src.dependencies import User as UserDependency
from src.logger import get_logger
from src.schemas import User

auth = APIRouter(prefix="/auth")
logger = get_logger(__name__)


@auth.post("/search")
async def register(
    conn: Connection,
    _: UserDependency,
    query: str,
) -> list[User]:
    querier = AsyncQuerier(conn)
    users = querier.search_users(
        query=query,
        useroffset=0,
        userlimit=20,
    )

    return [User(id=user.id, name=user.name, email=user.email) async for user in users]
