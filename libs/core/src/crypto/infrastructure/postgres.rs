use chrono::{DateTime, Utc};
use ferriscord_entities::crypto::{
    DeviceInfo, DmSessionInfo, IdentityKeyInfo, KeyBackup, KeyBundle, SenderKeyDistribution,
};
use sqlx::PgPool;
use tracing::error;
use uuid::Uuid;

use crate::crypto::domain::ports::{CryptoError, CryptoKeyRepository};

#[derive(Clone)]
pub struct PostgresCryptoKeyRepository {
    pool: PgPool,
}

impl PostgresCryptoKeyRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }
}

// ─── Row types ───────────────────────────────────────────────────────────────

#[derive(sqlx::FromRow)]
struct IdentityKeyRow {
    user_id: Uuid,
    public_key: Vec<u8>,
    created_at: DateTime<Utc>,
}

#[derive(sqlx::FromRow)]
struct DeviceRow {
    id: Uuid,
    device_name: String,
    public_key: Vec<u8>,
    created_at: DateTime<Utc>,
    last_seen_at: DateTime<Utc>,
}

#[derive(sqlx::FromRow)]
struct KeyBundleRow {
    identity_key: Vec<u8>,
    signed_prekey: Vec<u8>,
    signed_prekey_signature: Vec<u8>,
}

#[derive(sqlx::FromRow)]
struct OtpRow {
    id: Uuid,
    public_key: Vec<u8>,
}

#[derive(sqlx::FromRow)]
struct KeyBackupRow {
    encrypted_blob: Vec<u8>,
    salt: Vec<u8>,
    nonce: Vec<u8>,
    recovery_codes: Vec<u8>,
    version: i32,
}

#[derive(sqlx::FromRow)]
struct SenderKeyDistRow {
    sender_key_id: Uuid,
    sender_user_id: Uuid,
    channel_id: Uuid,
    generation: i32,
    encrypted_key: Vec<u8>,
    nonce: Vec<u8>,
}

#[derive(sqlx::FromRow)]
struct DmSessionRow {
    id: Uuid,
    channel_id: Uuid,
    device_id: Uuid,
    encrypted_ratchet_state: Vec<u8>,
    ephemeral_public_key: Vec<u8>,
    generation: i32,
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

fn map_err(e: sqlx::Error) -> CryptoError {
    error!("crypto db error: {}", e);
    CryptoError::Internal {
        message: e.to_string(),
    }
}

// ─── Implementation ──────────────────────────────────────────────────────────

impl CryptoKeyRepository for PostgresCryptoKeyRepository {
    // ── Identity Keys ────────────────────────────────────────────────────

    async fn upsert_identity_key(
        &self,
        user_id: Uuid,
        public_key: Vec<u8>,
    ) -> Result<(), CryptoError> {
        sqlx::query(
            r#"
            INSERT INTO user_identity_keys (user_id, public_key)
            VALUES ($1, $2)
            ON CONFLICT (user_id) DO UPDATE SET public_key = $2
            "#,
        )
        .bind(user_id)
        .bind(&public_key)
        .execute(&self.pool)
        .await
        .map_err(map_err)?;
        Ok(())
    }

    async fn get_identity_key(&self, user_id: Uuid) -> Result<IdentityKeyInfo, CryptoError> {
        let row = sqlx::query_as::<_, IdentityKeyRow>(
            "SELECT user_id, public_key, created_at FROM user_identity_keys WHERE user_id = $1",
        )
        .bind(user_id)
        .fetch_optional(&self.pool)
        .await
        .map_err(map_err)?
        .ok_or(CryptoError::NotFound)?;

        Ok(IdentityKeyInfo {
            user_id: row.user_id,
            public_key: row.public_key,
            created_at: row.created_at,
        })
    }

    // ── Devices ──────────────────────────────────────────────────────────

    async fn register_device(
        &self,
        user_id: Uuid,
        device_name: String,
        public_key: Vec<u8>,
    ) -> Result<DeviceInfo, CryptoError> {
        let id = Uuid::now_v7();
        let now = Utc::now();

        sqlx::query(
            r#"
            INSERT INTO user_devices (id, user_id, device_name, public_key, created_at, last_seen_at)
            VALUES ($1, $2, $3, $4, $5, $5)
            "#,
        )
        .bind(id)
        .bind(user_id)
        .bind(&device_name)
        .bind(&public_key)
        .bind(now)
        .execute(&self.pool)
        .await
        .map_err(map_err)?;

        Ok(DeviceInfo {
            id,
            device_name,
            public_key,
            created_at: now,
            last_seen_at: now,
        })
    }

