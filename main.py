import os
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager
from typing import Annotated
from uuid import UUID

from fastapi import Depends, FastAPI

from src.crud import create_recipe, list_recipes
from src.recipe import Recipe
from src.settings import settings


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    if not os.path.exists(settings.db_file_path):
        with open(settings.db_file_path, "w"):
            pass

    yield


app = FastAPI(lifespan=lifespan)

RecipeListDependency = Annotated[list[Recipe], Depends(list_recipes)]


@app.get("/recipes")
def get__list_recipes(recipes: RecipeListDependency) -> list[Recipe]:
    return recipes


@app.get("/recipes/{id}")
def get__find_recipe(
    recipes: RecipeListDependency,
    id: UUID | None = None,
) -> Recipe | None:
    return next((r for r in recipes if r.id == id), None)


@app.post("/recipes")
def post__recipe(recipe: Recipe) -> dict[str, str]:
    create_recipe(recipe)

    return {"message": "Recipe created successfully"}
