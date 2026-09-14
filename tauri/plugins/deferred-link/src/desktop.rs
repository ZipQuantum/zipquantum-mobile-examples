use serde::de::DeserializeOwned;
use tauri::{plugin::PluginApi, AppHandle, Runtime};

use crate::models::*;

pub fn init<R: Runtime, C: DeserializeOwned>(
  app: &AppHandle<R>,
  _api: PluginApi<R, C>,
) -> crate::Result<ZqDeferred<R>> {
  Ok(ZqDeferred(app.clone()))
}

/// Access to the zq-deferred APIs.
pub struct ZqDeferred<R: Runtime>(AppHandle<R>);

impl<R: Runtime> ZqDeferred<R> {
  pub fn get_pending_route(&self) -> crate::Result<PendingHandoffResponse> {
    Ok(PendingHandoffResponse { handoff: None })
  }
}
