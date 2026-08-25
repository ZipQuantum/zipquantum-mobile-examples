# Flutter example

Flutter 3.47 reference for Universal Links, verified Android App Links, and deferred deep links. It uses `app_links` plus small native handoff adapters; there is no proprietary ZipQuantum SDK.

## Included

- `app_links` for verified HTTPS entry points.
- iOS `UiKitView` backed by a visible native `UIPasteControl`; Dart never reads the pasteboard.
- Automatic Play Install Referrer recovery on Android, with a visible retry action.
- Runtime response validation, app/host binding, trusted acknowledgement endpoints, and `route_opened` only after Flutter paints the destination card.
- Unit tests for the handoff parsers and response contract.

## Add to an existing Flutter app

1. Copy `lib/` and replace the example host and app identifiers in `lib/configuration.dart` with dashboard-verified values.
2. Add `app_links: 7.2.1`, then configure Associated Domains and verified App Links.
3. iOS: copy `ZipQuantumPasteControl.swift`, apply the AppDelegate registration snippet, and set iOS 16+.
4. Android: merge the Kotlin, Gradle, and manifest snippets; verify the package and release SHA-256 in ZipQuantum.

```sh
flutter pub get
flutter analyze
flutter test
../scripts/validate.sh flutter
```

Test Universal Links on a physical iOS device and Install Referrer with a Google Play-delivered build. Never commit live handoffs, receipts, signing keys, or production tokens.
