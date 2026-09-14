# Tauri plugin: `zq-deferred`

This local Tauri 2 plugin exposes one command: `getPendingRoute()`.

- Android connects to Google Play Install Referrer once and returns only a
  validated `zq_token`/`zq_host` pair.
- iOS presents a native `UIPasteControl`; the pasteboard is never read silently.
- Desktop always returns no handoff. Desktop deferred recovery is out of scope.

The command is process-local and one-shot. It never persists or logs the
referrer, token, full URL, or route receipt. The webview must validate the host
again before sending the handoff to the ZipQuantum `mobile-v1` endpoint.