    async fn list_devices(&self, user_id: Uuid) -> Result<Vec<DeviceInfo>, CryptoError> {
        let rows = sqlx::query_as::<_, DeviceRow>(
            "SELECT id, device_name, public_key, created_at, last_seen_at FROM user_devices WHERE user_id = $1 ORDER BY created_at ASC",
        )
        .bind(user_id)
        .fetch_all(&self.pool)
        .await
        .map_err(map_err)?;

        Ok(rows
            .into_iter()
            .map(|r| DeviceInfo {
                id: r.id,
                device_name: r.device_name,
                public_key: r.public_key,
                created_at: r.created_at,
                last_seen_at: r.last_seen_at,
            })
            .collect())
    }

    async fn delete_device(&self, user_id: Uuid, device_id: Uuid) -> Result<bool, CryptoError> {
        let result = sqlx::query(
            "DELETE FROM user_devices WHERE id = $1 AND user_id = $2",
        )
        .bind(device_id)
        .bind(user_id)
        .execute(&self.pool)
        .await
        .map_err(map_err)?;
        Ok(result.rows_affected() > 0)
    }

    async fn touch_device(&self, device_id: Uuid) -> Result<(), CryptoError> {
        sqlx::query("UPDATE user_devices SET last_seen_at = now() WHERE id = $1")
            .bind(device_id)
            .execute(&self.pool)
            .await
            .map_err(map_err)?;
        Ok(())
    }

    // ── Signed Pre-Keys ──────────────────────────────────────────────────

    async fn upsert_signed_prekey(
        &self,
        user_id: Uuid,
        public_key: Vec<u8>,
        signature: Vec<u8>,
    ) -> Result<Uuid, CryptoError> {
        let id = Uuid::now_v7();

        // Delete old signed pre-keys for this user, keep only the latest
        let mut tx = self.pool.begin().await.map_err(map_err)?;

        sqlx::query("DELETE FROM user_signed_prekeys WHERE user_id = $1")
            .bind(user_id)
            .execute(&mut *tx)
            .await
            .map_err(map_err)?;

        sqlx::query(
            r#"
            INSERT INTO user_signed_prekeys (id, user_id, public_key, signature, created_at)
            VALUES ($1, $2, $3, $4, now())
            "#,
        )
        .bind(id)
        .bind(user_id)
        .bind(&public_key)
        .bind(&signature)
        .execute(&mut *tx)
        .await
        .map_err(map_err)?;

        tx.commit().await.map_err(map_err)?;
        Ok(id)
    }

    // ── One-Time Pre-Keys ────────────────────────────────────────────────

    async fn upload_onetime_prekeys(
        &self,
        user_id: Uuid,
        prekeys: Vec<Vec<u8>>,
    ) -> Result<Vec<Uuid>, CryptoError> {
        let mut tx = self.pool.begin().await.map_err(map_err)?;
        let mut ids = Vec::with_capacity(prekeys.len());

        for pk in prekeys {
            let id = Uuid::now_v7();
            sqlx::query(
                r#"
                INSERT INTO user_onetime_prekeys (id, user_id, public_key, consumed, created_at)
                VALUES ($1, $2, $3, false, now())
                "#,
            )
            .bind(id)
            .bind(user_id)
            .bind(&pk)
            .execute(&mut *tx)
            .await
            .map_err(map_err)?;
            ids.push(id);
        }

        tx.commit().await.map_err(map_err)?;
        Ok(ids)
    }

    async fn count_available_onetime_prekeys(&self, user_id: Uuid) -> Result<u32, CryptoError> {
        let row: (i64,) = sqlx::query_as(
            "SELECT COUNT(*) FROM user_onetime_prekeys WHERE user_id = $1 AND NOT consumed",
        )
        .bind(user_id)
        .fetch_one(&self.pool)
        .await
        .map_err(map_err)?;
        Ok(row.0 as u32)
    }

    // ── Key Bundle ───────────────────────────────────────────────────────

