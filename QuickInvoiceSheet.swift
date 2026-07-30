import SwiftUI
import SwiftData
import PencilKit

// MARK: - Quick Invoice Sheet

struct QuickInvoiceSheet: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(\.modelContext) private var modelContext
    @Query(sort: \Client.name) private var clients: [Client]
    @Query(sort: \WorkRateItem.title) private var workRates: [WorkRateItem]

    // Client selection
    @State private var selectedClient: Client?

    // Auto-filled client fields (editable overrides)
    @State private var clientName = ""
    @State private var clientEmail = ""
    @State private var clientAddress = ""
    @State private var clientTaxID = ""

    // Line items
    @State private var lineItems: [LineItem] = []

    // Signature
    @State private var signatureDrawing = PKDrawing()

    // UI state
    @State private var showAddLineItem = false
    @State private var showMailCompose = false
    @State private var generatedPDFURL: URL?
    @State private var showShareSheet = false
    @State private var isGenerating = false
    @State private var showSuccessBanner = false
    @State private var scrollProxy: ScrollViewProxy?

    // MARK: - Computed totals

    private var subtotal: Double { lineItems.reduce(0) { $0 + $1.subtotal } }
    private var taxTotal: Double { lineItems.reduce(0) { $0 + $1.cgst + $1.sgst } }
    private var grandTotal: Double { subtotal + taxTotal }

    var body: some View {
        NavigationStack {
            ScrollViewReader { proxy in
                ScrollView {
                    VStack(spacing: 20) {
                        clientSection
                        lineItemsSection
                        totalsCard
                        signatureSection
                        actionButtons
                    }
                    .padding(16)
                    .padding(.bottom, 40)
                }
                .onAppear { scrollProxy = proxy }
            }
            .navigationTitle("New Invoice")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
            }
            .overlay(alignment: .top) {
                if showSuccessBanner {
                    successBanner
                        .transition(.move(edge: .top).combined(with: .opacity))
                }
            }
        }
        .sheet(isPresented: $showAddLineItem) {
            AddLineItemSheet(workRates: workRates) { item in
                lineItems.append(item)
            }
        }
        .sheet(isPresented: $showShareSheet) {
            if let url = generatedPDFURL {
                ShareSheet(items: [url])
            }
        }
        .sheet(isPresented: $showMailCompose) {
            if let url = generatedPDFURL {
                MailComposeView(
                    toRecipients: [clientEmail],
                    subject: "Invoice from SimpleInvoice",
                    body: "Dear \(clientName),\n\nPlease find your invoice attached.\n\nRegards",
                    attachments: [(url, "application/pdf", url.lastPathComponent)]
                )
            }
        }
    }

    // MARK: - Client Section

    private var clientSection: some View {
        VStack(alignment: .leading, spacing: 14) {
            SectionHeader(title: "Bill To", icon: "person.fill", color: .indigo)

            // Client picker
            if !clients.isEmpty {
                Menu {
                    ForEach(clients) { client in
                        Button(client.name) { selectClient(client) }
                    }
                    Divider()
                    Button("Manual Entry", action: { selectedClient = nil })
                } label: {
                    HStack {
                        Image(systemName: "person.2.fill")
                            .foregroundStyle(.indigo)
                        Text(selectedClient?.name ?? "Select a client…")
                            .foregroundStyle(selectedClient == nil ? .secondary : .primary)
                        Spacer()
                        Image(systemName: "chevron.up.chevron.down")
                            .font(.caption)
                            .foregroundStyle(.tertiary)
                    }
                    .padding(14)
                    .background(Color(.secondarySystemBackground))
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                }
            }

            VStack(spacing: 10) {
                InvoiceTextField(placeholder: "Client Name", text: $clientName, icon: "person")
                InvoiceTextField(placeholder: "Email", text: $clientEmail, icon: "envelope")
                    .keyboardType(.emailAddress)
                    .textInputAutocapitalization(.never)
                InvoiceTextField(placeholder: "Address", text: $clientAddress, icon: "map")
                InvoiceTextField(placeholder: "GSTIN / Tax ID", text: $clientTaxID, icon: "number.square")
                    .textInputAutocapitalization(.characters)
            }
        }
        .cardStyle()
    }

    // MARK: - Line Items

    private var lineItemsSection: some View {
        VStack(alignment: .leading, spacing: 14) {
            SectionHeader(title: "Line Items", icon: "list.bullet.rectangle.fill", color: .green)

            if lineItems.isEmpty {
                HStack {
                    Spacer()
                    Text("No items yet — tap + to add")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                    Spacer()
                }
                .padding(.vertical, 12)
            } else {
                ForEach(lineItems.indices, id: \.self) { idx in
                    LineItemRow(item: $lineItems[idx]) {
                        withAnimation { lineItems.remove(at: idx) }
                    }
                }
            }

            Button {
                showAddLineItem = true
            } label: {
                HStack {
                    Image(systemName: "plus.circle.fill")
                        .foregroundStyle(.green)
                    Text("Add Item")
                        .fontWeight(.medium)
                        .foregroundStyle(.green)
                }
                .frame(maxWidth: .infinity)
                .padding(12)
                .background(Color.green.opacity(0.08))
                .clipShape(RoundedRectangle(cornerRadius: 10))
                .overlay {
                    RoundedRectangle(cornerRadius: 10)
                        .stroke(Color.green.opacity(0.25), lineWidth: 1)
                }
            }
        }
        .cardStyle()
    }

    // MARK: - Totals Card

    private var totalsCard: some View {
        VStack(spacing: 0) {
            TotalRow(label: "Subtotal", value: subtotal, isGrand: false)
            Divider().padding(.horizontal, 12)
            TotalRow(label: "CGST", value: taxTotal / 2, isGrand: false)
            TotalRow(label: "SGST", value: taxTotal / 2, isGrand: false)
            Divider().padding(.horizontal, 12)
            TotalRow(label: "Grand Total", value: grandTotal, isGrand: true)
        }
        .background {
            RoundedRectangle(cornerRadius: 16)
                .fill(Color(.secondarySystemBackground))
        }
    }

    // MARK: - Signature Section

    private var signatureSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            SectionHeader(title: "Digital Signature", icon: "signature", color: .purple)
            SignaturePadView(drawing: $signatureDrawing)
        }
        .cardStyle()
    }

    // MARK: - Action Buttons

    private var actionButtons: some View {
        VStack(spacing: 12) {
            // Generate PDF button
            Button {
                generateAndSavePDF()
            } label: {
                HStack {
                    if isGenerating {
                        ProgressView()
                            .tint(.white)
                            .scaleEffect(0.8)
                    } else {
                        Image(systemName: "doc.richtext.fill")
                    }
                    Text(isGenerating ? "Generating…" : "Generate & Print PDF")
                        .fontWeight(.semibold)
                }
                .frame(maxWidth: .infinity)
                .padding(16)
                .background(
                    LinearGradient(colors: [.indigo, .purple], startPoint: .leading, endPoint: .trailing)
                )
                .foregroundStyle(.white)
                .clipShape(RoundedRectangle(cornerRadius: 14))
            }
            .disabled(isGenerating || lineItems.isEmpty || clientName.isEmpty)
            .buttonStyle(ScaleButtonStyle())

            // Draft Email button
            Button {
                generateAndSavePDF(thenEmail: true)
            } label: {
                HStack {
                    Image(systemName: "envelope.fill")
                    Text("Draft Email")
                        .fontWeight(.semibold)
                }
                .frame(maxWidth: .infinity)
                .padding(16)
                .background(Color(.secondarySystemBackground))
                .foregroundStyle(.indigo)
                .clipShape(RoundedRectangle(cornerRadius: 14))
                .overlay {
                    RoundedRectangle(cornerRadius: 14)
                        .stroke(.indigo.opacity(0.3), lineWidth: 1)
                }
            }
            .disabled(isGenerating || lineItems.isEmpty || clientName.isEmpty || clientEmail.isEmpty)
            .buttonStyle(ScaleButtonStyle())
        }
    }

    // MARK: - Success Banner

    private var successBanner: some View {
        HStack(spacing: 12) {
            Image(systemName: "checkmark.circle.fill")
                .foregroundStyle(.green)
            Text("Invoice saved!")
                .fontWeight(.semibold)
            Spacer()
            Button("Share") {
                showShareSheet = true
            }
            .foregroundStyle(.indigo)
            .fontWeight(.semibold)
        }
        .padding(14)
        .background {
            RoundedRectangle(cornerRadius: 14)
                .fill(.regularMaterial)
                .shadow(radius: 8)
        }
        .padding(16)
    }

    // MARK: - Actions

    private func selectClient(_ client: Client) {
        selectedClient = client
        clientName = client.name
        clientEmail = client.email
        clientAddress = client.address
        clientTaxID = client.taxID
    }

    private func generateAndSavePDF(thenEmail: Bool = false) {
        guard !lineItems.isEmpty, !clientName.isEmpty else { return }
        isGenerating = true

        let sigData = signatureDrawing.strokes.isEmpty ? nil : signatureDrawing.pngData()
        let invoiceNumber = InvoiceNumberGenerator.next()
        let filename = "\(invoiceNumber).pdf"

        let invoice = Invoice(
            invoiceNumber: invoiceNumber,
            clientName: clientName,
            clientEmail: clientEmail,
            clientAddress: clientAddress,
            clientTaxID: clientTaxID,
            lineItems: lineItems,
            subtotal: subtotal,
            taxTotal: taxTotal,
            grandTotal: grandTotal,
            signatureData: sigData,
            pdfFilename: filename,
            status: .draft
        )

        // Link to selected client if available
        if let client = selectedClient {
            if client.invoices == nil { client.invoices = [] }
            client.invoices?.append(invoice)
        }

        modelContext.insert(invoice)

        DispatchQueue.global(qos: .userInitiated).async {
            let url = InvoicePDFGenerator.generate(for: invoice)
            DispatchQueue.main.async {
                isGenerating = false
                generatedPDFURL = url

                withAnimation(.spring()) { showSuccessBanner = true }
                DispatchQueue.main.asyncAfter(deadline: .now() + 4) {
                    withAnimation { showSuccessBanner = false }
                }

                if thenEmail {
                    DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                        showMailCompose = true
                    }
                } else {
                    showShareSheet = true
                }
            }
        }
    }
}

