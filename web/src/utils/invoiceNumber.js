export function generateInvoiceNumber() {
  const d = new Date()
  const ym = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`
  return `INV-${ym}-${String(Math.floor(Math.random() * 9000) + 1000)}`
}
