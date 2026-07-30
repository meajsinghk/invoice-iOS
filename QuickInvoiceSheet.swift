import SwiftUI
import SwiftData
import PencilKit

// MARK: - Quick Invoice Sheet

struct QuickInvoiceSheet: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(\.modelContext) private var modelContext
    @Query(sort: \Client.name) private var clients: [Client]
    @Query(sort: \WorkRateItem.title) private var workRates: [WorkRateItem]
    @Query private var profiles: [CompanyProfile]

    @State private var selectedClient: Client?
    @State private var clientName = ""
    @State private var clientEmail = ""
    @State private var clientAddress = ""
    @State private var clientGSTIN = ""
    @State private var clientPhone = ""
    @State private var lineItems: [LineItem] = []
    @State private var signatureDrawing = PKDrawing()
    @State private var showAddLineItem = false
    @State private var showMailCompose = false
    @State private var generatedPDFURL: URL?
    @State private var showShareSheet = false
    @State private var isGenerating = false
    @State private var showSuccessBanner = false

    private var subtotal: Double { lineItems.reduce(0) { $0 + $1.subtotal } }
    private var taxTotal: Double { lineItems.reduce(0) { $0 + $1.cgst + $1.sgst } }
    private var grandTotal: Double { subtotal + taxTotal }
    private var profile: CompanyProfile { profiles.first ?? CompanyProfile() }

    var body: some View {
        NavigationStack {
            ZStack {
                Color.black.ignoresSafeArea()
                ScrollView {
                    VStack(spacing: 16) {
                        clientSection
                        lineItemsSection
                        if !lineItems.isEmpty { totalsCard }
                        signatureSection
                        actionButtons
                    }
                    .padding(16)
                    .padding(.bottom, 40)
                }
            }
            .navigationTitle("New Invoice")
            .navigationBarTitleDisplayMode(.inline)
            .toolbarColorScheme(.dark, for: .navigationBar)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }.foregroundStyle(Color.white.opacity(0.7))
                }
            }
            .overlay(alignment: .top) {
                if showSuccessBanner {
                    successBanner.transition(.move(edge: .top).combined(with: .opacity))
                }
            }
        }
        .sheet(isPresented: $showAddLineItem) {
            AddLineItemSheet(workRates: workRates) { lineItems.append($0) }
                .presentationBackground(.ultraThinMaterial)
        }
        .sheet(isPresented: $showShareSheet) {
            if let url = generatedPDFURL { ShareSheet(items: [url]) }
        }
        .sheet(isPresented: $showMailCompose) {
            if let url = generatedPDFURL {
                MailComposeView(
                    toRecipients: [clientEmail],
                    subject: "Invoice from \(profile.companyName)",
                    body: "Dear \(clientName),\n\nPlease find your invoice attached.\n\nRegards",
                    attachments: [(url, "application/pdf", url.lastPathComponent)]
                )
            }
        }
    }

    // MARK: - Client Section

    private var clientSection: some View {
        ClientSectionView(
            clients: clients,
            selectedClient: $selectedClient,
            clientName: $clientName,
            clientEmail: $clientEmail,
            clientAddress: $clientAddress,
            clientGSTIN: $clientGSTIN,
            clientPhone: $clientPhone,
            onSelect: selectClient
        )
    }

    // MARK: - Line Items

    private var lineItemsSection: some View {
        LineItemsSectionView(lineItems: $lineItems, showAddLineItem: $showAddLineItem)
    }

    // MARK: - Totals Card

    private var totalsCard: some View {
        VStack(spacing: 0) {
            TotalRow(label: "Subtotal", value: subtotal, isGrand: false)
            Divider().background(Color.white.opacity(0.1)).padding(.horizontal, 12)
            TotalRow(label: "CGST (9%)", value: taxTotal / 2, isGrand: false)
            TotalRow(label: "SGST (9%)", value: taxTotal / 2, isGrand: false)
            Divider().background(Color.white.opacity(0.1)).padding(.horizontal, 12)
            TotalRow(label: "Grand Total", value: grandTotal, isGrand: true)
        }
        .darkGlassCard()
    }

    // MARK: - Signature Section

    private var signatureSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            SectionHeader(title: "Digital Signature", icon: "signature")
            SignaturePadView(drawing: $signatureDrawing)
        }
        .padding(16)
        .darkGlassCard()
    }

    // MARK: - Action Buttons

    private var actionButtons: some View {
        VStack(spacing: 12) {
            Button { generateAndSavePDF() } label: {
                GeneratePDFLabel(isGenerating: isGenerating)
            }
            .disabled(isGenerating || lineItems.isEmpty || clientName.isEmpty)
            .buttonStyle(ScaleButtonStyle())

            Button { generateAndSavePDF(thenEmail: true) } label: {
                HStack {
                    Image(systemName: "envelope.fill")
                    Text("Draft Email").fontWeight(.semibold)
                }
                .frame(maxWidth: .infinity)
                .padding(16)
                .background(Color.white.opacity(0.06))
                .foregroundStyle(Color.white)
                .clipShape(RoundedRectangle(cornerRadius: 14))
                .overlay { RoundedRectangle(cornerRadius: 14).stroke(Color.white.opacity(0.15), lineWidth: 1) }
            }
            .disabled(isGenerating || lineItems.isEmpty || clientName.isEmpty || clientEmail.isEmpty)
            .buttonStyle(ScaleButtonStyle())
        }
    }

    // MARK: - Success Banner

    private var successBanner: some View {
        HStack(spacing: 12) {
            Image(systemName: "checkmark.circle.fill").foregroundStyle(Color.white)
            Text("Invoice saved!").fontWeight(.semibold).foregroundStyle(Color.white)
            Spacer()
            Button("Share") { showShareSheet = true }
                .foregroundStyle(Color.white.opacity(0.7)).fontWeight(.semibold)
        }
        .padding(14)
        .background { RoundedRectangle(cornerRadius: 14).fill(.ultraThinMaterial).shadow(radius: 8) }
        .padding(16)
    }

    // MARK: - Actions

    private func selectClient(_ client: Client) {
        selectedClient = client
        clientName = client.name; clientEmail = client.email
        clientAddress = client.address; clientGSTIN = client.gstin
        clientPhone = client.phone
    }

    private func generateAndSavePDF(thenEmail: Bool = false) {
        guard !lineItems.isEmpty, !clientName.isEmpty else { return }
        isGenerating = true
        let sigData = signatureDrawing.strokes.isEmpty ? nil : signatureDrawing.pngData()
        let invoiceNumber = InvoiceNumberGenerator.next()

        let invoice = Invoice(
            invoiceNumber: invoiceNumber,
            clientName: clientName, clientEmail: clientEmail,
            clientAddress: clientAddress, clientGSTIN: clientGSTIN,
            clientPhone: clientPhone,
            lineItems: lineItems, subtotal: subtotal,
            taxTotal: taxTotal, grandTotal: grandTotal,
            signatureData: sigData, pdfFilename: "\(invoiceNumber).pdf",
            status: .draft
        )

        if let client = selectedClient {
            if client.invoices == nil { client.invoices = [] }
            client.invoices?.append(invoice)
        }
        modelContext.insert(invoice)

        let currentProfile = profile
        DispatchQueue.global(qos: .userInitiated).async {
            let url = InvoicePDFGenerator.generate(for: invoice, profile: currentProfile)
            DispatchQueue.main.async {
                isGenerating = false
                generatedPDFURL = url
                Haptics.success()
                withAnimation(.spring(response: 0.35, dampingFraction: 0.8)) { showSuccessBanner = true }
                DispatchQueue.main.asyncAfter(deadline: .now() + 4) {
                    withAnimation { showSuccessBanner = false }
                }
                if thenEmail {
                    DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) { showMailCompose = true }
                } else {
                    showShareSheet = true
                }
            }
        }
    }
}

