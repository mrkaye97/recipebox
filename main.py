from collections.abc import Generator
from sqlite3 import Connection, connect
from typing import Annotated

from fastapi import Depends, FastAPI

from src.crud import create_recipe, get_recipe_by_id, list_recipes, update_recipe_by_id
from src.recipe import Recipe, RecipePatch
from src.settings import settings

app = FastAPI()


def get_db() -> Generator[Connection, None, None]:
    conn = connect(settings.database_url.replace("sqlite:///", ""))
    try:
        yield conn
    finally:
        conn.close()


DbDependency = Annotated[Connection, Depends(get_db)]


@app.get("/recipes")
def get__list_recipes(db: DbDependency) -> list[Recipe]:
    return list_recipes(db)


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
def post__create_recipe(recipe: Recipe, db: DbDependency) -> dict[str, str]:
    create_recipe(db, recipe)

    return {"message": "Recipe created successfully"}
