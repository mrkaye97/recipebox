-- migrate:up

-- Add new UUID primary key columns to all recipe_* tables
ALTER TABLE recipe_tag
ADD COLUMN id UUID NOT NULL DEFAULT GEN_RANDOM_UUID();

ALTER TABLE recipe_dietary_restriction_met
ADD COLUMN id UUID NOT NULL DEFAULT GEN_RANDOM_UUID();

ALTER TABLE recipe_ingredient
ADD COLUMN id UUID NOT NULL DEFAULT GEN_RANDOM_UUID();

ALTER TABLE recipe_instruction
ADD COLUMN id UUID NOT NULL DEFAULT GEN_RANDOM_UUID();

ALTER TABLE cooking_history
ADD COLUMN id UUID NOT NULL DEFAULT GEN_RANDOM_UUID();

-- Drop existing primary key constraints
ALTER TABLE recipe_tag DROP CONSTRAINT recipe_tag_pkey;
ALTER TABLE recipe_dietary_restriction_met DROP CONSTRAINT recipe_dietary_restriction_met_pkey;
ALTER TABLE recipe_ingredient DROP CONSTRAINT recipe_ingredient_pkey;
ALTER TABLE recipe_instruction DROP CONSTRAINT recipe_instruction_pkey;
ALTER TABLE cooking_history DROP CONSTRAINT cooking_history_pkey;

-- Create new primary keys using the UUID columns
ALTER TABLE recipe_tag ADD PRIMARY KEY (id);
ALTER TABLE recipe_dietary_restriction_met ADD PRIMARY KEY (id);
ALTER TABLE recipe_ingredient ADD PRIMARY KEY (id);
ALTER TABLE recipe_instruction ADD PRIMARY KEY (id);
ALTER TABLE cooking_history ADD PRIMARY KEY (id);

-- Create unique indexes on the original composite keys
CREATE UNIQUE INDEX idx_recipe_tag_original_pk ON recipe_tag (recipe_id, user_id, tag);
CREATE UNIQUE INDEX idx_recipe_dietary_restriction_met_original_pk ON recipe_dietary_restriction_met (recipe_id, user_id, dietary_restriction);
CREATE UNIQUE INDEX idx_recipe_ingredient_original_pk ON recipe_ingredient (recipe_id, user_id, name, quantity, units);
CREATE UNIQUE INDEX idx_recipe_instruction_original_pk ON recipe_instruction (recipe_id, user_id, step_number);
CREATE UNIQUE INDEX idx_cooking_history_original_pk ON cooking_history (user_id, made_at, recipe_id);

-- migrate:down

-- Drop the unique indexes on original composite keys
DROP INDEX idx_recipe_tag_original_pk;
DROP INDEX idx_recipe_dietary_restriction_met_original_pk;
DROP INDEX idx_recipe_ingredient_original_pk;
DROP INDEX idx_recipe_instruction_original_pk;
DROP INDEX idx_cooking_history_original_pk;

-- Drop the new UUID primary keys
ALTER TABLE recipe_tag DROP CONSTRAINT recipe_tag_pkey;
ALTER TABLE recipe_dietary_restriction_met DROP CONSTRAINT recipe_dietary_restriction_met_pkey;
ALTER TABLE recipe_ingredient DROP CONSTRAINT recipe_ingredient_pkey;
ALTER TABLE recipe_instruction DROP CONSTRAINT recipe_instruction_pkey;
ALTER TABLE cooking_history DROP CONSTRAINT cooking_history_pkey;

-- Restore original primary keys
ALTER TABLE recipe_tag ADD PRIMARY KEY (recipe_id, user_id, tag);
ALTER TABLE recipe_dietary_restriction_met ADD PRIMARY KEY (recipe_id, user_id, dietary_restriction);
ALTER TABLE recipe_ingredient ADD PRIMARY KEY (recipe_id, user_id, name, quantity, units);
ALTER TABLE recipe_instruction ADD PRIMARY KEY (recipe_id, user_id, step_number);
ALTER TABLE cooking_history ADD PRIMARY KEY (user_id, made_at, recipe_id);

-- Drop the UUID columns
ALTER TABLE recipe_tag DROP COLUMN id;
ALTER TABLE recipe_dietary_restriction_met DROP COLUMN id;
ALTER TABLE recipe_ingredient DROP COLUMN id;
ALTER TABLE recipe_instruction DROP COLUMN id;
ALTER TABLE cooking_history DROP COLUMN id;