// MARK: - Generate PDF Label

struct GeneratePDFLabel: View {
    let isGenerating: Bool
    var body: some View {
        HStack {
            if isGenerating { ProgressView().tint(.black).scaleEffect(0.8) }
            else { Image(systemName: "doc.richtext.fill") }
            Text(isGenerating ? "Generating…" : "Generate & Print PDF").fontWeight(.semibold)
        }
        .frame(maxWidth: .infinity)
        .padding(16)
        .background(Color.white)
        .foregroundStyle(Color.black)
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }
}

// MARK: - Client Section View

struct ClientSectionView: View {
    let clients: [Client]
    @Binding var selectedClient: Client?
    @Binding var clientName: String
    @Binding var clientEmail: String
    @Binding var clientAddress: String
    @Binding var clientGSTIN: String
    @Binding var clientPhone: String
    let onSelect: (Client) -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            SectionHeader(title: "Bill To", icon: "person.fill")

            if !clients.isEmpty {
                Menu {
                    ForEach(clients) { client in
                        Button(client.name) { Haptics.light(); onSelect(client) }
                    }
                    Divider()
                    Button("Manual Entry") { selectedClient = nil }
                } label: {
                    HStack {
                        Image(systemName: "person.2.fill").foregroundStyle(Color.white.opacity(0.6))
                        Text(selectedClient?.name ?? "Select a client…")
                            .foregroundStyle(selectedClient == nil ? Color.white.opacity(0.4) : Color.white)
                        Spacer()
                        Image(systemName: "chevron.up.chevron.down").font(.caption).foregroundStyle(Color.white.opacity(0.35))
                    }
                    .padding(14)
                    .background(Color.white.opacity(0.06))
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                    .overlay { RoundedRectangle(cornerRadius: 12).stroke(Color.white.opacity(0.1), lineWidth: 0.8) }
                }
            }

