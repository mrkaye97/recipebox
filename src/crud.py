from src.recipe import Recipe
from src.settings import settings


def create_recipe(recipe: Recipe) -> None:
    with open(settings.db_file_path, "a") as file:
        file.write(recipe.model_dump_json() + "\n")


def list_recipes() -> list[Recipe]:
    with open(settings.db_file_path) as file:
        return [
            Recipe.model_validate_json(line.strip())
            for line in file.readlines()
            if line.strip()
        ]
