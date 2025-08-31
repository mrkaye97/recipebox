SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: pg_ivm; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_ivm WITH SCHEMA pg_catalog;


--
-- Name: EXTENSION pg_ivm; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pg_ivm IS 'incremental view maintenance on PostgreSQL';


--
-- Name: paradedb; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA paradedb;


--
-- Name: tiger; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA tiger;


--
-- Name: tiger_data; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA tiger_data;


--
-- Name: topology; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA topology;


--
-- Name: SCHEMA topology; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA topology IS 'PostGIS Topology schema';


--
-- Name: fuzzystrmatch; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS fuzzystrmatch WITH SCHEMA public;


--
-- Name: EXTENSION fuzzystrmatch; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION fuzzystrmatch IS 'determine similarities and distance between strings';


--
-- Name: pg_search; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_search WITH SCHEMA paradedb;


--
-- Name: EXTENSION pg_search; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pg_search IS 'pg_search: Full text search for PostgreSQL using BM25';


--
-- Name: pg_trgm; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;


--
-- Name: EXTENSION pg_trgm; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pg_trgm IS 'text similarity measurement and index searching based on trigrams';


--
-- Name: postgis; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA public;


--
-- Name: EXTENSION postgis; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION postgis IS 'PostGIS geometry and geography spatial types and functions';


--
-- Name: postgis_tiger_geocoder; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS postgis_tiger_geocoder WITH SCHEMA tiger;


--
-- Name: EXTENSION postgis_tiger_geocoder; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION postgis_tiger_geocoder IS 'PostGIS tiger geocoder and reverse geocoder';


--
-- Name: postgis_topology; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS postgis_topology WITH SCHEMA topology;


--
-- Name: EXTENSION postgis_topology; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION postgis_topology IS 'PostGIS topology spatial types and functions';


--
-- Name: vector; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA public;


--
-- Name: EXTENSION vector; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION vector IS 'vector data type and ivfflat and hnsw access methods';


--
-- Name: dietary_restriction; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.dietary_restriction AS ENUM (
    'gluten_free',
    'dairy_free',
    'nut_free',
    'vegan',
    'vegetarian',
    'pescatarian'
);


--
-- Name: friendship_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.friendship_status AS ENUM (
    'pending',
    'accepted'
);


