import json
from datetime import datetime
from sqlite3 import Connection

from src.recipe import Recipe, RecipeCreate, RecipeLocation, RecipePatch


def to_recipe(
    row: tuple[int, str, str, str, str, str, str, int, str, datetime, datetime, datetime],
) -> Recipe:
    return Recipe(
        id=row[0],
        name=row[1],
        author=row[2],
        cuisine=row[3],
        tags=json.loads(row[4]),
        location=RecipeLocation.model_validate_json(row[5]),
        dietary_restrictions_met=json.loads(row[6]),
        time_estimate_minutes=row[7],
        notes=row[8],
        last_made_at=row[9],
        saved_at=row[10],
        updated_at=row[11],
    )


def create_recipe(db: Connection, recipe: RecipeCreate) -> Recipe:
    res = db.execute(
        """
        INSERT INTO recipe (
            name,
            author,
            cuisine,
            tags,
            location,
            dietary_restrictions_met,
            time_estimate_minutes,
            notes
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        RETURNING
            id,
            name,
            author,
            cuisine,
            tags,
            location,
            dietary_restrictions_met,
            time_estimate_minutes,
            notes,
            last_made_at,
            saved_at,
            updated_at
        ;
        """,
        (
            recipe.name,
            recipe.author,
            recipe.cuisine,
            json.dumps(recipe.tags),
            recipe.location.model_dump_json(),
            json.dumps(recipe.dietary_restrictions_met),
            recipe.time_estimate_minutes,
            recipe.notes,
        ),
    )
    record = res.fetchone()
    db.commit()

    return to_recipe(record)


def list_recipes(db: Connection) -> list[Recipe]:
    res = db.execute(
        """
        SELECT
            id,
            name,
            author,
            cuisine,
            tags,
            location,
            dietary_restrictions_met,
            time_estimate_minutes,
            notes,
            last_made_at,
            saved_at,
            updated_at
        FROM recipe
        ORDER BY updated_at DESC
        """
    )
    rows = res.fetchall()

    return [to_recipe(row) for row in rows]


def get_recipe_by_id(db: Connection, id: int) -> Recipe | None:
    res = db.execute(
        """
        SELECT
            id,
            name,
            author,
            cuisine,
            tags,
            location,
            dietary_restrictions_met,
            time_estimate_minutes,
            notes,
            last_made_at,
            saved_at,
            updated_at
        FROM recipe
        WHERE id = ?
        """,
        (id,)
    )
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
            author = COALESCE(?, author),
            cuisine = COALESCE(?, cuisine),
            tags = COALESCE(?, tags),
            location = COALESCE(?, location),
            dietary_restrictions_met = COALESCE(?, dietary_restrictions_met),
            time_estimate_minutes = COALESCE(?, time_estimate_minutes),
            notes = COALESCE(?, notes),
            last_made_at = COALESCE(?, last_made_at),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
        RETURNING
            id,
            name,
            author,
            cuisine,
            tags,
            location,
            dietary_restrictions_met,
            time_estimate_minutes,
            notes,
            last_made_at,
            saved_at,
            updated_at
        ;
        """,
        (
            body.name,
            body.author,
            body.cuisine,
            json.dumps(body.tags) if body.tags is not None else None,
            body.location.model_dump_json() if body.location is not None else None,
            (
                json.dumps(body.dietary_restrictions_met)
                if body.dietary_restrictions_met is not None
                else None
            ),
            body.time_estimate_minutes,
            body.notes,
            body.last_made_at.isoformat(),
            id,
        ),
    )
    row = res.fetchone()
    db.commit()

    if row is None:
        return None

    return to_recipe(row)


def delete_recipe_by_id(db: Connection, id: int) -> Recipe | None:
    res = db.execute(
        """
        DELETE FROM recipe
        WHERE id = ?
        RETURNING
            id,
            name,
            author,
            cuisine,
            tags,
            location,
            dietary_restrictions_met,
            time_estimate_minutes,
            notes,
            last_made_at,
            saved_at,
            updated_at
        ;
        """,
        (id,)
    )
    row = res.fetchone()
    db.commit()

    if row is None:
        return None

    return to_recipe(row)
