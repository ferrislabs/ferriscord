-- Add encryption metadata to messages
ALTER TABLE messages ADD COLUMN encrypted BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE messages ADD COLUMN encryption_version INT NOT NULL DEFAULT 0;
ALTER TABLE messages ADD COLUMN sender_key_generation INT;

-- Add encryption flag to attachments
ALTER TABLE attachments ADD COLUMN encrypted BOOLEAN NOT NULL DEFAULT FALSE;
