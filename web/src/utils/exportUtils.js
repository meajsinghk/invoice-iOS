const CSV_HEADERS = [
  'Date', 'Time', 'Person Generated', 'Type', 'Entity Name',
  'Particular/Task', 'HSN Code', 'Qty', 'Rate', 'Amount',
  'CGST Rate %', 'CGST Amount', 'SGST Rate %', 'SGST Amount',
  'IGST Rate %', 'IGST Amount', 'Total Amount',
  'Money In (+)', 'Money Out (-)', 'Description',
]

function escapeCSV(val) {
  if (val === null || val === undefined) return ''
  const s = String(val)
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

function rowToCSV(row) {
  return row.map(escapeCSV).join(',')
}

function buildRows(ledgerEntries, clients, operators) {
  const rows = []

  for (const entry of ledgerEntries) {
    const d = new Date(entry.timestamp)
    const dateStr = d.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })
    const timeStr = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })

    let entityName = entry.entityId
    if (entry.entityType === 'Client') {
      const c = clients.find(c => c.id === entry.entityId)
      if (c) entityName = c.name
    } else {
      const o = operators.find(o => o.id === entry.entityId)
      if (o) entityName = o.name
    }

    const moneyIn = entry.amount > 0 ? entry.amount : ''
    const moneyOut = entry.amount < 0 ? Math.abs(entry.amount) : ''

    if (entry.lineItems && entry.lineItems.length > 0) {
      // Each line item gets its own row
      for (const item of entry.lineItems) {
        rows.push([
          dateStr, timeStr, entry.generatedByPerson || '',
          entry.entityType, entityName,
          item.particulars || '', item.hsnCode || '',
          item.qty, item.rate, item.amount,
          item.cgstRate || '', item.cgstAmount || '',
          item.sgstRate || '', item.sgstAmount || '',
          item.igstRate || '', item.igstAmount || '',
          item.amount,
          moneyIn, moneyOut,
          entry.noteDescription || '',
        ])
      }
    } else {
      rows.push([
        dateStr, timeStr, entry.generatedByPerson || '',
        entry.entityType, entityName,
        '', '', '', '', Math.abs(entry.amount),
        '', '', '', '', '', '',
        Math.abs(entry.amount),
        moneyIn, moneyOut,
        entry.noteDescription || '',
      ])
    }
  }

  return rows
}

export function exportAllDataToCSV(ledgerEntries = [], clients = [], operators = [], invoices = []) {
  // Sort all ledger entries newest first
  const sortedEntries = [...ledgerEntries].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))

  // Build a set of invoice numbers already covered by ledger entries
  const coveredInvoiceNums = new Set(
    sortedEntries
      .filter(e => e.transactionType === 'ClientPayment' && e.noteDescription)
      .map(e => e.noteDescription.replace(/.*Invoice\s+/, '').trim())
  )

  // Older received invoices not yet in ledger (pre-auto-entry)
  const extraClientRows = []
  for (const inv of invoices) {
    if (inv.status !== 'Received') continue
    if (coveredInvoiceNums.has(inv.invoiceNumber)) continue
    const d = new Date(inv.date || inv.createdAt || Date.now())
    const dateStr = d.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })
    const timeStr = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })

    // Compute GST totals from line items if available
    let totalCGST = 0, totalSGST = 0, totalIGST = 0
    let cgstRate = '', sgstRate = '', igstRate = ''
    if (inv.lineItems && inv.lineItems.length > 0) {
      inv.lineItems.forEach(item => {
        totalCGST += Number(item.cgstAmount || 0)
        totalSGST += Number(item.sgstAmount || 0)
        totalIGST += Number(item.igstAmount || 0)
        if (!cgstRate && item.cgstRate) cgstRate = item.cgstRate
        if (!sgstRate && item.sgstRate) sgstRate = item.sgstRate
        if (!igstRate && item.igstRate) igstRate = item.igstRate
      })
    }

    extraClientRows.push([
      dateStr, timeStr, inv.generatedByPerson || '',
      'Client', inv.clientName || '',
      `Invoice ${inv.invoiceNumber}`, '', '', '', inv.grandTotal || '',
      cgstRate, totalCGST || '', sgstRate, totalSGST || '', igstRate, totalIGST || '',
      inv.grandTotal || '',
      inv.grandTotal || '', '',
      `Payment received for Invoice ${inv.invoiceNumber}`,
    ])
  }

  const clientEntries = sortedEntries.filter(e => e.entityType === 'Client')
  const operatorEntries = sortedEntries.filter(e => e.entityType === 'Operator')

  const clientRows = [...buildRows(clientEntries, clients, operators), ...extraClientRows]
  const operatorRows = buildRows(operatorEntries, clients, operators)

  const dateTag = new Date().toISOString().slice(0, 10)

  if (clientRows.length === 0 && operatorRows.length === 0) {
    alert('No transaction data to export yet.')
    return
  }

  if (clientRows.length > 0) {
    const csvContent = [CSV_HEADERS.join(','), ...clientRows.map(rowToCSV)].join('\n')
    downloadCSV(csvContent, `clients_ledger_${dateTag}.csv`)
  }

  if (operatorRows.length > 0) {
    // Small delay so browser doesn't block two simultaneous downloads
    setTimeout(() => {
      const csvContent = [CSV_HEADERS.join(','), ...operatorRows.map(rowToCSV)].join('\n')
      downloadCSV(csvContent, `operators_ledger_${dateTag}.csv`)
    }, 400)
  }
}

function downloadCSV(content, filename) {
  const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
