-- name: ListRecentRecipeCooks :many
WITH recipes_cooked AS (
    SELECT *
    FROM recipe_cooking_log
    WHERE user_id = @userId::UUID
    ORDER BY cooked_at DESC
    LIMIT @recentCooksLimit::INT
    OFFSET @recentCooksOffset::INT
)

SELECT r.*, rc.cooked_at
FROM recipes_cooked rc
JOIN recipe r ON r.id = rc.recipe_id
ORDER BY rc.cooked_at DESC
;

