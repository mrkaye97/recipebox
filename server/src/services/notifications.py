from enum import Enum
from typing import NamedTuple, cast

from exponent_server_sdk import PushClient, PushMessage  # type: ignore[import-untyped]
from pydantic import BaseModel

from src.crud.models import PushPermissionStatus, User
from src.logger import get_logger

logger = get_logger(__name__)


class PushNotificationRedirectDestination(str, Enum):
    FRIEND_REQUESTS = "friend_requests"
    FRIENDS = "friends"
    SHARED_RECIPES = "shared_recipes"


class PushNotificationPayload(BaseModel):
    navigate_to: PushNotificationRedirectDestination | None


def send_push_message(
    recipient: User, message: str, payload: PushNotificationPayload
) -> bool:
    if (
        recipient.push_permission == PushPermissionStatus.NONE
        or not recipient.expo_push_token
    ):
        logger.info("User has not set push notification preferences, skipping")
        return False

    if recipient.push_permission == PushPermissionStatus.REJECTED:
        logger.info("User has rejected push notifications, skipping")
        return False

    if "development" in recipient.expo_push_token:
        logger.info("Skipping push notification in development mode")
        return False

    response = cast(
        NamedTuple,
        PushClient().publish(
            PushMessage(
                to=recipient.expo_push_token,
                body=message,
                data=payload.model_dump(mode="json"),
            )
        ),
    )

    return response._asdict().get("status") == "ok"