            VStack(spacing: 8) {
                InvoiceTextField(placeholder: "Client Name", text: $clientName, icon: "person")
                InvoiceTextField(placeholder: "Email", text: $clientEmail, icon: "envelope")
                    .keyboardType(.emailAddress).textInputAutocapitalization(.never)
                InvoiceTextField(placeholder: "Phone", text: $clientPhone, icon: "phone")
                    .keyboardType(.phonePad)
                InvoiceTextField(placeholder: "Address", text: $clientAddress, icon: "map")
                InvoiceTextField(placeholder: "Party GSTIN", text: $clientGSTIN, icon: "number.square")
                    .textInputAutocapitalization(.characters)
            }
        }
        .padding(16)
        .darkGlassCard()
    }
}

// MARK: - Line Items Section View

struct LineItemsSectionView: View {
    @Binding var lineItems: [LineItem]
    @Binding var showAddLineItem: Bool

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            SectionHeader(title: "Line Items", icon: "list.bullet.rectangle.fill")

            if lineItems.isEmpty {
                HStack {
                    Spacer()
                    Text("No items yet — tap + to add")
                        .font(.subheadline).foregroundStyle(Color.white.opacity(0.3))
                    Spacer()
                }
                .padding(.vertical, 12)
            } else {
                ForEach($lineItems) { $item in
                    LineItemRow(item: $item) {
                        withAnimation(.spring(response: 0.35, dampingFraction: 0.8)) {
                            lineItems.removeAll { $0.id == item.id }
                        }
                    }
                }
            }

            Button { Haptics.light(); showAddLineItem = true } label: {
                HStack {
                    Image(systemName: "plus.circle.fill").foregroundStyle(Color.white.opacity(0.7))
                    Text("Add Item").fontWeight(.medium).foregroundStyle(Color.white.opacity(0.7))
                }
                .frame(maxWidth: .infinity).padding(12)
                .background(Color.white.opacity(0.06))
                .clipShape(RoundedRectangle(cornerRadius: 10))
                .overlay { RoundedRectangle(cornerRadius: 10).stroke(Color.white.opacity(0.12), lineWidth: 0.8) }
            }
        }
        .padding(16)
        .darkGlassCard()
    }
}

