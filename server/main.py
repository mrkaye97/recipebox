from collections import defaultdict
from typing import Annotated, overload
from uuid import UUID

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm

from src.auth import create_access_token, hash_password
from src.crud.models import DietaryRestriction, RecipeIngredient, RecipeInstruction
from src.crud.models import Recipe as RecipeModel
from src.crud.query import (
    AsyncQuerier,
    CreateRecipeIngredientsParams,
    CreateRecipeParams,
    UpdateRecipeParams,
)
from src.dependencies import Connection, User
from src.logger import get_logger
from src.parsing import extract_recipe_markdown_from_url, markdown_to_recipe
from src.schemas import (
    CreateRecipeLocation,
    Recipe,
    RecipeLocation,
    Token,
    UserRegistration,
)

app = FastAPI()
logger = get_logger(__name__)


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


@overload
async def populate_recipe_data(
    db: AsyncQuerier, user_id: UUID, recipes: RecipeModel
) -> Recipe: ...


@overload
async def populate_recipe_data(
    db: AsyncQuerier, user_id: UUID, recipes: list[RecipeModel]
) -> list[Recipe]: ...


async def populate_recipe_data(
    db: AsyncQuerier, user_id: UUID, recipes: list[RecipeModel] | RecipeModel
) -> list[Recipe] | Recipe:
    wants_single = isinstance(recipes, RecipeModel)

    if isinstance(recipes, RecipeModel):
        recipes = [recipes]

    recipe_ids = [recipe.id for recipe in recipes]

    recipe_id_to_tags = defaultdict[UUID, list[str]](list)
    async for tag in db.list_recipe_tags(recipeids=recipe_ids, userid=user_id):
        recipe_id_to_tags[tag.recipe_id].append(tag.tag)

    recipe_id_to_dietary_restrictions_met = defaultdict[UUID, list[DietaryRestriction]](
        list
    )
    async for dr in db.list_recipe_dietary_restrictions_met(
        recipeids=recipe_ids, userid=user_id
    ):
        recipe_id_to_dietary_restrictions_met[dr.recipe_id].append(
            dr.dietary_restriction
        )

    recipe_id_to_ingredients = defaultdict[UUID, list[RecipeIngredient]](list)
    async for ingredient in db.list_recipe_ingredients(
        recipeids=recipe_ids, userid=user_id
    ):
        recipe_id_to_ingredients[ingredient.recipe_id].append(ingredient)

    recipe_id_to_instructions = defaultdict[UUID, list[RecipeInstruction]](list)
    async for instruction in db.list_recipe_instructions(
        recipeids=recipe_ids, userid=user_id
    ):
        recipe_id_to_instructions[instruction.recipe_id].append(instruction)

    to_return = [
        Recipe.from_db(
            recipe=recipe,
            ingredients=recipe_id_to_ingredients[recipe.id],
            dietary_restrictions_met=recipe_id_to_dietary_restrictions_met[recipe.id],
            instructions=recipe_id_to_instructions[recipe.id],
            tags=recipe_id_to_tags[recipe.id],
        )
        for recipe in recipes
    ]

    if wants_single:
        return to_return[0]

    return to_return


async def list_recipes_from_db(user_id: UUID, db: AsyncQuerier) -> list[Recipe]:
    recipes = [r async for r in db.list_recipes(userid=user_id)]

    return await populate_recipe_data(db=db, user_id=user_id, recipes=recipes)


@app.get("/recipes")
async def list_recipes(user: User, conn: Connection) -> list[Recipe]:
    db = AsyncQuerier(conn)
    return await list_recipes_from_db(user_id=user.id, db=db)


@app.get("/recipes/{id}")
async def get_recipe(
    conn: Connection,
    user: User,
    id: UUID,
) -> Recipe:
    db = AsyncQuerier(conn)
    recipe = await db.get_recipe(recipeid=id, userid=user.id)

    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")

    return await populate_recipe_data(
        db=db,
        user_id=user.id,
        recipes=recipe,
    )


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

    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")

    return await populate_recipe_data(
        db=db,
        user_id=user.id,
        recipes=recipe,
    )


@app.post("/recipes")
async def create_recipe(
    params: CreateRecipeLocation, user: User, conn: Connection
) -> Recipe | None:
    db = AsyncQuerier(conn)

    if params.location.location == "cookbook":
        ## TODO: Picture to markdown to recipe
        base = await markdown_to_recipe("foo")
    elif params.location.location == "online":
        md = await extract_recipe_markdown_from_url(params.location.url)
        base = await markdown_to_recipe(md)
    elif params.location.location == "made_up":
        md = f"""
            # {params.location.name}

            ## Ingredients
            {params.location.ingredients}

            ## Instructions
            {params.location.instructions}
        """

        base = await markdown_to_recipe(md)
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid location type"
        )

    # print("\nParams to dump out", params.model_dump(), "\n")
    location = RecipeLocation.model_validate(params.model_dump())

    recipe = await db.create_recipe(
        CreateRecipeParams(
            userid=user.id,
            name=base.name,
            author=base.author,
            cuisine=base.cuisine,
            location=location.model_dump_json(),
            timeestimateminutes=base.time_estimate_minutes,
            notes=params.notes,
        )
    )

    if not recipe:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Could not create recipe"
        )

    ingredients = db.create_recipe_ingredients(
        CreateRecipeIngredientsParams(
            recipeid=recipe.id,
            userid=user.id,
            names=[i.name for i in base.ingredients],
            quantities=[i.quantity for i in base.ingredients],
            units=[i.units or "" for i in base.ingredients],
        )
    )

    dietary_restrictions_met = db.create_recipe_dietary_restrictions_met(
        recipeid=recipe.id,
        userid=user.id,
        dietaryrestrictionsmets=base.dietary_restrictions_met,
    )

    instructions = db.create_recipe_instructions(
        recipeid=recipe.id,
        userid=user.id,
        stepnumbers=[i.step_number for i in base.instructions],
        contents=[i.content for i in base.instructions],
    )

    tags = db.create_recipe_tags(
        recipeid=recipe.id,
        tags=base.tags,
        userid=user.id,
    )

    return Recipe.from_db(
        recipe=recipe,
        ingredients=[i async for i in ingredients],
        dietary_restrictions_met=[
            d.dietary_restriction async for d in dietary_restrictions_met
        ],
        instructions=[i async for i in instructions],
        tags=[t.tag async for t in tags],
    )


@app.delete("/recipes/{id}")
async def delete_recipe(conn: Connection, user: User, id: UUID) -> UUID:
    db = AsyncQuerier(conn)

    await db.delete_recipe(recipeid=id, userid=user.id)

    return id
