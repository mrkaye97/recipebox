-- migrate:up
DROP INDEX idx_recipe_parent_recipe_id;
CREATE INDEX idx_recipe_user_id_parent_recipe_id ON public.recipe USING btree (user_id, parent_recipe_id);

-- migrate:down
CREATE INDEX idx_recipe_parent_recipe_id ON public.recipe USING btree (parent_recipe_id);
DROP INDEX idx_recipe_user_id_parent_recipe_id;