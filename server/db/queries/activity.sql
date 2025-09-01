-- name: ListRecentRecipeCooks :many
WITH recipes_cooked AS (
    SELECT *
    FROM recipe_cooking_log
    WHERE user_id = ANY(@userIds::UUID[])
    ORDER BY cooked_at DESC
    LIMIT @recentCooksLimit::INT
    OFFSET @recentCooksOffset::INT
)

SELECT r.*, rc.cooked_at
FROM recipes_cooked rc
JOIN recipe r ON r.id = rc.recipe_id
ORDER BY rc.cooked_at DESC
;

-- name: MarkRecipeCooked :one
WITH new_log AS (
    INSERT INTO recipe_cooking_log (recipe_id, user_id, cooked_at)
    VALUES (
        @recipeId::UUID,
        @userId::UUID,
        NOW()
    )
    RETURNING *
)

UPDATE recipe
SET
    last_made_at = (SELECT cooked_at FROM new_log),
    updated_at = CURRENT_TIMESTAMP
WHERE
    id = @recipeId::UUID
    AND user_id = @userId::UUID
RETURNING *;