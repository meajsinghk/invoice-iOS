import UIKit
import PDFKit

// MARK: - Invoice PDF Generator

final class InvoicePDFGenerator {

    // MARK: - Public API

    @discardableResult
    static func generate(for invoice: Invoice, profile: CompanyProfile = CompanyProfile()) -> URL? {
        let html = buildHTML(for: invoice, profile: profile)
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

    private static func buildHTML(for invoice: Invoice, profile: CompanyProfile) -> String {
        let formatter = DateFormatter()
        formatter.dateStyle = .long
        let dateString = formatter.string(from: invoice.dateCreated)

        // Line items rows
        let lineItemsHTML = invoice.lineItems.enumerated().map { (index, item) in
            """
            <tr>
                <td style="text-align:center;">\(index + 1)</td>
                <td>\(item.title)</td>
                <td style="text-align:center;">\(item.hsnCode)</td>
                <td style="text-align:center;">\(String(format: "%.2f", item.quantity))</td>
                <td style="text-align:right;">&#8377;\(String(format: "%.2f", item.unitPrice))</td>
                <td style="text-align:right;font-weight:600;">&#8377;\(String(format: "%.2f", item.subtotal))</td>
            </tr>
            """
        }.joined()

        // Signature block
        let signatureHTML: String
        if let sigData = invoice.signatureData, UIImage(data: sigData) != nil {
            let base64 = sigData.base64EncodedString()
            signatureHTML = "<img src='data:image/png;base64,\(base64)' style='max-width:200px;max-height:70px;display:block;margin:8px auto;' />"
        } else {
            signatureHTML = "<div style='height:60px;'></div>"
        }

        let amountInWords = NumberToWords.inWords(invoice.grandTotal)
        let cgstAmount = invoice.taxTotal / 2
        let sgstAmount = invoice.taxTotal / 2

        // Terms HTML
        let termsHTML = profile.termsAndConditions.enumerated().map { (i, t) in
            "<li>\(t)</li>"
        }.joined()

        return """
        <!DOCTYPE html>
        <html>
        <head>
        <meta charset="UTF-8"/>
        <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body {
                font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
                font-size: 10.5px;
                color: #111;
                padding: 24px 28px;
                background: #fff;
            }

            /* ── HEADER ── */
            .header { text-align: center; padding-bottom: 10px; border-bottom: 2px solid #111; margin-bottom: 10px; }
            .header .company-name {
                font-size: 22px;
                font-weight: 900;
                text-transform: uppercase;
                letter-spacing: 1.5px;
                color: #000;
                margin-bottom: 3px;
            }
            .header .tagline { font-size: 11px; font-weight: 700; color: #333; margin-bottom: 2px; text-transform: uppercase; letter-spacing: 0.5px; }
            .header .services { font-size: 10px; color: #555; margin-bottom: 5px; font-style: italic; }
            .header .address { font-size: 10px; color: #444; margin-bottom: 5px; }
            .header .badges {
                display: inline-flex; gap: 16px; font-size: 9.5px;
                font-weight: 700; color: #000; letter-spacing: 0.3px;
            }
            .header .badge-sep { color: #aaa; }

            /* ── INVOICE TITLE ── */
            .invoice-title {
                text-align: center;
                font-size: 14px;
                font-weight: 900;
                text-transform: uppercase;
                letter-spacing: 3px;
                color: #000;
                padding: 7px 0;
                border-bottom: 1px solid #ccc;
                margin-bottom: 10px;
            }

            /* ── META BLOCK ── */
            .meta-block { display: flex; justify-content: space-between; margin-bottom: 12px; }
            .meta-left { font-size: 10.5px; line-height: 1.9; }
            .meta-left .label { font-weight: 700; color: #000; }
            .meta-right { font-size: 10.5px; text-align: right; line-height: 1.9; }
            .meta-right .label { font-weight: 700; }

            /* ── TABLE ── */
            table { width: 100%; border-collapse: collapse; margin-bottom: 0; }
            thead th {
                background: #111;
                color: #fff;
                padding: 7px 8px;
                font-size: 9.5px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                border: 1px solid #111;
            }
            tbody td {
                padding: 7px 8px;
                border: 1px solid #ddd;
                font-size: 10px;
                vertical-align: middle;
            }
            tbody tr:nth-child(even) { background: #f8f8f8; }
            tbody tr:last-child td { border-bottom: 1px solid #111; }

            /* ── TOTALS ── */
            .totals-section { display: flex; justify-content: flex-end; margin-top: 0; border: 1px solid #ddd; border-top: none; }
            .totals-table { width: 300px; border-collapse: collapse; }
            .totals-table td { padding: 5px 10px; font-size: 10.5px; border-bottom: 1px solid #eee; }
            .totals-table td:last-child { text-align: right; }
            .totals-table .grand-row td {
                font-size: 12px; font-weight: 800; color: #000;
                background: #f0f0f0; border-top: 2px solid #111;
                border-bottom: 2px solid #111;
            }
            .amount-words {
                margin-top: 8px;
                padding: 8px 12px;
                background: #f5f5f5;
                border-left: 3px solid #111;
                font-size: 10px;
                font-style: italic;
                color: #333;
                border-radius: 0 4px 4px 0;
            }

            /* ── FOOTER ── */
            .footer {
                display: flex;
                justify-content: space-between;
                margin-top: 18px;
                padding-top: 14px;
                border-top: 1px solid #ccc;
                gap: 20px;
            }
            .footer-left { flex: 1; font-size: 10px; line-height: 1.8; }
            .footer-left h4 {
                font-size: 10px;
                text-transform: uppercase;
                letter-spacing: 0.8px;
                color: #000;
                margin-bottom: 4px;
                font-weight: 800;
            }
            .footer-left ul { padding-left: 14px; color: #444; }
            .footer-left li { margin-bottom: 2px; }
            .bank-detail .key { font-weight: 700; color: #000; }

            .signatory-box {
                width: 220px;
                border: 1px solid #ccc;
                border-radius: 6px;
                padding: 10px 14px;
                text-align: center;
                font-size: 10px;
            }
            .signatory-box .for-ms { font-weight: 800; font-size: 11px; text-transform: uppercase; margin-bottom: 2px; }
            .signatory-box .role { color: #666; margin-bottom: 4px; font-size: 9.5px; }
            .signatory-box .sig-name { font-weight: 700; margin-top: 6px; font-size: 10.5px; }
        </style>
        </head>
        <body>

        <!-- HEADER -->
        <div class="header">
            <div class="company-name">\(profile.companyName)</div>
            <div class="tagline">\(profile.businessTagline)</div>
            <div class="services">\(profile.businessServices)</div>
            <div class="address">\(profile.addressLine1), \(profile.addressLine2)</div>
            <div class="badges">
                <span>GSTIN: \(profile.companyGSTIN)</span>
                <span class="badge-sep">|</span>
                <span>PAN: \(profile.companyPAN)</span>
                <span class="badge-sep">|</span>
                <span>Phone: \(profile.companyPhone)</span>
            </div>
        </div>

        <!-- TITLE -->
        <div class="invoice-title">Tax Invoice</div>

        <!-- META -->
        <div class="meta-block">
            <div class="meta-left">
                <div><span class="label">Invoice No.:</span> \(invoice.invoiceNumber)</div>
                <div><span class="label">Billed To:</span> \(invoice.clientName)</div>
                <div><span class="label">Address:</span> \(invoice.clientAddress)</div>
                <div><span class="label">Party GSTIN:</span> \(invoice.clientGSTIN.isEmpty ? "N/A" : invoice.clientGSTIN)</div>
                \(invoice.clientPhone.isEmpty ? "" : "<div><span class=\"label\">Phone:</span> \(invoice.clientPhone)</div>")
            </div>
            <div class="meta-right">
                <div><span class="label">Date:</span> \(dateString)</div>
                <div><span class="label">Status:</span> \(invoice.status.rawValue)</div>
            </div>
        </div>

        <!-- LINE ITEMS TABLE -->
        <table>
            <thead>
                <tr>
                    <th style="width:5%;">S.No</th>
                    <th style="width:38%; text-align:left;">Particular Details</th>
                    <th style="width:12%;">HSN Code</th>
                    <th style="width:10%;">Qty</th>
                    <th style="width:15%; text-align:right;">Rate</th>
                    <th style="width:20%; text-align:right;">Amount</th>
                </tr>
            </thead>
            <tbody>
                \(lineItemsHTML)
            </tbody>
        </table>

        <!-- TOTALS -->
        <div class="totals-section">
            <table class="totals-table">
                <tr><td>Subtotal</td><td>&#8377;\(String(format: "%.2f", invoice.subtotal))</td></tr>
                <tr><td>CGST (9%)</td><td>&#8377;\(String(format: "%.2f", cgstAmount))</td></tr>
                <tr><td>SGST (9%)</td><td>&#8377;\(String(format: "%.2f", sgstAmount))</td></tr>
                <tr class="grand-row"><td>Estimated Grand Total</td><td>&#8377;\(String(format: "%.2f", invoice.grandTotal))</td></tr>
            </table>
        </div>
        <div class="amount-words"><strong>Amount in Words:</strong> \(amountInWords)</div>

        <!-- FOOTER -->
        <div class="footer">
            <div class="footer-left">
                <h4>Bank Details for Payment</h4>
                <div class="bank-detail"><span class="key">Bank Name &amp; Branch:</span> \(profile.bankNameAndBranch)</div>
                <div class="bank-detail"><span class="key">Account No.:</span> \(profile.bankAccountNo)</div>
                <div class="bank-detail"><span class="key">IFSC Code:</span> \(profile.bankIFSCCode)</div>

                <br/>
                <h4>Terms &amp; Conditions</h4>
                <ul>
                    \(termsHTML)
                </ul>
            </div>

            <div class="signatory-box">
                <div class="for-ms">For M/S \(profile.companyName)</div>
                <div class="role">Proprietor / Authorised Signatory</div>
                \(signatureHTML)
                <div style="border-top:1px solid #aaa; padding-top:6px; margin-top:4px;">
                    <div class="sig-name">\(profile.authorizedSignatoryName)</div>
                </div>
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

        let pageSize = CGSize(width: 595.2, height: 841.8) // A4
        let margin = UIEdgeInsets(top: 28, left: 28, bottom: 28, right: 28)
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
