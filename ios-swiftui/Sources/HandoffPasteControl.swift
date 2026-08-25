import SwiftUI
import UIKit

struct HandoffPasteControl: UIViewRepresentable {
    let onValue: (String) -> Void

    func makeCoordinator() -> PasteTarget { PasteTarget(onValue: onValue) }

    func makeUIView(context: Context) -> UIPasteControl {
        let configuration = UIPasteControl.Configuration()
        configuration.displayMode = .iconAndLabel
        configuration.cornerStyle = .capsule
        configuration.baseBackgroundColor = UIColor(red: 141/255, green: 1, blue: 42/255, alpha: 1)
        configuration.baseForegroundColor = UIColor(red: 7/255, green: 17/255, blue: 13/255, alpha: 1)
        let control = UIPasteControl(configuration: configuration)
        control.target = context.coordinator
        control.accessibilityLabel = "Restore my destination"
        return control
    }

    func updateUIView(_ uiView: UIPasteControl, context: Context) {}
}

final class PasteTarget: UIResponder, UIPasteConfigurationSupporting {
    var pasteConfiguration: UIPasteConfiguration? = UIPasteConfiguration(forAccepting: NSString.self)
    private let onValue: (String) -> Void

    init(onValue: @escaping (String) -> Void) { self.onValue = onValue }

    func paste(itemProviders: [NSItemProvider]) {
        guard let provider = itemProviders.first(where: { $0.canLoadObject(ofClass: NSString.self) }) else { return }
        provider.loadObject(ofClass: NSString.self) { [weak self] object, _ in
            guard let value = object as? String else { return }
            DispatchQueue.main.async { self?.onValue(value) }
        }
    }
}
