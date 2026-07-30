import SwiftUI
import UIKit

// MARK: - Haptic Helpers

enum Haptics {
    static func light()  { UIImpactFeedbackGenerator(style: .light).impactOccurred() }
    static func medium() { UIImpactFeedbackGenerator(style: .medium).impactOccurred() }
    static func success(){ UINotificationFeedbackGenerator().notificationOccurred(.success) }
}

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
            tabButton(for: .clients)
            Spacer()
            centerPlusButton
            Spacer()
            tabButton(for: .rates)
        }
        .padding(.horizontal, 28)
        .padding(.vertical, 12)
        .background {
            Capsule()
                .fill(.ultraThinMaterial)
                .overlay {
                    Capsule()
                        .stroke(Color.white.opacity(0.12), lineWidth: 0.8)
                }
                .shadow(color: .black.opacity(0.45), radius: 24, x: 0, y: 8)
        }
        .padding(.horizontal, 32)
    }

    // MARK: - Tab Button

    @ViewBuilder
    private func tabButton(for tab: AppTab) -> some View {
        Button {
            Haptics.light()
            withAnimation(.spring(response: 0.35, dampingFraction: 0.8)) {
                selectedTab = tab
            }
        } label: {
            VStack(spacing: 4) {
                Image(systemName: tab.icon)
                    .font(.system(size: 20, weight: selectedTab == tab ? .bold : .regular))
                    .foregroundStyle(selectedTab == tab ? Color.white : Color.white.opacity(0.35))
                    .scaleEffect(selectedTab == tab ? 1.1 : 1.0)
                    .animation(.spring(response: 0.3, dampingFraction: 0.8), value: selectedTab)

                Text(tab.label)
                    .font(.system(size: 10, weight: selectedTab == tab ? .semibold : .regular))
                    .foregroundStyle(selectedTab == tab ? Color.white : Color.white.opacity(0.35))
            }
            .frame(width: 56, height: 44)
        }
        .buttonStyle(.plain)
    }

    // MARK: - Center Plus Button

    private var centerPlusButton: some View {
        Button {
            Haptics.medium()
            withAnimation(.spring(response: 0.4, dampingFraction: 0.65)) {
                showQuickInvoice = true
            }
        } label: {
            ZStack {
                Circle()
                    .fill(Color.white.opacity(0.08))
                    .frame(width: 60, height: 60)
                    .blur(radius: 6)

                Circle()
                    .fill(.ultraThinMaterial)
                    .frame(width: 54, height: 54)
                    .overlay {
                        Circle()
                            .fill(Color.white.opacity(0.9))
                            .frame(width: 48, height: 48)
                    }
                    .overlay {
                        Circle()
                            .stroke(Color.white.opacity(0.3), lineWidth: 1)
                            .frame(width: 54, height: 54)
                    }
                    .shadow(color: .white.opacity(0.2), radius: 12, x: 0, y: 4)

                Image(systemName: "plus")
                    .font(.system(size: 22, weight: .bold))
                    .foregroundStyle(Color.black)
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
            .animation(.spring(response: 0.2, dampingFraction: 0.8), value: configuration.isPressed)
    }
}

// MARK: - Main Content View

struct MainContentView: View {
    @Environment(\.modelContext) private var modelContext
    @State private var selectedTab: AppTab = .clients
    @State private var showQuickInvoice = false
    @State private var showInvoiceDatabase = false
    @State private var showProfileSettings = false

    var body: some View {
        NavigationStack {
            ZStack(alignment: .bottom) {
                Color.black.ignoresSafeArea()

                Group {
                    switch selectedTab {
                    case .clients:
                        ClientsView()
                    case .rates:
                        WorkRatesView()
                    }
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)

                FloatingTabBar(selectedTab: $selectedTab, showQuickInvoice: $showQuickInvoice)
                    .padding(.bottom, 24)
            }
            .ignoresSafeArea(edges: .bottom)
            .navigationTitle(selectedTab == .clients ? "Clients" : "Work Rates")
            .navigationBarTitleDisplayMode(.large)
            .toolbarColorScheme(.dark, for: .navigationBar)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button {
                        Haptics.medium()
                        showInvoiceDatabase = true
                    } label: {
                        ZStack {
                            Circle()
                                .fill(Color.white.opacity(0.08))
                                .frame(width: 34, height: 34)
                                .overlay {
                                    Circle().stroke(Color.white.opacity(0.12), lineWidth: 0.8)
                                }
                            Image(systemName: "person.crop.circle.fill")
                                .font(.system(size: 20))
                                .foregroundStyle(Color.white)
                        }
                    }
                }
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button {
                        showProfileSettings = true
                    } label: {
                        Image(systemName: "building.2.crop.circle")
                            .font(.system(size: 20))
                            .foregroundStyle(Color.white.opacity(0.7))
                    }
                }
            }
        }
        .sheet(isPresented: $showQuickInvoice) {
            QuickInvoiceSheet()
                .presentationBackground(.ultraThinMaterial)
        }
        .sheet(isPresented: $showInvoiceDatabase) {
            InvoiceDatabaseSheet()
                .presentationBackground(.ultraThinMaterial)
        }
    }
}
