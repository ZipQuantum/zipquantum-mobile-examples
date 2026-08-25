# Security policy

Report vulnerabilities privately through GitHub Security Advisories. Never place live tokens, receipts, credentials, signing material, or user data in public issues.

## Required properties

- Deferred tokens and route receipts remain opaque server values.
- Receipts are short-lived, single-purpose, and server-bound to the app and host.
- iOS clipboard access requires a visible `UIPasteControl` action.
- Android deferred recovery uses Play Install Referrer, not device fingerprinting.
- No advertising ID, vendor ID, hardware fingerprint, or cross-app identity is collected.
- Transport uses HTTPS and errors fail closed.

These examples demonstrate routing, not authorization. Apps must independently authorize protected content.
