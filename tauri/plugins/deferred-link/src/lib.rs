use tauri::{
  plugin::{Builder, TauriPlugin},
  Manager, Runtime,
};

pub use models::*;

#[cfg(desktop)]
mod desktop;
#[cfg(mobile)]
mod mobile;

mod commands;
mod error;
mod models;

pub use error::{Error, Result};

#[cfg(desktop)]
use desktop::ZqDeferred;
#[cfg(mobile)]
use mobile::ZqDeferred;

/// Extensions to [`tauri::App`], [`tauri::AppHandle`] and [`tauri::Window`] to access the zq-deferred APIs.
pub trait ZqDeferredExt<R: Runtime> {
  fn zq_deferred(&self) -> &ZqDeferred<R>;
}

impl<R: Runtime, T: Manager<R>> crate::ZqDeferredExt<R> for T {
  fn zq_deferred(&self) -> &ZqDeferred<R> {
    self.state::<ZqDeferred<R>>().inner()
  }
}

/// Initializes the plugin.
pub fn init<R: Runtime>() -> TauriPlugin<R> {
  Builder::new("zq-deferred")
    .invoke_handler(tauri::generate_handler![commands::get_pending_route])
    .setup(|app, api| {
      #[cfg(mobile)]
      let zq_deferred = mobile::init(app, api)?;
      #[cfg(desktop)]
      let zq_deferred = desktop::init(app, api)?;
      app.manage(zq_deferred);
      Ok(())
    })
    .build()
}
