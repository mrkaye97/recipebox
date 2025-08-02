import json
from datetime import datetime
from sqlite3 import Connection

from src.recipe import Recipe, RecipeLocation


def to_recipe(row: tuple[int, str, str, str, str, str, datetime, datetime]) -> Recipe:
    return Recipe(
        id=row[0],
        name=row[1],
        cuisine=row[2],
        tags=json.loads(row[3]) if row[3] else [],
        location=RecipeLocation.model_validate_json(row[4]),
        notes=row[5],
        saved_at=row[6],
        updated_at=row[7],
    )


def create_recipe(db: Connection, recipe: Recipe) -> None:
    db.execute(
        "INSERT INTO recipe (name, cuisine, tags, location) VALUES (?, ?, ?, ?)",
        (
            recipe.name,
            recipe.cuisine,
            json.dumps(recipe.tags),
            recipe.location.model_dump_json(),
        ),
    )
    db.commit()


def list_recipes(db: Connection) -> list[Recipe]:
    res = db.execute("SELECT * FROM recipe")
    rows = res.fetchall()

    return [to_recipe(row) for row in rows]


def get_recipe_by_id(db: Connection, id: int) -> Recipe | None:
    res = db.execute("SELECT * FROM recipe WHERE id = ?", (id,))
    row = res.fetchone()

    if row is None:
        return None

    return to_recipe(row)


def update_recipe_by_id(db: Connection, id: int) -> Recipe | None:
    res = db.execute("SELECT * FROM recipe WHERE id = ?", (id,))
    row = res.fetchone()

    if row is None:
        return None

    return to_recipe(row)
