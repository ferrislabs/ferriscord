ALTER TABLE attachments DROP COLUMN IF EXISTS encrypted;
DROP INDEX IF EXISTS idx_dm_message_payloads_target_device;
DROP TABLE IF EXISTS dm_message_device_payloads;
DROP INDEX IF EXISTS idx_messages_sender_device_id;
ALTER TABLE messages DROP COLUMN IF EXISTS sender_device_id;
ALTER TABLE messages DROP COLUMN IF EXISTS sender_key_generation;
ALTER TABLE messages DROP COLUMN IF EXISTS encryption_version;
ALTER TABLE messages DROP COLUMN IF EXISTS encrypted;
