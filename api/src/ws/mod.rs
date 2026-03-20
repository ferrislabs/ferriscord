use std::collections::HashMap;
use std::sync::Arc;

use axum::extract::{Query, State, WebSocketUpgrade};
use axum::extract::ws::{Message, WebSocket};
use axum::http::StatusCode;
use axum::response::IntoResponse;
use ferriscord_auth::AuthRepository;
use ferriscord_core::user::domain::user::ports::UserService;
use futures_util::{SinkExt, StreamExt};
use serde::Deserialize;
use tokio::sync::{RwLock, broadcast, mpsc};
use tracing::error;

use crate::state::AppState;

const BROADCAST_CAPACITY: usize = 256;

// ─── Hub ─────────────────────────────────────────────────────────────────────

#[derive(Clone)]
pub struct WsHub {
    rooms: Arc<RwLock<HashMap<String, broadcast::Sender<String>>>>,
}

impl WsHub {
    pub fn new() -> Self {
        Self {
            rooms: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    pub async fn subscribe(&self, room: &str) -> broadcast::Receiver<String> {
        let mut rooms = self.rooms.write().await;
        let tx = rooms
            .entry(room.to_string())
            .or_insert_with(|| broadcast::channel(BROADCAST_CAPACITY).0);
        tx.subscribe()
    }

    pub async fn publish(&self, room: &str, msg: String) {
        let rooms = self.rooms.read().await;
        if let Some(tx) = rooms.get(room) {
            let _ = tx.send(msg);
        }
    }
}

// ─── Handler ─────────────────────────────────────────────────────────────────

#[derive(Deserialize)]
pub struct WsQuery {
    pub token: String,
}

#[derive(Deserialize)]
struct WsClientMsg {
    #[serde(rename = "type")]
    kind: String,
    rooms: Option<Vec<String>>,
}

pub async fn ws_handler(
    ws: WebSocketUpgrade,
    Query(params): Query<WsQuery>,
    State(state): State<AppState>,
) -> Result<impl IntoResponse, StatusCode> {
    let identity = state
        .auth
        .identify(&params.token)
        .await
        .map_err(|_| StatusCode::UNAUTHORIZED)?;

    let user = state
        .user_service
        .upsert_by_sub(identity.id(), identity.username())
        .await
        .map_err(|e| {
            error!("WS: failed to upsert user: {:?}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    let user_room = format!("user:{}", user.id.0);
    let hub = state.hub.clone();

    Ok(ws.on_upgrade(move |socket| handle_socket(socket, hub, user_room)))
}

async fn handle_socket(socket: WebSocket, hub: WsHub, user_room: String) {
    let (mut ws_tx, mut ws_rx) = socket.split();
    let (conn_tx, mut conn_rx) = mpsc::channel::<String>(256);

    // Auto-subscribe to the user's personal room
    let mut user_rx = hub.subscribe(&user_room).await;
    let conn_tx_user = conn_tx.clone();
    tokio::spawn(async move {
        loop {
            match user_rx.recv().await {
                Ok(msg) => {
                    if conn_tx_user.send(msg).await.is_err() {
                        break;
                    }
                }
                Err(broadcast::error::RecvError::Closed) => break,
                Err(broadcast::error::RecvError::Lagged(_)) => continue,
            }
        }
    });

    // Forward messages from conn_rx to the WebSocket
    let send_task = tokio::spawn(async move {
        while let Some(msg) = conn_rx.recv().await {
            if ws_tx.send(Message::Text(msg.into())).await.is_err() {
                break;
            }
        }
    });

    // Handle incoming messages from the client
    while let Some(Ok(msg)) = ws_rx.next().await {
        match msg {
            Message::Text(text) => {
                let Ok(cmd) = serde_json::from_str::<WsClientMsg>(&text) else {
                    continue;
                };
                match cmd.kind.as_str() {
                    "subscribe" => {
                        for room in cmd.rooms.unwrap_or_default() {
                            let mut rx = hub.subscribe(&room).await;
                            let tx = conn_tx.clone();
                            tokio::spawn(async move {
                                loop {
                                    match rx.recv().await {
                                        Ok(msg) => {
                                            if tx.send(msg).await.is_err() {
                                                break;
                                            }
                                        }
                                        Err(broadcast::error::RecvError::Closed) => break,
                                        Err(broadcast::error::RecvError::Lagged(_)) => continue,
                                    }
                                }
                            });
                        }
                    }
                    "ping" => {
                        let _ = conn_tx.send(r#"{"type":"pong"}"#.to_string()).await;
                    }
                    _ => {}
                }
            }
            Message::Close(_) => break,
            _ => {}
        }
    }

    send_task.abort();
}
