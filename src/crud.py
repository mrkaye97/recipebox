import json
from datetime import datetime
from sqlite3 import Connection

from src.recipe import Recipe, RecipeCreate, RecipeLocation, RecipePatch


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


def create_recipe(db: Connection, recipe: RecipeCreate) -> Recipe:
    res = db.execute(
        """
        INSERT INTO recipe (name, cuisine, tags, location)
        VALUES (?, ?, ?, ?)
        RETURNING *;
        """,
        (
            recipe.name,
            recipe.cuisine,
            json.dumps(recipe.tags),
            recipe.location.model_dump_json(),
        ),
    )
    record = res.fetchone()
    db.commit()

    return to_recipe(record)


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


def update_recipe_by_id(db: Connection, id: int, body: RecipePatch) -> Recipe | None:
    res = db.execute(
        """
        UPDATE recipe
        SET
            name = COALESCE(?, name),
            cuisine = COALESCE(?, cuisine),
            tags = COALESCE(?, tags),
            location = COALESCE(?, location),
            notes = COALESCE(?, notes),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
        RETURNING *;
        """,
        (
            body.name,
            body.cuisine,
            json.dumps(body.tags) if body.tags is not None else None,
            body.location.model_dump_json() if body.location is not None else None,
            body.notes,
            id,
        ),
    )
    row = res.fetchone()
    db.commit()

    if row is None:
        return None

    return to_recipe(row)


def delete_recipe_by_id(db: Connection, id: int) -> Recipe | None:
    res = db.execute("DELETE FROM recipe WHERE id = ? RETURNING *", (id,))
    db.commit()

    row = res.fetchone()

    if row is None:
        return None

    return to_recipe(row)
