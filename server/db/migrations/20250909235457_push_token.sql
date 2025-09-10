-- migrate:up
ALTER TABLE "user" ADD COLUMN expo_push_token TEXT;

-- migrate:down
ALTER TABLE "user" DROP COLUMN expo_push_token;
