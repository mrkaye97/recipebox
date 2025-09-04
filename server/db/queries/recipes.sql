
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
    meal
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
    @meal::meal
)
RETURNING *;

-- name: DeleteRecipeTagsByRecipeId :exec
DELETE FROM recipe_tag
WHERE
    recipe_id = @recipeId::UUID
    AND user_id = @userId::UUID
;

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

-- name: DeleteRecipeDietaryRestrictionsMetByRecipeId :exec
DELETE FROM recipe_dietary_restriction_met
WHERE
    recipe_id = @recipeId::UUID
    AND user_id = @userId::UUID
;

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

-- name: DeleteRecipeIngredientsByRecipeId :exec
DELETE FROM recipe_ingredient
WHERE
    recipe_id = @recipeId::UUID
    AND user_id = @userId::UUID
;

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

-- name: DeleteRecipeInstructionsByRecipeId :exec
DELETE FROM recipe_instruction
WHERE
    recipe_id = @recipeId::UUID
    AND user_id = @userId::UUID
;

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
WHERE
    user_id = @userId::UUID
    AND (
        sqlc.narg('search')::TEXT IS NULL
        OR id @@@ paradedb.parse(sqlc.narg('search')::TEXT, lenient => true)
    )
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
    meal = COALESCE(sqlc.narg('meal')::meal, meal),
    type = COALESCE(sqlc.narg('type')::recipe_type, type),
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

-- name: RecommendRecipe :one
WITH ingredient_seasonality_score AS (
    SELECT
        recipe_id,
        user_id,
        SUM(paradedb.score(id)) as total_ingredient_score
    FROM recipe_ingredient
    WHERE
        id @@@ paradedb.parse(@seasonalIngredients::TEXT, lenient => true)
        AND user_id = @userId::UUID
    GROUP BY recipe_id, user_id
), last_recommended_at_score AS (
    SELECT
        recipe_id,
        user_id,
        GREATEST(1.0, LEAST(3.0, (NOW()::DATE - COALESCE(MAX(rr.created_at)::DATE, '1970-01-01'::DATE)) / 30.0)) AS last_recommended_at_factor
    FROM recipe_recommendation rr
    WHERE rr.user_id = @userId::UUID
    GROUP BY recipe_id, user_id
)

SELECT r.*
FROM recipe r
LEFT JOIN ingredient_seasonality_score iss ON (r.id, r.user_id) = (iss.recipe_id, iss.user_id)
LEFT JOIN last_recommended_at_score lras ON (r.id, r.user_id) = (lras.recipe_id, lras.user_id)
WHERE r.user_id = @userId::UUID
ORDER BY (
    CASE
        WHEN EXTRACT(ISODOW FROM NOW()::DATE) IN (6, 7) AND r.time_estimate_minutes > 60 THEN 0.5
        ELSE 1.0
    END *
    CASE
        WHEN r.last_made_at IS NULL THEN 1.0
        ELSE GREATEST(1.0, LEAST(3.0, (NOW()::DATE - r.last_made_at::DATE) / 30.0))
    END *
    COALESCE(lras.last_recommended_at_factor, 1.0) *
    COALESCE(iss.total_ingredient_score + 1.0, 1.0)
) DESC
LIMIT 1;

-- name: LogRecipeRecommendation :exec
INSERT INTO recipe_recommendation (recipe_id, user_id)
VALUES (
    @recipeId::UUID,
    @userId::UUID
);

-- name: ListRecipeFilterOptions :one
SELECT
    ARRAY_AGG(DISTINCT meal)::meal[] AS meals,
    ARRAY_AGG(DISTINCT type)::recipe_type[] AS types,
    ARRAY_AGG(DISTINCT cuisine)::TEXT[] AS cuisines
FROM recipe
WHERE user_id = @userId::UUID;