    async fn fetch_key_bundle(&self, user_id: Uuid) -> Result<KeyBundle, CryptoError> {
        // Fetch identity key + latest signed pre-key
        let bundle = sqlx::query_as::<_, KeyBundleRow>(
            r#"
            SELECT
                ik.public_key AS identity_key,
                sp.public_key AS signed_prekey,
                sp.signature  AS signed_prekey_signature
            FROM user_identity_keys ik
            JOIN user_signed_prekeys sp ON sp.user_id = ik.user_id
            WHERE ik.user_id = $1
            ORDER BY sp.created_at DESC
            LIMIT 1
            "#,
        )
        .bind(user_id)
        .fetch_optional(&self.pool)
        .await
        .map_err(map_err)?
        .ok_or(CryptoError::NotFound)?;

        // Try to consume one OTP atomically
        let otp = sqlx::query_as::<_, OtpRow>(
            r#"
            UPDATE user_onetime_prekeys
            SET consumed = true
            WHERE id = (
                SELECT id FROM user_onetime_prekeys
                WHERE user_id = $1 AND NOT consumed
                ORDER BY created_at ASC
                LIMIT 1
                FOR UPDATE SKIP LOCKED
            )
            RETURNING id, public_key
            "#,
        )
        .bind(user_id)
        .fetch_optional(&self.pool)
        .await
        .map_err(map_err)?;

        Ok(KeyBundle {
            user_id,
            identity_key: bundle.identity_key,
            signed_prekey: bundle.signed_prekey,
            signed_prekey_signature: bundle.signed_prekey_signature,
            onetime_prekey: otp.as_ref().map(|o| o.public_key.clone()),
            onetime_prekey_id: otp.map(|o| o.id),
        })
    }

    // ── Key Backup ───────────────────────────────────────────────────────

    async fn upsert_key_backup(
        &self,
        user_id: Uuid,
        encrypted_blob: Vec<u8>,
        salt: Vec<u8>,
        nonce: Vec<u8>,
        recovery_codes: Vec<u8>,
    ) -> Result<(), CryptoError> {
        sqlx::query(
            r#"
            INSERT INTO user_key_backups (user_id, encrypted_blob, salt, nonce, recovery_codes, version, updated_at)
            VALUES ($1, $2, $3, $4, $5, 1, now())
            ON CONFLICT (user_id) DO UPDATE SET
                encrypted_blob = $2,
                salt = $3,
                nonce = $4,
                recovery_codes = $5,
                version = user_key_backups.version + 1,
                updated_at = now()
            "#,
        )
        .bind(user_id)
        .bind(&encrypted_blob)
        .bind(&salt)
        .bind(&nonce)
        .bind(&recovery_codes)
        .execute(&self.pool)
        .await
        .map_err(map_err)?;
        Ok(())
    }

    async fn get_key_backup(&self, user_id: Uuid) -> Result<KeyBackup, CryptoError> {
        let row = sqlx::query_as::<_, KeyBackupRow>(
            "SELECT encrypted_blob, salt, nonce, recovery_codes, version FROM user_key_backups WHERE user_id = $1",
        )
        .bind(user_id)
        .fetch_optional(&self.pool)
        .await
        .map_err(map_err)?
        .ok_or(CryptoError::NotFound)?;

        Ok(KeyBackup {
            encrypted_blob: row.encrypted_blob,
            salt: row.salt,
            nonce: row.nonce,
            recovery_codes: row.recovery_codes,
            version: row.version,
        })
    }

    // ── Sender Keys ──────────────────────────────────────────────────────

    async fn distribute_sender_key(
        &self,
        channel_id: Uuid,
        sender_user_id: Uuid,
        generation: i32,
        distributions: Vec<(Uuid, Vec<u8>, Vec<u8>)>,
    ) -> Result<(), CryptoError> {
        let mut tx = self.pool.begin().await.map_err(map_err)?;

        // Upsert the sender key record
        let sender_key_id = Uuid::now_v7();
        sqlx::query(
            r#"
            INSERT INTO channel_sender_keys (id, channel_id, sender_user_id, generation, created_at)
            VALUES ($1, $2, $3, $4, now())
            ON CONFLICT (channel_id, sender_user_id, generation) DO NOTHING
            "#,
        )
        .bind(sender_key_id)
        .bind(channel_id)
        .bind(sender_user_id)
        .bind(generation)
        .execute(&mut *tx)
        .await
        .map_err(map_err)?;

        // Get the actual sender_key_id (might already exist)
        let (actual_sk_id,): (Uuid,) = sqlx::query_as(
            "SELECT id FROM channel_sender_keys WHERE channel_id = $1 AND sender_user_id = $2 AND generation = $3",
        )
        .bind(channel_id)
        .bind(sender_user_id)
        .bind(generation)
        .fetch_one(&mut *tx)
        .await
        .map_err(map_err)?;

        // Insert distributions
        for (recipient_device_id, encrypted_key, nonce) in distributions {
            let dist_id = Uuid::now_v7();
            sqlx::query(
                r#"
                INSERT INTO sender_key_distributions (id, sender_key_id, recipient_device_id, encrypted_key, nonce, created_at)
                VALUES ($1, $2, $3, $4, $5, now())
                ON CONFLICT (sender_key_id, recipient_device_id) DO UPDATE SET
                    encrypted_key = $4,
                    nonce = $5
                "#,
            )
            .bind(dist_id)
            .bind(actual_sk_id)
            .bind(recipient_device_id)
            .bind(&encrypted_key)
            .bind(&nonce)
            .execute(&mut *tx)
            .await
            .map_err(map_err)?;
        }

        tx.commit().await.map_err(map_err)?;
        Ok(())
    }

