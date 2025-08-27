
-- name: CreateRecipe :one
INSERT INTO recipe (
    user_id,
    name,
    author,
    cuisine,
    location,
    time_estimate_minutes,
    notes
)
VALUES (
    @userId::UUID,
    @name::TEXT,
    @author::TEXT,
    @cuisine::TEXT,
    @location::JSONB,
    @timeEstimateMinutes::INTEGER,
    sqlc.narg('notes')::TEXT
)
RETURNING *;

-- name: CreateRecipeTags :many
WITH tags AS (
    SELECT UNNEST(@tags::TEXT[]) AS tag
)

INSERT INTO recipe_tag (recipe_id, user_id, tag)
SELECT
    @recipeId::UUID,
    @userId::UUID,
    tag
FROM tags
ON CONFLICT DO NOTHING
RETURNING *;

-- name: CreateRecipeDietaryRestrictionsMet :many
WITH restrictions AS (
    SELECT UNNEST(@dietaryRestrictionsMets::dietary_restriction[]) AS dietary_restriction
)

INSERT INTO recipe_dietary_restriction_met (recipe_id, user_id, dietary_restriction)
SELECT
    @recipeId::UUID,
    @userId::UUID,
    dietary_restriction
FROM restrictions
ON CONFLICT DO NOTHING
RETURNING *;

-- name: CreateRecipeIngredients :many
WITH ingredients AS (
    SELECT
        UNNEST(@names::TEXT[]) AS name,
        UNNEST(@quantities::FLOAT8[]) AS quantity,
        UNNEST(@units::TEXT[]) AS units
)

INSERT INTO recipe_ingredient (recipe_id, user_id, name, quantity, units)
SELECT
    @recipeId::UUID,
    @userId::UUID,
    name,
    quantity,
    units
FROM ingredients
ON CONFLICT DO NOTHING
RETURNING *;

-- name: CreateRecipeInstructions :many
WITH instructions AS (
    SELECT
        UNNEST(@stepNumbers::INT[]) AS step_number,
        UNNEST(@contents::TEXT[]) AS content
)

INSERT INTO recipe_instruction (recipe_id, user_id, step_number, content)
SELECT
    @recipeId::UUID,
    @userId::UUID,
    step_number,
    content
FROM instructions
ON CONFLICT DO NOTHING
RETURNING *;

-- name: ListRecipes :many
SELECT *
FROM recipe
WHERE user_id = @userId::UUID
ORDER BY updated_at DESC
;

-- name: GetRecipe :one
SELECT *
FROM recipe
WHERE id = @recipeId::UUID
AND user_id = @userId::UUID
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
    last_made_at = COALESCE(sqlc.narg('last_made_at')::TIMESTAMPTZ, last_made_at),
    updated_at = CURRENT_TIMESTAMP
WHERE
    id = @recipeId::UUID
    AND user_id = @userId::UUID
RETURNING *
;

-- name: DeleteRecipe :exec
DELETE FROM recipe
WHERE
    id = @recipeId::UUID
    AND user_id = @userId::UUID
RETURNING *
;

-- name: ListRecipeTags :many
SELECT *
FROM recipe_tag
WHERE
    recipe_id = ANY(@recipeIds::UUID[])
    AND user_id = @userId::UUID
;

-- name: ListRecipeDietaryRestrictionsMet :many
SELECT *
FROM recipe_dietary_restriction_met
WHERE
    recipe_id = ANY(@recipeIds::UUID[])
    AND user_id = @userId::UUID
;

-- name: ListRecipeIngredients :many
SELECT *
FROM recipe_ingredient
WHERE
    recipe_id = ANY(@recipeIds::UUID[])
    AND user_id = @userId::UUID
;

-- name: ListRecipeInstructions :many
SELECT *
FROM recipe_instruction
WHERE
    recipe_id = ANY(@recipeIds::UUID[])
    AND user_id = @userId::UUID
ORDER BY step_number ASC
;