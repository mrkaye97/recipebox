import random
from collections.abc import Generator
from datetime import UTC, datetime, timedelta
from sqlite3 import Connection, connect
from typing import Annotated, cast

from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates

from src.crud import (
    create_recipe,
    delete_recipe_by_id,
    get_recipe_by_id,
    list_recipes,
    update_recipe_by_id,
)
from src.recipe import Recipe, RecipeCreate, RecipePatch
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


def get_db() -> Generator[Connection, None, None]:
    conn = connect(settings.database_url.replace("sqlite:///", ""))
    try:
        yield conn
    finally:
        conn.close()


DbDependency = Annotated[Connection, Depends(get_db)]


@app.get("/", response_class=HTMLResponse)
def get__index(request: Request, db: DbDependency) -> HTMLResponse:
    recipes = list_recipes(db)

    recipes_dict = [recipe.model_dump(mode="json") for recipe in recipes]
    return templates.TemplateResponse(
        "index.html", {"request": request, "recipes": recipes_dict}
    )


@app.get("/recipes")
def get__list_recipes(db: DbDependency) -> list[Recipe]:
    return list_recipes(db)


@app.get("/recipes/random")
def get__random_recipe(db: DbDependency) -> Recipe | None:
    recent_recommendations = get_recent_recommendations()
    recipes = list_recipes(db)

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
                    datetime.now(tz=UTC)
                    - (r.last_made_at or r.saved_at)
                    + timedelta(days=1)
                ).days
            ),
        )
        for r in recipes
    ]

    choice = random.choices(
        recipes,
        k=1,
        weights=weights,
    )[0]

    set_recent_recommendation(choice)

    return choice


@app.get("/recipes/{id}")
def get__find_recipe(
    db: DbDependency,
    id: int,
) -> Recipe | None:
    return get_recipe_by_id(db, id)


@app.patch("/recipes/{id}")
def patch__update_recipe(
    db: DbDependency,
    id: int,
    body: RecipePatch,
) -> Recipe | None:
    return update_recipe_by_id(db, id, body)


@app.post("/recipes")
def post__create_recipe(recipe: RecipeCreate, db: DbDependency) -> Recipe:
    return create_recipe(db, recipe)


@app.delete("/recipes/{id}")
def delete__recipe(db: DbDependency, id: int) -> Recipe:
    res = delete_recipe_by_id(db, id)

    if not res:
        raise HTTPException(status_code=404, detail="Recipe not found")

    return res
