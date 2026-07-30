import SwiftUI
import Charts

// MARK: - Insights View

struct InsightsView: View {
    let invoices: [Invoice]

    private var totalRevenue: Double {
        invoices.filter { $0.status == .paid }.reduce(0) { $0 + $1.grandTotal }
    }
    private var totalInvoices: Int { invoices.count }
    private var outstandingBalance: Double {
        invoices.filter { $0.status != .paid }.reduce(0) { $0 + $1.grandTotal }
    }
    private var sentCount: Int { invoices.filter { $0.status == .sent }.count }
    private var paidCount: Int { invoices.filter { $0.status == .paid }.count }
    private var draftCount: Int { invoices.filter { $0.status == .draft }.count }

    // Top clients by spend
    private var topClients: [(name: String, total: Double)] {
        var map: [String: Double] = [:]
        for inv in invoices {
            map[inv.clientName, default: 0] += inv.grandTotal
        }
        return map.map { (name: $0.key, total: $0.value) }
            .sorted { $0.total > $1.total }
            .prefix(5)
            .map { $0 }
    }

    // Monthly revenue (last 6 months)
    private var monthlyData: [(month: String, revenue: Double)] {
        let cal = Calendar.current
        let formatter = DateFormatter()
        formatter.dateFormat = "MMM"
        var map: [Date: Double] = [:]

        for inv in invoices where inv.status == .paid {
            let start = cal.dateInterval(of: .month, for: inv.dateCreated)!.start
            map[start, default: 0] += inv.grandTotal
        }

        let now = Date()
        return (0..<6).reversed().compactMap { offset -> (String, Double)? in
            guard let date = cal.date(byAdding: .month, value: -offset, to: now),
                  let start = cal.dateInterval(of: .month, for: date)?.start else { return nil }
            return (formatter.string(from: start), map[start] ?? 0)
        }
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                // KPI Cards
                kpiGrid

                // Revenue chart
                if !monthlyData.allSatisfy({ $0.revenue == 0 }) {
                    revenueChart
                }

                // Status donut
                statusChart

                // Top clients
                if !topClients.isEmpty {
                    topClientsSection
                }
            }
            .padding(16)
            .padding(.bottom, 40)
        }
    }

    // MARK: - KPI Grid

    private var kpiGrid: some View {
        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 14) {
            KPICard(
                title: "Total Revenue",
                value: "₹\(String(format: "%.0f", totalRevenue))",
                icon: "indianrupeesign.circle.fill",
                color: .green,
                subtitle: "\(paidCount) paid"
            )
            KPICard(
                title: "Invoices",
                value: "\(totalInvoices)",
                icon: "doc.fill",
                color: .indigo,
                subtitle: "\(draftCount) drafts, \(sentCount) sent"
            )
            KPICard(
                title: "Outstanding",
                value: "₹\(String(format: "%.0f", outstandingBalance))",
                icon: "exclamationmark.circle.fill",
                color: .orange,
                subtitle: "\(invoices.count - paidCount) unpaid"
            )
            KPICard(
                title: "Avg Invoice",
                value: invoices.isEmpty ? "—" : "₹\(String(format: "%.0f", invoices.reduce(0) { $0 + $1.grandTotal } / Double(invoices.count)))",
                icon: "chart.bar.fill",
                color: .purple,
                subtitle: "per invoice"
            )
        }
    }

    // MARK: - Revenue Chart

    private var revenueChart: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Monthly Revenue")
                .font(.headline)

            Chart {
                ForEach(monthlyData, id: \.month) { data in
                    BarMark(
                        x: .value("Month", data.month),
                        y: .value("Revenue", data.revenue)
                    )
                    .foregroundStyle(
                        LinearGradient(colors: [.indigo, .purple], startPoint: .bottom, endPoint: .top)
                    )
                    .cornerRadius(6)
                    .annotation(position: .top) {
                        if data.revenue > 0 {
                            Text("₹\(Int(data.revenue))")
                                .font(.system(size: 8))
                                .foregroundStyle(.secondary)
                        }
                    }
                }
            }
            .frame(height: 180)
            .chartYAxis {
                AxisMarks(position: .leading) { value in
                    AxisGridLine()
                    AxisValueLabel {
                        if let amount = value.as(Double.self) {
                            Text("₹\(Int(amount))")
                                .font(.system(size: 9))
                        }
                    }
                }
            }
        }
        .cardStyle()
    }

    // MARK: - Status Donut Chart

    private var statusChart: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Invoice Status")
                .font(.headline)

            let data: [(String, Double, Color)] = [
                ("Draft", Double(draftCount), .orange),
                ("Sent",  Double(sentCount),  .blue),
                ("Paid",  Double(paidCount),  .green)
            ].filter { $0.1 > 0 }

            if data.isEmpty {
                Text("No invoices yet")
                    .foregroundStyle(.secondary)
                    .frame(maxWidth: .infinity)
                    .padding()
            } else {
                HStack(spacing: 24) {
                    Chart {
                        ForEach(data, id: \.0) { item in
                            SectorMark(
                                angle: .value("Count", item.1),
                                innerRadius: .ratio(0.55),
                                angularInset: 2
                            )
                            .foregroundStyle(item.2)
                            .cornerRadius(4)
                        }
                    }
                    .frame(width: 120, height: 120)

                    VStack(alignment: .leading, spacing: 10) {
                        ForEach(data, id: \.0) { item in
                            HStack(spacing: 8) {
                                Circle()
                                    .fill(item.2)
                                    .frame(width: 10, height: 10)
                                Text(item.0)
                                    .font(.subheadline)
                                Spacer()
                                Text("\(Int(item.1))")
                                    .font(.subheadline.bold())
                            }
                        }
                    }
                    .frame(maxWidth: .infinity)
                }
            }
        }
        .cardStyle()
    }

    // MARK: - Top Clients

    private var topClientsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Top Clients by Spend")
                .font(.headline)

            let maxValue = topClients.first?.total ?? 1

            ForEach(topClients.indices, id: \.self) { idx in
                let client = topClients[idx]
                VStack(alignment: .leading, spacing: 6) {
                    HStack {
                        Text(client.name)
                            .font(.subheadline)
                        Spacer()
                        Text("₹\(String(format: "%.0f", client.total))")
                            .font(.subheadline.bold())
                            .foregroundStyle(.indigo)
                    }
                    GeometryReader { geo in
                        ZStack(alignment: .leading) {
                            RoundedRectangle(cornerRadius: 4)
                                .fill(Color(.tertiarySystemBackground))
                                .frame(height: 6)
                            RoundedRectangle(cornerRadius: 4)
                                .fill(
                                    LinearGradient(
                                        colors: [.indigo, .purple],
                                        startPoint: .leading,
                                        endPoint: .trailing
                                    )
                                )
                                .frame(width: geo.size.width * (client.total / maxValue), height: 6)
                        }
                    }
                    .frame(height: 6)
                }
            }
        }
        .cardStyle()
    }
}

// MARK: - KPI Card

struct KPICard: View {
    let title: String
    let value: String
    let icon: String
    let color: Color
    let subtitle: String

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: icon)
                    .font(.system(size: 18))
                    .foregroundStyle(color)
                Spacer()
                Text(subtitle)
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            }
            Text(value)
                .font(.system(size: 22, weight: .bold, design: .rounded))
                .foregroundStyle(.primary)
                .minimumScaleFactor(0.6)
                .lineLimit(1)
            Text(title)
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .padding(14)
        .background {
            RoundedRectangle(cornerRadius: 16)
                .fill(color.opacity(0.06))
        }
        .overlay {
            RoundedRectangle(cornerRadius: 16)
                .stroke(color.opacity(0.15), lineWidth: 1)
        }
    }
}
