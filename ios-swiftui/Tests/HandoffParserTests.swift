import XCTest
@testable import ZipQuantumExample

final class HandoffParserTests: XCTestCase {
    func testValidHandoff() throws {
        let value = "zqddl://restore?token=opaque&host=links.example.com&bundle_id=com.example.ZipQuantumExample"
        let handoff = try ZQHandoff.parse(value, expectedBundleID: "com.example.ZipQuantumExample")
        XCTAssertEqual(handoff.host, "links.example.com")
        XCTAssertEqual(handoff.token, "opaque")
    }

    func testRejectsWrongBundle() {
        let value = "zqddl://restore?token=opaque&host=links.example.com&bundle_id=attacker.example"
        XCTAssertThrowsError(try ZQHandoff.parse(value, expectedBundleID: "com.example.ZipQuantumExample"))
    }

    func testRejectsOrdinaryClipboardText() {
        XCTAssertThrowsError(try ZQHandoff.parse("hello", expectedBundleID: "com.example.ZipQuantumExample"))
    }
}
