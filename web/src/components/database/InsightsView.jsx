import React from 'react'
import { useStore } from '../../store/useStore'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement,
  ArcElement, Title, Tooltip, Legend,
} from 'chart.js'
import { Bar } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend)

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
  const invoices = state.invoices
  const ledgerEntries = state.ledgerEntries || []

  const rangeStart = getTimeRangeBounds(timeRange)
  const inRange = d => !rangeStart || new Date(d) >= rangeStart

  const filteredInvoices = invoices.filter(i => inRange(i.dateCreated))
  const filteredEntries = ledgerEntries.filter(e => inRange(e.timestamp))

  const sentInvoices = filteredInvoices.filter(i => i.status === 'Sent')
  const totalClientInvoiceAmt = filteredEntries
    .filter(e => e.transactionType === 'ClientInvoice')
    .reduce((s, e) => s + Math.abs(e.amount), 0)
  const totalOperatorPaymentAmt = filteredEntries
    .filter(e => e.transactionType === 'OperatorPayment')
    .reduce((s, e) => s + Math.abs(e.amount), 0)

  const paidCount = filteredInvoices.filter(i => i.status === 'Paid').length
  const draftCount = filteredInvoices.filter(i => i.status === 'Draft').length

  const kpis = [
    { label: 'Invoices Sent', value: sentInvoices.length, sub: 'Sent status only', icon: '📤' },
    { label: 'Client Invoice Total', value: `₹${totalClientInvoiceAmt.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, sub: 'All client invoices', icon: '🧾' },
    { label: 'Operator Payments', value: `₹${totalOperatorPaymentAmt.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, sub: 'Paid to operators', icon: '🔧' },
    { label: 'Paid Invoices', value: paidCount, sub: `${draftCount} drafts`, icon: '✅' },
  ]

  // Monthly breakdown (last 6 months)
  const months = []
  const clientAmts = []
  const operatorAmts = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    months.push(d.toLocaleString('en-IN', { month: 'short' }))
    clientAmts.push(
      ledgerEntries.filter(e => e.transactionType === 'ClientInvoice' && e.timestamp.startsWith(key))
        .reduce((s, e) => s + Math.abs(e.amount), 0)
    )
    operatorAmts.push(
      ledgerEntries.filter(e => e.transactionType === 'OperatorPayment' && e.timestamp.startsWith(key))
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
        {kpis.map(kpi => (
          <div key={kpi.label} style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 20 }}>{kpi.icon}</span>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{kpi.sub}</span>
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'white', marginBottom: 3, wordBreak: 'break-all' }}>{kpi.value}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* Monthly Bar Chart */}
      {(clientAmts.some(v => v > 0) || operatorAmts.some(v => v > 0)) && (
        <div style={{ ...cardStyle, padding: 16 }}>
          <div style={{ fontWeight: 700, marginBottom: 12, fontSize: 15, color: 'white' }}>Monthly Activity</div>
          <Bar
            data={{
              labels: months,
              datasets: [
                {
                  label: 'Client Invoices',
                  data: clientAmts,
                  backgroundColor: 'rgba(255,255,255,0.30)',
                  borderRadius: 5,
                  borderSkipped: false,
                },
                {
                  label: 'Operator Payments',
                  data: operatorAmts,
                  backgroundColor: 'rgba(255,255,255,0.10)',
                  borderRadius: 5,
                  borderSkipped: false,
                },
              ],
            }}
            options={{
              responsive: true,
              plugins: {
                legend: {
                  display: true,
                  labels: { color: 'rgba(255,255,255,0.5)', font: { size: 11 } },
                },
              },
              scales: {
                y: { beginAtZero: true, ticks: { callback: v => `₹${v}`, color: 'rgba(255,255,255,0.4)' }, grid: { color: 'rgba(255,255,255,0.05)' } },
                x: { ticks: { color: 'rgba(255,255,255,0.4)' }, grid: { color: 'rgba(255,255,255,0.05)' } },
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
