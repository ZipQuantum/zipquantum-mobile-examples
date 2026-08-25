import Foundation

struct ZQRouteAcknowledgement: Decodable, Sendable {
    let receipt: String
    let expiresIn: Int
    let endpoint: String

    enum CodingKeys: String, CodingKey {
        case receipt
        case expiresIn = "expires_in"
        case endpoint
    }
}

struct ZQResolvedLink: Decodable, Sendable {
    let url: URL
    let code: String?
    let host: String?
    let destinationURL: URL?

    enum CodingKeys: String, CodingKey {
        case url, code, host
        case destinationURL = "destination_url"
    }
}

struct ZQDelivery: Decodable, Sendable {
    let success: Bool
    let delivery: String
    let link: ZQResolvedLink
    let routeAcknowledgement: ZQRouteAcknowledgement?

    enum CodingKeys: String, CodingKey {
        case success, delivery, link
        case routeAcknowledgement = "route_ack"
    }
}

enum ZQIntegrationError: LocalizedError, Equatable {
    case invalidUniversalLink
    case invalidHandoff
    case server(Int)
    case invalidResponse

    var errorDescription: String? {
        switch self {
        case .invalidUniversalLink: "The Universal Link host or path is not configured."
        case .invalidHandoff: "No valid ZipQuantum handoff was pasted."
        case .server(let status): "ZipQuantum returned HTTP \(status)."
        case .invalidResponse: "ZipQuantum returned an invalid response."
        }
    }
}

struct ZQHandoff: Equatable, Sendable {
    let token: String
    let host: String
    let bundleID: String

    static func parse(_ value: String, expectedBundleID: String) throws -> ZQHandoff {
        guard let components = URLComponents(string: value.trimmingCharacters(in: .whitespacesAndNewlines)),
              components.scheme == "zqddl" else {
            throw ZQIntegrationError.invalidHandoff
        }
        let items = components.queryItems ?? []
        let value: (String) -> String? = { name in items.first(where: { $0.name == name })?.value }
        guard let token = value("token"), !token.isEmpty,
              let host = value("host"), !host.isEmpty,
              value("bundle_id") == expectedBundleID else {
            throw ZQIntegrationError.invalidHandoff
        }
        return ZQHandoff(token: token, host: host, bundleID: expectedBundleID)
    }
}
