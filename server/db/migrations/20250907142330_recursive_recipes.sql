-- migrate:up
ALTER TABLE recipe ADD COLUMN parent_recipe_id UUID REFERENCES recipe(id) ON DELETE SET NULL;
CREATE INDEX idx_recipe_parent_recipe_id ON recipe(parent_recipe_id);

-- migrate:down
ALTER TABLE recipe DROP COLUMN parent_recipe_id;
