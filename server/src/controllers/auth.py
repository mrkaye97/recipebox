from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm

from src.auth import create_access_token, hash_password
from src.crud.query import AsyncQuerier
from src.dependencies import Connection
from src.logger import get_logger
from src.schemas import Token, UserRegistration

auth = APIRouter(prefix="/auth")
logger = get_logger(__name__)


@auth.post("/register", response_model=Token)
async def register(user_data: UserRegistration, conn: Connection) -> Token:
    querier = AsyncQuerier(conn)
    user = await querier.create_user(email=user_data.email, name=user_data.name)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Could not create user"
        )

    password_hash = hash_password(user_data.password)
    await querier.create_user_password(userid=user.id, passwordhash=password_hash)

    access_token = create_access_token(user.id)

    return Token(access_token=access_token, token_type="bearer")


@auth.post("/login", response_model=Token)
async def login(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()], conn: Connection
) -> Token:
    db = AsyncQuerier(conn)
    password_hash = hash_password(form_data.password)
    user = await db.authenticate_user(
        email=form_data.username,
        user_id=None,
        passwordhash=password_hash,
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(user.id)

    return Token(access_token=access_token, token_type="bearer")
