import Foundation
import UIKit

actor ZipQuantumClient {
    private let session: URLSession
    init() {
        let configuration = URLSessionConfiguration.ephemeral
        configuration.timeoutIntervalForRequest = 15
        configuration.timeoutIntervalForResource = 20
        configuration.httpCookieStorage = nil
        self.session = URLSession(configuration: configuration)
    }

    func resolve(_ url: URL) async throws -> ZQDelivery {
        guard let host = url.host,
              ZQConfiguration.allowedHosts.contains(host),
              let reference = url.pathComponents.last,
              reference != "/" else {
            throw ZQIntegrationError.invalidUniversalLink
        }
        return try await post(path: "/api/mobile/v1/links/resolve", body: baseContext().merging([
            "host": host,
            "reference": reference,
            "url": url.absoluteString,
            "bundle_id": ZQConfiguration.bundleID,
            "parameters": URLComponents(url: url, resolvingAgainstBaseURL: false)?.queryItems?.reduce(into: [String: String]()) { $0[$1.name] = $1.value ?? "" } ?? [:]
        ]) { _, new in new })
    }

    func recover(_ handoff: ZQHandoff) async throws -> ZQDelivery {
        try await post(path: "/api/mobile/v1/deferred/ios/recover", body: baseContext().merging([
            "token": handoff.token,
            "host": handoff.host,
            "bundle_id": handoff.bundleID
        ]) { _, new in new })
    }

    func acknowledgeRouteOpened(_ ack: ZQRouteAcknowledgement, host: String) async throws {
        let endpoint = URL(string: ack.endpoint, relativeTo: ZQConfiguration.apiBaseURL)?.absoluteURL
        guard let endpoint, endpoint.scheme == "https",
              endpoint.host == ZQConfiguration.apiBaseURL.host else {
            throw ZQIntegrationError.invalidResponse
        }
        _ = try await postURL(endpoint, body: [
            "receipt": ack.receipt,
            "host": host,
            "platform": "iOS",
            "bundle_id": ZQConfiguration.bundleID
        ], decode: EmptyResponse.self)
    }

    private func baseContext() -> [String: Any] {
        let bounds = UIScreen.main.bounds
        let scale = UIScreen.main.scale
        return [
            "platform": "iOS",
            "os_name": UIDevice.current.systemName,
            "os_version": UIDevice.current.systemVersion,
            "model": UIDevice.current.model,
            "language": Locale.current.identifier,
            "timezone": TimeZone.current.identifier,
            "screen_resolution": "\(Int(bounds.width * scale))x\(Int(bounds.height * scale))",
            "hardware_concurrency": ProcessInfo.processInfo.activeProcessorCount,
            "tracking_consent": false,
            "consent_version": ZQConfiguration.consentVersion
        ]
    }

    private func post(path: String, body: [String: Any]) async throws -> ZQDelivery {
        guard let url = URL(string: path, relativeTo: ZQConfiguration.apiBaseURL)?.absoluteURL else {
            throw ZQIntegrationError.invalidResponse
        }
        return try await postURL(url, body: body, decode: ZQDelivery.self)
    }

    private func postURL<T: Decodable>(_ url: URL, body: [String: Any], decode: T.Type) async throws -> T {
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        request.httpBody = try JSONSerialization.data(withJSONObject: body)
        let (data, response) = try await session.data(for: request)
        guard let http = response as? HTTPURLResponse else { throw ZQIntegrationError.invalidResponse }
        guard (200..<300).contains(http.statusCode) else { throw ZQIntegrationError.server(http.statusCode) }
        if T.self == EmptyResponse.self, data.isEmpty || data == Data("{}".utf8) {
            return EmptyResponse() as! T
        }
        return try JSONDecoder().decode(T.self, from: data)
    }
}

private struct EmptyResponse: Codable {
    init() {}
}
