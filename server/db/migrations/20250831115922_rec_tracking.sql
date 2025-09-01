-- migrate:up
CREATE TABLE recipe_recommendation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipe_id UUID NOT NULL REFERENCES recipe(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_recipe_recommendation_user_recipe_created_at ON recipe_recommendation(user_id, recipe_id, created_at);

-- migrate:down
DROP TABLE recipe_recommendation;

