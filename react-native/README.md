# React Native example

React Native 0.86 TypeScript reference using verified HTTPS links and small, auditable native adapters. It does **not** add a proprietary ZipQuantum SDK.

## Included

- `Linking` for Universal Links and Android App Links.
- A native iOS `UIPasteControl`; JavaScript never reads the pasteboard silently.
- A minimal Android bridge for Google Play Install Referrer.
- Automatic Android recovery on first launch, with a visible retry action if Play is not ready yet.
- App-bound handoff parsing, trusted acknowledgement endpoint validation, and `route_opened` only after the destination card renders.
- Pure TypeScript tests for the security-sensitive parsers.

## Add to an existing React Native app

1. Copy `App.tsx` and `src/`, then replace the host and identifiers in `src/config.ts` with values verified in the ZipQuantum dashboard.
2. iOS: copy both files from `ios/`, set iOS 16+, and add `applinks:links.example.com` to Associated Domains.
3. Android: copy both Kotlin files from `android/`, register `ZipQuantumPackage()` in `MainApplication`, merge the manifest snippet, and add the Install Referrer dependency snippet.
4. Verify the same Bundle ID or package name, host, Team ID, and SHA-256 certificate in ZipQuantum.

```sh
npm ci
npm run typecheck
npm test
../scripts/validate.sh react-native
```

Install Referrer must be exercised through a Google Play-delivered build. Universal Links should be verified on a physical iOS device. Never commit a real handoff, route receipt, signing key, or production token.
