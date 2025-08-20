import asyncio
import sqlite3
from ast import literal_eval

from pydantic import BaseModel
from sqlalchemy.ext.asyncio import create_async_engine

from main import ingest_recipe
from src.crud.query import AsyncQuerier
from src.parsing import extract_recipe_markdown_from_url, markdown_to_recipe
from src.schemas import OnlineRecipeLocation, RecipeLocation
from src.settings import settings


class RecipeToImport(BaseModel):
    name: str
    author: str
    cuisine: str
    tags: list[str]
    location: RecipeLocation
    dietary_restrictions_met: list[str]
    time_estimate_minutes: int
    notes: str | None

    @classmethod
    def from_sqlite(cls, data: dict[str, str]) -> "RecipeToImport":
        return cls(
            name=data["name"],
            author=data["author"],
            cuisine=data["cuisine"],
            tags=literal_eval(data["tags"]),
            location=RecipeLocation.model_validate_json(data["location"]),
            dietary_restrictions_met=literal_eval(data["dietary_restrictions_met"]),
            time_estimate_minutes=(
                int(data["time_estimate_minutes"])
                if data["time_estimate_minutes"]
                else 0
            ),
            notes=data["notes"],
        )


async def main() -> None:
    conn = sqlite3.connect("/recipebox.db")

    cursor = conn.cursor()

    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = cursor.fetchall()

    all_data = {}

    for (table_name,) in tables:
        cursor.execute(f"SELECT * FROM {table_name}")
        rows = cursor.fetchall()

        col_names = [desc[0] for desc in cursor.description]

        all_data[table_name] = [dict(zip(col_names, row, strict=False)) for row in rows]

    conn.close()

    engine = create_async_engine(
        settings.database_url.replace("postgresql", "postgresql+asyncpg").split("?")[0],
    )
    async with engine.connect() as pgconn, pgconn.begin():
        db = AsyncQuerier(pgconn)

        recipes = [RecipeToImport.from_sqlite(recipe) for recipe in all_data["recipe"]]
        user = await db.find_user_by_id(userid="34ce6a85-cf5d-4a6b-999c-db861f0bb573")
        assert user

        for recipe in recipes:
            print(f"Importing recipe: {recipe.name} by {recipe.author}")
            if recipe.location.location.location != "online":
                continue

            md = await extract_recipe_markdown_from_url(recipe.location.location.url)
            base = await markdown_to_recipe(md)

            location = RecipeLocation(
                location=OnlineRecipeLocation(
                    location="online",
                    url=recipe.location.location.url,
                )
            )

            await ingest_recipe(
                db=db, user=user, params=base, notes=recipe.notes, location=location
            )


if __name__ == "__main__":
    asyncio.run(main())
