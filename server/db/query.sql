-- name: FindUserById :one
SELECT *
FROM "user"
WHERE id = @userId;
