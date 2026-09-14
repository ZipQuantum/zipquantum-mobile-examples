# Tauri 2 direct and deferred deep links

This reference app adds Tauri 2 without adding a proprietary ZipQuantum SDK. It
uses the repository's [`mobile-v1`](../contracts/mobile-v1.schema.json) contract
on iOS and Android and keeps the desktop path deliberately narrower.

## What the example proves

| Runtime | Direct delivery | Deferred delivery | `route_ack` |
| --- | --- | --- | --- |
| iOS | Universal Link via `tauri-plugin-deep-link` | Visible native `UIPasteControl`, one read | After route render |
| Android | Verified App Link via `tauri-plugin-deep-link` | Play Install Referrer, one read | After route render |
| macOS/Windows/Linux | `zq-example://` + single instance | Out of scope | Never sent |

The single-instance plugin is registered before the deep-link plugin in
[`src-tauri/src/lib.rs`](src-tauri/src/lib.rs). Both initial launch and a second
instance feed `handleDirectUrls()` in [`src/main.ts`](src/main.ts), which uses the
same allowlisted route parser.

## Replace placeholders

Before running a mobile build, replace only with values verified in your
ZipQuantum dashboard:

- `links.example.com` in `src/config.ts` and `src-tauri/tauri.conf.json`;
- `app.example.com` and the allowlisted application routes in `src/routing.ts`;
- `com.example.zipquantum` app identifiers;
- `com.example.zipquantum.tauri` Tauri bundle identifier.

Do not commit a live token, signing certificate, provisioning profile, handoff
URL, route receipt, or user data.

## Run locally

```sh
npm ci
npm test
npm run typecheck
npm run build
npm run tauri dev
```

The Rust shell lives in `src-tauri/`; the mobile adapter is the path dependency
`plugins/deferred-link/`. A platform build also requires the normal Tauri 2
Android or iOS prerequisites.

## Delivery sequence

1. The deep-link plugin supplies the cold-start URL through `getCurrent()` or a
   warm URL through `onOpenUrl()`.
2. Mobile verifies the incoming host and calls the appropriate `mobile-v1`
   endpoint. Desktop parses only the configured custom scheme locally.
3. The response destination is reduced to an allowlisted route; arbitrary web
   destinations are rejected.
4. The app renders the destination.
5. Mobile forwards the opaque server receipt once. Desktop does not acknowledge.

For deferred mobile delivery, `getPendingRoute()` can be consumed only once per
process. Android extracts `zq_token` and `zq_host` from Play Install Referrer.
iOS opens a native modal whose paste action is implemented by `UIPasteControl`.
There is no clipboard read at launch or generic clipboard API.

## Receipt boundary

The receipt is held only in the pending in-memory navigation closure. The client
does not manufacture, decode, sign, persist, print, or replay it. Error messages
never include a full URL, handoff token, or receipt. Desktop `route_ack` remains
out of scope until ZipQuantum defines a separate desktop identity and trust
contract.

## Deterministic validation

From the repository root:

```powershell
powershell -File scripts/validate.ps1 tauri
```

```sh
./scripts/validate.sh tauri
```

The checks use stable `ZQ_OK`, `ZQ_WARN`, and `ZQ_ERROR` prefixes. The TypeScript
tests cover cold/warm direct delivery, deferred delivery, unknown routes,
one-shot acknowledgement, and the desktop no-ack boundary.
