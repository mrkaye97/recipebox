-- migrate:up
CREATE TABLE "user" (
    id UUID NOT NULL DEFAULT GEN_RANDOM_UUID(),
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id)
);

CREATE TABLE user_password (
  user_id UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  PRIMARY KEY (user_id)
);


CREATE TYPE dietary_restriction AS ENUM (
    'gluten_free',
    'dairy_free',
    'nut_free',
    'vegan',
    'vegetarian',
    'pescatarian'
);

CREATE TABLE recipe (
    id UUID NOT NULL DEFAULT GEN_RANDOM_UUID(),
    user_id UUID NOT NULL,
    name TEXT NOT NULL,
    author TEXT NOT NULL,
    cuisine TEXT NOT NULL,
    location JSONB NOT NULL,
    time_estimate_minutes INTEGER NOT NULL,
    notes TEXT, -- Markdown
    last_made_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE
);

CREATE INDEX idx_recipe_last_made_at ON recipe (user_id, last_made_at);
CREATE INDEX idx_recipe_updated_at ON recipe (user_id, updated_at);
CREATE INDEX idx_recipe_time_estimate ON recipe (user_id, time_estimate_minutes);

CREATE TABLE recipe_tag (
    user_id UUID NOT NULL,
    recipe_id UUID NOT NULL,
    tag TEXT NOT NULL,

    PRIMARY KEY (recipe_id, user_id, tag),
    FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE,
    FOREIGN KEY (recipe_id) REFERENCES recipe(id) ON DELETE CASCADE
);

CREATE TABLE recipe_dietary_restriction_met (
    user_id UUID NOT NULL,
    recipe_id UUID NOT NULL,
    dietary_restriction dietary_restriction NOT NULL,

    PRIMARY KEY (recipe_id, user_id, dietary_restriction),
    FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE,
    FOREIGN KEY (recipe_id) REFERENCES recipe(id) ON DELETE CASCADE
);

CREATE TABLE recipe_ingredient (
    recipe_id UUID NOT NULL,
    user_id UUID NOT NULL,
    name TEXT NOT NULL,
    quantity FLOAT NOT NULL,
    units TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (recipe_id, user_id, name, quantity, units),
    FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE,
    FOREIGN KEY (recipe_id) REFERENCES recipe(id) ON DELETE CASCADE
);

CREATE TABLE recipe_instruction (
    recipe_id UUID NOT NULL,
    user_id UUID NOT NULL,
    step_number INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (recipe_id, user_id, step_number),
    FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE,
    FOREIGN KEY (recipe_id) REFERENCES recipe(id) ON DELETE CASCADE
);

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

-- migrate:down
DROP TABLE cooking_history;
DROP TABLE recipe_instruction;
DROP TABLE recipe_ingredient;
DROP TABLE recipe_dietary_restriction_met;
DROP TABLE recipe_tag;
DROP TABLE recipe;
DROP TABLE user_password;
DROP TABLE "user";
DROP TYPE dietary_restriction;

