import SwiftUI
import SwiftData

// MARK: - App Entry Point

@main
struct SimpleInvoiceApp: App {
    var body: some Scene {
        WindowGroup {
            MainContentView()
        }
        .modelContainer(for: [
            Client.self,
            WorkRateItem.self,
            Invoice.self
        ])
    }
}
