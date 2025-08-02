from collections.abc import Generator
from sqlite3 import Connection, connect
from typing import Annotated

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
from src.recipe import Recipe, RecipePatch
from src.settings import settings

app = FastAPI()
templates = Jinja2Templates(directory="templates")


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
    import secrets

    recipes = list_recipes(db)
    if not recipes:
        return None
    return recipes[secrets.randbelow(len(recipes))]


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


@app.delete("/recipes/{id}")
def delete__recipe(db: DbDependency, id: int) -> Recipe:
    res = delete_recipe_by_id(db, id)

    if not res:
        raise HTTPException(status_code=404, detail="Recipe not found")

    return res
