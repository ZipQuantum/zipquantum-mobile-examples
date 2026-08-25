import Flutter
import UIKit

final class ZipQuantumPasteControlFactory: NSObject, FlutterPlatformViewFactory {
    private let messenger: FlutterBinaryMessenger
    init(messenger: FlutterBinaryMessenger) { self.messenger = messenger }
    func create(withFrame frame: CGRect, viewIdentifier viewId: Int64, arguments args: Any?) -> FlutterPlatformView {
        ZipQuantumPasteControlView(frame: frame, messenger: messenger)
    }
}

private final class ZipQuantumPasteControlView: NSObject, FlutterPlatformView {
    private let control: UIPasteControl
    private let target: PasteTarget

    init(frame: CGRect, messenger: FlutterBinaryMessenger) {
        let channel = FlutterMethodChannel(name: "tn.zq.zipquantum/handoff", binaryMessenger: messenger)
        target = PasteTarget { channel.invokeMethod("onIosPastedHandoff", arguments: $0) }
        let configuration = UIPasteControl.Configuration()
        configuration.displayMode = .iconAndLabel
        configuration.cornerStyle = .capsule
        configuration.baseBackgroundColor = UIColor(red: 0.51, green: 1, blue: 0.17, alpha: 1)
        configuration.baseForegroundColor = UIColor(red: 0.03, green: 0.08, blue: 0.06, alpha: 1)
        control = UIPasteControl(configuration: configuration)
        control.target = target
        control.accessibilityLabel = "Restore my destination"
        super.init()
    }
    func view() -> UIView { control }
}

private final class PasteTarget: UIResponder {
    private let onValue: (String) -> Void
    init(onValue: @escaping (String) -> Void) {
        self.onValue = onValue
        super.init()
        pasteConfiguration = UIPasteConfiguration(forAccepting: NSString.self)
    }
    override func paste(itemProviders: [NSItemProvider]) {
        guard let provider = itemProviders.first(where: { $0.canLoadObject(ofClass: NSString.self) }) else { return }
        provider.loadObject(ofClass: NSString.self) { [weak self] object, _ in
            guard let value = object as? String else { return }
            DispatchQueue.main.async { self?.onValue(value) }
        }
    }
}
