import json
from typing import NamedTuple, cast

from exponent_server_sdk import PushClient, PushMessage  # type: ignore[import-untyped]

from src.logger import get_logger

logger = get_logger(__name__)


def send_push_message(
    token: str, message: str, extra: dict[str, str] | None = None
) -> None:
    response = cast(
        NamedTuple,
        PushClient().publish(PushMessage(to=token, body=message, data=extra)),
    )

    logger.info(json.dumps(response._asdict()))
