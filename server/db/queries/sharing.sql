
-- name: CreateRecipeShareRequest :one
INSERT INTO recipe_share_request (
    recipe_id,
    to_user_id,
    expires_at
)
VALUES (
    @recipeId::UUID,
    @toUserId::UUID,
    @expiresAt::TIMESTAMPTZ
)
RETURNING *;

-- name: ListPendingRecipeShareRequests :many
SELECT
    r.name AS recipe_name,
    u.name AS from_user_name,
    u.email AS from_user_email
FROM recipe_share_request rsr
JOIN recipe r ON rsr.recipe_id = r.id
JOIN "user" u ON r.user_id = u.id
WHERE rsr.to_user_id = @toUserId::UUID
AND rsr.expires_at > NOW()
ORDER BY rsr.created_at DESC
;

-- name: DeleteSharingRequest :one
DELETE FROM recipe_share_request
WHERE
    recipe_id = @recipeId::UUID
    AND to_user_id = @toUserId::UUID
RETURNING *;