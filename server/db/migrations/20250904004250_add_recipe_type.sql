-- migrate:up
CREATE TYPE recipe_type AS ENUM ('starter', 'main', 'salad', 'dessert', 'snack', 'cocktail', 'condiment', 'other');
CREATE TYPE meal AS ENUM ('breakfast', 'lunch', 'dinner', 'other');

ALTER TABLE recipe
    ADD COLUMN type recipe_type NOT NULL DEFAULT 'main',
    ADD COLUMN meal meal NOT NULL DEFAULT 'dinner'
;

-- migrate:down
ALTER TABLE recipe
    DROP COLUMN type,
    DROP COLUMN meal
;

DROP TYPE recipe_type;
DROP TYPE meal;