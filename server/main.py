import random
from collections.abc import Generator
from datetime import datetime, timedelta
from sqlite3 import Row, connect
from typing import Annotated, cast
from uuid import UUID

from fastapi import Depends, FastAPI, HTTPException
from fastapi.templating import Jinja2Templates

from src.crud.models import Recipe
from src.crud.query import AsyncQuerier, CreateRecipeParams, UpdateRecipeParams
from src.settings import settings

app = FastAPI()
app.state.recent_recommendations = set[int]()

templates = Jinja2Templates(directory="templates")


def set_recent_recommendation(recipe: Recipe) -> None:
    recent_recommendations = cast(set[int], app.state.recent_recommendations)

    recent_recommendations.add(recipe.id)


def clear_recent_recommendations() -> None:
    app.state.recent_recommendations.clear()


def get_recent_recommendations() -> set[int]:
    return cast(set[int], app.state.recent_recommendations)


def get_db() -> Generator[AsyncQuerier, None, None]:
    conn = connect(settings.database_url.replace("sqlite:///", ""))
    conn.row_factory = Row

    try:
        yield AsyncQuerier(conn)
    finally:
        conn.close()


DbDependency = Annotated[AsyncQuerier, Depends(get_db)]


@app.get("/{user_id}/recipes")
async def get__list_recipes(user_id: UUID, db: DbDependency) -> list[Recipe]:
    return await db.list_recipes(userid=user_id)


@app.get("/{user_id}/recipes/random")
async def get__random_recipe(user_id: UUID, db: DbDependency) -> Recipe | None:
    recent_recommendations = get_recent_recommendations()
    recipes = await db.list_recipes(db)

    if len(recent_recommendations) >= len(recipes):
        clear_recent_recommendations()
        recent_recommendations = set[int]()

    recipes = [r for r in recipes if r.id not in recent_recommendations]

    if not recipes:
        return None

    weights = [
        max(
            1,
            float(
                (
                    datetime.now()
                    - (r.last_made_at or r.saved_at).replace(tzinfo=None)
                    + timedelta(days=1)
                ).days
            ),
        )
        for r in recipes
    ]

    choices = random.choices(
        recipes,
        k=1,
        weights=weights,
    )

    if not choices:
        return None

    choice = choices[0]

    set_recent_recommendation(choice)

    return choice


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


@app.post("/recipes")
async def post__create_recipe(recipe: CreateRecipeParams, db: DbDependency) -> Recipe:
    return await db.create_recipe(recipe)


@app.delete("/{user_id}/recipes/{id}")
def delete__recipe(db: DbDependency, id: UUID, user_id: UUID) -> Recipe:
    res = db.delete_recipe(recipeid=id, userid=user_id)

    if not res:
        raise HTTPException(status_code=404, detail="Recipe not found")

    return res
