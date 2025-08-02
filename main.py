from fastapi import FastAPI, Depends
from typing import Annotated
from src.crud import list_recipes, create_recipe
from src.recipe import Recipe
from src.settings import settings
import os
from contextlib import asynccontextmanager
from uuid import UUID

@asynccontextmanager
async def lifespan(app: FastAPI):
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