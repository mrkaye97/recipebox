-- name: FindUserById :one
SELECT *
FROM "user"
WHERE id = @userId;

-- name: CreateRecipe :one
INSERT INTO recipe (
    name,
    author,
    cuisine,
    location,
    time_estimate_minutes,
    notes
)
VALUES (
    @name,
    @author,
    @cuisine,
    @location,
    @timeEstimateMinutes,
    @notes
)
RETURNING *;

-- name: CreateRecipeTags :many
WITH tags AS (
    SELECT
        UNNEST(@recipeId::UUID[]) AS recipe_id,
        UNNEST(@tag::TEXT[]) AS tag
)

INSERT INTO recipe_tag (recipe_id, tag)
SELECT
    recipe_id,
    tag
FROM tags
ON CONFLICT DO NOTHING
RETURNING *;

-- name: CreateRecipeDietaryRestrictionsMet :many
WITH restrictions AS (
    SELECT
        UNNEST(@recipeId::UUID[]) AS recipe_id,
        UNNEST(@dietaryRestrictionMet::dietary_restriction[]) AS dietary_restriction_met
)

INSERT INTO recipe_dietary_restriction_met (recipe_id, dietary_restriction_met)
SELECT
    recipe_id,
    dietary_restriction_met
FROM restrictions
ON CONFLICT DO NOTHING
RETURNING *;

-- name: CreateRecipeIngredients :many
WITH ingredients AS (
    SELECT
        UNNEST(@recipeId::UUID[]) AS recipe_id,
        UNNEST(@name::TEXT[]) AS name,
        UNNEST(@quantity::FLOAT8[]) AS quantity,
        UNNEST(@units::TEXT[]) AS units
)

INSERT INTO recipe_ingredient (recipe_id, name, quantity, units)
SELECT
    recipe_id,
    name,
    quantity,
    units
FROM ingredients
ON CONFLICT DO NOTHING
RETURNING *;

-- name: CreateRecipeInstructions :many
WITH instructions AS (
    SELECT
        UNNEST(@recipeId::UUID[]) AS recipe_id,
        UNNEST(@stepNumber::INT[]) AS step_number,
        UNNEST(@instruction::TEXT[]) AS instruction
)

INSERT INTO recipe_instruction (recipe_id, step_number, instruction)
SELECT
    recipe_id,
    step_number,
    instruction
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
    name = COALESCE(@name::TEXT, name),
    author = COALESCE(@author::TEXT, author),
    cuisine = COALESCE(@cuisine::TEXT, cuisine),
    location = COALESCE(@location::JSONB, location),
    time_estimate_minutes = COALESCE(@timeEstimateMinutes::INT, time_estimate_minutes),
    notes = COALESCE(@notes::TEXT, notes),
    last_made_at = COALESCE(@lastMadeAt::TIMESTAMPTZ, last_made_at),
    updated_at = CURRENT_TIMESTAMP
WHERE id = @recipeId::UUID
AND user_id = @userId::UUID
RETURNING *
;

-- name: DeleteRecipe :one
DELETE FROM recipe
WHERE id = @recipeId::UUID
AND user_id = @userId::UUID
RETURNING *
;