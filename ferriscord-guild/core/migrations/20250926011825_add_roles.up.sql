-- Add up migration script here
CREATE TABLE roles (
    id          UUID PRIMARY KEY,      -- ULID
    guild_id    UUID NOT NULL REFERENCES guilds(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    position    INT NOT NULL DEFAULT 0,
    color       INT,
    permissions BIGINT NOT NULL,           -- bitflags
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_roles_guild_id ON roles(guild_id);
