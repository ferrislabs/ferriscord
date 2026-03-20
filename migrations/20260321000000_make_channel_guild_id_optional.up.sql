ALTER TABLE channels
    DROP CONSTRAINT channels_guild_id_fkey,
    ALTER COLUMN guild_id DROP NOT NULL,
    ADD CONSTRAINT channels_guild_id_fkey
        FOREIGN KEY (guild_id) REFERENCES guilds(id) ON DELETE CASCADE;
