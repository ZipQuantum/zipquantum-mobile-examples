import XCTest
@testable import tauri_plugin_zq_deferred

final class HandoffParserTests: XCTestCase {
  func testExpectedHandoff() {
    XCTAssertEqual(
      HandoffParser.parse(
        "zqddl://recover?token=opaque_token&host=links.example.com&bundle_id=com.example.zipquantum",
        expectedBundleID: "com.example.zipquantum"
      ),
      DeferredHandoff(token: "opaque_token", host: "links.example.com")
    )
  }

  func testRejectsMismatchAndDuplicates() {
    XCTAssertNil(HandoffParser.parse(
      "zqddl://recover?token=opaque_token&host=links.example.com&bundle_id=other.example",
      expectedBundleID: "com.example.zipquantum"
    ))
    XCTAssertNil(HandoffParser.parse(
      "zqddl://recover?token=one&token=two&host=links.example.com&bundle_id=com.example.zipquantum",
      expectedBundleID: "com.example.zipquantum"
    ))
  }
}
