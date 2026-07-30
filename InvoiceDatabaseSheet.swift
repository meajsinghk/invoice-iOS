import SwiftUI
import SwiftData
import PDFKit

// MARK: - Invoice Database Sheet

struct InvoiceDatabaseSheet: View {
    @Environment(\.dismiss) private var dismiss
    @Query(sort: \Invoice.dateCreated, order: .reverse) private var invoices: [Invoice]

    @State private var selectedTab = 0
    @State private var showExportSheet = false
    @State private var exportItems: [Any] = []
    @State private var isExporting = false

    var body: some View {
        NavigationStack {
            ZStack {
                Color.black.ignoresSafeArea()
                VStack(spacing: 0) {
                    Picker("Section", selection: $selectedTab) {
                        Text("Archive").tag(0)
                        Text("Insights").tag(1)
                    }
                    .pickerStyle(.segmented)
                    .padding(.horizontal, 16)
                    .padding(.top, 10)
                    .padding(.bottom, 6)

                    if selectedTab == 0 {
                        InvoiceArchiveView(invoices: invoices)
                    } else {
                        InsightsView(invoices: invoices)
                    }
                }
            }
            .navigationTitle("Invoice Database")
            .navigationBarTitleDisplayMode(.inline)
            .toolbarColorScheme(.dark, for: .navigationBar)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Done") { dismiss() }.foregroundStyle(Color.white.opacity(0.7))
                }
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button { exportAllPDFs() } label: {
                        if isExporting {
                            ProgressView().scaleEffect(0.8).tint(.white)
                        } else {
                            Label("Export All", systemImage: "arrow.down.doc.fill")
                                .font(.subheadline).foregroundStyle(Color.white.opacity(0.7))
                        }
                    }
                    .disabled(isExporting || invoices.isEmpty)
                }
            }
        }
        .sheet(isPresented: $showExportSheet) {
            ShareSheet(items: exportItems)
        }
    }

    private func exportAllPDFs() {
        isExporting = true
        DispatchQueue.global(qos: .userInitiated).async {
            let url = ZipExporter.zipAllPDFs()
            DispatchQueue.main.async {
                isExporting = false
                if let url = url { exportItems = [url]; showExportSheet = true }
            }
        }
    }
}

// MARK: - Invoice Archive View

struct InvoiceArchiveView: View {
    let invoices: [Invoice]
    @State private var filterStatus: InvoiceStatus? = nil
    @State private var selectedInvoice: Invoice?
    @Environment(\.modelContext) private var modelContext

    private var filtered: [Invoice] {
        guard let status = filterStatus else { return invoices }
        return invoices.filter { $0.status == status }
    }

    var body: some View {
        VStack(spacing: 0) {
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    FilterChip(label: "All", isSelected: filterStatus == nil) {
                        Haptics.light(); filterStatus = nil
                    }
                    ForEach(InvoiceStatus.allCases, id: \.rawValue) { status in
                        FilterChip(label: status.rawValue, isSelected: filterStatus == status) {
                            Haptics.light()
                            filterStatus = filterStatus == status ? nil : status
                        }
                    }
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 10)
            }

            Divider().background(Color.white.opacity(0.08))

            if filtered.isEmpty {
                VStack(spacing: 14) {
                    Image(systemName: "doc.text.magnifyingglass")
                        .font(.system(size: 44)).foregroundStyle(Color.white.opacity(0.15))
                    Text("No Invoices Found").font(.title3.bold()).foregroundStyle(Color.white)
                    Text(filterStatus == nil ? "Generate your first invoice" : "No \(filterStatus!.rawValue) invoices")
                        .foregroundStyle(Color.white.opacity(0.4))
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity).padding()
            } else {
                List {
                    ForEach(filtered) { invoice in
                        InvoiceArchiveRow(invoice: invoice)
                            .onTapGesture { Haptics.light(); selectedInvoice = invoice }
                            .listRowBackground(Color.white.opacity(0.04))
                            .swipeActions(edge: .trailing, allowsFullSwipe: false) {
                                Button(role: .destructive) { modelContext.delete(invoice) } label: {
                                    Label("Delete", systemImage: "trash")
                                }
                                Button { cycleStatus(invoice) } label: {
                                    Label("Mark \(nextStatus(invoice.status).rawValue)", systemImage: nextStatus(invoice.status).systemImage)
                                }
                                .tint(Color.white.opacity(0.3))
                            }
                    }
                }
                .listStyle(.plain)
                .scrollContentBackground(.hidden)
            }
        }
        .sheet(item: $selectedInvoice) { invoice in
            InvoicePDFPreviewSheet(invoice: invoice)
                .presentationBackground(.ultraThinMaterial)
        }
    }

    private func cycleStatus(_ invoice: Invoice) {
        switch invoice.status {
        case .draft: invoice.status = .sent
        case .sent:  invoice.status = .paid
        case .paid:  invoice.status = .draft
        }
        Haptics.light()
    }

    private func nextStatus(_ status: InvoiceStatus) -> InvoiceStatus {
        switch status {
        case .draft: return .sent
        case .sent:  return .paid
        case .paid:  return .draft
        }
    }
}

