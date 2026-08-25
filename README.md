# ZipQuantum mobile examples

Auditable, agent-friendly reference integrations for ZipQuantum deep links and deferred deep links.

These examples use platform APIs directly:

- no proprietary ZipQuantum SDK;
- no fingerprinting or cross-app user identifier;
- signed, short-lived handoff receipts;
- explicit clipboard recovery on iOS;
- aggregate funnel acknowledgements only after the destination route opens.

## Examples

| Platform | Direct deep link | Deferred deep link | Route acknowledgement |
| --- | --- | --- | --- |
| [SwiftUI](ios-swiftui/) | Universal Links | `UIPasteControl` user action | Signed `route_ack` receipt |
| [Kotlin](android-kotlin/) | Verified App Links | Google Play Install Referrer | Signed `route_ack` receipt |

The sample identifiers and hosts are placeholders. Replace them with values verified in your ZipQuantum dashboard before running an app.

## AI agents

Start with [AGENTS.md](AGENTS.md), then read the machine-readable [mobile contract](contracts/mobile-v1.schema.json) and [agent integration guide](docs/agent-integration.md). Every verification command is non-interactive and returns a non-zero exit code on failure.

## Contract

The apps call the public endpoints documented in [docs/mobile-contract.md](docs/mobile-contract.md). The server resolves routing and issues a host- and app-bound acknowledgement receipt. Apps never manufacture or decode this receipt.

## Security and privacy

See [SECURITY.md](SECURITY.md). Device context is optional and coarse. Do not add advertising identifiers, pasteboard reads at launch, device fingerprinting, or a locally generated substitute for a server receipt.

## License

MIT