--
-- Name: user_privacy_preference; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.user_privacy_preference AS ENUM (
    'public',
    'private'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: cooking_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cooking_history (
    recipe_id uuid NOT NULL,
    user_id uuid NOT NULL,
    made_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: friendship; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.friendship (
    user_id uuid NOT NULL,
    friend_user_id uuid NOT NULL,
    status public.friendship_status NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: recipe; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.recipe (
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


--
-- Name: recipe_dietary_restriction_met; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.recipe_dietary_restriction_met (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    recipe_id uuid NOT NULL,
    dietary_restriction public.dietary_restriction NOT NULL
);


--
-- Name: recipe_ingredient; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.recipe_ingredient (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    recipe_id uuid NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    quantity double precision NOT NULL,
    units text NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: recipe_instruction; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.recipe_instruction (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    recipe_id uuid NOT NULL,
    user_id uuid NOT NULL,
    step_number integer NOT NULL,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: recipe_share_request; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.recipe_share_request (
    token text NOT NULL,
    to_user_id uuid,
    recipe_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone NOT NULL
);


--
-- Name: recipe_tag; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.recipe_tag (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    recipe_id uuid NOT NULL,
    tag text NOT NULL
);


--
-- Name: schema_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.schema_migrations (
    version character varying(128) NOT NULL
);


--
-- Name: user; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."user" (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email text NOT NULL,
    name text NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    privacy_preference public.user_privacy_preference DEFAULT 'public'::public.user_privacy_preference NOT NULL
);


--
-- Name: user_password; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_password (
    user_id uuid NOT NULL,
    password_hash text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: cooking_history cooking_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cooking_history
    ADD CONSTRAINT cooking_history_pkey PRIMARY KEY (user_id, made_at, recipe_id);


--
-- Name: friendship friendship_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.friendship
    ADD CONSTRAINT friendship_pkey PRIMARY KEY (user_id, friend_user_id);


--
-- Name: recipe_dietary_restriction_met recipe_dietary_restriction_met_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recipe_dietary_restriction_met
    ADD CONSTRAINT recipe_dietary_restriction_met_pkey PRIMARY KEY (id);


--
-- Name: recipe_ingredient recipe_ingredient_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recipe_ingredient
    ADD CONSTRAINT recipe_ingredient_pkey PRIMARY KEY (id);


--
-- Name: recipe_instruction recipe_instruction_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recipe_instruction
    ADD CONSTRAINT recipe_instruction_pkey PRIMARY KEY (id);


--
-- Name: recipe recipe_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recipe
    ADD CONSTRAINT recipe_pkey PRIMARY KEY (id);


--
-- Name: recipe_share_request recipe_share_request_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recipe_share_request
    ADD CONSTRAINT recipe_share_request_pkey PRIMARY KEY (token);


--
-- Name: recipe_tag recipe_tag_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recipe_tag
    ADD CONSTRAINT recipe_tag_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: user user_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user_email_key UNIQUE (email);


--
-- Name: user_password user_password_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_password
    ADD CONSTRAINT user_password_pkey PRIMARY KEY (user_id);


--
-- Name: user user_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user_pkey PRIMARY KEY (id);


--
-- Name: idx_recipe_last_made_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_recipe_last_made_at ON public.recipe USING btree (user_id, last_made_at);


--
-- Name: idx_recipe_time_estimate; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_recipe_time_estimate ON public.recipe USING btree (user_id, time_estimate_minutes);


--
-- Name: idx_recipe_updated_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_recipe_updated_at ON public.recipe USING btree (user_id, updated_at);


--
-- Name: idx_recipe_user_name; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_recipe_user_name ON public.recipe USING btree (user_id, name);


--
-- Name: idx_users_name_email_trgm; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_name_email_trgm ON public."user" USING gin ((((name || ' '::text) || email)) public.gin_trgm_ops);


--
-- Name: recipe_dietary_restriction_met_recipe_id_user_id_dietary_restri; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX recipe_dietary_restriction_met_recipe_id_user_id_dietary_restri ON public.recipe_dietary_restriction_met USING btree (recipe_id, user_id, dietary_restriction);


--
-- Name: recipe_ingredient_recipe_id_user_id_name_units; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX recipe_ingredient_recipe_id_user_id_name_units ON public.recipe_ingredient USING btree (recipe_id, user_id, name, quantity, units);


--
-- Name: recipe_ingredient_search_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX recipe_ingredient_search_idx ON public.recipe_ingredient USING bm25 (id, name, recipe_id, user_id) WITH (key_field=id, text_fields='{"name": {"tokenizer": {"type": "default", "stemmer": "English"}}}');


--
-- Name: recipe_instruction_recipe_id_user_id_step_number; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX recipe_instruction_recipe_id_user_id_step_number ON public.recipe_instruction USING btree (recipe_id, user_id, step_number);


--
-- Name: recipe_search_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX recipe_search_idx ON public.recipe USING bm25 (name, author, cuisine, notes, id) WITH (key_field=id, text_fields='{"name": {"tokenizer": {"type": "default", "stemmer": "English"}}, "notes": {"tokenizer": {"type": "default", "stemmer": "English"}}}');


--
-- Name: recipe_tag_recipe_id_user_id_tag; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX recipe_tag_recipe_id_user_id_tag ON public.recipe_tag USING btree (recipe_id, user_id, tag);


--
-- Name: cooking_history cooking_history_recipe_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cooking_history
    ADD CONSTRAINT cooking_history_recipe_id_fkey FOREIGN KEY (recipe_id) REFERENCES public.recipe(id) ON DELETE CASCADE;


--
-- Name: cooking_history cooking_history_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cooking_history
    ADD CONSTRAINT cooking_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."user"(id) ON DELETE CASCADE;


--
-- Name: friendship friendship_friend_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.friendship
    ADD CONSTRAINT friendship_friend_user_id_fkey FOREIGN KEY (friend_user_id) REFERENCES public."user"(id) ON DELETE CASCADE;


--
-- Name: friendship friendship_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.friendship
    ADD CONSTRAINT friendship_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."user"(id) ON DELETE CASCADE;


--
-- Name: recipe_dietary_restriction_met recipe_dietary_restriction_met_recipe_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recipe_dietary_restriction_met
    ADD CONSTRAINT recipe_dietary_restriction_met_recipe_id_fkey FOREIGN KEY (recipe_id) REFERENCES public.recipe(id) ON DELETE CASCADE;


--
-- Name: recipe_dietary_restriction_met recipe_dietary_restriction_met_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recipe_dietary_restriction_met
    ADD CONSTRAINT recipe_dietary_restriction_met_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."user"(id) ON DELETE CASCADE;


--
-- Name: recipe_ingredient recipe_ingredient_recipe_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recipe_ingredient
    ADD CONSTRAINT recipe_ingredient_recipe_id_fkey FOREIGN KEY (recipe_id) REFERENCES public.recipe(id) ON DELETE CASCADE;


--
-- Name: recipe_ingredient recipe_ingredient_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recipe_ingredient
    ADD CONSTRAINT recipe_ingredient_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."user"(id) ON DELETE CASCADE;


--
-- Name: recipe_instruction recipe_instruction_recipe_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recipe_instruction
    ADD CONSTRAINT recipe_instruction_recipe_id_fkey FOREIGN KEY (recipe_id) REFERENCES public.recipe(id) ON DELETE CASCADE;


--
-- Name: recipe_instruction recipe_instruction_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recipe_instruction
    ADD CONSTRAINT recipe_instruction_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."user"(id) ON DELETE CASCADE;


--
-- Name: recipe_share_request recipe_share_request_recipe_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recipe_share_request
    ADD CONSTRAINT recipe_share_request_recipe_id_fkey FOREIGN KEY (recipe_id) REFERENCES public.recipe(id) ON DELETE CASCADE;


--
-- Name: recipe_share_request recipe_share_request_to_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recipe_share_request
    ADD CONSTRAINT recipe_share_request_to_user_id_fkey FOREIGN KEY (to_user_id) REFERENCES public."user"(id) ON DELETE CASCADE;


--
-- Name: recipe_tag recipe_tag_recipe_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recipe_tag
    ADD CONSTRAINT recipe_tag_recipe_id_fkey FOREIGN KEY (recipe_id) REFERENCES public.recipe(id) ON DELETE CASCADE;


--
-- Name: recipe_tag recipe_tag_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recipe_tag
    ADD CONSTRAINT recipe_tag_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."user"(id) ON DELETE CASCADE;


--
-- Name: recipe recipe_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recipe
    ADD CONSTRAINT recipe_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."user"(id) ON DELETE CASCADE;


--
-- Name: user_password user_password_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_password
    ADD CONSTRAINT user_password_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."user"(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--


--
-- Dbmate schema migrations
--

INSERT INTO public.schema_migrations (version) VALUES
    ('20250803211143'),
    ('20250827005941'),
    ('20250827021238'),
    ('20250827022009'),
    ('20250831115304');
