-- migrate:up
CREATE TYPE user_privacy_preference AS ENUM ('public', 'private');
ALTER TABLE "user" ADD COLUMN privacy_preference user_privacy_preference NOT NULL DEFAULT 'public';

-- migrate:down
ALTER TABLE "user" DROP COLUMN privacy_preference;
DROP TYPE user_privacy_preference;
