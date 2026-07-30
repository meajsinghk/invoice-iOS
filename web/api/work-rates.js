import { ensureSchema, toWorkRate, sql } from './_db.js'

export default async function handler(req, res) {
  try {
    await ensureSchema()

    if (req.method === 'GET') {
      const rows = await sql`SELECT * FROM work_rates ORDER BY title ASC`
      return res.status(200).json(rows.map(toWorkRate))
    }

    if (req.method === 'POST' || req.method === 'PUT') {
      const r = req.body
      if (!r || !r.id || !r.title) return res.status(400).json({ error: 'Missing id or title' })
      await sql`
        INSERT INTO work_rates (id, title, hsn_code, unit_rate, default_tax_percentage, updated_at)
        VALUES (${r.id}, ${r.title}, ${r.hsnCode || ''}, ${r.unitRate || 0}, ${r.defaultTaxPercentage || 0}, now())
        ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title, hsn_code = EXCLUDED.hsn_code,
          unit_rate = EXCLUDED.unit_rate, default_tax_percentage = EXCLUDED.default_tax_percentage,
          updated_at = now()
      `
      return res.status(200).json({ ok: true })
    }

    if (req.method === 'DELETE') {
      const id = req.query.id
      if (!id) return res.status(400).json({ error: 'Missing id' })
      await sql`DELETE FROM work_rates WHERE id = ${id}`
      return res.status(200).json({ ok: true })
    }

    res.setHeader('Allow', 'GET, POST, PUT, DELETE')
    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
