-- migrate:up
ALTER TABLE recipe_share_request DROP COLUMN token;
ALTER TABLE recipe_share_request ADD CONSTRAINT recipe_share_request_pkey PRIMARY KEY (recipe_id, to_user_id);

-- migrate:down
ALTER TABLE recipe_share_request ADD COLUMN token text NOT NULL DEFAULT '';
ALTER TABLE recipe_share_request DROP CONSTRAINT recipe_share_request_pkey;
