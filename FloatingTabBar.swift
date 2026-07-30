import SwiftUI

// MARK: - Tab Enum

enum AppTab: Int, CaseIterable {
    case clients
    case rates

    var icon: String {
        switch self {
        case .clients: return "person.2.fill"
        case .rates:   return "dollarsign.circle.fill"
        }
    }

    var label: String {
        switch self {
        case .clients: return "Clients"
        case .rates:   return "Rates"
        }
    }
}

// MARK: - Floating Glass Tab Bar

struct FloatingTabBar: View {
    @Binding var selectedTab: AppTab
    @Binding var showQuickInvoice: Bool

    var body: some View {
        HStack(spacing: 0) {
            // Left tab
            tabButton(for: .clients)

            Spacer()

            // Center action button
            centerPlusButton

            Spacer()

            // Right tab
            tabButton(for: .rates)
        }
        .padding(.horizontal, 28)
        .padding(.vertical, 12)
        .background {
            Capsule()
                .fill(.ultraThinMaterial)
                .shadow(color: .black.opacity(0.18), radius: 20, x: 0, y: 8)
                .overlay {
                    Capsule()
                        .stroke(
                            LinearGradient(
                                colors: [.white.opacity(0.5), .white.opacity(0.1)],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            ),
                            lineWidth: 0.8
                        )
                }
        }
        .padding(.horizontal, 32)
    }

    // MARK: - Tab Button

    @ViewBuilder
    private func tabButton(for tab: AppTab) -> some View {
        Button {
            withAnimation(.spring(response: 0.35, dampingFraction: 0.7)) {
                selectedTab = tab
            }
        } label: {
            VStack(spacing: 4) {
                Image(systemName: tab.icon)
                    .font(.system(size: 20, weight: selectedTab == tab ? .bold : .regular))
                    .foregroundStyle(selectedTab == tab
                        ? LinearGradient(colors: [.indigo, .purple], startPoint: .top, endPoint: .bottom)
                        : LinearGradient(colors: [Color(.tertiaryLabel)], startPoint: .top, endPoint: .bottom)
                    )
                    .scaleEffect(selectedTab == tab ? 1.12 : 1.0)
                    .animation(.spring(response: 0.3), value: selectedTab)

                Text(tab.label)
                    .font(.system(size: 10, weight: selectedTab == tab ? .semibold : .regular))
                    .foregroundStyle(selectedTab == tab ? .indigo : .secondary)
            }
            .frame(width: 56, height: 44)
        }
        .buttonStyle(.plain)
    }

    // MARK: - Center Plus Button

    private var centerPlusButton: some View {
        Button {
            withAnimation(.spring(response: 0.4, dampingFraction: 0.65)) {
                showQuickInvoice = true
            }
        } label: {
            ZStack {
                // Outer glow
                Circle()
                    .fill(
                        LinearGradient(
                            colors: [.indigo.opacity(0.3), .purple.opacity(0.2)],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .frame(width: 60, height: 60)
                    .blur(radius: 8)

                // Glass pill
                Circle()
                    .fill(.ultraThinMaterial)
                    .frame(width: 54, height: 54)
                    .overlay {
                        Circle()
                            .fill(
                                LinearGradient(
                                    colors: [.indigo, .purple],
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                )
                            )
                            .frame(width: 48, height: 48)
                    }
                    .overlay {
                        Circle()
                            .stroke(.white.opacity(0.35), lineWidth: 1)
                            .frame(width: 54, height: 54)
                    }
                    .shadow(color: .indigo.opacity(0.5), radius: 12, x: 0, y: 6)

                Image(systemName: "plus")
                    .font(.system(size: 22, weight: .bold))
                    .foregroundStyle(.white)
            }
        }
        .buttonStyle(ScaleButtonStyle())
        .offset(y: -10)
    }
}

// MARK: - Scale Button Style

struct ScaleButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .scaleEffect(configuration.isPressed ? 0.92 : 1.0)
            .animation(.spring(response: 0.2), value: configuration.isPressed)
    }
}

// MARK: - Main Content View with Floating Tab Bar

struct MainContentView: View {
    @State private var selectedTab: AppTab = .clients
    @State private var showQuickInvoice = false
    @State private var showInvoiceDatabase = false

    var body: some View {
        NavigationStack {
            ZStack(alignment: .bottom) {
                // Content
                Group {
                    switch selectedTab {
                    case .clients:
                        ClientsView()
                    case .rates:
                        WorkRatesView()
                    }
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)

                // Floating Tab Bar
                FloatingTabBar(selectedTab: $selectedTab, showQuickInvoice: $showQuickInvoice)
                    .padding(.bottom, 24)
            }
            .ignoresSafeArea(edges: .bottom)
            .navigationTitle(selectedTab == .clients ? "Clients" : "Work Rates")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button {
                        showInvoiceDatabase = true
                    } label: {
                        ZStack {
                            Circle()
                                .fill(
                                    LinearGradient(
                                        colors: [.indigo.opacity(0.2), .purple.opacity(0.15)],
                                        startPoint: .topLeading,
                                        endPoint: .bottomTrailing
                                    )
                                )
                                .frame(width: 34, height: 34)
                            Image(systemName: "person.crop.circle.fill")
                                .font(.system(size: 22))
                                .foregroundStyle(
                                    LinearGradient(colors: [.indigo, .purple], startPoint: .top, endPoint: .bottom)
                                )
                        }
                    }
                }
            }
        }
        .sheet(isPresented: $showQuickInvoice) {
            QuickInvoiceSheet()
        }
        .sheet(isPresented: $showInvoiceDatabase) {
            InvoiceDatabaseSheet()
        }
    }
}
