import { ensureSchema, toOperator, sql } from './_db.js'

export default async function handler(req, res) {
  try {
    await ensureSchema()

    if (req.method === 'GET') {
      const rows = await sql`SELECT * FROM operators ORDER BY name ASC`
      return res.status(200).json(rows.map(toOperator))
    }

    if (req.method === 'POST' || req.method === 'PUT') {
      const o = req.body
      if (!o || !o.id || !o.name) return res.status(400).json({ error: 'Missing id or name' })
      await sql`
        INSERT INTO operators (id, name, phone, address, pan_number, avatar_url, updated_at)
        VALUES (${o.id}, ${o.name}, ${o.phone || ''}, ${o.address || ''}, ${o.panNumber || ''}, ${o.avatarUrl || ''}, now())
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name, phone = EXCLUDED.phone, address = EXCLUDED.address,
          pan_number = EXCLUDED.pan_number, avatar_url = EXCLUDED.avatar_url, updated_at = now()
      `
      return res.status(200).json({ ok: true })
    }

    if (req.method === 'DELETE') {
      const id = req.query.id
      if (!id) return res.status(400).json({ error: 'Missing id' })
      await sql`DELETE FROM operators WHERE id = ${id}`
      return res.status(200).json({ ok: true })
    }

    res.setHeader('Allow', 'GET, POST, PUT, DELETE')
    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
