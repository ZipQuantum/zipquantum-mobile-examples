import SwiftUI

struct ContentView: View {
    @StateObject private var model = LinkViewModel()

    var body: some View {
        NavigationStack {
            VStack(spacing: 24) {
                Image(systemName: "link.badge.plus")
                    .font(.system(size: 56))
                    .foregroundStyle(Color(red: 141/255, green: 1, blue: 42/255))
                Text("ZipQuantum link example").font(.title2.bold())
                Text(model.status).multilineTextAlignment(.center).foregroundStyle(.secondary)
                if let destination = model.destination {
                    Text(destination.absoluteString).font(.footnote.monospaced()).textSelection(.enabled)
                }
                HandoffPasteControl(onValue: model.restoreFromPaste)
                    .frame(height: 50)
                    .accessibilityHint("Reads a ZipQuantum handoff only after you tap")
                if model.isWorking { ProgressView() }
            }
            .padding(28)
            .onOpenURL(perform: model.openUniversalLink)
        }
    }
}
