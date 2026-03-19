CREATE TABLE channels (
    id UUID PRIMARY KEY,
    kind SMALLINT NOT NULL,
    guild_id UUID NOT NULL REFERENCES guilds(id) ON DELETE CASCADE,
    position INT NOT NULL DEFAULT 0,
    name TEXT NOT NULL,
    topic TEXT,
    nsfw BOOLEAN NOT NULL DEFAULT FALSE,
    last_message_id UUID,
    rate_limit_per_user INT NOT NULL DEFAULT 0,
    parent_id UUID REFERENCES channels(id) ON DELETE SET NULL,
    last_pin_timestamp TIMESTAMPTZ,
    bitrate INT,
    user_limit INT,
    rtc_region TEXT,
    default_auto_archive_duration INT,
    flags INT NOT NULL DEFAULT 0,
    permission_overwrites JSONB NOT NULL DEFAULT '[]',
    available_tags JSONB NOT NULL DEFAULT '[]',
    default_reaction_emoji JSONB,
    default_thread_rate_limit_per_user INT NOT NULL DEFAULT 0,
    default_sort_order SMALLINT,
    default_forum_layout SMALLINT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_channels_guild_id ON channels(guild_id);
CREATE INDEX idx_channels_parent_id ON channels(parent_id);
CREATE INDEX idx_channels_position ON channels(guild_id, position);
