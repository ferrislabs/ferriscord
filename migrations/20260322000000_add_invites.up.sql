CREATE TABLE invites (
    id          UUID        PRIMARY KEY,
    guild_id    UUID        NOT NULL REFERENCES guilds(id) ON DELETE CASCADE,
    code        TEXT        NOT NULL UNIQUE,
    creator_sub TEXT        NOT NULL,
    expires_at  TIMESTAMPTZ,
    max_uses    INT,
    uses        INT         NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_invites_guild_id ON invites(guild_id);
CREATE INDEX idx_invites_code     ON invites(code);
