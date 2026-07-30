import SwiftUI
import SwiftData

// MARK: - App Entry Point

@main
struct SimpleInvoiceApp: App {
    var body: some Scene {
        WindowGroup {
            MainContentView()
                .preferredColorScheme(.dark)
        }
        .modelContainer(for: [
            Client.self,
            WorkRateItem.self,
            Invoice.self,
            CompanyProfile.self,
        ])
    }
}
