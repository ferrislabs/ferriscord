-- Fix members where user_id was stored as oauth_sub instead of the real users.id.
-- This happened because create_guild used identity.id() (oauth_sub) as the owner's UserId.
UPDATE members
SET user_id = u.id
FROM users u
WHERE u.oauth_sub = members.user_id::text
  AND NOT EXISTS (SELECT 1 FROM users u2 WHERE u2.id = members.user_id);

-- Remove any remaining orphan/duplicate rows created by the bug before cleaning up.
DELETE FROM members m1
USING members m2
WHERE m1.ctid > m2.ctid
  AND m1.guild_id = m2.guild_id
  AND m1.user_id  = m2.user_id;

-- Remove any rows whose user_id still doesn't match a real user (truly orphaned).
DELETE FROM members
WHERE NOT EXISTS (SELECT 1 FROM users WHERE users.id = members.user_id);

-- Add unique constraint to prevent future duplicates.
ALTER TABLE members
    ADD CONSTRAINT members_guild_user_unique UNIQUE (guild_id, user_id);
