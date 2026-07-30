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
        ZStack {
            Color.black.ignoresSafeArea()
            Group {
                if clients.isEmpty {
                    emptyState
                } else {
                    clientList
                }
            }
        }
        .searchable(text: $searchText, prompt: "Search clients…")
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Button {
                    Haptics.medium()
                    showAddClient = true
                } label: {
                    Image(systemName: "plus")
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundStyle(Color.white)
                }
            }
        }
        .sheet(isPresented: $showAddClient) {
            ClientFormSheet(client: nil)
                .presentationBackground(.ultraThinMaterial)
        }
        .sheet(item: $clientToEdit) { client in
            ClientFormSheet(client: client)
                .presentationBackground(.ultraThinMaterial)
        }
    }

    // MARK: - Subviews

    private var clientList: some View {
        ScrollView {
            LazyVStack(spacing: 10) {
                ForEach(filtered) { client in
                    ClientCard(client: client)
                        .onTapGesture {
                            Haptics.light()
                            clientToEdit = client
                        }
                        .contextMenu {
                            Button { clientToEdit = client } label: {
                                Label("Edit", systemImage: "pencil")
                            }
                            Button(role: .destructive) { delete(client) } label: {
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
                .foregroundStyle(Color.white.opacity(0.15))
            Text("No Clients Yet")
                .font(.title2.bold())
                .foregroundStyle(Color.white)
            Text("Tap + to add your first client")
                .foregroundStyle(Color.white.opacity(0.45))
            Button {
                Haptics.medium()
                showAddClient = true
            } label: {
                Label("Add Client", systemImage: "plus.circle.fill")
                    .font(.headline)
                    .padding(.horizontal, 24)
                    .padding(.vertical, 12)
                    .background(Color.white)
                    .foregroundStyle(Color.black)
                    .clipShape(Capsule())
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .padding(.bottom, 80)
    }

    private func delete(_ client: Client) {
        withAnimation(.spring(response: 0.35, dampingFraction: 0.8)) {
            modelContext.delete(client)
        }
    }
}

// MARK: - Client Card

struct ClientCard: View {
    let client: Client

    var body: some View {
        HStack(spacing: 14) {
            ZStack {
                Circle()
                    .fill(Color.white.opacity(0.1))
                    .frame(width: 48, height: 48)
                    .overlay { Circle().stroke(Color.white.opacity(0.15), lineWidth: 0.8) }
                Text(client.name.prefix(1).uppercased())
                    .font(.system(size: 20, weight: .bold))
                    .foregroundStyle(Color.white)
            }

            VStack(alignment: .leading, spacing: 3) {
                Text(client.name)
                    .font(.headline)
                    .foregroundStyle(Color.white)
                Text(client.email)
                    .font(.subheadline)
                    .foregroundStyle(Color.white.opacity(0.5))
                if !client.gstin.isEmpty {
                    Text("GSTIN: \(client.gstin)")
                        .font(.caption)
                        .foregroundStyle(Color.white.opacity(0.3))
                }
            }

            Spacer()

            if let count = client.invoices?.count, count > 0 {
                VStack(spacing: 2) {
                    Text("\(count)")
                        .font(.system(size: 14, weight: .bold))
                        .foregroundStyle(Color.white)
                    Text("invoices")
                        .font(.system(size: 9))
                        .foregroundStyle(Color.white.opacity(0.4))
                }
            }

            Image(systemName: "chevron.right")
                .font(.caption)
                .foregroundStyle(Color.white.opacity(0.2))
        }
        .padding(16)
        .darkGlassCard()
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
    @State private var gstin = ""
    @State private var phone = ""
    @State private var panNumber = ""

    private var isEditing: Bool { client != nil }

    var body: some View {
        NavigationStack {
            ZStack {
                Color.black.ignoresSafeArea()
                Form {
                    Section {
                        darkFormField("Full Name", text: $name, icon: "person.fill")
                        darkFormField("Email", text: $email, icon: "envelope.fill")
                        darkFormField("Phone", text: $phone, icon: "phone.fill")
                    } header: { Text("Contact Info").foregroundStyle(Color.white.opacity(0.4)) }

                    Section {
                        ZStack(alignment: .topLeading) {
                            if address.isEmpty {
                                Text("Full address…")
                                    .foregroundStyle(Color.white.opacity(0.25))
                                    .padding(.top, 8).padding(.leading, 4)
                            }
                            TextEditor(text: $address)
                                .frame(minHeight: 80)
                                .foregroundStyle(Color.white)
                                .scrollContentBackground(.hidden)
                        }
                    } header: { Text("Address").foregroundStyle(Color.white.opacity(0.4)) }

                    Section {
                        darkFormField("GSTIN / Tax ID", text: $gstin, icon: "number.square.fill")
                        darkFormField("PAN Number", text: $panNumber, icon: "creditcard.fill")
                    } header: { Text("Tax Details").foregroundStyle(Color.white.opacity(0.4)) }
                }
                .scrollContentBackground(.hidden)
            }
            .navigationTitle(isEditing ? "Edit Client" : "New Client")
            .navigationBarTitleDisplayMode(.inline)
            .toolbarColorScheme(.dark, for: .navigationBar)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                        .foregroundStyle(Color.white.opacity(0.7))
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") { save() }
                        .disabled(name.trimmingCharacters(in: .whitespaces).isEmpty)
                        .fontWeight(.semibold)
                        .foregroundStyle(Color.white)
                }
            }
            .onAppear { populate() }
        }
    }

    @ViewBuilder
    private func darkFormField(_ label: String, text: Binding<String>, icon: String) -> some View {
        HStack(spacing: 10) {
            Image(systemName: icon)
                .foregroundStyle(Color.white.opacity(0.5))
                .frame(width: 20)
            TextField(label, text: text)
                .foregroundStyle(Color.white)
        }
        .listRowBackground(Color.white.opacity(0.06))
    }

    private func populate() {
        guard let c = client else { return }
        name = c.name; email = c.email; address = c.address
        gstin = c.gstin; phone = c.phone; panNumber = c.panNumber
    }

    private func save() {
        if let c = client {
            c.name = name; c.email = email; c.address = address
            c.gstin = gstin; c.phone = phone; c.panNumber = panNumber
        } else {
            let c = Client(name: name, email: email, address: address,
                           gstin: gstin, phone: phone, panNumber: panNumber)
            modelContext.insert(c)
        }
        Haptics.success()
        dismiss()
    }
}

// MARK: - Labeled TextField Helper (kept for backward compat)

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
                .foregroundStyle(Color.white.opacity(0.5))
                .frame(width: 20)
            TextField(label, text: $text)
                .foregroundStyle(Color.white)
        }
    }
}

