import UIKit
import PDFKit

// MARK: - Invoice PDF Generator

final class InvoicePDFGenerator {

    // MARK: - Public API

    /// Generates a PDF for the given invoice and saves it to the Documents directory.
    /// Returns the file URL on success.
    @discardableResult
    static func generate(for invoice: Invoice, companyName: String = "My Company", companyAddress: String = "123 Business Street, City - 560001") -> URL? {
        let html = buildHTML(for: invoice, companyName: companyName, companyAddress: companyAddress)
        guard let data = renderHTMLtoPDF(html: html) else { return nil }

        let filename = invoice.pdfFilename.isEmpty ? "\(invoice.invoiceNumber).pdf" : invoice.pdfFilename
        let url = documentsURL(for: filename)

        do {
            try data.write(to: url, options: .atomic)
            return url
        } catch {
            print("PDF write error: \(error)")
            return nil
        }
    }

    // MARK: - Documents Directory

    static func documentsURL(for filename: String) -> URL {
        FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
            .appendingPathComponent(filename)
    }

    static func allPDFURLs() -> [URL] {
        let dir = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
        let files = (try? FileManager.default.contentsOfDirectory(at: dir, includingPropertiesForKeys: nil)) ?? []
        return files.filter { $0.pathExtension == "pdf" }
    }

    // MARK: - HTML Builder

    private static func buildHTML(for invoice: Invoice, companyName: String, companyAddress: String) -> String {
        let formatter = DateFormatter()
        formatter.dateStyle = .long

        let lineItemsHTML = invoice.lineItems.map { item in
            """
            <tr>
                <td>\(item.title)</td>
                <td>\(item.hsnCode)</td>
                <td style="text-align:right;">\(String(format: "%.2f", item.quantity))</td>
                <td style="text-align:right;">₹\(String(format: "%.2f", item.unitPrice))</td>
                <td style="text-align:right;">₹\(String(format: "%.2f", item.subtotal))</td>
                <td style="text-align:right;">\(String(format: "%.1f", item.taxPercentage))%</td>
                <td style="text-align:right;">₹\(String(format: "%.2f", item.cgst))</td>
                <td style="text-align:right;">₹\(String(format: "%.2f", item.sgst))</td>
                <td style="text-align:right;font-weight:bold;">₹\(String(format: "%.2f", item.total))</td>
            </tr>
            """
        }.joined()

        let signatureHTML: String
        if let sigData = invoice.signatureData,
           let _ = UIImage(data: sigData) {
            let base64 = sigData.base64EncodedString()
            signatureHTML = "<img src='data:image/png;base64,\(base64)' style='max-width:220px;max-height:80px;border-bottom:1px solid #333;' />"
        } else {
            signatureHTML = "<div style='width:220px;height:60px;border-bottom:1px solid #333;'></div>"
        }

        let amountInWords = NumberToWords.inWords(invoice.grandTotal)

        return """
        <!DOCTYPE html>
        <html>
        <head>
        <meta charset="UTF-8"/>
        <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 11px; color: #1a1a2e; padding: 30px; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
            .company-block h1 { font-size: 24px; font-weight: 800; color: #0f3460; letter-spacing: -0.5px; }
            .company-block p { color: #555; margin-top: 4px; line-height: 1.5; }
            .invoice-meta { text-align: right; }
            .invoice-meta h2 { font-size: 20px; color: #e94560; font-weight: 700; }
            .invoice-meta p { color: #555; line-height: 1.8; }
            .divider { border: none; border-top: 2px solid #0f3460; margin: 16px 0; }
            .parties { display: flex; gap: 40px; margin-bottom: 20px; }
            .party-block { flex: 1; background: #f0f4ff; border-radius: 8px; padding: 12px 16px; }
            .party-block h3 { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #0f3460; margin-bottom: 8px; }
            .party-block p { line-height: 1.7; color: #333; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
            thead { background: #0f3460; color: white; }
            thead th { padding: 8px 6px; text-align: left; font-size: 9px; text-transform: uppercase; letter-spacing: 0.5px; }
            tbody tr:nth-child(even) { background: #f7f9ff; }
            tbody td { padding: 7px 6px; border-bottom: 1px solid #e5e8ef; vertical-align: top; }
            .totals-block { display: flex; justify-content: flex-end; }
            .totals-table { width: 280px; }
            .totals-table td { padding: 5px 8px; }
            .totals-table .grand-total-row td { font-size: 13px; font-weight: 800; color: #0f3460; background: #eef2ff; border-radius: 4px; }
            .amount-words { background: #f0f4ff; border-left: 4px solid #0f3460; padding: 10px 14px; margin-bottom: 20px; font-style: italic; color: #333; border-radius: 0 6px 6px 0; }
            .footer { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 30px; padding-top: 16px; border-top: 1px solid #ddd; }
            .signature-block { text-align: center; }
            .signature-block p { font-size: 10px; color: #777; margin-top: 6px; }
            .status-badge { display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }
            .status-draft { background: #fff3cd; color: #856404; }
            .status-sent { background: #cfe2ff; color: #084298; }
            .status-paid { background: #d1e7dd; color: #0f5132; }
        </style>
        </head>
        <body>
        <div class="header">
            <div class="company-block">
                <h1>\(companyName)</h1>
                <p>\(companyAddress)</p>
            </div>
            <div class="invoice-meta">
                <h2>TAX INVOICE</h2>
                <p><strong>Invoice #:</strong> \(invoice.invoiceNumber)</p>
                <p><strong>Date:</strong> \(formatter.string(from: invoice.dateCreated))</p>
                <p><span class="status-badge status-\(invoice.status.rawValue.lowercased())">\(invoice.status.rawValue)</span></p>
            </div>
        </div>
        <hr class="divider" />
        <div class="parties">
            <div class="party-block">
                <h3>Bill To</h3>
                <p><strong>\(invoice.clientName)</strong></p>
                <p>\(invoice.clientAddress)</p>
                <p>\(invoice.clientEmail)</p>
                <p><strong>GSTIN:</strong> \(invoice.clientTaxID)</p>
            </div>
            <div class="party-block">
                <h3>From</h3>
                <p><strong>\(companyName)</strong></p>
                <p>\(companyAddress)</p>
            </div>
        </div>
        <table>
            <thead>
                <tr>
                    <th>Description</th>
                    <th>HSN</th>
                    <th>Qty</th>
                    <th>Unit Price</th>
                    <th>Amount</th>
                    <th>Tax%</th>
                    <th>CGST</th>
                    <th>SGST</th>
                    <th>Total</th>
                </tr>
            </thead>
            <tbody>
                \(lineItemsHTML)
            </tbody>
        </table>
        <div class="totals-block">
            <table class="totals-table">
                <tr><td>Subtotal</td><td style="text-align:right;">₹\(String(format: "%.2f", invoice.subtotal))</td></tr>
                <tr><td>CGST</td><td style="text-align:right;">₹\(String(format: "%.2f", invoice.taxTotal / 2))</td></tr>
                <tr><td>SGST</td><td style="text-align:right;">₹\(String(format: "%.2f", invoice.taxTotal / 2))</td></tr>
                <tr class="grand-total-row">
                    <td>Grand Total</td>
                    <td style="text-align:right;">₹\(String(format: "%.2f", invoice.grandTotal))</td>
                </tr>
            </table>
        </div>
        <div class="amount-words" style="margin-top:12px;">
            <strong>Amount in Words:</strong> \(amountInWords)
        </div>
        <div class="footer">
            <div>
                <p style="font-size:10px;color:#999;">Thank you for your business!</p>
                <p style="font-size:9px;color:#bbb;margin-top:4px;">Generated by SimpleInvoice</p>
            </div>
            <div class="signature-block">
                \(signatureHTML)
                <p>Authorized Signature</p>
            </div>
        </div>
        </body>
        </html>
        """
    }

