
-- name: CreateRecipe :one
INSERT INTO recipe (
    user_id,
    name,
    author,
    cuisine,
    location,
    time_estimate_minutes,
    notes,
    type,
    meal,
    parent_recipe_id
)
VALUES (
    @userId::UUID,
    @name::TEXT,
    @author::TEXT,
    @cuisine::TEXT,
    @location::JSONB,
    @timeEstimateMinutes::INTEGER,
    sqlc.narg('notes')::TEXT,
    @type::recipe_type,
    @meal::meal,
    sqlc.narg('parent_recipe_id')::UUID
)
RETURNING *;

-- name: DeleteRecipeTagsByRecipeId :exec
DELETE FROM recipe_tag
WHERE recipe_id = @recipeId::UUID
;

-- name: CreateRecipeTags :many
WITH tags AS (
    SELECT UNNEST(@tags::TEXT[]) AS tag
)

INSERT INTO recipe_tag (recipe_id, tag)
SELECT
    @recipeId::UUID,
    tag
FROM tags
ON CONFLICT DO NOTHING
RETURNING *;

-- name: DeleteRecipeDietaryRestrictionsMetByRecipeId :exec
DELETE FROM recipe_dietary_restriction_met
WHERE recipe_id = @recipeId::UUID
;

-- name: CreateRecipeDietaryRestrictionsMet :many
WITH restrictions AS (
    SELECT UNNEST(@dietaryRestrictionsMets::dietary_restriction[]) AS dietary_restriction
)

INSERT INTO recipe_dietary_restriction_met (recipe_id, dietary_restriction)
SELECT
    @recipeId::UUID,
    dietary_restriction
FROM restrictions
ON CONFLICT DO NOTHING
RETURNING *;

-- name: DeleteRecipeIngredientsByRecipeId :exec
DELETE FROM recipe_ingredient
WHERE recipe_id = @recipeId::UUID
;

-- name: CreateRecipeIngredients :many
WITH ingredients AS (
    SELECT
        UNNEST(@names::TEXT[]) AS name,
        UNNEST(@quantities::FLOAT8[]) AS quantity,
        UNNEST(@units::TEXT[]) AS units
)

INSERT INTO recipe_ingredient (recipe_id, name, quantity, units)
SELECT
    @recipeId::UUID,
    name,
    quantity,
    units
FROM ingredients
ON CONFLICT DO NOTHING
RETURNING *;

-- name: DeleteRecipeInstructionsByRecipeId :exec
DELETE FROM recipe_instruction
WHERE recipe_id = @recipeId::UUID
;

-- name: CreateRecipeInstructions :many
WITH instructions AS (
    SELECT
        UNNEST(@stepNumbers::INT[]) AS step_number,
        UNNEST(@contents::TEXT[]) AS content
)

INSERT INTO recipe_instruction (recipe_id, step_number, content)
SELECT
    @recipeId::UUID,
    step_number,
    content
FROM instructions
ON CONFLICT DO NOTHING
RETURNING *;

-- name: ListRecipes :many
WITH ingredient_seasonality_score AS (
    SELECT
        i.recipe_id,
        SUM(paradedb.score(i.id)) AS total_ingredient_score
    FROM recipe_ingredient i
    JOIN recipe r ON r.id = i.recipe_id
    WHERE
        i.id @@@ paradedb.parse(@seasonalIngredients::TEXT, lenient => true)
        AND r.user_id = @userId::UUID
    GROUP BY i.recipe_id
)
SELECT r.*
FROM recipe r
JOIN "user" u ON u.id = r.user_id
LEFT JOIN ingredient_seasonality_score iss ON r.id = iss.recipe_id
WHERE
    (
        (
            -- browsing all recipes
            @onlyUser::BOOLEAN = FALSE
            -- don't include copies, only originals
            AND r.parent_recipe_id IS NULL
            -- exclude current user's own recipes
            AND r.user_id != @userId::UUID
        )
        OR (
            @onlyUser::BOOLEAN
            AND r.user_id = @userId::UUID
        )
    )
    AND (
        sqlc.narg('search')::TEXT IS NULL
        OR r.id @@@ paradedb.parse(sqlc.narg('search')::TEXT, lenient => true)
    )
ORDER BY
    CASE WHEN @onlyUser::BOOLEAN THEN
        CASE
            -- don't surface long recipes on weekdays
            WHEN EXTRACT(ISODOW FROM NOW()::DATE) IN (1, 2, 3, 4, 5) AND r.time_estimate_minutes > 90 THEN 0.0
            WHEN EXTRACT(ISODOW FROM NOW()::DATE) IN (1, 2, 3, 4, 5) AND r.time_estimate_minutes > 60 THEN 0.2
            ELSE 1.0
        END *
        CASE
            WHEN r.last_made_at IS NULL THEN 1.0
            ELSE GREATEST(1.0, LEAST(3.0, (NOW()::DATE - r.last_made_at::DATE) / 30.0))
        END *
        COALESCE(iss.total_ingredient_score + 1.0, 1.0)
    ELSE NULL END DESC NULLS LAST,
    r.updated_at DESC,
    r.id
;

-- name: GetRecipe :one
SELECT r.*
FROM recipe r
JOIN "user" u ON u.id = r.user_id
WHERE
    r.id = @recipeId::UUID
;

-- name: UpdateRecipe :one
UPDATE recipe
SET
    name = COALESCE(sqlc.narg('name')::TEXT, name),
    author = COALESCE(sqlc.narg('author')::TEXT, author),
    cuisine = COALESCE(sqlc.narg('cuisine')::TEXT, cuisine),
    location = COALESCE(sqlc.narg('location')::JSONB, location),
    time_estimate_minutes = COALESCE(sqlc.narg('time_estimate_minutes')::INT, time_estimate_minutes),
    notes = COALESCE(sqlc.narg('notes')::TEXT, notes),
    meal = COALESCE(sqlc.narg('meal')::meal, meal),
    type = COALESCE(sqlc.narg('type')::recipe_type, type),
    updated_at = CURRENT_TIMESTAMP
WHERE id = @recipeId::UUID
RETURNING *
;

-- name: DeleteRecipe :exec
DELETE FROM recipe
WHERE id = @recipeId::UUID
RETURNING *
;

-- name: ListRecipeTags :many
SELECT *
FROM recipe_tag
WHERE recipe_id = ANY(@recipeIds::UUID[])
;

-- name: ListRecipeDietaryRestrictionsMet :many
SELECT *
FROM recipe_dietary_restriction_met
WHERE recipe_id = ANY(@recipeIds::UUID[])
;

-- name: ListRecipeIngredients :many
SELECT *
FROM recipe_ingredient
WHERE recipe_id = ANY(@recipeIds::UUID[])
;

-- name: ListRecipeInstructions :many
SELECT *
FROM recipe_instruction
WHERE recipe_id = ANY(@recipeIds::UUID[])
ORDER BY step_number ASC
;

-- name: ListRecipeFilterOptions :one
SELECT
    ARRAY_AGG(DISTINCT meal)::meal[] AS meals,
    ARRAY_AGG(DISTINCT type)::recipe_type[] AS types,
    ARRAY_AGG(DISTINCT cuisine)::TEXT[] AS cuisines
FROM recipe
WHERE user_id = @userId::UUID;