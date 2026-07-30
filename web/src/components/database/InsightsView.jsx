import React from 'react'
import { useStore } from '../../store/useStore'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement,
  ArcElement, Title, Tooltip, Legend,
} from 'chart.js'
import { Bar, Doughnut } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend)

export default function InsightsView() {
  const { state } = useStore()
  const invoices = state.invoices

  const totalRevenue = invoices.filter(i => i.status === 'Paid').reduce((s, i) => s + i.grandTotal, 0)
  const outstanding = invoices.filter(i => i.status !== 'Paid').reduce((s, i) => s + i.grandTotal, 0)
  const paidCount = invoices.filter(i => i.status === 'Paid').length
  const sentCount = invoices.filter(i => i.status === 'Sent').length
  const draftCount = invoices.filter(i => i.status === 'Draft').length
  const avgInvoice = invoices.length ? invoices.reduce((s, i) => s + i.grandTotal, 0) / invoices.length : 0

  // Monthly revenue (last 6 months)
  const months = []
  const monthRevenue = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = d.toLocaleString('en-IN', { month: 'short' })
    months.push(label)
    const rev = invoices.filter(inv => inv.status === 'Paid' && inv.dateCreated.startsWith(key)).reduce((s, inv) => s + inv.grandTotal, 0)
    monthRevenue.push(rev)
  }

  // Top clients
  const clientMap = {}
  invoices.forEach(inv => { clientMap[inv.clientName] = (clientMap[inv.clientName] || 0) + inv.grandTotal })
  const topClients = Object.entries(clientMap).sort((a, b) => b[1] - a[1]).slice(0, 5)
  const maxClientVal = topClients[0]?.[1] || 1

  const kpis = [
    { label: 'Total Revenue', value: `₹${totalRevenue.toFixed(0)}`, sub: `${paidCount} paid`, icon: '💰' },
    { label: 'Invoices', value: invoices.length, sub: `${draftCount} drafts, ${sentCount} sent`, icon: '📄' },
    { label: 'Outstanding', value: `₹${outstanding.toFixed(0)}`, sub: `${invoices.length - paidCount} unpaid`, icon: '⚠️' },
    { label: 'Avg Invoice', value: invoices.length ? `₹${avgInvoice.toFixed(0)}` : '—', sub: 'per invoice', icon: '📊' },
  ]

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

      {/* Monthly Revenue Bar Chart */}
      {monthRevenue.some(v => v > 0) && (
        <div style={{ ...cardStyle, padding: 16 }}>
          <div style={{ fontWeight: 700, marginBottom: 12, fontSize: 15, color: 'white' }}>Monthly Revenue</div>
          <Bar
            data={{
              labels: months,
              datasets: [{
                label: 'Revenue (₹)',
                data: monthRevenue,
                backgroundColor: 'rgba(255,255,255,0.25)',
                borderRadius: 6,
                borderSkipped: false,
              }],
            }}
            options={{
              responsive: true,
              plugins: { legend: { display: false } },
              scales: {
                y: { beginAtZero: true, ticks: { callback: v => `₹${v}`, color: 'rgba(255,255,255,0.45)' }, grid: { color: 'rgba(255,255,255,0.06)' } },
                x: { ticks: { color: 'rgba(255,255,255,0.45)' }, grid: { color: 'rgba(255,255,255,0.06)' } },
              },
            }}
          />
        </div>
      )}

      {/* Status Donut */}
      {invoices.length > 0 && (
        <div style={{ ...cardStyle, padding: 16 }}>
          <div style={{ fontWeight: 700, marginBottom: 12, fontSize: 15, color: 'white' }}>Invoice Status</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <div style={{ width: 120, height: 120, flexShrink: 0 }}>
              <Doughnut
                data={{
                  labels: ['Draft', 'Sent', 'Paid'],
                  datasets: [{
                    data: [draftCount, sentCount, paidCount],
                    backgroundColor: ['rgba(249,115,22,0.5)', 'rgba(96,165,250,0.5)', 'rgba(74,222,128,0.5)'],
                    borderColor: ['#f97316', '#60a5fa', '#4ade80'],
                    borderWidth: 2,
                    hoverOffset: 4,
                  }],
                }}
                options={{ plugins: { legend: { display: false } }, cutout: '60%' }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
              {[['Draft', draftCount, '#f97316'], ['Sent', sentCount, '#60a5fa'], ['Paid', paidCount, '#4ade80']].map(([l, v, c]) => (
                <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: c, display: 'inline-block', flexShrink: 0 }} />
                  <span style={{ fontSize: 14, flex: 1, color: 'rgba(255,255,255,0.7)' }}>{l}</span>
                  <span style={{ fontWeight: 700, fontSize: 14, color: 'white' }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Top Clients */}
      {topClients.length > 0 && (
        <div style={{ ...cardStyle, padding: 16 }}>
          <div style={{ fontWeight: 700, marginBottom: 14, fontSize: 15, color: 'white' }}>Top Clients by Spend</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {topClients.map(([name, val]) => (
              <div key={name}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>{name}</span>
                  <span style={{ fontWeight: 700, fontSize: 13, color: 'white' }}>₹{val.toFixed(0)}</span>
                </div>
                <div style={{ height: 5, borderRadius: 4, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 4, width: `${(val / maxClientVal) * 100}%`, background: 'rgba(255,255,255,0.4)' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {invoices.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(255,255,255,0.3)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
          <p>Generate invoices to see insights</p>
        </div>
      )}
    </div>
  )
}
