import SwiftUI
import SwiftData

// MARK: - Company Profile Sheet

struct CompanyProfileSheet: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(\.modelContext) private var modelContext
    @Query private var profiles: [CompanyProfile]

    private var profile: CompanyProfile {
        if let existing = profiles.first { return existing }
        let new = CompanyProfile()
        modelContext.insert(new)
        return new
    }

    @State private var companyName = ""
    @State private var businessTagline = ""
    @State private var businessServices = ""
    @State private var addressLine1 = ""
    @State private var addressLine2 = ""
    @State private var companyGSTIN = ""
    @State private var companyPAN = ""
    @State private var companyPhone = ""
    @State private var bankName = ""
    @State private var bankAccountNo = ""
    @State private var bankIFSC = ""
    @State private var authorizedSignatory = ""

    var body: some View {
        NavigationStack {
            ZStack {
                Color.black.ignoresSafeArea()
                ScrollView {
                    VStack(spacing: 20) {
                        darkSection("Company Identity") {
                            darkField("Company Name", text: $companyName)
                            darkField("Business Tagline", text: $businessTagline)
                            darkField("Services", text: $businessServices)
                        }
                        darkSection("Address") {
                            darkField("Address Line 1", text: $addressLine1)
                            darkField("Address Line 2", text: $addressLine2)
                        }
                        darkSection("Tax Details") {
                            darkField("GSTIN", text: $companyGSTIN)
                            darkField("PAN", text: $companyPAN)
                            darkField("Phone", text: $companyPhone)
                        }
                        darkSection("Bank Details") {
                            darkField("Bank Name & Branch", text: $bankName)
                            darkField("Account Number", text: $bankAccountNo)
                            darkField("IFSC Code", text: $bankIFSC)
                        }
                        darkSection("Signatory") {
                            darkField("Authorized Signatory Name", text: $authorizedSignatory)
                        }
                        Button("Save Profile") { save() }
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 16)
                            .background(Color.white)
                            .foregroundStyle(Color.black)
                            .fontWeight(.bold)
                            .clipShape(RoundedRectangle(cornerRadius: 14))
                            .padding(.horizontal, 16)
                    }
                    .padding(.vertical, 16)
                }
            }
            .navigationTitle("Company Profile")
            .navigationBarTitleDisplayMode(.inline)
            .toolbarColorScheme(.dark, for: .navigationBar)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                        .foregroundStyle(Color.white.opacity(0.7))
                }
            }
            .onAppear { populate() }
        }
    }

    @ViewBuilder
    private func darkSection(_ title: String, @ViewBuilder content: () -> some View) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(title.uppercased())
                .font(.caption)
                .fontWeight(.semibold)
                .foregroundStyle(Color.white.opacity(0.4))
                .padding(.horizontal, 16)
            VStack(spacing: 1) { content() }
                .background(Color.white.opacity(0.06))
                .clipShape(RoundedRectangle(cornerRadius: 14))
                .overlay { RoundedRectangle(cornerRadius: 14).stroke(Color.white.opacity(0.1), lineWidth: 0.8) }
                .padding(.horizontal, 16)
        }
    }

    @ViewBuilder
    private func darkField(_ placeholder: String, text: Binding<String>) -> some View {
        TextField(placeholder, text: text)
            .foregroundStyle(Color.white)
            .padding(.horizontal, 14)
            .padding(.vertical, 13)
            .background(Color.clear)
            .overlay(alignment: .bottom) { Divider().background(Color.white.opacity(0.06)) }
    }

    private func populate() {
        let p = profile
        companyName = p.companyName
        businessTagline = p.businessTagline
        businessServices = p.businessServices
        addressLine1 = p.addressLine1
        addressLine2 = p.addressLine2
        companyGSTIN = p.companyGSTIN
        companyPAN = p.companyPAN
        companyPhone = p.companyPhone
        bankName = p.bankNameAndBranch
        bankAccountNo = p.bankAccountNo
        bankIFSC = p.bankIFSCCode
        authorizedSignatory = p.authorizedSignatoryName
    }

    private func save() {
        let p = profile
        p.companyName = companyName
        p.businessTagline = businessTagline
        p.businessServices = businessServices
        p.addressLine1 = addressLine1
        p.addressLine2 = addressLine2
        p.companyGSTIN = companyGSTIN
        p.companyPAN = companyPAN
        p.companyPhone = companyPhone
        p.bankNameAndBranch = bankName
        p.bankAccountNo = bankAccountNo
        p.bankIFSCCode = bankIFSC
        p.authorizedSignatoryName = authorizedSignatory
        Haptics.success()
        dismiss()
    }
}

// MARK: - Dark Glass Card Modifier

struct DarkGlassCard: ViewModifier {
    func body(content: Content) -> some View {
        content
            .background(Color.white.opacity(0.06))
            .clipShape(RoundedRectangle(cornerRadius: 16))
            .overlay { RoundedRectangle(cornerRadius: 16).stroke(Color.white.opacity(0.12), lineWidth: 0.8) }
    }
}

extension View {
    func darkGlassCard() -> some View { modifier(DarkGlassCard()) }

    // Keep backward compat
    func cardStyle() -> some View { modifier(DarkGlassCard()) }
}
