import SwiftUI
import SwiftData

// MARK: - Work Rates View

struct WorkRatesView: View {
    @Environment(\.modelContext) private var modelContext
    @Query(sort: \WorkRateItem.title) private var items: [WorkRateItem]

    @State private var showAddItem = false
    @State private var itemToEdit: WorkRateItem?
    @State private var searchText = ""

    private var filtered: [WorkRateItem] {
        if searchText.isEmpty { return items }
        return items.filter {
            $0.title.localizedCaseInsensitiveContains(searchText) ||
            $0.hsnCode.localizedCaseInsensitiveContains(searchText)
        }
    }

    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()
            Group {
                if items.isEmpty { emptyState } else { rateList }
            }
        }
        .searchable(text: $searchText, prompt: "Search items…")
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Button {
                    Haptics.medium()
                    showAddItem = true
                } label: {
                    Image(systemName: "plus")
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundStyle(Color.white)
                }
            }
        }
        .sheet(isPresented: $showAddItem) {
            WorkRateFormSheet(item: nil)
                .presentationBackground(.ultraThinMaterial)
        }
        .sheet(item: $itemToEdit) { item in
            WorkRateFormSheet(item: item)
                .presentationBackground(.ultraThinMaterial)
        }
    }

    private var rateList: some View {
        ScrollView {
            LazyVStack(spacing: 10) {
                ForEach(filtered) { item in
                    WorkRateCard(item: item)
                        .onTapGesture { Haptics.light(); itemToEdit = item }
                        .contextMenu {
                            Button { itemToEdit = item } label: { Label("Edit", systemImage: "pencil") }
                            Button(role: .destructive) {
                                withAnimation { modelContext.delete(item) }
                            } label: { Label("Delete", systemImage: "trash") }
                        }
                }
            }
            .padding(.horizontal, 16)
            .padding(.top, 8)
            .padding(.bottom, 120)
        }
    }

    private var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: "cart.badge.questionmark")
                .font(.system(size: 52))
                .foregroundStyle(Color.white.opacity(0.15))
            Text("No Work Rates")
                .font(.title2.bold())
                .foregroundStyle(Color.white)
            Text("Add your standard services & pricing")
                .foregroundStyle(Color.white.opacity(0.45))
            Button {
                Haptics.medium()
                showAddItem = true
            } label: {
                Label("Add Rate", systemImage: "plus.circle.fill")
                    .font(.headline)
                    .padding(.horizontal, 24).padding(.vertical, 12)
                    .background(Color.white)
                    .foregroundStyle(Color.black)
                    .clipShape(Capsule())
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .padding(.bottom, 80)
    }
}

// MARK: - Work Rate Card

struct WorkRateCard: View {
    let item: WorkRateItem

    var body: some View {
        HStack(spacing: 14) {
            ZStack {
                RoundedRectangle(cornerRadius: 12)
                    .fill(Color.white.opacity(0.08))
                    .frame(width: 48, height: 48)
                    .overlay { RoundedRectangle(cornerRadius: 12).stroke(Color.white.opacity(0.12), lineWidth: 0.8) }
                Image(systemName: "wrench.and.screwdriver.fill")
                    .font(.system(size: 20))
                    .foregroundStyle(Color.white.opacity(0.7))
            }

            VStack(alignment: .leading, spacing: 5) {
                Text(item.title)
                    .font(.headline)
                    .foregroundStyle(Color.white)
                HStack(spacing: 6) {
                    if !item.hsnCode.isEmpty {
                        PillTag(text: "HSN: \(item.hsnCode)", textColor: Color.white.opacity(0.8), bgColor: Color.white.opacity(0.08))
                    }
                    PillTag(text: "Tax: \(String(format: "%.0f", item.defaultTaxPercentage))%", textColor: Color.white.opacity(0.8), bgColor: Color.white.opacity(0.08))
                }
            }

            Spacer()

            VStack(alignment: .trailing, spacing: 2) {
                Text("₹\(String(format: "%.2f", item.unitRate))")
                    .font(.system(size: 16, weight: .bold, design: .rounded))
                    .foregroundStyle(Color.white)
                Text("per unit")
                    .font(.caption2)
                    .foregroundStyle(Color.white.opacity(0.35))
            }
        }
        .padding(16)
        .darkGlassCard()
    }
}

