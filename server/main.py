from typing import Annotated
from uuid import UUID

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm

from src.auth import create_access_token, hash_password
from src.crud.query import AsyncQuerier, CreateRecipeParams, UpdateRecipeParams
from src.dependencies import Connection, User
from src.schemas import Token, UserRegistration, RecipeCreate, Recipe

app = FastAPI()


@app.post("/auth/register", response_model=Token)
async def register(user_data: UserRegistration, conn: Connection) -> Token:
    querier = AsyncQuerier(conn)
    user = await querier.create_user(email=user_data.email, name=user_data.name)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Could not create user"
        )

    password_hash = hash_password(user_data.password)
    await querier.create_user_password(userid=user.id, passwordhash=password_hash)

    access_token = create_access_token(user.id)

    await conn.commit()

    return Token(access_token=access_token, token_type="bearer")


@app.post("/auth/login", response_model=Token)
async def login(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()], conn: Connection
) -> Token:
    db = AsyncQuerier(conn)
    password_hash = hash_password(form_data.password)
    user = await db.authenticate_user(
        email=form_data.username,
        user_id=None,
        passwordhash=password_hash,
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(user.id)

    return Token(access_token=access_token, token_type="bearer")


@app.get("/recipes")
async def list_recipes(user: User, conn: Connection) -> list[Recipe]:
    db = AsyncQuerier(conn)
    return [r async for r in db.list_recipes(userid=user.id)]


@app.get("/recipes/{id}")
async def get_recipe(
    conn: Connection,
    user: User,
    id: UUID,
) -> Recipe | None:
    db = AsyncQuerier(conn)
    return await db.get_recipe(recipeid=id, userid=user.id)


@app.patch("/recipes/{id}")
async def update_recipe(
    conn: Connection,
    user: User,
    id: UUID,
    body: UpdateRecipeParams,
) -> Recipe | None:
    db = AsyncQuerier(conn)
    body.userid = user.id
    body.recipeid = id
    recipe = await db.update_recipe(body)

    await conn.commit()

    return recipe


@app.post("/recipes")
async def create_recipe(
    body: RecipeCreate, user: User, conn: Connection
) -> Recipe | None:
    db = AsyncQuerier(conn)

    recipe = await db.create_recipe(
        CreateRecipeParams(
            userid=user.id,
            name=body.name,
            author=body.author,
            cuisine=body.cuisine,
            location=body.location.model_dump_json(),
            time_estimate_minutes=body.time_estimate_minutes,
            notes=body.notes,
        )
    )

    if not recipe:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Could not create recipe"
        )

    ingredients = db.create_recipe_ingredients(
        recipeid=recipe.id,
        names=[i.name for i in body.ingredients],
        quantities=[i.quantity for i in body.ingredients],
        units=[i.units for i in body.ingredients],
    )

    dietary_restrictions_met = db.create_recipe_dietary_restrictions_met(
        recipeid=recipe.id,
        dietaryrestrictionsmets=[dr.value for dr in body.dietary_restrictions_met],
    )

    instructions = db.create_recipe_instructions(
        recipeid=recipe.id,
        stepnumbers=[i.step_number for i in body.instructions],
        contents=[i.content for i in body.instructions],
    )

    tags = db.create_recipe_tags(recipeid=recipe.id, tags=body.tags)

    await conn.commit()
    return Recipe.from_db(
        recipe=recipe,
        ingredients=ingredients,
        dietary_restrictions_met=dietary_restrictions_met,
        instructions=instructions,
        tags=tags,
    )


@app.delete("/recipes/{id}")
async def delete_recipe(conn: Connection, user: User, id: UUID) -> Recipe:
    db = AsyncQuerier(conn)
    res = await db.delete_recipe(recipeid=id, userid=user.id)

    await conn.commit()

    if not res:
        raise HTTPException(status_code=404, detail="Recipe not found")

    return res
