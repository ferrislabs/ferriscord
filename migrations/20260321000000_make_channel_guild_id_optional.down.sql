-- DM channels (guild_id IS NULL) will be lost on rollback
DELETE FROM channels WHERE guild_id IS NULL;

ALTER TABLE channels
    DROP CONSTRAINT channels_guild_id_fkey,
    ALTER COLUMN guild_id SET NOT NULL,
    ADD CONSTRAINT channels_guild_id_fkey
        FOREIGN KEY (guild_id) REFERENCES guilds(id) ON DELETE CASCADE;
