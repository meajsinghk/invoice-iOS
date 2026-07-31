import jsPDF from 'jspdf'
import { numberToWords } from './numberToWords'

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
    stampImageUrl: '/stamp.png',
    ...companyProfile,
  }
  // Guard: if DB returned null/empty for stampImageUrl, fall back to default
  if (!p.stampImageUrl) p.stampImageUrl = '/stamp.png'

  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const margin = 36
  const cx = pageW / 2
  let y = margin

  // ── HEADER ──────────────────────────────────────────────────
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(10, 10, 10)
  doc.text(p.companyName.toUpperCase(), cx, y + 16, { align: 'center' })
  y += 22

  if (p.businessTagline) {
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(60, 60, 60)
    doc.text(p.businessTagline, cx, y + 12, { align: 'center' })
    y += 14
  }
  if (p.businessServices) {
    doc.setFontSize(8.5)
    doc.setTextColor(80, 80, 80)
    const servLines = doc.splitTextToSize(p.businessServices, pageW - margin * 2)
    servLines.forEach(line => {
      doc.text(line, cx, y + 12, { align: 'center' })
      y += 13
    })
  }

  const addrParts = [p.addressLine1, p.addressLine2].filter(Boolean)
  if (addrParts.length) {
    doc.setFontSize(8.5)
    doc.setTextColor(80, 80, 80)
    addrParts.forEach(line => {
      doc.text(line, cx, y + 12, { align: 'center' })
      y += 13
    })
  }
  y += 2

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
  const leftLines = [
    `Invoice No.: ${invoice.invoiceNumber}`,
    invoice.clientName && `Billed To: ${invoice.clientName}`,
    invoice.clientAddress && `Address: ${invoice.clientAddress}`,
    invoice.clientPhone && `Phone: ${invoice.clientPhone}`,
    invoice.clientGSTIN && `Party GSTIN: ${invoice.clientGSTIN}`,
    invoice.clientPAN && `Party PAN: ${invoice.clientPAN}`,
  ].filter(Boolean)

  const lineH = 13
  leftLines.forEach((line, i) => {
    const wrappedLines = doc.splitTextToSize(line, (pageW - margin * 2) * 0.55)
    doc.setFont('helvetica', i === 0 ? 'bold' : 'normal')
    doc.setTextColor(i === 0 ? 10 : 50, i === 0 ? 10 : 50, i === 0 ? 10 : 50)
    wrappedLines.forEach((wl, wi) => {
      doc.text(wl, margin, y + i * lineH + wi * lineH)
    })
  })

  doc.setFont('helvetica', 'normal')
  doc.setTextColor(50, 50, 50)
  doc.text(`Date: ${dateStr}`, pageW - margin, y, { align: 'right' })
  doc.text(`Time: ${timeStr} IST`, pageW - margin, y + lineH, { align: 'right' })

  y += leftLines.length * lineH + 14

  doc.setDrawColor(200, 200, 200)
  doc.setLineWidth(0.5)
  doc.line(margin, y, pageW - margin, y)
  y += 10

  // ── LINE ITEMS TABLE ─────────────────────────────────────────
  const { default: autoTable } = await import('jspdf-autotable')

  const usableW = pageW - margin * 2

  // Build rows with per-item tax
  const rows = invoice.lineItems.map((item, idx) => {
    const sub = item.quantity * item.unitPrice
    const cgstAmt = sub * ((item.cgstRate || 0) / 100)
    const sgstAmt = sub * ((item.sgstRate || 0) / 100)
    const igstAmt = sub * ((item.igstRate || 0) / 100)
    const total = sub + cgstAmt + sgstAmt + igstAmt

    const taxParts = []
    if (item.cgstRate > 0) taxParts.push(`CGST ${item.cgstRate}%`)
    if (item.sgstRate > 0) taxParts.push(`SGST ${item.sgstRate}%`)
    if (item.igstRate > 0) taxParts.push(`IGST ${item.igstRate}%`)

    return [
      idx + 1,
      item.title || item.particulars || '',
      item.hsnCode || '—',
      fmt(item.quantity),
      money(item.unitPrice),
      taxParts.length ? taxParts.join('\n') : '—',
      money(total),
    ]
  })

  autoTable(doc, {
    startY: y,
    head: [['S.No', 'Particulars', 'HSN', 'Qty', 'Rate', 'Tax', 'Amount']],
    body: rows,
    styles: { fontSize: 8, cellPadding: 4, lineColor: [200, 200, 200], lineWidth: 0.4, overflow: 'linebreak' },
    headStyles: { fillColor: [20, 20, 20], textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold', halign: 'center' },
    columnStyles: {
      0: { cellWidth: usableW * 0.06, halign: 'center' },
      1: { cellWidth: usableW * 0.30 },
      2: { cellWidth: usableW * 0.10, halign: 'center' },
      3: { cellWidth: usableW * 0.08, halign: 'right' },
      4: { cellWidth: usableW * 0.14, halign: 'right' },
      5: { cellWidth: usableW * 0.14, halign: 'center' },
      6: { cellWidth: usableW * 0.18, halign: 'right' },
    },
    alternateRowStyles: { fillColor: [248, 248, 248] },
    margin: { left: margin, right: margin },
    tableLineColor: [180, 180, 180],
    tableLineWidth: 0.4,
    tableWidth: usableW,
  })

  y = doc.lastAutoTable.finalY + 14

  // ── TOTALS ───────────────────────────────────────────────────
  const totalsX = pageW - margin - 200

  // Compute per-item totals
  let subtotal = 0, totalCGST = 0, totalSGST = 0, totalIGST = 0
  invoice.lineItems.forEach(item => {
    const sub = item.quantity * item.unitPrice
    subtotal += sub
    totalCGST += sub * ((item.cgstRate || 0) / 100)
    totalSGST += sub * ((item.sgstRate || 0) / 100)
    totalIGST += sub * ((item.igstRate || 0) / 100)
  })
  const grandTotal = subtotal + totalCGST + totalSGST + totalIGST

  // Build totals rows with rates shown next to each tax line
  // Group by rate to show clean "CGST @ 9%: Rs. X" format
  const cgstByRate = {}, sgstByRate = {}, igstByRate = {}
  invoice.lineItems.forEach(item => {
    const sub = item.quantity * item.unitPrice
    if ((item.cgstRate || 0) > 0) {
      cgstByRate[item.cgstRate] = (cgstByRate[item.cgstRate] || 0) + sub * item.cgstRate / 100
    }
    if ((item.sgstRate || 0) > 0) {
      sgstByRate[item.sgstRate] = (sgstByRate[item.sgstRate] || 0) + sub * item.sgstRate / 100
    }
    if ((item.igstRate || 0) > 0) {
      igstByRate[item.igstRate] = (igstByRate[item.igstRate] || 0) + sub * item.igstRate / 100
    }
  })

  const totalsRows = [
    ['Subtotal', subtotal],
    ...Object.entries(cgstByRate).map(([rate, amt]) => [`CGST @ ${rate}%`, amt]),
    ...Object.entries(sgstByRate).map(([rate, amt]) => [`SGST @ ${rate}%`, amt]),
    ...Object.entries(igstByRate).map(([rate, amt]) => [`IGST @ ${rate}%`, amt]),
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

  // Scale font for large numbers
  const grandFontSize = grandTotal >= 100000 ? 9 : 11
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(grandFontSize)
  doc.setTextColor(10, 10, 10)
  doc.text('Estimated Grand Total', totalsX, y + 8)
  doc.text(money(grandTotal), pageW - margin, y + 8, { align: 'right' })
  y += 24

  // Amount in words
  doc.setFontSize(8.5)
  doc.setFont('helvetica', 'italic')
  doc.setTextColor(60, 60, 60)
  const wordsText = `Amount in Words: ${numberToWords(grandTotal)} Only`
  const wordsLines = doc.splitTextToSize(wordsText, usableW)
  wordsLines.forEach(line => {
    doc.text(line, margin, y)
    y += 13
  })
  y += 7

  doc.setDrawColor(200, 200, 200)
  doc.setLineWidth(0.5)
  doc.line(margin, y, pageW - margin, y)
  y += 14

  // ── FOOTER: BANK + TERMS (left) & SIGNATORY (right) ─────────
  const rightColX = pageW / 2 + 10
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
    const wrapped = doc.splitTextToSize(`${i + 1}. ${term}`, (pageW / 2 - margin - 16))
    wrapped.forEach(wl => {
      doc.text(wl, margin, leftY)
      leftY += 11
    })
  })

  // ── RIGHT COLUMN: SIGNATORY (center-aligned within column) ──────────────────
  const sigW = 200
  const sigX = pageW - margin - sigW
  const sigCx = sigX + sigW / 2   // center of the signature column

  // STAMP IMAGE — use Image element → canvas → JPEG for reliable rendering
  // This bypasses jsPDF's PNG alpha handling quirks and preserves exact aspect ratio
  if (p.stampImageUrl) {
    try {
      const stampUrl = p.stampImageUrl.startsWith('http')
        ? p.stampImageUrl
        : `${window.location.origin}${p.stampImageUrl.startsWith('/') ? '' : '/'}${p.stampImageUrl}`

      // Load via Image element to get real natural dimensions + browser decode
      const img = await new Promise((resolve, reject) => {
        const el = new Image()
        el.onload = () => resolve(el)
        el.onerror = () => reject(new Error('Image element failed to load'))
        el.src = stampUrl + (stampUrl.includes('?') ? '&' : '?') + '_t=' + Date.now()
      })

      const iw = img.naturalWidth || 423
      const ih = img.naturalHeight || 718

      // Render to canvas (white background eliminates alpha, gives clean JPEG for jsPDF)
      const canvas = document.createElement('canvas')
      canvas.width = iw
      canvas.height = ih
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, iw, ih)
      ctx.drawImage(img, 0, 0, iw, ih)
      const jpegDataUrl = canvas.toDataURL('image/jpeg', 0.92)

      // Scale to fit signature column — maintain exact aspect ratio (h/w)
      const aspectHW = ih / iw   // height-to-width ratio; >1 = portrait
      const targetH = 125        // desired stamp height in pt
      const safeRightY = Math.min(rightY, pageH - margin - targetH - 30)
      const finalH = Math.min(targetH, pageH - margin - safeRightY - 30)
      const finalW = finalH / aspectHW    // width derived from height: w = h / (h/w)

      // Center the stamp horizontally within the signature column
      const stampX = sigCx - finalW / 2
      doc.addImage(jpegDataUrl, 'JPEG', stampX, safeRightY, finalW, finalH)
      rightY = safeRightY + finalH + 8
    } catch (e) {
      console.warn('[PDF] Stamp failed:', e.message)
      doc.setFontSize(7)
      doc.setTextColor(180, 0, 0)
      doc.text('[Stamp not loaded]', sigCx, rightY + 8, { align: 'center' })
      rightY += 16
    }
  }

  doc.setDrawColor(100)
  doc.setLineWidth(0.5)
  doc.line(sigX + 10, rightY, pageW - margin - 10, rightY)
  rightY += 10

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(10, 10, 10)
  doc.text(`For M/S ${p.companyName}`, sigCx, rightY, { align: 'center' })
  rightY += 12
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(50, 50, 50)
  doc.text('Proprietor / Authorised Signatory', sigCx, rightY, { align: 'center' })
  rightY += 12
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(10, 10, 10)
  doc.text(p.authorizedSignatoryName || 'Authorised Signatory', sigCx, rightY, { align: 'center' })

  // Page border
  doc.setDrawColor(180, 180, 180)
  doc.setLineWidth(0.5)
  doc.rect(10, 10, pageW - 20, pageH - 20)

  return doc.output('blob')
}
