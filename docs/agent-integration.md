# Agent integration guide

This repository is structured for coding agents and CI systems as well as humans.

## Inputs an agent must obtain

- ZipQuantum API base URL, normally `https://a.zq.tn`.
- Verified link hostname.
- iOS Team ID and Bundle ID, or Android application ID and SHA-256 certificate fingerprint.
- A non-production test link from the DDL Test Lab.

Never infer these values from branding or repository names. Read them from the ZipQuantum dashboard or explicit environment variables.

## Safe execution order

1. Validate local configuration.
2. Verify `apple-app-site-association` or `assetlinks.json` over HTTPS.
3. Build the native app.
4. Run direct-link tests with the app installed.
5. Run deferred tests only with a disposable test link/token.
6. Confirm the aggregate funnel reaches `route_opened`.

## Machine behavior

- Commands are non-interactive.
- JSON contracts live in `contracts/`.
- Validation uses stable prefixes: `ZQ_OK`, `ZQ_WARN`, and `ZQ_ERROR`.
- Exit `0` means all static checks passed; any `ZQ_ERROR` produces non-zero exit.
- Logs must redact `token`, `receipt`, authorization headers, and signing secrets.

## Error handling

Fail closed on an invalid scheme, host, app identifier, HTTP status, expired receipt, or malformed response. Report the failing invariant and remediation; never fall back to fingerprinting or silent clipboard access.