// MARK: - Pill Tag

struct PillTag: View {
    let text: String
    var textColor: Color = .white
    var bgColor: Color = Color.white.opacity(0.1)

    var body: some View {
        Text(text)
            .font(.caption2)
            .fontWeight(.medium)
            .foregroundStyle(textColor)
            .padding(.horizontal, 8)
            .padding(.vertical, 3)
            .background(bgColor)
            .clipShape(Capsule())
            .overlay { Capsule().stroke(Color.white.opacity(0.1), lineWidth: 0.5) }
    }
}

// MARK: - Work Rate Form Sheet

struct WorkRateFormSheet: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(\.modelContext) private var modelContext

    let item: WorkRateItem?

    @State private var title = ""
    @State private var hsnCode = ""
    @State private var unitRate = ""
    @State private var taxPercentage = "18"

    private var isEditing: Bool { item != nil }

    var body: some View {
        NavigationStack {
            ZStack {
                Color.black.ignoresSafeArea()
                Form {
                    Section {
                        rateField("Service / Item Name", text: $title, icon: "tag.fill")
                        rateField("HSN Code", text: $hsnCode, icon: "number")
                    } header: { Text("Item Details").foregroundStyle(Color.white.opacity(0.4)) }

                    Section {
                        HStack {
                            Image(systemName: "indianrupeesign.circle.fill")
                                .foregroundStyle(Color.white.opacity(0.5)).frame(width: 20)
                            TextField("Unit Rate (₹)", text: $unitRate).foregroundStyle(Color.white)
                                .keyboardType(.decimalPad)
                        }
                        .listRowBackground(Color.white.opacity(0.06))
                        HStack {
                            Image(systemName: "percent")
                                .foregroundStyle(Color.white.opacity(0.5)).frame(width: 20)
                            TextField("Default Tax %", text: $taxPercentage).foregroundStyle(Color.white)
                                .keyboardType(.decimalPad)
                            Text("%").foregroundStyle(Color.white.opacity(0.35))
                        }
                        .listRowBackground(Color.white.opacity(0.06))
                    } header: { Text("Pricing").foregroundStyle(Color.white.opacity(0.4)) }

                    if let rate = Double(unitRate), let tax = Double(taxPercentage) {
                        Section {
                            previewRow("CGST (\(String(format: "%.1f", tax / 2))%)", value: rate * (tax / 2) / 100)
                            previewRow("SGST (\(String(format: "%.1f", tax / 2))%)", value: rate * (tax / 2) / 100)
                            previewRow("Total per unit", value: rate + rate * tax / 100, bold: true)
                        } header: { Text("Preview").foregroundStyle(Color.white.opacity(0.4)) }
                    }
                }
                .scrollContentBackground(.hidden)
            }
            .navigationTitle(isEditing ? "Edit Rate" : "New Rate")
            .navigationBarTitleDisplayMode(.inline)
            .toolbarColorScheme(.dark, for: .navigationBar)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }.foregroundStyle(Color.white.opacity(0.7))
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") { save() }
                        .disabled(title.trimmingCharacters(in: .whitespaces).isEmpty)
                        .fontWeight(.semibold).foregroundStyle(Color.white)
                }
            }
            .onAppear { populate() }
        }
    }

    @ViewBuilder
    private func rateField(_ label: String, text: Binding<String>, icon: String) -> some View {
        HStack(spacing: 10) {
            Image(systemName: icon).foregroundStyle(Color.white.opacity(0.5)).frame(width: 20)
            TextField(label, text: text).foregroundStyle(Color.white)
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

    private func populate() {
        guard let i = item else { return }
        title = i.title; hsnCode = i.hsnCode
        unitRate = String(i.unitRate); taxPercentage = String(i.defaultTaxPercentage)
    }

    private func save() {
        let rate = Double(unitRate) ?? 0
        let tax = Double(taxPercentage) ?? 18
        if let i = item {
            i.title = title; i.hsnCode = hsnCode; i.unitRate = rate; i.defaultTaxPercentage = tax
        } else {
            modelContext.insert(WorkRateItem(title: title, hsnCode: hsnCode, unitRate: rate, defaultTaxPercentage: tax))
        }
        Haptics.success()
        dismiss()
    }
}

