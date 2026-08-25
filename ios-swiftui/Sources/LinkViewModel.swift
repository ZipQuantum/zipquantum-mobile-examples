import Foundation

@MainActor
final class LinkViewModel: ObservableObject {
    @Published private(set) var status = "Waiting for a verified link"
    @Published private(set) var destination: URL?
    @Published private(set) var isWorking = false
    private let client = ZipQuantumClient()

    func openUniversalLink(_ url: URL) { Task { await deliver { try await client.resolve(url) } } }

    func restoreFromPaste(_ value: String) {
        Task {
            do {
                let handoff = try ZQHandoff.parse(value, expectedBundleID: ZQConfiguration.bundleID)
                await deliver { try await client.recover(handoff) }
            } catch { status = error.localizedDescription }
        }
    }

    private func deliver(_ operation: @escaping () async throws -> ZQDelivery) async {
        isWorking = true
        defer { isWorking = false }
        do {
            let delivery = try await operation()
            destination = delivery.link.destinationURL ?? delivery.link.url
            status = "Route opened: \(delivery.delivery)"

            // This line represents the app route becoming visible. In a real app,
            // call acknowledge only after navigation succeeds.
            if let acknowledgement = delivery.routeAcknowledgement,
               let host = delivery.link.host ?? delivery.link.url.host {
                try await client.acknowledgeRouteOpened(acknowledgement, host: host)
            }
        } catch { status = error.localizedDescription }
    }
}
