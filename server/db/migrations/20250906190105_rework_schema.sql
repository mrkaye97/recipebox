-- migrate:up
DROP INDEX idx_recipe_user_name;
DROP INDEX idx_recipe_last_made_at;
DROP INDEX idx_recipe_time_estimate;
DROP INDEX idx_recipe_updated_at;

-- ingredient
ALTER TABLE recipe_ingredient DROP COLUMN user_id;
ALTER TABLE recipe_ingredient DROP CONSTRAINT recipe_ingredient_pkey;
ALTER TABLE recipe_ingredient ADD PRIMARY KEY (recipe_id, name, quantity, units);

-- instruction
ALTER TABLE recipe_instruction DROP COLUMN user_id;
ALTER TABLE recipe_instruction DROP CONSTRAINT recipe_instruction_pkey;
ALTER TABLE recipe_instruction ADD PRIMARY KEY (recipe_id, step_number);

-- tags
ALTER TABLE recipe_tag DROP COLUMN user_id;
ALTER TABLE recipe_tag DROP CONSTRAINT recipe_tag_pkey;
ALTER TABLE recipe_tag ADD PRIMARY KEY (recipe_id, tag);

-- dietary restriction
ALTER TABLE recipe_dietary_restriction_met DROP COLUMN user_id;
ALTER TABLE recipe_dietary_restriction_met DROP CONSTRAINT recipe_dietary_restriction_met_pkey;
ALTER TABLE recipe_dietary_restriction_met ADD PRIMARY KEY (recipe_id, dietary_restriction);

-- migrate:down
-- intentionall blank