// MARK: - Line Item Row

struct LineItemRow: View {
    @Binding var item: LineItem
    let onDelete: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(item.title).font(.subheadline.bold()).foregroundStyle(Color.white)
                Spacer()
                Button(action: onDelete) {
                    Image(systemName: "xmark.circle.fill").foregroundStyle(Color.white.opacity(0.4))
                }
            }
            HStack(spacing: 12) {
                miniField("Qty", value: $item.quantity, width: 60)
                miniField("Rate ₹", value: $item.unitPrice, width: 80)
                miniField("Tax%", value: $item.taxPercentage, width: 56)
                Spacer()
                VStack(alignment: .trailing, spacing: 2) {
                    Text("Total").font(.caption2).foregroundStyle(Color.white.opacity(0.35))
                    Text("₹\(String(format: "%.2f", item.total))").font(.subheadline.bold()).foregroundStyle(Color.white)
                }
            }
        }
        .padding(12)
        .background(Color.white.opacity(0.04))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .overlay { RoundedRectangle(cornerRadius: 12).stroke(Color.white.opacity(0.08), lineWidth: 0.5) }
    }

    @ViewBuilder
    private func miniField(_ label: String, value: Binding<Double>, width: CGFloat) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(label).font(.caption2).foregroundStyle(Color.white.opacity(0.35))
            TextField("0", value: value, format: .number)
                .keyboardType(.decimalPad)
                .foregroundStyle(Color.white)
                .padding(6)
                .background(Color.white.opacity(0.06))
                .clipShape(RoundedRectangle(cornerRadius: 7))
                .frame(width: width)
        }
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
                .foregroundStyle(isGrand ? Color.white : Color.white.opacity(0.6))
            Spacer()
            Text("₹\(String(format: "%.2f", value))")
                .font(isGrand ? .headline : .subheadline)
                .fontWeight(isGrand ? .bold : .regular)
                .foregroundStyle(isGrand ? Color.white : Color.white.opacity(0.6))
        }
        .padding(.horizontal, 16)
        .padding(.vertical, isGrand ? 14 : 10)
        .background(isGrand ? Color.white.opacity(0.06) : Color.clear)
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
            ZStack {
                Color.black.ignoresSafeArea()
                Form {
                    if !workRates.isEmpty {
                        Section {
                            ScrollView(.horizontal, showsIndicators: false) {
                                HStack(spacing: 10) {
                                    ForEach(workRates) { rate in
                                        Button { applyRate(rate) } label: {
                                            VStack(alignment: .leading, spacing: 4) {
                                                Text(rate.title).font(.caption.bold())
                                                    .foregroundStyle(selectedRate?.id == rate.id ? Color.black : Color.white)
                                                Text("₹\(String(format: "%.0f", rate.unitRate))")
                                                    .font(.caption2)
                                                    .foregroundStyle(selectedRate?.id == rate.id ? Color.black.opacity(0.7) : Color.white.opacity(0.5))
                                            }
                                            .padding(.horizontal, 12).padding(.vertical, 8)
                                            .background(selectedRate?.id == rate.id ? Color.white : Color.white.opacity(0.08))
                                            .clipShape(Capsule())
                                        }
                                    }
                                }
                                .padding(.vertical, 4)
                            }
                        } header: { Text("Quick Pick").foregroundStyle(Color.white.opacity(0.4)) }
                        .listRowBackground(Color.white.opacity(0.04))
                    }

                    Section {
                        darkRow("tag.fill", label: "Description", text: $title)
                        darkRow("number", label: "HSN Code", text: $hsnCode)
                    } header: { Text("Item Details").foregroundStyle(Color.white.opacity(0.4)) }

                    Section {
                        darkRow("number.circle.fill", label: "Quantity", text: $quantity, pad: .decimalPad)
                        darkRow("indianrupeesign.circle.fill", label: "Unit Price (₹)", text: $unitPrice, pad: .decimalPad)
                        darkRow("percent", label: "Tax %", text: $taxPercentage, pad: .decimalPad)
                    } header: { Text("Pricing").foregroundStyle(Color.white.opacity(0.4)) }

                    if let qty = Double(quantity), let price = Double(unitPrice), let tax = Double(taxPercentage) {
                        let item = LineItem(title: title, hsnCode: hsnCode, quantity: qty, unitPrice: price, taxPercentage: tax)
                        Section {
                            previewRow("Subtotal", value: item.subtotal)
                            previewRow("CGST (9%)", value: item.cgst)
                            previewRow("SGST (9%)", value: item.sgst)
                            previewRow("Total", value: item.total, bold: true)
                        } header: { Text("Preview").foregroundStyle(Color.white.opacity(0.4)) }
                    }
                }
                .scrollContentBackground(.hidden)
            }
            .navigationTitle("Add Item")
            .navigationBarTitleDisplayMode(.inline)
            .toolbarColorScheme(.dark, for: .navigationBar)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }.foregroundStyle(Color.white.opacity(0.7))
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Add") { addItem() }.fontWeight(.semibold).foregroundStyle(Color.white)
                        .disabled(title.isEmpty || Double(unitPrice) == nil)
                }
            }
        }
    }

    @ViewBuilder
    private func darkRow(_ icon: String, label: String, text: Binding<String>, pad: UIKeyboardType = .default) -> some View {
        HStack(spacing: 10) {
            Image(systemName: icon).foregroundStyle(Color.white.opacity(0.5)).frame(width: 20)
            TextField(label, text: text).foregroundStyle(Color.white).keyboardType(pad)
        }
        .listRowBackground(Color.white.opacity(0.06))
    }

    @ViewBuilder
    private func previewRow(_ label: String, value: Double, bold: Bool = false) -> some View {
        HStack {
            Text(label).fontWeight(bold ? .semibold : .regular).foregroundStyle(Color.white)
            Spacer()
            Text("₹\(String(format: "%.2f", value))")
                .foregroundStyle(bold ? Color.white : Color.white.opacity(0.6))
                .fontWeight(bold ? .semibold : .regular)
        }
        .listRowBackground(Color.white.opacity(0.06))
    }

    private func applyRate(_ rate: WorkRateItem) {
        Haptics.light()
        selectedRate = rate; title = rate.title; hsnCode = rate.hsnCode
        unitPrice = String(rate.unitRate); taxPercentage = String(rate.defaultTaxPercentage)
    }

    private func addItem() {
        let item = LineItem(title: title, hsnCode: hsnCode,
                            quantity: Double(quantity) ?? 1,
                            unitPrice: Double(unitPrice) ?? 0,
                            taxPercentage: Double(taxPercentage) ?? 18)
        onAdd(item); dismiss()
    }
}

// MARK: - Invoice Text Field

struct InvoiceTextField: View {
    let placeholder: String
    @Binding var text: String
    let icon: String

    var body: some View {
        HStack(spacing: 10) {
            Image(systemName: icon).font(.system(size: 14)).foregroundStyle(Color.white.opacity(0.4)).frame(width: 20)
            TextField(placeholder, text: $text)
                .font(.subheadline).foregroundStyle(Color.white)
        }
        .padding(12)
        .background(Color.white.opacity(0.06))
        .clipShape(RoundedRectangle(cornerRadius: 10))
        .overlay { RoundedRectangle(cornerRadius: 10).stroke(Color.white.opacity(0.1), lineWidth: 0.5) }
    }
}

// MARK: - Section Header

struct SectionHeader: View {
    let title: String
    let icon: String

    var body: some View {
        HStack(spacing: 8) {
            Image(systemName: icon).font(.system(size: 14, weight: .semibold)).foregroundStyle(Color.white.opacity(0.7))
            Text(title).font(.headline).foregroundStyle(Color.white)
        }
    }
}

