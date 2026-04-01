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
    source_device_id   UUID REFERENCES user_devices(id) ON DELETE SET NULL,
    sync_kind          TEXT NOT NULL DEFAULT 'live',
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (message_id, target_device_id),
    CHECK (sync_kind IN ('live', 'history_sync'))
);
CREATE INDEX idx_dm_message_payloads_target_device
    ON dm_message_device_payloads(target_device_id, message_id);
CREATE INDEX idx_dm_message_payloads_source_device
    ON dm_message_device_payloads(source_device_id, message_id);

-- History sync jobs allow an already-authorized source device to re-encrypt
-- previously readable DM history for a newly linked target device.
CREATE TABLE dm_history_sync_jobs (
    id                UUID PRIMARY KEY,
    owner_user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    source_device_id  UUID NOT NULL REFERENCES user_devices(id) ON DELETE CASCADE,
    target_device_id  UUID NOT NULL REFERENCES user_devices(id) ON DELETE CASCADE,
    channel_id        UUID REFERENCES channels(id) ON DELETE CASCADE,
    status            TEXT NOT NULL DEFAULT 'pending',
    cursor_message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
    last_error        TEXT,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
    CHECK (source_device_id <> target_device_id)
);
CREATE INDEX idx_dm_history_sync_jobs_owner
    ON dm_history_sync_jobs(owner_user_id, created_at DESC);
CREATE INDEX idx_dm_history_sync_jobs_target
    ON dm_history_sync_jobs(target_device_id, status, created_at DESC);

-- Payloads uploaded as part of a history sync batch. They are separated from
-- the live payload table so the sync process can be resumed and audited before
-- being materialized into dm_message_device_payloads.
CREATE TABLE dm_history_sync_payloads (
    job_id            UUID NOT NULL REFERENCES dm_history_sync_jobs(id) ON DELETE CASCADE,
    message_id        UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    target_device_id  UUID NOT NULL REFERENCES user_devices(id) ON DELETE CASCADE,
    ciphertext        TEXT NOT NULL,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (job_id, message_id, target_device_id)
);
CREATE INDEX idx_dm_history_sync_payloads_target
    ON dm_history_sync_payloads(target_device_id, message_id);

-- Add encryption flag to attachments
ALTER TABLE attachments ADD COLUMN encrypted BOOLEAN NOT NULL DEFAULT FALSE;
