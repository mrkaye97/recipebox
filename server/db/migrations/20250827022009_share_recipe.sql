-- migrate:up
CREATE TABLE recipe_share_request (
    token TEXT PRIMARY KEY,
    to_user_id UUID REFERENCES "user"(id) ON DELETE CASCADE,
    recipe_id UUID REFERENCES recipe(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL
);

-- migrate:down
DROP TABLE recipe_share_request;