    async fn get_sender_keys_for_device(
        &self,
        channel_id: Uuid,
        device_id: Uuid,
    ) -> Result<Vec<SenderKeyDistribution>, CryptoError> {
        let rows = sqlx::query_as::<_, SenderKeyDistRow>(
            r#"
            SELECT
                sk.id AS sender_key_id,
                sk.sender_user_id,
                sk.channel_id,
                sk.generation,
                skd.encrypted_key,
                skd.nonce
            FROM sender_key_distributions skd
            JOIN channel_sender_keys sk ON sk.id = skd.sender_key_id
            WHERE sk.channel_id = $1 AND skd.recipient_device_id = $2
            ORDER BY sk.generation ASC
            "#,
        )
        .bind(channel_id)
        .bind(device_id)
        .fetch_all(&self.pool)
        .await
        .map_err(map_err)?;

        Ok(rows
            .into_iter()
            .map(|r| SenderKeyDistribution {
                sender_key_id: r.sender_key_id,
                sender_user_id: r.sender_user_id,
                channel_id: r.channel_id,
                generation: r.generation,
                encrypted_key: r.encrypted_key,
                nonce: r.nonce,
            })
            .collect())
    }

    // ── DM Sessions ──────────────────────────────────────────────────────

    async fn upsert_dm_session(
        &self,
        channel_id: Uuid,
        device_id: Uuid,
        encrypted_ratchet_state: Vec<u8>,
        ephemeral_public_key: Vec<u8>,
    ) -> Result<DmSessionInfo, CryptoError> {
        let id = Uuid::now_v7();

        let row = sqlx::query_as::<_, DmSessionRow>(
            r#"
            INSERT INTO dm_sessions (id, channel_id, device_id, encrypted_ratchet_state, ephemeral_public_key, generation, updated_at)
            VALUES ($1, $2, $3, $4, $5, 0, now())
            ON CONFLICT (channel_id, device_id) DO UPDATE SET
                encrypted_ratchet_state = $4,
                ephemeral_public_key = $5,
                generation = dm_sessions.generation + 1,
                updated_at = now()
            RETURNING id, channel_id, device_id, encrypted_ratchet_state, ephemeral_public_key, generation
            "#,
        )
        .bind(id)
        .bind(channel_id)
        .bind(device_id)
        .bind(&encrypted_ratchet_state)
        .bind(&ephemeral_public_key)
        .fetch_one(&self.pool)
        .await
        .map_err(map_err)?;

        Ok(DmSessionInfo {
            id: row.id,
            channel_id: row.channel_id,
            device_id: row.device_id,
            encrypted_ratchet_state: row.encrypted_ratchet_state,
            ephemeral_public_key: row.ephemeral_public_key,
            generation: row.generation,
        })
    }

    async fn get_dm_session(
        &self,
        channel_id: Uuid,
        device_id: Uuid,
    ) -> Result<DmSessionInfo, CryptoError> {
        let row = sqlx::query_as::<_, DmSessionRow>(
            r#"
            SELECT id, channel_id, device_id, encrypted_ratchet_state, ephemeral_public_key, generation
            FROM dm_sessions
            WHERE channel_id = $1 AND device_id = $2
            "#,
        )
        .bind(channel_id)
        .bind(device_id)
        .fetch_optional(&self.pool)
        .await
        .map_err(map_err)?
        .ok_or(CryptoError::NotFound)?;

        Ok(DmSessionInfo {
            id: row.id,
            channel_id: row.channel_id,
            device_id: row.device_id,
            encrypted_ratchet_state: row.encrypted_ratchet_state,
            ephemeral_public_key: row.ephemeral_public_key,
            generation: row.generation,
        })
    }
}
