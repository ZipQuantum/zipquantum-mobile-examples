# Agent instructions

This repository contains independent native reference apps. Do not add a proprietary ZipQuantum SDK.

## Deterministic workflow

1. Read `contracts/mobile-v1.schema.json` and the target platform README.
2. Copy the platform's `.env.example` or generated config template; never commit real tokens or signing material.
3. Run `scripts/validate.ps1` on Windows or `scripts/validate.sh` on macOS/Linux.
4. Treat every validation error as blocking. Do not weaken Associated Domains, App Links, TLS, token binding, or explicit paste consent to make a test pass.

## Invariants

- iOS deferred recovery begins only from a visible `UIPasteControl` action.
- Android deferred recovery uses Play Install Referrer parameters `zq_token` and `zq_host`.
- `route_ack.receipt` is opaque. Never decode, persist, print, or replay it.
- Send `route_opened` only after the app has displayed its destination route.
- No IDFA, App Set ID, Android advertising ID, IDFV, fingerprint, or cross-app identity.
- Example values use `example.com`; replace them with dashboard-verified values.

## Scope map

- `ios-swiftui/`: SwiftUI example and XcodeGen definition.
- `android-kotlin/`: Jetpack Compose example.
- `contracts/`: machine-readable API shapes.
- `docs/`: human and agent integration guidance.
- `scripts/`: non-interactive validation entrypoints.

Prefer small reviewable changes. Update tests and documentation with behavior changes.
