-- migrate:up
CREATE TYPE push_permission_status AS ENUM ('none', 'accepted', 'rejected');
ALTER TABLE "user" ADD COLUMN push_permission push_permission_status NOT NULL DEFAULT 'none';

UPDATE "user"
SET push_permission = 'accepted'
WHERE expo_push_token IS NOT NULL;

-- migrate:down
ALTER TABLE "user" DROP COLUMN push_permission;
DROP TYPE push_permission_status;
