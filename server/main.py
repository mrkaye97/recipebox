from collections.abc import AsyncGenerator
from typing import Annotated
from uuid import UUID, uuid4

from fastapi import Depends, FastAPI, HTTPException
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import create_async_engine

from src.crud.models import Recipe, User
from src.crud.query import AsyncQuerier, CreateRecipeParams, UpdateRecipeParams
from src.settings import settings

app = FastAPI()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")


async def get_db() -> AsyncGenerator[AsyncQuerier]:
    engine = create_async_engine(
        settings.database_url.replace("postgresql", "postgresql+asyncpg")
    )
    async with engine.connect() as conn:
        try:
            yield AsyncQuerier(conn)
        finally:
            await conn.close()


DbDependency = Annotated[AsyncQuerier, Depends(get_db)]


async def authenticate_user(
    db: DbDependency, token: Annotated[str, Depends(oauth2_scheme)]
) -> AsyncGenerator[User]:
    print("\nAuthenticating user with token:", token)
    print(token)
    user = await db.authenticate_user(email="foo", user_id=uuid4(), passwordhash="baz")

    if not user:
        raise HTTPException(
            status_code=401, detail="Invalid authentication credentials"
        )

    return user


UserDep = Annotated[User, Depends(authenticate_user)]


@app.get("/{user_id}/recipes")
async def get__list_recipes(user: UserDep, db: DbDependency) -> list[Recipe]:
    return [r async for r in db.list_recipes(userid=user.id)]


@app.get("/{user_id}/recipes/{id}")
async def get__find_recipe(
    db: DbDependency,
    user_id: UUID,
    id: UUID,
) -> Recipe | None:
    return await db.get_recipe(recipeid=id, userid=user_id)


@app.patch("/{user_id}/recipes/{id}")
async def patch__update_recipe(
    db: DbDependency,
    body: UpdateRecipeParams,
) -> Recipe | None:
    return await db.update_recipe(body)


@app.post("/{user_id}/recipes")
async def post__create_recipe(
    user_id: UUID, recipe: CreateRecipeParams, db: DbDependency
) -> Recipe | None:
    return await db.create_recipe(recipe)


@app.delete("/{user_id}/recipes/{id}")
async def delete__recipe(db: DbDependency, id: UUID, user_id: UUID) -> Recipe:
    res = await db.delete_recipe(recipeid=id, userid=user_id)

    if not res:
        raise HTTPException(status_code=404, detail="Recipe not found")

    return res
