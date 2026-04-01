-- Add encryption metadata to messages
ALTER TABLE messages ADD COLUMN encrypted BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE messages ADD COLUMN encryption_version INT NOT NULL DEFAULT 0;
ALTER TABLE messages ADD COLUMN sender_key_generation INT;
ALTER TABLE messages ADD COLUMN sender_device_id UUID REFERENCES user_devices(id) ON DELETE SET NULL;
CREATE INDEX idx_messages_sender_device_id ON messages(sender_device_id);

-- Encrypted DM payloads must be stored per target device. A single encrypted DM
-- can therefore have multiple ciphertexts, one for each recipient device and
-- one for each additional device owned by the sender that should receive the
-- message for cross-device sync.
CREATE TABLE dm_message_device_payloads (
    message_id         UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    target_device_id   UUID NOT NULL REFERENCES user_devices(id) ON DELETE CASCADE,
    ciphertext         TEXT NOT NULL,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (message_id, target_device_id)
);
CREATE INDEX idx_dm_message_payloads_target_device
    ON dm_message_device_payloads(target_device_id, message_id);

-- Add encryption flag to attachments
ALTER TABLE attachments ADD COLUMN encrypted BOOLEAN NOT NULL DEFAULT FALSE;
