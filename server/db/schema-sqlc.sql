CREATE EXTENSION IF NOT EXISTS pg_ivm WITH SCHEMA pg_catalog;
COMMENT ON EXTENSION pg_ivm IS 'incremental view maintenance on PostgreSQL';
CREATE SCHEMA paradedb;
CREATE SCHEMA tiger;
CREATE SCHEMA tiger_data;
CREATE SCHEMA topology;
COMMENT ON SCHEMA topology IS 'PostGIS Topology schema';
CREATE EXTENSION IF NOT EXISTS fuzzystrmatch WITH SCHEMA public;
COMMENT ON EXTENSION fuzzystrmatch IS 'determine similarities and distance between strings';
CREATE EXTENSION IF NOT EXISTS pg_search WITH SCHEMA paradedb;
COMMENT ON EXTENSION pg_search IS 'pg_search: Full text search for PostgreSQL using BM25';
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;
COMMENT ON EXTENSION pg_trgm IS 'text similarity measurement and index searching based on trigrams';
CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA public;
COMMENT ON EXTENSION postgis IS 'PostGIS geometry and geography spatial types and functions';
CREATE EXTENSION IF NOT EXISTS postgis_tiger_geocoder WITH SCHEMA tiger;
COMMENT ON EXTENSION postgis_tiger_geocoder IS 'PostGIS tiger geocoder and reverse geocoder';
CREATE EXTENSION IF NOT EXISTS postgis_topology WITH SCHEMA topology;
COMMENT ON EXTENSION postgis_topology IS 'PostGIS topology spatial types and functions';
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA public;
COMMENT ON EXTENSION vector IS 'vector data type and ivfflat and hnsw access methods';
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
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    recipe_id uuid NOT NULL,
    dietary_restriction dietary_restriction NOT NULL
);
CREATE TABLE recipe_ingredient (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    recipe_id uuid NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    quantity double precision NOT NULL,
    units text NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE TABLE recipe_instruction (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    recipe_id uuid NOT NULL,
    user_id uuid NOT NULL,
    step_number integer NOT NULL,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE TABLE recipe_share_request (
    token text NOT NULL,
    to_user_id uuid,
    recipe_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone NOT NULL
);
CREATE TABLE recipe_tag (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
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
    ADD CONSTRAINT recipe_dietary_restriction_met_pkey PRIMARY KEY (id);
ALTER TABLE ONLY recipe_ingredient
    ADD CONSTRAINT recipe_ingredient_pkey PRIMARY KEY (id);
ALTER TABLE ONLY recipe_instruction
    ADD CONSTRAINT recipe_instruction_pkey PRIMARY KEY (id);
ALTER TABLE ONLY recipe
    ADD CONSTRAINT recipe_pkey PRIMARY KEY (id);
ALTER TABLE ONLY recipe_share_request
    ADD CONSTRAINT recipe_share_request_pkey PRIMARY KEY (token);
ALTER TABLE ONLY recipe_tag
    ADD CONSTRAINT recipe_tag_pkey PRIMARY KEY (id);
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
CREATE UNIQUE INDEX recipe_dietary_restriction_met_recipe_id_user_id_dietary_restri ON recipe_dietary_restriction_met USING btree (recipe_id, user_id, dietary_restriction);
CREATE UNIQUE INDEX recipe_ingredient_recipe_id_user_id_name_units ON recipe_ingredient USING btree (recipe_id, user_id, name, quantity, units);
CREATE INDEX recipe_ingredient_search_idx ON recipe_ingredient USING bm25 (id, name, recipe_id, user_id) WITH (key_field=id, text_fields='{"name": {"tokenizer": {"type": "default", "stemmer": "English"}}}');
CREATE UNIQUE INDEX recipe_instruction_recipe_id_user_id_step_number ON recipe_instruction USING btree (recipe_id, user_id, step_number);
CREATE INDEX recipe_search_idx ON recipe USING bm25 (name, author, cuisine, notes, id) WITH (key_field=id, text_fields='{"name": {"tokenizer": {"type": "default", "stemmer": "English"}}, "notes": {"tokenizer": {"type": "default", "stemmer": "English"}}}');
CREATE UNIQUE INDEX recipe_tag_recipe_id_user_id_tag ON recipe_tag USING btree (recipe_id, user_id, tag);
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
ALTER TABLE ONLY recipe_share_request
    ADD CONSTRAINT recipe_share_request_recipe_id_fkey FOREIGN KEY (recipe_id) REFERENCES recipe(id) ON DELETE CASCADE;
ALTER TABLE ONLY recipe_share_request
    ADD CONSTRAINT recipe_share_request_to_user_id_fkey FOREIGN KEY (to_user_id) REFERENCES "user"(id) ON DELETE CASCADE;
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
    ('20250827021238'),
    ('20250827022009'),
    ('20250831115304');
