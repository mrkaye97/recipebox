-- migrate:up
CREATE TABLE recipe_cooking_log (
    user_id UUID REFERENCES "user"(id) ON DELETE CASCADE,
    recipe_id UUID REFERENCES recipe(id) ON DELETE CASCADE,
    cooked_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, cooked_at, recipe_id)
);

-- migrate:down
DROP TABLE recipe_cooking_log;
