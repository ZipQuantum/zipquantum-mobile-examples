import SwiftRs
import Tauri
import UIKit
import WebKit

struct DeferredHandoff: Equatable {
  let token: String
  let host: String
}

enum HandoffParser {
  static func parse(_ value: String, expectedBundleID: String) -> DeferredHandoff? {
    guard let components = URLComponents(string: value.trimmingCharacters(in: .whitespacesAndNewlines)),
      components.scheme == "zqddl"
    else { return nil }

    let items = components.queryItems ?? []
    func unique(_ name: String) -> String? {
      let values = items.filter { $0.name == name }.compactMap(\.value)
      return values.count == 1 ? values[0].trimmingCharacters(in: .whitespacesAndNewlines) : nil
    }

    guard let token = unique("token"), token.range(of: "^[A-Za-z0-9._~-]{1,512}$", options: .regularExpression) != nil,
      let host = unique("host")?.lowercased(), host.range(of: "^(?=.{1,253}$)([A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\\.)+[A-Za-z]{2,63}$", options: .regularExpression) != nil,
      unique("bundle_id") == expectedBundleID
    else { return nil }

    return DeferredHandoff(token: token, host: host)
  }
}

@available(iOS 16.0, *)
final class PasteControlViewController: UIViewController, UIPasteConfigurationSupporting {
  var pasteConfiguration: UIPasteConfiguration? = UIPasteConfiguration(forAccepting: NSString.self)
  private let completion: (DeferredHandoff?) -> Void
  private var completed = false

  init(completion: @escaping (DeferredHandoff?) -> Void) {
    self.completion = completion
    super.init(nibName: nil, bundle: nil)
  }

  required init?(coder: NSCoder) { nil }

  override func viewDidLoad() {
    super.viewDidLoad()
    view.backgroundColor = .systemBackground

    let title = UILabel()
    title.text = "Recover your ZipQuantum link"
    title.font = .preferredFont(forTextStyle: .title2)
    title.textAlignment = .center

    let paste = UIPasteControl(configuration: .init())
    paste.target = self

    let cancel = UIButton(type: .system)
    cancel.setTitle("Cancel", for: .normal)
    cancel.addTarget(self, action: #selector(cancelled), for: .touchUpInside)

    let stack = UIStackView(arrangedSubviews: [title, paste, cancel])
    stack.axis = .vertical
    stack.spacing = 24
    stack.translatesAutoresizingMaskIntoConstraints = false
    view.addSubview(stack)
    NSLayoutConstraint.activate([
      stack.leadingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.leadingAnchor, constant: 24),
      stack.trailingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.trailingAnchor, constant: -24),
      stack.centerYAnchor.constraint(equalTo: view.centerYAnchor),
    ])
  }

  func paste(itemProviders: [NSItemProvider]) {
    guard !completed, let provider = itemProviders.first else { return }
    provider.loadObject(ofClass: NSString.self) { [weak self] value, _ in
      DispatchQueue.main.async {
        guard let self, !self.completed else { return }
        let bundleID = Bundle.main.bundleIdentifier ?? ""
        let handoff = (value as? String).flatMap { HandoffParser.parse($0, expectedBundleID: bundleID) }
        self.finish(handoff)
      }
    }
  }

  @objc private func cancelled() { finish(nil) }

  private func finish(_ handoff: DeferredHandoff?) {
    guard !completed else { return }
    completed = true
    dismiss(animated: true) { self.completion(handoff) }
  }
}

final class ZqDeferredPlugin: Plugin {
  private var requested = false

  @objc public func getPendingRoute(_ invoke: Invoke) {
    DispatchQueue.main.async {
      guard !self.requested else {
        invoke.resolve(["handoff": NSNull()])
        return
      }
      self.requested = true

      guard #available(iOS 16.0, *) else {
        invoke.resolve(["handoff": NSNull()])
        return
      }

      let controller = PasteControlViewController { handoff in
        guard let handoff else {
          invoke.resolve(["handoff": NSNull()])
          return
        }
        invoke.resolve(["handoff": ["token": handoff.token, "host": handoff.host]])
      }
      controller.modalPresentationStyle = .formSheet
      self.presentViewController(controller)
    }
  }
}

@_cdecl("init_plugin_zq_deferred")
func initPlugin() -> Plugin {
  ZqDeferredPlugin()
}
