import asyncio
import json

from src.crud.recipes import AsyncQuerier as RecipeQuerier
from src.crud.users import AsyncQuerier as UserQuerier
from src.dependencies import create_db_connection
from src.schemas import Recipe, RecipeCreate
from src.services.recipe import ingest_recipe


def read_recipe_blob() -> list[Recipe]:
    with open("../seed/recipes.json") as f:
        data = json.load(f)

    return [RecipeCreate.model_validate(r) for r in data]


async def main() -> None:
    recipes = await asyncio.to_thread(read_recipe_blob)

    async with create_db_connection() as conn:
        recipe_querier = RecipeQuerier(conn)
        user_querier = UserQuerier(conn)

        user = await user_querier.find_user_by_id(
            userid="f208932d-c87a-43d2-8acc-d3e265ac7137"
        )

        for recipe in recipes:
            await ingest_recipe(
                db=recipe_querier,
                user=user,
                params=recipe,
                location=recipe.location,
                notes=recipe.notes,
            )

        await conn.commit()


if __name__ == "__main__":
    asyncio.run(main())
