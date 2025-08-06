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
WITH inputs AS (
    SELECT
        UNNEST(@name) AS name,
        UNNEST(@recipeId) AS recipe_id
)

INSERT INTO recipe_tag (name, recipe_id)
SELECT
    name,
    recipe_id
FROM inputs
ON CONFLICT DO NOTHING
RETURNING *;

-- name: CreateRecipeDietaryRestrictionsMet :many
WITH inputs AS (
    SELECT
        UNNEST(@dietaryRestrictionsMet) AS dietary_restriction_met,
        UNNEST(@recipeId) AS recipe_id
)
INSERT INTO recipe_dietary_restriction_met (dietary_restriction_met, recipe_id)
SELECT
    dietary_restriction_met,
    recipe_id
FROM inputs
ON CONFLICT DO NOTHING
RETURNING *;