// MARK: - Line Item Row

struct LineItemRow: View {
    @Binding var item: LineItem
    let onDelete: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(item.title)
                    .font(.subheadline.bold())
                Spacer()
                Button(action: onDelete) {
                    Image(systemName: "xmark.circle.fill")
                        .foregroundStyle(.red.opacity(0.7))
                }
            }

            HStack(spacing: 12) {
                VStack(alignment: .leading, spacing: 2) {
                    Text("Qty")
                        .font(.caption2).foregroundStyle(.secondary)
                    TextField("1", value: $item.quantity, format: .number)
                        .keyboardType(.decimalPad)
                        .textFieldStyle(.roundedBorder)
                        .frame(width: 60)
                }
                VStack(alignment: .leading, spacing: 2) {
                    Text("Rate (₹)")
                        .font(.caption2).foregroundStyle(.secondary)
                    TextField("0", value: $item.unitPrice, format: .number)
                        .keyboardType(.decimalPad)
                        .textFieldStyle(.roundedBorder)
                        .frame(width: 80)
                }
                VStack(alignment: .leading, spacing: 2) {
                    Text("Tax%")
                        .font(.caption2).foregroundStyle(.secondary)
                    TextField("18", value: $item.taxPercentage, format: .number)
                        .keyboardType(.decimalPad)
                        .textFieldStyle(.roundedBorder)
                        .frame(width: 56)
                }
                Spacer()
                VStack(alignment: .trailing, spacing: 2) {
                    Text("Total")
                        .font(.caption2).foregroundStyle(.secondary)
                    Text("₹\(String(format: "%.2f", item.total))")
                        .font(.subheadline.bold())
                        .foregroundStyle(.green)
                }
            }
        }
        .padding(12)
        .background(Color(.tertiarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }
}

