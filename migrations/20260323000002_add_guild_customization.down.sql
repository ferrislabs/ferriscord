ALTER TABLE guilds
    DROP COLUMN IF EXISTS icon_url,
    DROP COLUMN IF EXISTS banner_url,
    DROP COLUMN IF EXISTS banner_color;
