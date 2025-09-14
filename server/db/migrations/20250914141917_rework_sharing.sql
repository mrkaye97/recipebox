-- migrate:up
ALTER TABLE recipe_share_request DROP COLUMN token;

-- migrate:down
ALTER TABLE recipe_share_request ADD COLUMN token text NOT NULL DEFAULT '';
