-- E2EE Key Infrastructure
-- User identity keys (Ed25519, one per user, long-lived)
CREATE TABLE user_identity_keys (
    user_id     UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    public_key  BYTEA NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Devices (one per browser/device session)
CREATE TABLE user_devices (
    id              UUID PRIMARY KEY,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_name     TEXT NOT NULL,
    public_key      BYTEA NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_seen_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_user_devices_user_id ON user_devices(user_id);

-- Signed pre-keys (X25519, rotated per device)
CREATE TABLE user_signed_prekeys (
    id          UUID PRIMARY KEY,
    device_id    UUID NOT NULL REFERENCES user_devices(id) ON DELETE CASCADE,
    public_key  BYTEA NOT NULL,
    signature   BYTEA NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(device_id)
);
CREATE INDEX idx_signed_prekeys_device ON user_signed_prekeys(device_id);

-- One-time pre-keys (X25519, consumed once, per device)
CREATE TABLE user_onetime_prekeys (
    id          UUID PRIMARY KEY,
    device_id    UUID NOT NULL REFERENCES user_devices(id) ON DELETE CASCADE,
    public_key  BYTEA NOT NULL,
    consumed    BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_otp_unconsumed ON user_onetime_prekeys(device_id, consumed) WHERE NOT consumed;

-- Encrypted private key backup (Argon2id-derived key)
CREATE TABLE user_key_backups (
    user_id         UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    encrypted_blob  BYTEA NOT NULL,
    salt            BYTEA NOT NULL,
    nonce           BYTEA NOT NULL,
    recovery_codes  BYTEA NOT NULL,
    version         INT NOT NULL DEFAULT 1,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Sender keys for guild channels, scoped to the sending device
CREATE TABLE channel_sender_keys (
    id              UUID PRIMARY KEY,
    channel_id      UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
    sender_user_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sender_device_id UUID NOT NULL REFERENCES user_devices(id) ON DELETE CASCADE,
    generation      INT NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(channel_id, sender_device_id, generation)
);
CREATE INDEX idx_sender_keys_channel ON channel_sender_keys(channel_id);
CREATE INDEX idx_sender_keys_sender_device ON channel_sender_keys(sender_device_id);

-- Sender key distributions (encrypted per recipient device)
CREATE TABLE sender_key_distributions (
    id                    UUID PRIMARY KEY,
    sender_key_id         UUID NOT NULL REFERENCES channel_sender_keys(id) ON DELETE CASCADE,
    recipient_device_id   UUID NOT NULL REFERENCES user_devices(id) ON DELETE CASCADE,
    encrypted_key         BYTEA NOT NULL,
    nonce                 BYTEA NOT NULL,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(sender_key_id, recipient_device_id)
);
CREATE INDEX idx_skd_recipient ON sender_key_distributions(recipient_device_id);

-- DM sessions (Double Ratchet state) must be tracked per local device and peer
-- device. A single channel can therefore have multiple active ratchets for the
-- same user account when that account is connected from multiple browsers.
CREATE TABLE dm_sessions (
    id                       UUID PRIMARY KEY,
    channel_id               UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
    owner_device_id          UUID NOT NULL REFERENCES user_devices(id) ON DELETE CASCADE,
    peer_device_id           UUID NOT NULL REFERENCES user_devices(id) ON DELETE CASCADE,
    peer_user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    encrypted_ratchet_state BYTEA NOT NULL,
    ephemeral_public_key    BYTEA NOT NULL,
    generation               INT NOT NULL DEFAULT 0,
    updated_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(channel_id, owner_device_id, peer_device_id)
);
CREATE INDEX idx_dm_sessions_channel ON dm_sessions(channel_id);
CREATE INDEX idx_dm_sessions_owner_device ON dm_sessions(owner_device_id);
CREATE INDEX idx_dm_sessions_peer_device ON dm_sessions(peer_device_id);
