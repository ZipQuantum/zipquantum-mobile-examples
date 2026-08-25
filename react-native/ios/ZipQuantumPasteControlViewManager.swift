import React
import UIKit

@objc(ZipQuantumPasteControlViewManager)
final class ZipQuantumPasteControlViewManager: RCTViewManager {
    override static func requiresMainQueueSetup() -> Bool { true }
    override func view() -> UIView! { ZipQuantumPasteControlView() }
}

private final class ZipQuantumPasteControlView: UIView {
    @objc var onPaste: RCTBubblingEventBlock?
    private lazy var control: UIPasteControl = {
        let configuration = UIPasteControl.Configuration()
        configuration.displayMode = .iconAndLabel
        configuration.cornerStyle = .capsule
        configuration.baseBackgroundColor = UIColor(red: 0.51, green: 1, blue: 0.17, alpha: 1)
        configuration.baseForegroundColor = UIColor(red: 0.03, green: 0.08, blue: 0.06, alpha: 1)
        let control = UIPasteControl(configuration: configuration)
        control.target = self
        control.translatesAutoresizingMaskIntoConstraints = false
        return control
    }()

    override init(frame: CGRect) {
        super.init(frame: frame)
        pasteConfiguration = UIPasteConfiguration(forAccepting: NSString.self)
        addSubview(control)
        NSLayoutConstraint.activate([
            control.leadingAnchor.constraint(equalTo: leadingAnchor),
            control.trailingAnchor.constraint(equalTo: trailingAnchor),
            control.topAnchor.constraint(equalTo: topAnchor),
            control.bottomAnchor.constraint(equalTo: bottomAnchor),
        ])
    }

    required init?(coder: NSCoder) { nil }

    override func paste(itemProviders: [NSItemProvider]) {
        guard let provider = itemProviders.first(where: { $0.canLoadObject(ofClass: NSString.self) }) else { return }
        provider.loadObject(ofClass: NSString.self) { [weak self] object, _ in
            guard let value = object as? String else { return }
            DispatchQueue.main.async { self?.onPaste?(["value": value]) }
        }
    }
}
