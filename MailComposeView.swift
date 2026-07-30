import SwiftUI
import MessageUI

// MARK: - Mail Compose View (UIViewControllerRepresentable)

struct MailComposeView: UIViewControllerRepresentable {
    let toRecipients: [String]
    let subject: String
    let body: String
    let attachments: [(url: URL, mimeType: String, filename: String)]

    @Environment(\.dismiss) private var dismiss

    func makeUIViewController(context: Context) -> MFMailComposeViewController {
        let vc = MFMailComposeViewController()
        vc.mailComposeDelegate = context.coordinator
        vc.setToRecipients(toRecipients.filter { !$0.isEmpty })
        vc.setSubject(subject)
        vc.setMessageBody(body, isHTML: false)

        for attachment in attachments {
            if let data = try? Data(contentsOf: attachment.url) {
                vc.addAttachmentData(data, mimeType: attachment.mimeType, fileName: attachment.filename)
            }
        }

        return vc
    }

    func updateUIViewController(_ uiViewController: MFMailComposeViewController, context: Context) {}

    func makeCoordinator() -> Coordinator {
        Coordinator(dismiss: dismiss)
    }

    class Coordinator: NSObject, MFMailComposeViewControllerDelegate {
        let dismiss: DismissAction

        init(dismiss: DismissAction) {
            self.dismiss = dismiss
        }

        func mailComposeController(
            _ controller: MFMailComposeViewController,
            didFinishWith result: MFMailComposeResult,
            error: Error?
        ) {
            dismiss()
        }
    }

    /// Check if mail is available on this device
    static var isAvailable: Bool {
        MFMailComposeViewController.canSendMail()
    }
}
