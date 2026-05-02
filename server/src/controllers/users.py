from uuid import UUID

from fastapi import APIRouter
from pydantic import BaseModel

from src.crud.models import Friendship
from src.crud.users import AsyncQuerier
from src.dependencies import Connection
from src.dependencies import User as UserDependency
from src.schemas import User

users = APIRouter(prefix="/users")


@users.get("")
async def get_user(
    user: UserDependency,
) -> UserDependency:
    return user


@users.get("/search")
async def register(
    conn: Connection,
    user: UserDependency,
    query: str,
) -> list[User]:
    querier = AsyncQuerier(conn)
    users = querier.search_users(
        query=query,
        userid=user.id,
        useroffset=0,
        userlimit=20,
    )

    return [User(id=user.id, name=user.name) async for user in users]


class FriendRequestBody(BaseModel):
    friend_user_id: UUID


@users.post("/friend-request")
async def send_friend_request(
    conn: Connection,
    user: UserDependency,
    body: FriendRequestBody,
) -> Friendship | None:
    querier = AsyncQuerier(conn)

    return await querier.create_friend_request(
        userid=user.id,
        frienduserid=body.friend_user_id,
    )


@users.post("/friend-request/{request_from_user_id}/accept")
async def accept_friend_request(
    conn: Connection,
    user: UserDependency,
    request_from_user_id: UUID,
) -> Friendship | None:
    querier = AsyncQuerier(conn)

    return await querier.accept_friend_request(
        userid=user.id, requestfromuserid=request_from_user_id
    )


@users.get("/friends")
async def list_friends(
    conn: Connection,
    user: UserDependency,
) -> list[User]:
    querier = AsyncQuerier(conn)
    friends = querier.list_friends(
        userid=user.id,
    )

    return [User(id=friend.id, name=friend.name) async for friend in friends]


@users.get("/friend-requests")
async def list_friend_requests(
    conn: Connection,
    user: UserDependency,
) -> list[User]:
    querier = AsyncQuerier(conn)
    requests = querier.list_friend_requests(
        userid=user.id,
    )

    return [
        User(
            id=friend.id,
            name=friend.name,
        )
        async for friend in requests
    ]
