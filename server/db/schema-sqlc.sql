CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;
COMMENT ON EXTENSION pg_trgm IS 'text similarity measurement and index searching based on trigrams';
CREATE TYPE dietary_restriction AS ENUM (
    'gluten_free',
    'dairy_free',
    'nut_free',
    'vegan',
    'vegetarian',
    'pescatarian'
);
CREATE TYPE friendship_status AS ENUM (
    'pending',
    'accepted'
);
CREATE TYPE user_privacy_preference AS ENUM (
    'public',
    'private'
);
CREATE TABLE cooking_history (
    recipe_id uuid NOT NULL,
    user_id uuid NOT NULL,
    made_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE TABLE friendship (
    user_id uuid NOT NULL,
    friend_user_id uuid NOT NULL,
    status friendship_status NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE TABLE recipe (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    author text NOT NULL,
    cuisine text NOT NULL,
    location jsonb NOT NULL,
    time_estimate_minutes integer NOT NULL,
    notes text,
    last_made_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE TABLE recipe_dietary_restriction_met (
    user_id uuid NOT NULL,
    recipe_id uuid NOT NULL,
    dietary_restriction dietary_restriction NOT NULL
);
CREATE TABLE recipe_ingredient (
    recipe_id uuid NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    quantity double precision NOT NULL,
    units text NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE TABLE recipe_instruction (
    recipe_id uuid NOT NULL,
    user_id uuid NOT NULL,
    step_number integer NOT NULL,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE TABLE recipe_tag (
    user_id uuid NOT NULL,
    recipe_id uuid NOT NULL,
    tag text NOT NULL
);
CREATE TABLE schema_migrations (
    version character varying(128) NOT NULL
);
CREATE TABLE "user" (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email text NOT NULL,
    name text NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    privacy_preference user_privacy_preference DEFAULT 'public'::user_privacy_preference NOT NULL
);
CREATE TABLE user_password (
    user_id uuid NOT NULL,
    password_hash text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE ONLY cooking_history
    ADD CONSTRAINT cooking_history_pkey PRIMARY KEY (user_id, made_at, recipe_id);
ALTER TABLE ONLY friendship
    ADD CONSTRAINT friendship_pkey PRIMARY KEY (user_id, friend_user_id);
ALTER TABLE ONLY recipe_dietary_restriction_met
    ADD CONSTRAINT recipe_dietary_restriction_met_pkey PRIMARY KEY (recipe_id, user_id, dietary_restriction);
ALTER TABLE ONLY recipe_ingredient
    ADD CONSTRAINT recipe_ingredient_pkey PRIMARY KEY (recipe_id, user_id, name, quantity, units);
ALTER TABLE ONLY recipe_instruction
    ADD CONSTRAINT recipe_instruction_pkey PRIMARY KEY (recipe_id, user_id, step_number);
ALTER TABLE ONLY recipe
    ADD CONSTRAINT recipe_pkey PRIMARY KEY (id);
ALTER TABLE ONLY recipe_tag
    ADD CONSTRAINT recipe_tag_pkey PRIMARY KEY (recipe_id, user_id, tag);
ALTER TABLE ONLY schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);
ALTER TABLE ONLY "user"
    ADD CONSTRAINT user_email_key UNIQUE (email);
ALTER TABLE ONLY user_password
    ADD CONSTRAINT user_password_pkey PRIMARY KEY (user_id);
ALTER TABLE ONLY "user"
    ADD CONSTRAINT user_pkey PRIMARY KEY (id);
CREATE INDEX idx_recipe_last_made_at ON recipe USING btree (user_id, last_made_at);
CREATE INDEX idx_recipe_time_estimate ON recipe USING btree (user_id, time_estimate_minutes);
CREATE INDEX idx_recipe_updated_at ON recipe USING btree (user_id, updated_at);
CREATE UNIQUE INDEX idx_recipe_user_name ON recipe USING btree (user_id, name);
CREATE INDEX idx_users_name_email_trgm ON "user" USING gin ((((name || ' '::text) || email)) gin_trgm_ops);
ALTER TABLE ONLY cooking_history
    ADD CONSTRAINT cooking_history_recipe_id_fkey FOREIGN KEY (recipe_id) REFERENCES recipe(id) ON DELETE CASCADE;
ALTER TABLE ONLY cooking_history
    ADD CONSTRAINT cooking_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE;
ALTER TABLE ONLY friendship
    ADD CONSTRAINT friendship_friend_user_id_fkey FOREIGN KEY (friend_user_id) REFERENCES "user"(id) ON DELETE CASCADE;
ALTER TABLE ONLY friendship
    ADD CONSTRAINT friendship_user_id_fkey FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE;
ALTER TABLE ONLY recipe_dietary_restriction_met
    ADD CONSTRAINT recipe_dietary_restriction_met_recipe_id_fkey FOREIGN KEY (recipe_id) REFERENCES recipe(id) ON DELETE CASCADE;
ALTER TABLE ONLY recipe_dietary_restriction_met
    ADD CONSTRAINT recipe_dietary_restriction_met_user_id_fkey FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE;
ALTER TABLE ONLY recipe_ingredient
    ADD CONSTRAINT recipe_ingredient_recipe_id_fkey FOREIGN KEY (recipe_id) REFERENCES recipe(id) ON DELETE CASCADE;
ALTER TABLE ONLY recipe_ingredient
    ADD CONSTRAINT recipe_ingredient_user_id_fkey FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE;
ALTER TABLE ONLY recipe_instruction
    ADD CONSTRAINT recipe_instruction_recipe_id_fkey FOREIGN KEY (recipe_id) REFERENCES recipe(id) ON DELETE CASCADE;
ALTER TABLE ONLY recipe_instruction
    ADD CONSTRAINT recipe_instruction_user_id_fkey FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE;
ALTER TABLE ONLY recipe_tag
    ADD CONSTRAINT recipe_tag_recipe_id_fkey FOREIGN KEY (recipe_id) REFERENCES recipe(id) ON DELETE CASCADE;
ALTER TABLE ONLY recipe_tag
    ADD CONSTRAINT recipe_tag_user_id_fkey FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE;
ALTER TABLE ONLY recipe
    ADD CONSTRAINT recipe_user_id_fkey FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE;
ALTER TABLE ONLY user_password
    ADD CONSTRAINT user_password_user_id_fkey FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE;
INSERT INTO schema_migrations (version) VALUES
    ('20250803211143'),
    ('20250827005941'),
    ('20250827021238');
