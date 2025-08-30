
-- name: CreateRecipeShareRequest :one
INSERT INTO recipe_share_request (
    recipe_id,
    token,
    to_user_id,
    expires_at
)
VALUES (
    @recipeId::UUID,
    @token::TEXT,
    @toUserId::UUID,
    @expiresAt::TIMESTAMPTZ
)
RETURNING *;

-- name: AcceptRecipeShareRequest :one
WITH deleted_request AS (
    DELETE FROM recipe_share_request rsr
    USING recipe r
    WHERE rsr.recipe_id = r.id
      AND rsr.token = @token::TEXT
      AND rsr.expires_at > NOW()
    RETURNING rsr.recipe_id
)
SELECT r.*
FROM recipe r
JOIN deleted_request dr ON r.id = dr.recipe_id;

-- name: ListPendingRecipeShareRequests :many
SELECT
    rsr.token,
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
    token = @token::TEXT
    AND to_user_id = @toUserId::UUID
RETURNING *;