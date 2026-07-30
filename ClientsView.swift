import SwiftUI
import SwiftData

// MARK: - Clients View

struct ClientsView: View {
    @Environment(\.modelContext) private var modelContext
    @Query(sort: \Client.name) private var clients: [Client]

    @State private var showAddClient = false
    @State private var clientToEdit: Client?
    @State private var searchText = ""

    private var filtered: [Client] {
        if searchText.isEmpty { return clients }
        return clients.filter {
            $0.name.localizedCaseInsensitiveContains(searchText) ||
            $0.email.localizedCaseInsensitiveContains(searchText)
        }
    }

    var body: some View {
        Group {
            if clients.isEmpty {
                emptyState
            } else {
                clientList
            }
        }
        .searchable(text: $searchText, prompt: "Search clients…")
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Button {
                    showAddClient = true
                } label: {
                    Image(systemName: "plus")
                        .font(.system(size: 16, weight: .semibold))
                }
            }
        }
        .sheet(isPresented: $showAddClient) {
            ClientFormSheet(client: nil)
        }
        .sheet(item: $clientToEdit) { client in
            ClientFormSheet(client: client)
        }
    }

    // MARK: - Subviews

    private var clientList: some View {
        ScrollView {
            LazyVStack(spacing: 12) {
                ForEach(filtered) { client in
                    ClientCard(client: client)
                        .onTapGesture { clientToEdit = client }
                        .contextMenu {
                            Button {
                                clientToEdit = client
                            } label: {
                                Label("Edit", systemImage: "pencil")
                            }
                            Button(role: .destructive) {
                                delete(client)
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

    private var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: "person.2.slash")
                .font(.system(size: 52))
                .foregroundStyle(.quaternary)
            Text("No Clients Yet")
                .font(.title2.bold())
            Text("Tap + to add your first client")
                .foregroundStyle(.secondary)
            Button {
                showAddClient = true
            } label: {
                Label("Add Client", systemImage: "plus.circle.fill")
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

    // MARK: - Actions

    private func delete(_ client: Client) {
        withAnimation {
            modelContext.delete(client)
        }
    }
}

// MARK: - Client Card

struct ClientCard: View {
    let client: Client

    var body: some View {
        HStack(spacing: 14) {
            // Avatar
            ZStack {
                Circle()
                    .fill(
                        LinearGradient(
                            colors: [.indigo.opacity(0.2), .purple.opacity(0.15)],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .frame(width: 48, height: 48)
                Text(client.name.prefix(1).uppercased())
                    .font(.system(size: 20, weight: .bold))
                    .foregroundStyle(
                        LinearGradient(colors: [.indigo, .purple], startPoint: .top, endPoint: .bottom)
                    )
            }

            VStack(alignment: .leading, spacing: 3) {
                Text(client.name)
                    .font(.headline)
                Text(client.email)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                if !client.taxID.isEmpty {
                    Text("GSTIN: \(client.taxID)")
                        .font(.caption)
                        .foregroundStyle(.tertiary)
                }
            }

            Spacer()

            // Invoice count badge
            if let count = client.invoices?.count, count > 0 {
                VStack(spacing: 2) {
                    Text("\(count)")
                        .font(.system(size: 14, weight: .bold))
                        .foregroundStyle(.indigo)
                    Text("invoices")
                        .font(.system(size: 9))
                        .foregroundStyle(.secondary)
                }
            }

            Image(systemName: "chevron.right")
                .font(.caption)
                .foregroundStyle(.tertiary)
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

// MARK: - Client Form Sheet

struct ClientFormSheet: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(\.modelContext) private var modelContext

    let client: Client?

    @State private var name = ""
    @State private var email = ""
    @State private var address = ""
    @State private var taxID = ""

    private var isEditing: Bool { client != nil }

    var body: some View {
        NavigationStack {
            Form {
                Section("Contact Info") {
                    LabeledTextField("Full Name", text: $name, icon: "person.fill")
                    LabeledTextField("Email", text: $email, icon: "envelope.fill")
                        .keyboardType(.emailAddress)
                        .textInputAutocapitalization(.never)
                }

                Section("Address") {
                    ZStack(alignment: .topLeading) {
                        if address.isEmpty {
                            Text("Full address…")
                                .foregroundStyle(.tertiary)
                                .padding(.top, 8)
                                .padding(.leading, 4)
                        }
                        TextEditor(text: $address)
                            .frame(minHeight: 80)
                    }
                }

                Section("Tax Details") {
                    LabeledTextField("GSTIN / Tax ID", text: $taxID, icon: "number.square.fill")
                        .textInputAutocapitalization(.characters)
                }
            }
            .navigationTitle(isEditing ? "Edit Client" : "New Client")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") { save() }
                        .disabled(name.trimmingCharacters(in: .whitespaces).isEmpty)
                        .fontWeight(.semibold)
                }
            }
            .onAppear { populate() }
        }
    }

    private func populate() {
        guard let c = client else { return }
        name = c.name; email = c.email; address = c.address; taxID = c.taxID
    }

    private func save() {
        if let c = client {
            c.name = name; c.email = email; c.address = address; c.taxID = taxID
        } else {
            let c = Client(name: name, email: email, address: address, taxID: taxID)
            modelContext.insert(c)
        }
        dismiss()
    }
}

// MARK: - Labeled TextField Helper

struct LabeledTextField: View {
    let label: String
    @Binding var text: String
    let icon: String

    init(_ label: String, text: Binding<String>, icon: String) {
        self.label = label
        _text = text
        self.icon = icon
    }

    var body: some View {
        HStack(spacing: 10) {
            Image(systemName: icon)
                .foregroundStyle(.indigo)
                .frame(width: 20)
            TextField(label, text: $text)
        }
    }
}
