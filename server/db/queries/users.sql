-- name: CreateUser :one
INSERT INTO "user" (
    email,
    name
)
VALUES (
    @email::TEXT,
    @name::TEXT
)
RETURNING *
;

-- name: CreateUserPassword :exec
INSERT INTO user_password (
    user_id,
    password_hash
)
VALUES (
    @userId::UUID,
    @passwordHash::TEXT
)
;

-- name: AuthenticateUser :one
SELECT u.*
FROM "user" u
JOIN user_password up ON u.id = up.user_id
WHERE
    (u.email = sqlc.narg('email')::TEXT OR u.id = sqlc.narg('user_id')::UUID)
    AND up.password_hash = @passwordHash::TEXT
;

-- name: FindUserById :one
SELECT *
FROM "user"
WHERE id = @userId;

-- name: SearchUsers :many
SELECT
    *,
    similarity(name || ' ' || email, @query::TEXT) as relevance_score
FROM "user"
WHERE (name || ' ' || email) ILIKE '%' || @query::TEXT || '%'
ORDER BY relevance_score DESC, name ASC
LIMIT COALESCE(@userLimit::INT, 25)
OFFSET COALESCE(@userOffset::INT, 0)
;