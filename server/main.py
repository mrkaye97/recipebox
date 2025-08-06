from typing import Annotated
from uuid import UUID

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm

from src.auth import create_access_token, hash_password
from src.crud.models import Recipe
from src.crud.query import AsyncQuerier, CreateRecipeParams, UpdateRecipeParams
from src.dependencies import Connection, User
from src.schemas import Token, UserRegistration

app = FastAPI()


@app.post("/auth/register", response_model=Token)
async def register(user_data: UserRegistration, conn: Connection) -> Token:
    querier = AsyncQuerier(conn)
    user = await querier.create_user(email=user_data.email, name=user_data.name)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Could not create user"
        )

    password_hash = hash_password(user_data.password)
    await querier.create_user_password(userid=user.id, passwordhash=password_hash)

    access_token = create_access_token(data={"sub": str(user.id)})

    await conn.commit()

    return Token(access_token=access_token, token_type="bearer")


@app.post("/auth/login", response_model=Token)
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

    access_token = create_access_token(data={"sub": str(user.id)})

    return Token(access_token=access_token, token_type="bearer")


@app.get("/recipes")
async def get__list_recipes(user: User, conn: Connection) -> list[Recipe]:
    db = AsyncQuerier(conn)
    return [r async for r in db.list_recipes(userid=user.id)]


@app.get("/recipes/{id}")
async def get__find_recipe(
    conn: Connection,
    user: User,
    id: UUID,
) -> Recipe | None:
    db = AsyncQuerier(conn)
    return await db.get_recipe(recipeid=id, userid=user.id)


@app.patch("/recipes/{id}")
async def patch__update_recipe(
    conn: Connection,
    user: User,
    id: UUID,
    body: UpdateRecipeParams,
) -> Recipe | None:
    db = AsyncQuerier(conn)
    body.userid = user.id
    body.recipeid = id
    recipe = await db.update_recipe(body)

    await conn.commit()

    return recipe


@app.post("/recipes")
async def post__create_recipe(
    recipe: CreateRecipeParams, user: User, conn: Connection
) -> Recipe | None:
    db = AsyncQuerier(conn)
    recipe.userid = user.id
    created = await db.create_recipe(recipe)

    await conn.commit()
    return created


@app.delete("/recipes/{id}")
async def delete__recipe(conn: Connection, user: User, id: UUID) -> Recipe:
    db = AsyncQuerier(conn)
    res = await db.delete_recipe(recipeid=id, userid=user.id)

    await conn.commit()

    if not res:
        raise HTTPException(status_code=404, detail="Recipe not found")

    return res