// MARK: - Total Row

struct TotalRow: View {
    let label: String
    let value: Double
    let isGrand: Bool

    var body: some View {
        HStack {
            Text(label)
                .font(isGrand ? .headline : .subheadline)
                .fontWeight(isGrand ? .bold : .regular)
            Spacer()
            Text("₹\(String(format: "%.2f", value))")
                .font(isGrand ? .headline : .subheadline)
                .fontWeight(isGrand ? .bold : .regular)
                .foregroundStyle(isGrand ? .indigo : .primary)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, isGrand ? 14 : 10)
        .background(isGrand ? Color.indigo.opacity(0.06) : Color.clear)
    }
}

// MARK: - Add Line Item Sheet

struct AddLineItemSheet: View {
    @Environment(\.dismiss) private var dismiss
    let workRates: [WorkRateItem]
    let onAdd: (LineItem) -> Void

    @State private var title = ""
    @State private var hsnCode = ""
    @State private var quantity = "1"
    @State private var unitPrice = ""
    @State private var taxPercentage = "18"
    @State private var selectedRate: WorkRateItem?

    var body: some View {
        NavigationStack {
            Form {
                if !workRates.isEmpty {
                    Section("Quick Pick from Work Rates") {
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 10) {
                                ForEach(workRates) { rate in
                                    Button {
                                        applyRate(rate)
                                    } label: {
                                        VStack(alignment: .leading, spacing: 4) {
                                            Text(rate.title)
                                                .font(.caption.bold())
                                                .foregroundStyle(selectedRate?.id == rate.id ? .white : .primary)
                                            Text("₹\(String(format: "%.0f", rate.unitRate))")
                                                .font(.caption2)
                                                .foregroundStyle(selectedRate?.id == rate.id ? .white.opacity(0.8) : .secondary)
                                        }
                                        .padding(.horizontal, 12)
                                        .padding(.vertical, 8)
                                        .background(
                                            selectedRate?.id == rate.id
                                            ? AnyShapeStyle(LinearGradient(colors: [.indigo, .purple], startPoint: .leading, endPoint: .trailing))
                                            : AnyShapeStyle(Color(.secondarySystemBackground))
                                        )
                                        .clipShape(Capsule())
                                    }
                                }
                            }
                            .padding(.vertical, 4)
                        }
                    }
                }

                Section("Item Details") {
                    LabeledTextField("Description", text: $title, icon: "tag.fill")
                    LabeledTextField("HSN Code", text: $hsnCode, icon: "number")
                }

                Section("Pricing") {
                    HStack {
                        Image(systemName: "number.circle.fill").foregroundStyle(.blue).frame(width: 20)
                        TextField("Quantity", text: $quantity).keyboardType(.decimalPad)
                    }
                    HStack {
                        Image(systemName: "indianrupeesign.circle.fill").foregroundStyle(.green).frame(width: 20)
                        TextField("Unit Price (₹)", text: $unitPrice).keyboardType(.decimalPad)
                    }
                    HStack {
                        Image(systemName: "percent").foregroundStyle(.orange).frame(width: 20)
                        TextField("Tax %", text: $taxPercentage).keyboardType(.decimalPad)
                        Text("%").foregroundStyle(.secondary)
                    }
                }

                if let qty = Double(quantity), let price = Double(unitPrice), let tax = Double(taxPercentage) {
                    let item = LineItem(title: title, hsnCode: hsnCode, quantity: qty, unitPrice: price, taxPercentage: tax)
                    Section("Preview") {
                        HStack { Text("Subtotal"); Spacer(); Text("₹\(String(format: "%.2f", item.subtotal))") }
                        HStack { Text("CGST"); Spacer(); Text("₹\(String(format: "%.2f", item.cgst))") }
                        HStack { Text("SGST"); Spacer(); Text("₹\(String(format: "%.2f", item.sgst))") }
                        HStack {
                            Text("Total").fontWeight(.semibold)
                            Spacer()
                            Text("₹\(String(format: "%.2f", item.total))").fontWeight(.semibold).foregroundStyle(.green)
                        }
                    }
                }
            }
            .navigationTitle("Add Item")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Cancel") { dismiss() } }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Add") {
                        addItem()
                    }
                    .fontWeight(.semibold)
                    .disabled(title.isEmpty || Double(unitPrice) == nil)
                }
            }
        }
    }

    private func applyRate(_ rate: WorkRateItem) {
        selectedRate = rate
        title = rate.title
        hsnCode = rate.hsnCode
        unitPrice = String(rate.unitRate)
        taxPercentage = String(rate.defaultTaxPercentage)
    }

    private func addItem() {
        let item = LineItem(
            title: title,
            hsnCode: hsnCode,
            quantity: Double(quantity) ?? 1,
            unitPrice: Double(unitPrice) ?? 0,
            taxPercentage: Double(taxPercentage) ?? 18
        )
        onAdd(item)
        dismiss()
    }
}

// MARK: - Invoice Text Field

struct InvoiceTextField: View {
    let placeholder: String
    @Binding var text: String
    let icon: String

    var body: some View {
        HStack(spacing: 10) {
            Image(systemName: icon)
                .font(.system(size: 14))
                .foregroundStyle(.secondary)
                .frame(width: 20)
            TextField(placeholder, text: $text)
                .font(.subheadline)
        }
        .padding(12)
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 10))
    }
}

// MARK: - Section Header

struct SectionHeader: View {
    let title: String
    let icon: String
    let color: Color

    var body: some View {
        HStack(spacing: 8) {
            Image(systemName: icon)
                .font(.system(size: 14, weight: .semibold))
                .foregroundStyle(color)
            Text(title)
                .font(.headline)
        }
    }
}

// MARK: - Card Style Modifier

extension View {
    func cardStyle() -> some View {
        self
            .padding(16)
            .background {
                RoundedRectangle(cornerRadius: 18)
                    .fill(Color(.systemBackground))
                    .shadow(color: .black.opacity(0.06), radius: 10, x: 0, y: 3)
            }
            .overlay {
                RoundedRectangle(cornerRadius: 18)
                    .stroke(Color(.separator).opacity(0.3), lineWidth: 0.5)
            }
    }
}
