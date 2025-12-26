-- Add up migration script here
CREATE TABLE members (
    id          UUID PRIMARY KEY,
    user_id     UUID NOT NULL,
    guild_id    UUID NOT NULL REFERENCES guilds(id) ON DELETE CASCADE,
    joined_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    nick        TEXT,
    permissions  BIGINT NOT NULL DEFAULT 0
);

CREATE TABLE role_assignments (
    role_id     UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    member_id   UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, member_id)
);

CREATE INDEX idx_members_guild_id ON members(guild_id);
CREATE INDEX idx_role_assignments_member_id ON role_assignments(member_id);
