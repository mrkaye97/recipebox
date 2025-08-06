from collections.abc import AsyncGenerator
from datetime import UTC, datetime
from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncConnection, create_async_engine

from src.auth import parse_token
from src.crud.models import User as DbUser
from src.crud.query import AsyncQuerier
from src.settings import settings

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")


async def get_db() -> AsyncGenerator[AsyncConnection]:
    engine = create_async_engine(
        settings.database_url.replace("postgresql", "postgresql+asyncpg").split("?")[0],
    )
    async with engine.connect() as conn, conn.begin():
        try:
            yield conn
        except Exception as e:
            if isinstance(e, HTTPException):
                raise e

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
