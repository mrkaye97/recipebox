from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager
from datetime import UTC, datetime
from typing import Annotated

from asyncpg.exceptions import UniqueViolationError  # type: ignore[import-untyped]
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncConnection, create_async_engine

from src.auth import parse_token
from src.crud.models import User as DbUser
from src.crud.users import AsyncQuerier
from src.logger import get_logger
from src.settings import settings

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")
logger = get_logger(__name__)


@asynccontextmanager
async def create_db_connection() -> AsyncGenerator[AsyncConnection]:
    engine = create_async_engine(
        settings.database_url.get_secret_value()
        .replace("postgresql", "postgresql+asyncpg")
        .split("?")[0],
    )
    async with engine.connect() as conn:
        yield conn


async def get_db() -> AsyncGenerator[AsyncConnection]:
    async with create_db_connection() as conn, conn.begin():
        try:
            yield conn
        except Exception as e:
            if isinstance(e, HTTPException):
                raise e

            if (
                isinstance(e, IntegrityError)
                and e.orig
                and isinstance(e.orig.__cause__, UniqueViolationError)
            ):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="duplicate",
                ) from e

            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            ) from e


Connection = Annotated[AsyncConnection, Depends(get_db)]


async def authenticate(conn: Connection, token: str = Depends(oauth2_scheme)) -> DbUser:
    db = AsyncQuerier(conn)
    data = parse_token(token)

    if not data.expires_at or data.expires_at < datetime.now(UTC):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if data.user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = await db.find_user_by_id(userid=data.user_id)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user


User = Annotated[DbUser, Depends(authenticate)]
