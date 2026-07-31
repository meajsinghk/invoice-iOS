// Thin wrapper around the Vercel serverless API routes (backed by Postgres).
// All calls fail gracefully (throw) when the DB isn't configured / unreachable —
// callers should catch and fall back to localStorage.

async function request(path, options) {
  const res = await fetch(`/api/${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    let msg = `Request to /api/${path} failed (${res.status})`
    try { const body = await res.json(); if (body?.error) msg = body.error } catch {}
    throw new Error(msg)
  }
  return res.json()
}

export const api = {
  fetchClients: () => request('clients'),
  saveClient: (client) => request('clients', { method: 'POST', body: JSON.stringify(client) }),
  deleteClient: (id) => request(`clients?id=${encodeURIComponent(id)}`, { method: 'DELETE' }),

  fetchOperators: () => request('operators'),
  saveOperator: (op) => request('operators', { method: 'POST', body: JSON.stringify(op) }),
  deleteOperator: (id) => request(`operators?id=${encodeURIComponent(id)}`, { method: 'DELETE' }),

  fetchWorkRates: () => request('work-rates'),
  saveWorkRate: (rate) => request('work-rates', { method: 'POST', body: JSON.stringify(rate) }),
  deleteWorkRate: (id) => request(`work-rates?id=${encodeURIComponent(id)}`, { method: 'DELETE' }),

  fetchInvoices: () => request('invoices'),
  saveInvoice: (invoice) => request('invoices', { method: 'POST', body: JSON.stringify(invoice) }),
  deleteInvoice: (id) => request(`invoices?id=${encodeURIComponent(id)}`, { method: 'DELETE' }),

  fetchLedgerEntries: () => request('ledger-entries'),
  saveLedgerEntry: (entry) => request('ledger-entries', { method: 'POST', body: JSON.stringify(entry) }),
  deleteLedgerEntry: (id) => request(`ledger-entries?id=${encodeURIComponent(id)}`, { method: 'DELETE' }),

  fetchCompanyProfile: () => request('company-profile'),
  saveCompanyProfile: (profile) => request('company-profile', { method: 'POST', body: JSON.stringify(profile) }),

  resetAllData: () => request('reset', { method: 'POST' }),
}
