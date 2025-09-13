import asyncio
from uuid import UUID

from fastapi import APIRouter
from pydantic import BaseModel

from src.crud.models import Friendship, PushPermissionStatus
from src.crud.users import AsyncQuerier
from src.dependencies import Connection
from src.dependencies import User as UserDependency
from src.logger import get_logger
from src.schemas import User
from src.services.notifications import send_push_message

users = APIRouter(prefix="/users")
logger = get_logger(__name__)


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

    recipient = await querier.find_user_by_id(userid=body.friend_user_id)

    result = await querier.create_friend_request(
        userid=user.id,
        frienduserid=body.friend_user_id,
    )

    if result and recipient and recipient.expo_push_token:
        await asyncio.to_thread(
            send_push_message,
            recipient=recipient,
            message=f"{user.name} sent you a friend request",
        )

    return result


@users.post("/friend-request/{request_from_user_id}/accept")
async def accept_friend_request(
    conn: Connection,
    user: UserDependency,
    request_from_user_id: UUID,
) -> Friendship | None:
    querier = AsyncQuerier(conn)

    sender = await querier.find_user_by_id(userid=request_from_user_id)

    result = await querier.accept_friend_request(
        userid=user.id, requestfromuserid=request_from_user_id
    )

    if result and sender and sender.expo_push_token:
        await asyncio.to_thread(
            send_push_message,
            recipient=sender,
            message=f"{user.name} accepted your friend request",
        )

    return result


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


class PushTokenBody(BaseModel):
    expo_push_token: str | None
    push_permission: PushPermissionStatus


class PushTokenResponse(BaseModel):
    success: bool
    message: str


@users.post("/push-token")
async def store_push_token(
    conn: Connection,
    user: UserDependency,
    body: PushTokenBody,
) -> PushTokenResponse:
    querier = AsyncQuerier(conn)

    if user.expo_push_token:
        return PushTokenResponse(success=True, message="Push token already exists")

    await querier.set_expo_push_token(
        push_token=body.expo_push_token,
        userid=user.id,
        pushpermission=body.push_permission,
    )

    return PushTokenResponse(success=True, message="Push token stored successfully")
