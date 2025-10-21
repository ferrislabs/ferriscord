-- Add down migration script here
DROP INDEX IF EXISTS idx_roles_guild_id;
DROP TABLE IF EXISTS roles;
