import jsPDF from 'jspdf'
import { numberToWords } from './numberToWords'

// Format a number: show as integer when there's no meaningful decimal part,
// otherwise show up to 2 decimal places with trailing zeros trimmed.
function fmt(n) {
  if (n === null || n === undefined || isNaN(n)) return '0'
  const rounded = Math.round(n * 100) / 100
  if (Number.isInteger(rounded)) return rounded.toString()
  return rounded.toFixed(2).replace(/0+$/, '').replace(/\.$/, '')
}

function money(n) {
  return `Rs. ${fmt(n)}`
}

export async function generateInvoicePDF(invoice, companyProfile = {}) {
  const p = {
    companyName: 'MY COMPANY',
    businessTagline: '',
    businessServices: '',
    addressLine1: '',
    addressLine2: '',
    companyGSTIN: '',
    companyPAN: '',
    companyPhone: '',
    bankNameAndBranch: '',
    bankAccountNo: '',
    bankIFSCCode: '',
    termsAndConditions: [
      'Certified that the particulars given above are true and correct.',
      'E.&O.E.',
      'Subject to Gwalior jurisdiction only.',
      'Goods once sold will not be taken back.',
    ],
    authorizedSignatoryName: '',
    ...companyProfile,
  }

  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const margin = 36
  const cx = pageW / 2
  let y = margin

  // ── HEADER ──────────────────────────────────────────────────
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(10, 10, 10)
  doc.text(p.companyName.toUpperCase(), cx, y + 16, { align: 'center' })
  y += 22

  if (p.businessTagline) {
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(60, 60, 60)
    doc.text(p.businessTagline, cx, y + 12, { align: 'center' })
    y += 14
  }
  if (p.businessServices) {
    doc.setFontSize(9)
    doc.setTextColor(80, 80, 80)
    doc.text(p.businessServices, cx, y + 12, { align: 'center' })
    y += 14
  }

  const addrParts = [p.addressLine1, p.addressLine2].filter(Boolean)
  if (addrParts.length) {
    doc.setFontSize(9)
    doc.setTextColor(80, 80, 80)
    doc.text(addrParts.join(', '), cx, y + 12, { align: 'center' })
    y += 14
  }

  const badges = [
    p.companyGSTIN && `GSTIN: ${p.companyGSTIN}`,
    p.companyPAN && `PAN: ${p.companyPAN}`,
    p.companyPhone && `Phone: ${p.companyPhone}`,
  ].filter(Boolean).join('  |  ')
  if (badges) {
    doc.setFontSize(8)
    doc.setTextColor(100, 100, 100)
    doc.text(badges, cx, y + 12, { align: 'center' })
    y += 14
  }

  y += 6
  doc.setDrawColor(30, 30, 30)
  doc.setLineWidth(1.5)
  doc.line(margin, y, pageW - margin, y)
  y += 14

  // ── TAX INVOICE TITLE ────────────────────────────────────────
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(10, 10, 10)
  doc.text('TAX INVOICE', cx, y + 12, { align: 'center' })
  y += 20

  doc.setDrawColor(200, 200, 200)
  doc.setLineWidth(0.5)
  doc.line(margin, y, pageW - margin, y)
  y += 12

  // ── META BLOCK ───────────────────────────────────────────────
  const dateStr = new Date(invoice.dateCreated).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
  const timeStr = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' })

  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(30, 30, 30)
  const leftLines = [
    `Invoice No.: ${invoice.invoiceNumber}`,
    `Billed To: ${invoice.clientName}`,
    invoice.clientAddress && `Address: ${invoice.clientAddress}`,
    invoice.clientPhone && `Phone: ${invoice.clientPhone}`,
    invoice.clientGSTIN && `Party GSTIN: ${invoice.clientGSTIN}`,
    invoice.clientPAN && `Party PAN: ${invoice.clientPAN}`,
  ].filter(Boolean)

  leftLines.forEach((line, i) => {
    doc.setFont('helvetica', i === 0 ? 'bold' : 'normal')
    doc.setTextColor(i === 0 ? 10 : 50, i === 0 ? 10 : 50, i === 0 ? 10 : 50)
    doc.text(line, margin, y + i * 13)
  })

  doc.setFont('helvetica', 'normal')
  doc.setTextColor(50, 50, 50)
  doc.text(`Date: ${dateStr}`, pageW - margin, y, { align: 'right' })
  doc.text(`Time: ${timeStr} IST`, pageW - margin, y + 13, { align: 'right' })

  y += leftLines.length * 13 + 12

  doc.setDrawColor(200, 200, 200)
  doc.setLineWidth(0.5)
  doc.line(margin, y, pageW - margin, y)
  y += 10

  // ── LINE ITEMS TABLE ─────────────────────────────────────────
  const { default: autoTable } = await import('jspdf-autotable')

  const rows = invoice.lineItems.map((item, idx) => {
    const sub = item.quantity * item.unitPrice
    return [
      idx + 1,
      item.title,
      item.hsnCode || '—',
      fmt(item.quantity),
      money(item.unitPrice),
      money(sub),
    ]
  })

  autoTable(doc, {
    startY: y,
    head: [['S.No', 'Particular Details', 'HSN Code', 'Qty', 'Rate', 'Amount']],
    body: rows,
    styles: { fontSize: 8.5, cellPadding: 5, lineColor: [200, 200, 200], lineWidth: 0.4 },
    headStyles: { fillColor: [30, 30, 30], textColor: [255, 255, 255], fontSize: 8.5, fontStyle: 'bold', halign: 'center' },
    columnStyles: {
      0: { cellWidth: 32, halign: 'center' },
      1: { cellWidth: 160 },
      2: { cellWidth: 62, halign: 'center' },
      3: { cellWidth: 44, halign: 'right' },
      4: { cellWidth: 66, halign: 'right' },
      5: { cellWidth: 66, halign: 'right' },
    },
    alternateRowStyles: { fillColor: [248, 248, 248] },
    margin: { left: margin, right: margin },
    tableLineColor: [180, 180, 180],
    tableLineWidth: 0.4,
  })

  y = doc.lastAutoTable.finalY + 14

  // ── TOTALS ───────────────────────────────────────────────────
  const cgst = invoice.taxTotal / 2
  const sgst = invoice.taxTotal / 2
  const totalsX = pageW - margin - 180

  const totalsRows = [
    ['Subtotal', invoice.subtotal],
    ['CGST (9%)', cgst],
    ['SGST (9%)', sgst],
  ]
  doc.setFontSize(9)
  totalsRows.forEach(([label, val]) => {
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(60, 60, 60)
    doc.text(label, totalsX, y)
    doc.text(money(val), pageW - margin, y, { align: 'right' })
    y += 15
  })

  doc.setDrawColor(30, 30, 30)
  doc.setLineWidth(0.8)
  doc.line(totalsX - 4, y - 4, pageW - margin, y - 4)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(10, 10, 10)
  doc.text('Estimated Grand Total', totalsX, y + 8)
  doc.text(money(invoice.grandTotal), pageW - margin, y + 8, { align: 'right' })
  y += 24

  // Amount in words
  doc.setFontSize(8.5)
  doc.setFont('helvetica', 'italic')
  doc.setTextColor(60, 60, 60)
  doc.text(`Amount in Words: ${numberToWords(invoice.grandTotal)} Only`, margin, y)
  y += 20

  // Notes / Remarks
  if (invoice.notes && invoice.notes.trim()) {
    doc.setFontSize(8.5)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(10, 10, 10)
    doc.text('NOTES / REMARKS:', margin, y)
    y += 12
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(50, 50, 50)
    const noteLines = doc.splitTextToSize(invoice.notes.trim(), pageW - margin * 2)
    noteLines.forEach(line => {
      doc.text(line, margin, y)
      y += 11
    })
    y += 4
  }

  doc.setDrawColor(200, 200, 200)
  doc.setLineWidth(0.5)
  doc.line(margin, y, pageW - margin, y)
  y += 14

  // ── FOOTER: BANK + TERMS (left) & SIGNATORY (right) ─────────
  const colMid = pageW / 2 - 10
  const rightCol = pageW / 2 + 10
  let leftY = y
  let rightY = y

  // Bank details
  doc.setFontSize(8.5)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(10, 10, 10)
  doc.text('BANK DETAILS FOR PAYMENT', margin, leftY)
  leftY += 13

  doc.setFont('helvetica', 'normal')
  doc.setTextColor(50, 50, 50)
  const bankLines = [
    p.bankNameAndBranch && `Bank Name & Branch: ${p.bankNameAndBranch}`,
    p.bankAccountNo && `Account No.: ${p.bankAccountNo}`,
    p.bankIFSCCode && `IFSC Code: ${p.bankIFSCCode}`,
  ].filter(Boolean)
  bankLines.forEach(line => {
    doc.text(line, margin, leftY)
    leftY += 12
  })
  leftY += 6

  // Terms
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(10, 10, 10)
  doc.text('TERMS & CONDITIONS:', margin, leftY)
  leftY += 12
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(50, 50, 50)
  ;(p.termsAndConditions || []).forEach((term, i) => {
    doc.text(`${i + 1}. ${term}`, margin, leftY)
    leftY += 11
  })

  // Signatory box (right column)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(50, 50, 50)
  doc.setFontSize(8.5)
  doc.text(`For ${p.companyName}`, rightCol, rightY)
  rightY += 12
  doc.text('Proprietor / Authorised Signatory', rightCol, rightY)
  rightY += 14

  if (invoice.signatureDataUrl) {
    try {
      doc.addImage(invoice.signatureDataUrl, 'PNG', rightCol, rightY, 150, 42)
      rightY += 48
    } catch {}
  }

  doc.setDrawColor(100)
  doc.setLineWidth(0.5)
  doc.line(rightCol, rightY, rightCol + 160, rightY)
  rightY += 10
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(10, 10, 10)
  doc.text(p.authorizedSignatoryName || 'Authorised Signatory', rightCol, rightY)

  // Page border
  doc.setDrawColor(180, 180, 180)
  doc.setLineWidth(0.5)
  doc.rect(10, 10, pageW - 20, pageH - 20)

  return doc.output('blob')
}
