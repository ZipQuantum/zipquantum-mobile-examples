#[cfg(desktop)]
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let mut builder = tauri::Builder::default();

    // ZQ_INVARIANT_SINGLE_INSTANCE_FIRST: Windows/Linux deliver a warm URL to
    // a second process. This plugin must be registered before deep-link so its
    // `deep-link` feature can forward that URL to the first process.
    #[cfg(desktop)]
    {
        builder = builder.plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            // Never print arguments: they can contain a full route URL.
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
                let _ = window.set_focus();
            }
        }));
    }

    builder
        .plugin(tauri_plugin_deep_link::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_zq_deferred::init())
        .run(tauri::generate_context!())
        .expect("failed to run ZipQuantum Tauri example");
}
