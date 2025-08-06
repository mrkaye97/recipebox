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
    user_id uuid NOT NULL,
    recipe_id uuid NOT NULL,
    dietary_restriction public.dietary_restriction NOT NULL
);


--
-- Name: recipe_ingredient; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.recipe_ingredient (
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
    recipe_id uuid NOT NULL,
    user_id uuid NOT NULL,
    step_number integer NOT NULL,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: recipe_tag; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.recipe_tag (
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
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
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
-- Name: recipe_dietary_restriction_met recipe_dietary_restriction_met_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recipe_dietary_restriction_met
    ADD CONSTRAINT recipe_dietary_restriction_met_pkey PRIMARY KEY (recipe_id, user_id, dietary_restriction);


--
-- Name: recipe_ingredient recipe_ingredient_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recipe_ingredient
    ADD CONSTRAINT recipe_ingredient_pkey PRIMARY KEY (recipe_id, user_id, name, quantity, units);


--
-- Name: recipe_instruction recipe_instruction_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recipe_instruction
    ADD CONSTRAINT recipe_instruction_pkey PRIMARY KEY (recipe_id, user_id, step_number);


--
-- Name: recipe recipe_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recipe
    ADD CONSTRAINT recipe_pkey PRIMARY KEY (id);


--
-- Name: recipe_tag recipe_tag_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recipe_tag
    ADD CONSTRAINT recipe_tag_pkey PRIMARY KEY (recipe_id, user_id, tag);


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
    ('20250803211143');
