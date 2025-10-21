-- Add up migration script here
CREATE TABLE users (
    id UUID PRIMARY KEY,
    oauth_sub TEXT NOT NULL UNIQUE,
    username TEXT NOT NULL UNIQUE,
    display_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_users_sub ON users(oauth_sub);
