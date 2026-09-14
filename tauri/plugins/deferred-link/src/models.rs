use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DeferredHandoff {
  pub token: String,
  pub host: String,
}

#[derive(Debug, Clone, Default, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PendingHandoffResponse {
  pub handoff: Option<DeferredHandoff>,
}
