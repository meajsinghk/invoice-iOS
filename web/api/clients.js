import { ensureSchema, toClient, sql } from './_db.js'

export default async function handler(req, res) {
  try {
    await ensureSchema()

    if (req.method === 'GET') {
      const rows = await sql`SELECT * FROM clients ORDER BY name ASC`
      return res.status(200).json(rows.map(toClient))
    }

    if (req.method === 'POST' || req.method === 'PUT') {
      const c = req.body
      if (!c || !c.id || !c.name) return res.status(400).json({ error: 'Missing id or name' })
      await sql`
        INSERT INTO clients (id, name, email, phone, address, gstin, pan_number, avatar_url, updated_at)
        VALUES (${c.id}, ${c.name}, ${c.email || ''}, ${c.phone || ''}, ${c.address || ''}, ${c.gstin || ''}, ${c.panNumber || ''}, ${c.avatarUrl || ''}, now())
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name, email = EXCLUDED.email, phone = EXCLUDED.phone,
          address = EXCLUDED.address, gstin = EXCLUDED.gstin, pan_number = EXCLUDED.pan_number,
          avatar_url = EXCLUDED.avatar_url, updated_at = now()
      `
      return res.status(200).json({ ok: true })
    }

    if (req.method === 'DELETE') {
      const id = req.query.id
      if (!id) return res.status(400).json({ error: 'Missing id' })
      await sql`DELETE FROM clients WHERE id = ${id}`
      return res.status(200).json({ ok: true })
    }

    res.setHeader('Allow', 'GET, POST, PUT, DELETE')
    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
