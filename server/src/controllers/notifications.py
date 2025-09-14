import asyncio
from uuid import UUID

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from src.crud.users import AsyncQuerier as Users
from src.dependencies import Connection, User
from src.services.notifications import PushNotificationPayload, send_push_message

notifications = APIRouter(prefix="/notifications")


class PushNotificationBody(BaseModel):
    recipient_id: UUID
    message: str
    payload: PushNotificationPayload


@notifications.post("")
async def push_notification(
    conn: Connection,
    _: User,
    body: PushNotificationBody,
) -> dict[str, bool]:
    users = Users(conn)
    recipient = await users.find_user_by_id(userid=body.recipient_id)

    if not recipient:
        raise HTTPException(status_code=400, detail="Recipient not found")

    result = await asyncio.to_thread(
        send_push_message,
        recipient=recipient,
        message=body.message,
        payload=body.payload,
    )

    return {"success": result}
