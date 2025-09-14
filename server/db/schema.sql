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
-- Name: meal; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.meal AS ENUM (
    'breakfast',
    'lunch',
    'dinner',
    'other'
);


--
-- Name: push_permission_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.push_permission_status AS ENUM (
    'none',
    'accepted',
    'rejected'
);


--
-- Name: recipe_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.recipe_type AS ENUM (
    'starter',
    'main',
    'salad',
    'dessert',
    'snack',
    'cocktail',
    'condiment',
    'other'
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
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    type public.recipe_type DEFAULT 'main'::public.recipe_type NOT NULL,
    meal public.meal DEFAULT 'dinner'::public.meal NOT NULL,
    parent_recipe_id uuid
);


--
-- Name: recipe_cooking_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.recipe_cooking_log (
    user_id uuid NOT NULL,
    recipe_id uuid NOT NULL,
    cooked_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: recipe_dietary_restriction_met; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.recipe_dietary_restriction_met (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    recipe_id uuid NOT NULL,
    dietary_restriction public.dietary_restriction NOT NULL
);


--
-- Name: recipe_ingredient; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.recipe_ingredient (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    recipe_id uuid NOT NULL,
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
    step_number integer NOT NULL,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: recipe_recommendation; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.recipe_recommendation (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    recipe_id uuid NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: recipe_share_request; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.recipe_share_request (
    to_user_id uuid NOT NULL,
    recipe_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone NOT NULL
);


--
-- Name: recipe_tag; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.recipe_tag (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
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
    privacy_preference public.user_privacy_preference DEFAULT 'public'::public.user_privacy_preference NOT NULL,
    expo_push_token text,
    push_permission public.push_permission_status DEFAULT 'none'::public.push_permission_status NOT NULL,
    CONSTRAINT check_push_token_set_if_permission_accepted CHECK ((((push_permission = 'accepted'::public.push_permission_status) AND (expo_push_token IS NOT NULL)) OR ((push_permission = ANY (ARRAY['none'::public.push_permission_status, 'rejected'::public.push_permission_status])) AND (expo_push_token IS NULL))))
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
-- Name: friendship friendship_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.friendship
    ADD CONSTRAINT friendship_pkey PRIMARY KEY (user_id, friend_user_id);


--
-- Name: recipe_cooking_log recipe_cooking_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recipe_cooking_log
    ADD CONSTRAINT recipe_cooking_log_pkey PRIMARY KEY (user_id, cooked_at, recipe_id);


--
-- Name: recipe_dietary_restriction_met recipe_dietary_restriction_met_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recipe_dietary_restriction_met
    ADD CONSTRAINT recipe_dietary_restriction_met_pkey PRIMARY KEY (recipe_id, dietary_restriction);


--
-- Name: recipe_ingredient recipe_ingredient_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recipe_ingredient
    ADD CONSTRAINT recipe_ingredient_pkey PRIMARY KEY (recipe_id, name, quantity, units);


--
-- Name: recipe_instruction recipe_instruction_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recipe_instruction
    ADD CONSTRAINT recipe_instruction_pkey PRIMARY KEY (recipe_id, step_number);


--
-- Name: recipe recipe_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recipe
    ADD CONSTRAINT recipe_pkey PRIMARY KEY (id);


--
-- Name: recipe_recommendation recipe_recommendation_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recipe_recommendation
    ADD CONSTRAINT recipe_recommendation_pkey PRIMARY KEY (id);


--
-- Name: recipe_share_request recipe_share_request_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recipe_share_request
    ADD CONSTRAINT recipe_share_request_pkey PRIMARY KEY (recipe_id, to_user_id);


--
-- Name: recipe_tag recipe_tag_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recipe_tag
    ADD CONSTRAINT recipe_tag_pkey PRIMARY KEY (recipe_id, tag);


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
-- Name: idx_recipe_recommendation_user_recipe_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_recipe_recommendation_user_recipe_created_at ON public.recipe_recommendation USING btree (user_id, recipe_id, created_at);


--
-- Name: idx_recipe_user_id_parent_recipe_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_recipe_user_id_parent_recipe_id ON public.recipe USING btree (user_id, parent_recipe_id);


--
-- Name: idx_users_name_email_trgm; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_name_email_trgm ON public."user" USING gin ((((name || ' '::text) || email)) public.gin_trgm_ops);


--
-- Name: recipe_ingredient_search_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX recipe_ingredient_search_idx ON public.recipe_ingredient USING bm25 (id, name, recipe_id) WITH (key_field=id, text_fields='{"name": {"tokenizer": {"type": "default", "stemmer": "English"}}}');


--
-- Name: recipe_search_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX recipe_search_idx ON public.recipe USING bm25 (name, author, cuisine, notes, id) WITH (key_field=id, text_fields='{"name": {"tokenizer": {"type": "default", "stemmer": "English"}}, "notes": {"tokenizer": {"type": "default", "stemmer": "English"}}}');


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
-- Name: recipe_cooking_log recipe_cooking_log_recipe_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recipe_cooking_log
    ADD CONSTRAINT recipe_cooking_log_recipe_id_fkey FOREIGN KEY (recipe_id) REFERENCES public.recipe(id) ON DELETE CASCADE;


--
-- Name: recipe_cooking_log recipe_cooking_log_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recipe_cooking_log
    ADD CONSTRAINT recipe_cooking_log_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."user"(id) ON DELETE CASCADE;


--
-- Name: recipe_dietary_restriction_met recipe_dietary_restriction_met_recipe_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recipe_dietary_restriction_met
    ADD CONSTRAINT recipe_dietary_restriction_met_recipe_id_fkey FOREIGN KEY (recipe_id) REFERENCES public.recipe(id) ON DELETE CASCADE;


--
-- Name: recipe_ingredient recipe_ingredient_recipe_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recipe_ingredient
    ADD CONSTRAINT recipe_ingredient_recipe_id_fkey FOREIGN KEY (recipe_id) REFERENCES public.recipe(id) ON DELETE CASCADE;


--
-- Name: recipe_instruction recipe_instruction_recipe_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recipe_instruction
    ADD CONSTRAINT recipe_instruction_recipe_id_fkey FOREIGN KEY (recipe_id) REFERENCES public.recipe(id) ON DELETE CASCADE;


--
-- Name: recipe recipe_parent_recipe_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recipe
    ADD CONSTRAINT recipe_parent_recipe_id_fkey FOREIGN KEY (parent_recipe_id) REFERENCES public.recipe(id) ON DELETE SET NULL;


--
-- Name: recipe_recommendation recipe_recommendation_recipe_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recipe_recommendation
    ADD CONSTRAINT recipe_recommendation_recipe_id_fkey FOREIGN KEY (recipe_id) REFERENCES public.recipe(id) ON DELETE CASCADE;


--
-- Name: recipe_recommendation recipe_recommendation_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recipe_recommendation
    ADD CONSTRAINT recipe_recommendation_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."user"(id) ON DELETE CASCADE;


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
    ('20250831115304'),
    ('20250831115922'),
    ('20250901022533'),
    ('20250904004250'),
    ('20250904214144'),
    ('20250906190105'),
    ('20250907142330'),
    ('20250907193907'),
    ('20250907205340'),
    ('20250909235457'),
    ('20250912212801'),
    ('20250914141917');
