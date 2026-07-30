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
        Group {
            if items.isEmpty {
                emptyState
            } else {
                rateList
            }
        }
        .searchable(text: $searchText, prompt: "Search items…")
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Button { showAddItem = true } label: {
                    Image(systemName: "plus")
                        .font(.system(size: 16, weight: .semibold))
                }
            }
        }
        .sheet(isPresented: $showAddItem) {
            WorkRateFormSheet(item: nil)
        }
        .sheet(item: $itemToEdit) { item in
            WorkRateFormSheet(item: item)
        }
    }

    // MARK: - List

    private var rateList: some View {
        ScrollView {
            LazyVStack(spacing: 12) {
                ForEach(filtered) { item in
                    WorkRateCard(item: item)
                        .onTapGesture { itemToEdit = item }
                        .contextMenu {
                            Button { itemToEdit = item } label: {
                                Label("Edit", systemImage: "pencil")
                            }
                            Button(role: .destructive) {
                                withAnimation { modelContext.delete(item) }
                            } label: {
                                Label("Delete", systemImage: "trash")
                            }
                        }
                }
            }
            .padding(.horizontal, 16)
            .padding(.top, 8)
            .padding(.bottom, 120)
        }
    }

    // MARK: - Empty State

    private var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: "cart.badge.questionmark")
                .font(.system(size: 52))
                .foregroundStyle(.quaternary)
            Text("No Work Rates")
                .font(.title2.bold())
            Text("Add your standard services & pricing")
                .foregroundStyle(.secondary)
            Button {
                showAddItem = true
            } label: {
                Label("Add Rate", systemImage: "plus.circle.fill")
                    .font(.headline)
                    .padding(.horizontal, 24)
                    .padding(.vertical, 12)
                    .background(
                        LinearGradient(colors: [.indigo, .purple], startPoint: .leading, endPoint: .trailing)
                    )
                    .foregroundStyle(.white)
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
                    .fill(
                        LinearGradient(
                            colors: [.green.opacity(0.15), .teal.opacity(0.1)],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .frame(width: 48, height: 48)
                Image(systemName: "wrench.and.screwdriver.fill")
                    .font(.system(size: 20))
                    .foregroundStyle(
                        LinearGradient(colors: [.green, .teal], startPoint: .top, endPoint: .bottom)
                    )
            }

            VStack(alignment: .leading, spacing: 4) {
                Text(item.title)
                    .font(.headline)
                HStack(spacing: 8) {
                    if !item.hsnCode.isEmpty {
                        PillTag(text: "HSN: \(item.hsnCode)", color: .blue)
                    }
                    PillTag(text: "Tax: \(String(format: "%.0f", item.defaultTaxPercentage))%", color: .orange)
                }
            }

            Spacer()

            VStack(alignment: .trailing, spacing: 2) {
                Text("₹\(String(format: "%.2f", item.unitRate))")
                    .font(.system(size: 16, weight: .bold, design: .rounded))
                    .foregroundStyle(.primary)
                Text("per unit")
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            }
        }
        .padding(16)
        .background {
            RoundedRectangle(cornerRadius: 16)
                .fill(.background)
                .shadow(color: .black.opacity(0.06), radius: 8, x: 0, y: 2)
        }
        .overlay {
            RoundedRectangle(cornerRadius: 16)
                .stroke(Color(.separator).opacity(0.4), lineWidth: 0.5)
        }
    }
}

// MARK: - Pill Tag

struct PillTag: View {
    let text: String
    let color: Color

    var body: some View {
        Text(text)
            .font(.caption2)
            .fontWeight(.medium)
            .foregroundStyle(color)
            .padding(.horizontal, 8)
            .padding(.vertical, 3)
            .background(color.opacity(0.12))
            .clipShape(Capsule())
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
            Form {
                Section("Item Details") {
                    LabeledTextField("Service / Item Name", text: $title, icon: "tag.fill")
                    LabeledTextField("HSN Code", text: $hsnCode, icon: "number")
                        .keyboardType(.numberPad)
                }

                Section("Pricing") {
                    HStack {
                        Image(systemName: "indianrupeesign.circle.fill")
                            .foregroundStyle(.green)
                            .frame(width: 20)
                        TextField("Unit Rate (₹)", text: $unitRate)
                            .keyboardType(.decimalPad)
                    }
                    HStack {
                        Image(systemName: "percent")
                            .foregroundStyle(.orange)
                            .frame(width: 20)
                        TextField("Default Tax %", text: $taxPercentage)
                            .keyboardType(.decimalPad)
                        Text("%")
                            .foregroundStyle(.secondary)
                    }
                }

                if let rate = Double(unitRate), let tax = Double(taxPercentage) {
                    Section("Preview") {
                        HStack {
                            Text("CGST (\(String(format: "%.1f", tax / 2))%)")
                            Spacer()
                            Text("₹\(String(format: "%.2f", rate * (tax / 2) / 100))")
                                .foregroundStyle(.secondary)
                        }
                        HStack {
                            Text("SGST (\(String(format: "%.1f", tax / 2))%)")
                            Spacer()
                            Text("₹\(String(format: "%.2f", rate * (tax / 2) / 100))")
                                .foregroundStyle(.secondary)
                        }
                        HStack {
                            Text("Total per unit")
                                .fontWeight(.semibold)
                            Spacer()
                            Text("₹\(String(format: "%.2f", rate + rate * tax / 100))")
                                .fontWeight(.semibold)
                                .foregroundStyle(.green)
                        }
                    }
                }
            }
            .navigationTitle(isEditing ? "Edit Rate" : "New Rate")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") { save() }
                        .disabled(title.trimmingCharacters(in: .whitespaces).isEmpty)
                        .fontWeight(.semibold)
                }
            }
            .onAppear { populate() }
        }
    }

    private func populate() {
        guard let i = item else { return }
        title = i.title
        hsnCode = i.hsnCode
        unitRate = String(i.unitRate)
        taxPercentage = String(i.defaultTaxPercentage)
    }

    private func save() {
        let rate = Double(unitRate) ?? 0
        let tax = Double(taxPercentage) ?? 18

        if let i = item {
            i.title = title; i.hsnCode = hsnCode; i.unitRate = rate; i.defaultTaxPercentage = tax
        } else {
            let i = WorkRateItem(title: title, hsnCode: hsnCode, unitRate: rate, defaultTaxPercentage: tax)
            modelContext.insert(i)
        }
        dismiss()
    }
}
