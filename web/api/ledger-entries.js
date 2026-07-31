import { ensureSchema, toLedgerEntry, sql } from './_db.js'

export default async function handler(req, res) {
  try {
    await ensureSchema()

    if (req.method === 'GET') {
      const rows = await sql`SELECT * FROM ledger_entries ORDER BY timestamp DESC`
      return res.status(200).json(rows.map(toLedgerEntry))
    }

    if (req.method === 'POST' || req.method === 'PUT') {
      const e = req.body
      if (!e || !e.id) return res.status(400).json({ error: 'Missing id' })
      await sql`
        INSERT INTO ledger_entries (
          id, timestamp, transaction_type, amount, note_description,
          generated_by_person, entity_type, entity_id, invoice_pdf_url, line_items, updated_at
        )
        VALUES (
          ${e.id}, ${e.timestamp || new Date().toISOString()}, ${e.transactionType}, ${e.amount},
          ${e.noteDescription || ''}, ${e.generatedByPerson || ''}, ${e.entityType}, ${e.entityId},
          ${e.invoicePDFUrl || ''}, ${JSON.stringify(e.lineItems || [])}::jsonb, now()
        )
        ON CONFLICT (id) DO UPDATE SET
          transaction_type = EXCLUDED.transaction_type, amount = EXCLUDED.amount,
          note_description = EXCLUDED.note_description, generated_by_person = EXCLUDED.generated_by_person,
          entity_type = EXCLUDED.entity_type, entity_id = EXCLUDED.entity_id,
          invoice_pdf_url = EXCLUDED.invoice_pdf_url, line_items = EXCLUDED.line_items,
          updated_at = now()
      `
      return res.status(200).json({ ok: true })
    }

    if (req.method === 'DELETE') {
      const id = req.query.id
      if (!id) return res.status(400).json({ error: 'Missing id' })
      await sql`DELETE FROM ledger_entries WHERE id = ${id}`
      return res.status(200).json({ ok: true })
    }

    res.setHeader('Allow', 'GET, POST, PUT, DELETE')
    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