// MARK: - Invoice Archive Row

struct InvoiceArchiveRow: View {
    let invoice: Invoice

    private var statusColor: Color {
        switch invoice.status {
        case .draft: return .orange
        case .sent:  return .blue
        case .paid:  return .green
        }
    }

    var body: some View {
        HStack(spacing: 14) {
            RoundedRectangle(cornerRadius: 4)
                .fill(statusColor.opacity(0.8))
                .frame(width: 4, height: 44)

            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    Text(invoice.invoiceNumber).font(.headline).foregroundStyle(Color.white)
                    Spacer()
                    Text("₹\(String(format: "%.2f", invoice.grandTotal))")
                        .font(.headline).foregroundStyle(Color.white)
                }
                HStack {
                    Text(invoice.clientName).font(.subheadline).foregroundStyle(Color.white.opacity(0.5))
                    Spacer()
                    StatusBadge(status: invoice.status)
                }
                Text(invoice.dateCreated, style: .date)
                    .font(.caption).foregroundStyle(Color.white.opacity(0.3))
            }
        }
        .padding(.vertical, 4)
    }
}

// MARK: - Status Badge

struct StatusBadge: View {
    let status: InvoiceStatus

    private var color: Color {
        switch status {
        case .draft: return .orange
        case .sent:  return .blue
        case .paid:  return .green
        }
    }

    var body: some View {
        HStack(spacing: 4) {
            Image(systemName: status.systemImage).font(.system(size: 9))
            Text(status.rawValue).font(.caption2.bold())
        }
        .foregroundStyle(color)
        .padding(.horizontal, 8).padding(.vertical, 4)
        .background(color.opacity(0.15))
        .clipShape(Capsule())
        .overlay { Capsule().stroke(color.opacity(0.25), lineWidth: 0.5) }
    }
}

// MARK: - PDF Preview Sheet

struct InvoicePDFPreviewSheet: View {
    @Environment(\.dismiss) private var dismiss
    let invoice: Invoice

    @State private var pdfDoc: PDFDocument?
    @State private var showShareSheet = false

    var body: some View {
        NavigationStack {
            ZStack {
                Color.black.ignoresSafeArea()
                Group {
                    if let doc = pdfDoc {
                        PDFKitView(document: doc).ignoresSafeArea(edges: .bottom)
                    } else {
                        VStack(spacing: 16) {
                            ProgressView().tint(.white)
                            Text("Loading PDF…").foregroundStyle(Color.white.opacity(0.5))
                        }
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                    }
                }
            }
            .navigationTitle(invoice.invoiceNumber)
            .navigationBarTitleDisplayMode(.inline)
            .toolbarColorScheme(.dark, for: .navigationBar)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Close") { dismiss() }.foregroundStyle(Color.white.opacity(0.7))
                }
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button { showShareSheet = true } label: {
                        Image(systemName: "square.and.arrow.up").foregroundStyle(Color.white)
                    }
                    .disabled(pdfDoc == nil)
                }
            }
            .onAppear { loadPDF() }
            .sheet(isPresented: $showShareSheet) {
                let url = InvoicePDFGenerator.documentsURL(for: invoice.pdfFilename)
                ShareSheet(items: [url])
            }
        }
    }

    private func loadPDF() {
        let url = InvoicePDFGenerator.documentsURL(for: invoice.pdfFilename)
        if let doc = PDFDocument(url: url) {
            pdfDoc = doc
        } else {
            DispatchQueue.global(qos: .userInitiated).async {
                let genURL = InvoicePDFGenerator.generate(for: invoice)
                DispatchQueue.main.async {
                    if let u = genURL, let doc = PDFDocument(url: u) { pdfDoc = doc }
                }
            }
        }
    }
}

// MARK: - PDFKit View

struct PDFKitView: UIViewRepresentable {
    let document: PDFDocument

    func makeUIView(context: Context) -> PDFView {
        let view = PDFView()
        view.document = document
        view.autoScales = true
        view.displayMode = .singlePageContinuous
        view.displayDirection = .vertical
        view.backgroundColor = UIColor.black
        return view
    }

    func updateUIView(_ uiView: PDFView, context: Context) {
        uiView.document = document
    }
}

// MARK: - Filter Chip

struct FilterChip: View {
    let label: String
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(label)
                .font(.subheadline)
                .fontWeight(isSelected ? .semibold : .regular)
                .foregroundStyle(isSelected ? Color.black : Color.white.opacity(0.6))
                .padding(.horizontal, 14).padding(.vertical, 7)
                .background(isSelected ? Color.white : Color.white.opacity(0.06))
                .clipShape(Capsule())
                .overlay {
                    if !isSelected { Capsule().stroke(Color.white.opacity(0.12), lineWidth: 0.5) }
                }
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Share Sheet

struct ShareSheet: UIViewControllerRepresentable {
    let items: [Any]
    func makeUIViewController(context: Context) -> UIActivityViewController {
        UIActivityViewController(activityItems: items, applicationActivities: nil)
    }
    func updateUIViewController(_ uiViewController: UIActivityViewController, context: Context) {}
}

