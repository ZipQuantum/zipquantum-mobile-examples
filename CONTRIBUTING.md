# Contributing

Keep the examples small, native, deterministic, and auditable.

1. Never commit secrets, certificates, provisioning profiles, keystores, live tokens, or receipts.
2. Preserve explicit user initiation for iOS clipboard recovery.
3. Do not introduce fingerprinting, advertising identifiers, or silent cross-app tracking.
4. Acknowledge `route_opened` only after the destination route is displayed.
5. Add tests for parsing, request construction, and receipt handling.

Run the repository validation script before opening a pull request.