    // MARK: - HTML → PDF

    private static func renderHTMLtoPDF(html: String) -> Data? {
        let fmt = UIMarkupTextPrintFormatter(markupText: html)
        let renderer = UIPrintPageRenderer()
        renderer.addPrintFormatter(fmt, startingAtPageAt: 0)

        let pageSize = CGSize(width: 595.2, height: 841.8) // A4 in points
        let margin = UIEdgeInsets(top: 36, left: 36, bottom: 36, right: 36)
        let printableRect = CGRect(
            x: margin.left, y: margin.top,
            width: pageSize.width - margin.left - margin.right,
            height: pageSize.height - margin.top - margin.bottom
        )

        renderer.setValue(NSValue(cgRect: CGRect(origin: .zero, size: pageSize)), forKey: "paperRect")
        renderer.setValue(NSValue(cgRect: printableRect), forKey: "printableRect")

        let data = NSMutableData()
        UIGraphicsBeginPDFContextToData(data, CGRect(origin: .zero, size: pageSize), nil)

        for pageIndex in 0..<renderer.numberOfPages {
            UIGraphicsBeginPDFPage()
            renderer.drawPage(at: pageIndex, in: UIGraphicsGetPDFContextBounds())
        }

        UIGraphicsEndPDFContext()
        return data as Data
    }
}

// MARK: - ZIP Exporter

import Foundation

enum ZipExporter {
    /// Creates a zip of all PDF files in the Documents directory and returns its URL.
    static func zipAllPDFs() -> URL? {
        let urls = InvoicePDFGenerator.allPDFURLs()
        guard !urls.isEmpty else { return nil }

        let tempDir = FileManager.default.temporaryDirectory
        _ = tempDir.appendingPathComponent("SimpleInvoice_All_\(Date().timeIntervalSince1970).zip")

        // Use a simple file concatenation approach via UIActivityViewController
        // Real ZIP requires a ZIP library or Process; here we bundle as a temp folder
        let bundleDir = tempDir.appendingPathComponent("invoices_bundle", isDirectory: true)
        try? FileManager.default.removeItem(at: bundleDir)
        try? FileManager.default.createDirectory(at: bundleDir, withIntermediateDirectories: true)

        for url in urls {
            let dest = bundleDir.appendingPathComponent(url.lastPathComponent)
            try? FileManager.default.copyItem(at: url, to: dest)
        }

        // Compress using NSFileCoordinator + coordinate zip via shell or native API
        var error: NSError?
        var resultURL: URL?
        let coordinator = NSFileCoordinator()
        coordinator.coordinate(readingItemAt: bundleDir, options: .forUploading, error: &error) { zipTmp in
            resultURL = zipTmp
        }

        if let zipped = resultURL, error == nil {
            // Move to a stable temp location
            let stableURL = tempDir.appendingPathComponent("SimpleInvoice_Export.zip")
            try? FileManager.default.removeItem(at: stableURL)
            try? FileManager.default.copyItem(at: zipped, to: stableURL)
            return stableURL
        }

        return resultURL
    }
}
