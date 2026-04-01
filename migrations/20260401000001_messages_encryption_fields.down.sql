ALTER TABLE attachments DROP COLUMN IF EXISTS encrypted;
ALTER TABLE messages DROP COLUMN IF EXISTS sender_key_generation;
ALTER TABLE messages DROP COLUMN IF EXISTS encryption_version;
ALTER TABLE messages DROP COLUMN IF EXISTS encrypted;
