use tauri::{AppHandle, command, Runtime};

use crate::models::PendingHandoffResponse;
use crate::Result;
use crate::ZqDeferredExt;

#[command]
pub(crate) async fn get_pending_route<R: Runtime>(
    app: AppHandle<R>,
) -> Result<PendingHandoffResponse> {
    app.zq_deferred().get_pending_route()
}
