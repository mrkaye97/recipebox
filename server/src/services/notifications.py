from typing import NamedTuple, cast

from exponent_server_sdk import PushClient, PushMessage  # type: ignore[import-untyped]

from src.crud.models import PushPermissionStatus, User
from src.logger import get_logger

logger = get_logger(__name__)


def send_push_message(
    recipient: User, message: str, extra: dict[str, str] | None = None
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
            PushMessage(to=recipient.expo_push_token, body=message, data=extra)
        ),
    )

    return response._asdict().get("status") == "ok"
