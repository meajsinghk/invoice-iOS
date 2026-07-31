import { ensureSchema, toInvoice, sql } from './_db.js'

export default async function handler(req, res) {
  try {
    await ensureSchema()

    if (req.method === 'GET') {
      const rows = await sql`SELECT * FROM invoices ORDER BY date_created DESC`
      return res.status(200).json(rows.map(toInvoice))
    }

    if (req.method === 'POST' || req.method === 'PUT') {
      const i = req.body
      if (!i || !i.id || !i.invoiceNumber) return res.status(400).json({ error: 'Missing id or invoiceNumber' })
      await sql`
        INSERT INTO invoices (
          id, invoice_number, date_created, client_name, client_email, client_address,
          client_gstin, client_phone, client_pan, notes, line_items, subtotal, tax_total, grand_total,
          signature_data_url, status, pdf_filename, pdf_base64, updated_at
        )
        VALUES (
          ${i.id}, ${i.invoiceNumber}, ${i.dateCreated}, ${i.clientName || ''}, ${i.clientEmail || ''}, ${i.clientAddress || ''},
          ${i.clientGSTIN || ''}, ${i.clientPhone || ''}, ${i.clientPAN || ''}, ${i.notes || ''},
          ${JSON.stringify(i.lineItems || [])}::jsonb,
          ${i.subtotal || 0}, ${i.taxTotal || 0}, ${i.grandTotal || 0},
          ${i.signatureDataUrl || null}, ${i.status || 'Draft'}, ${i.pdfFilename || ''}, ${i.pdfBase64 || null}, now()
        )
        ON CONFLICT (id) DO UPDATE SET
          invoice_number = EXCLUDED.invoice_number, date_created = EXCLUDED.date_created,
          client_name = EXCLUDED.client_name, client_email = EXCLUDED.client_email, client_address = EXCLUDED.client_address,
          client_gstin = EXCLUDED.client_gstin, client_phone = EXCLUDED.client_phone, client_pan = EXCLUDED.client_pan,
          notes = EXCLUDED.notes,
          line_items = EXCLUDED.line_items, subtotal = EXCLUDED.subtotal, tax_total = EXCLUDED.tax_total,
          grand_total = EXCLUDED.grand_total, signature_data_url = EXCLUDED.signature_data_url,
          status = EXCLUDED.status, pdf_filename = EXCLUDED.pdf_filename, pdf_base64 = EXCLUDED.pdf_base64,
          updated_at = now()
      `
      return res.status(200).json({ ok: true })
    }

    if (req.method === 'DELETE') {
      const id = req.query.id
      if (!id) return res.status(400).json({ error: 'Missing id' })
      await sql`DELETE FROM invoices WHERE id = ${id}`
      return res.status(200).json({ ok: true })
    }

    res.setHeader('Allow', 'GET, POST, PUT, DELETE')
    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
