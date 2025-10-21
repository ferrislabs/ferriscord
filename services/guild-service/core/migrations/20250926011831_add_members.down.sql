-- Add down migration script here
DROP INDEX IF EXISTS idx_role_assignments_user_id;
DROP INDEX IF EXISTS idx_members_guild_id;
DROP TABLE IF EXISTS role_assignments;
DROP TABLE IF EXISTS members;
