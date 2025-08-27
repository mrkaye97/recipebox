-- migrate:up
CREATE TYPE friendship_status AS ENUM ('pending', 'accepted');
CREATE TABLE friendship (
    user_id UUID NOT NULL,
    friend_user_id UUID NOT NULL,
    status friendship_status NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, friend_user_id),
    FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE,
    FOREIGN KEY (friend_user_id) REFERENCES "user"(id) ON DELETE CASCADE
);
-- migrate:down
DROP TABLE friendship;
DROP TYPE friendship_status;

