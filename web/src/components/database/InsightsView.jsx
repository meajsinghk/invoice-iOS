import React from 'react'
import { useStore } from '../../store/useStore'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement,
  ArcElement, Title, Tooltip, Legend,
} from 'chart.js'
import { Bar } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend)

// Responsive font size — shrinks for large numbers to always fit on one line
function amtFontSize(val) {
  const digits = String(Math.round(Math.abs(val))).length
  if (digits >= 10) return 12
  if (digits >= 8) return 13
  if (digits >= 7) return 14
  if (digits >= 6) return 16
  if (digits >= 5) return 18
  return 20
}

function getTimeRangeBounds(timeRange) {
  const now = new Date()
  const start = new Date()
  switch (timeRange) {
    case 'Today':
      start.setHours(0, 0, 0, 0)
      break
    case 'This Week':
      start.setDate(now.getDate() - now.getDay())
      start.setHours(0, 0, 0, 0)
      break
    case 'This Month':
      start.setDate(1)
      start.setHours(0, 0, 0, 0)
      break
    case 'This Year':
      start.setMonth(0, 1)
      start.setHours(0, 0, 0, 0)
      break
    default:
      return null
  }
  return start
}

export default function InsightsView({ timeRange = 'All Time' }) {
  const { state } = useStore()
  const invoices = state.invoices || []
  const ledgerEntries = state.ledgerEntries || []

  const rangeStart = getTimeRangeBounds(timeRange)
  const inRange = d => !rangeStart || new Date(d) >= rangeStart

  const filteredInvoices = invoices.filter(i => inRange(i.dateCreated))
  const filteredEntries = ledgerEntries.filter(e => inRange(e.timestamp))

  // Invoices that were dispatched (Sent or Received, not just Draft)
  const sentInvoices = filteredInvoices.filter(i => i.status === 'Sent' || i.status === 'Received' || i.status === 'Paid')
  const receivedInvoices = filteredInvoices.filter(i => i.status === 'Received' || i.status === 'Paid')

  // Sum from ledger entries for accurate amounts
  const totalClientInvoiceAmt = filteredEntries
    .filter(e => e.transactionType === 'ClientInvoice')
    .reduce((s, e) => s + Math.abs(e.amount), 0)

  const totalClientReceivedAmt = filteredEntries
    .filter(e => e.transactionType === 'ClientPayment')
    .reduce((s, e) => s + Math.abs(e.amount), 0)

  const totalOperatorPaymentAmt = filteredEntries
    .filter(e => e.transactionType === 'OperatorPayment' || e.transactionType === 'OperatorAdvance')
    .reduce((s, e) => s + Math.abs(e.amount), 0)

  const kpis = [
    { label: 'Invoices Sent', value: sentInvoices.length, isMoney: false, sub: `${receivedInvoices.length} received`, icon: '📤' },
    { label: 'Client Invoice Total', value: totalClientInvoiceAmt, isMoney: true, sub: 'Total invoiced', icon: '🧾' },
    { label: 'Payments Received', value: totalClientReceivedAmt, isMoney: true, sub: 'From clients', icon: '💰' },
    { label: 'Operator Payments', value: totalOperatorPaymentAmt, isMoney: true, sub: 'Paid to operators', icon: '🔧' },
  ]

  // Monthly breakdown (last 6 months) — indexed by YYYY-MM
  const months = []
  const clientAmts = []
  const operatorAmts = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date()
    d.setDate(1)
    d.setMonth(d.getMonth() - i)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    months.push(d.toLocaleString('en-IN', { month: 'short' }))
    clientAmts.push(
      ledgerEntries
        .filter(e => e.transactionType === 'ClientInvoice' && (e.timestamp || '').slice(0, 7) === key)
        .reduce((s, e) => s + Math.abs(e.amount), 0)
    )
    operatorAmts.push(
      ledgerEntries
        .filter(e => (e.transactionType === 'OperatorPayment' || e.transactionType === 'OperatorAdvance') && (e.timestamp || '').slice(0, 7) === key)
        .reduce((s, e) => s + Math.abs(e.amount), 0)
    )
  }

  const cardStyle = {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 16, padding: 14,
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* KPI Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {kpis.map(kpi => {
          const display = kpi.isMoney
            ? `₹${kpi.value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
            : kpi.value
          const fs = kpi.isMoney ? amtFontSize(kpi.value) : 26
          return (
            <div key={kpi.label} style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 20 }}>{kpi.icon}</span>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', textAlign: 'right', maxWidth: 80 }}>{kpi.sub}</span>
              </div>
              <div style={{ fontSize: fs, fontWeight: 800, color: 'white', marginBottom: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.2 }}>{display}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>{kpi.label}</div>
            </div>
          )
        })}
      </div>

      {/* Monthly Bar Chart */}
      {(clientAmts.some(v => v > 0) || operatorAmts.some(v => v > 0)) && (
        <div style={{ ...cardStyle, padding: 16 }}>
          <div style={{ fontWeight: 700, marginBottom: 12, fontSize: 15, color: 'white' }}>Monthly Activity</div>
          {/* Legend */}
          <div style={{ display: 'flex', gap: 16, marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 12, height: 12, borderRadius: 3, background: 'rgba(255,255,255,0.85)' }} />
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>Client Invoices</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 12, height: 12, borderRadius: 3, background: 'rgba(255,255,255,0.35)' }} />
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', fontWeight: 600 }}>Operator Payments</span>
            </div>
          </div>
          <Bar
            data={{
              labels: months,
              datasets: [
                {
                  label: 'Client Invoices',
                  data: clientAmts,
                  backgroundColor: 'rgba(255,255,255,0.85)',
                  borderRadius: 5,
                  borderSkipped: false,
                },
                {
                  label: 'Operator Payments',
                  data: operatorAmts,
                  backgroundColor: 'rgba(255,255,255,0.30)',
                  borderRadius: 5,
                  borderSkipped: false,
                },
              ],
            }}
            options={{
              responsive: true,
              plugins: {
                legend: { display: false },
                tooltip: {
                  callbacks: {
                    label: ctx => ` ₹${ctx.parsed.y.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`,
                  },
                },
              },
              scales: {
                y: {
                  beginAtZero: true,
                  ticks: { callback: v => `₹${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`, color: 'rgba(255,255,255,0.4)', font: { size: 11 } },
                  grid: { color: 'rgba(255,255,255,0.05)' },
                },
                x: { ticks: { color: 'rgba(255,255,255,0.4)', font: { size: 11 } }, grid: { color: 'rgba(255,255,255,0.05)' } },
              },
            }}
          />
        </div>
      )}

      {filteredInvoices.length === 0 && filteredEntries.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(255,255,255,0.3)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
          <p>No data for the selected time range</p>
        </div>
      )}
    </div>
  )
}
