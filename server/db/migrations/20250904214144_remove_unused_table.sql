-- migrate:up
DROP TABLE cooking_history;

-- migrate:down
CREATE TABLE cooking_history (
    recipe_id UUID NOT NULL,
    user_id UUID NOT NULL,
    made_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (user_id, made_at, recipe_id),
    FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE,
    FOREIGN KEY (recipe_id) REFERENCES recipe(id) ON DELETE CASCADE
);
