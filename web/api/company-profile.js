import { ensureSchema, sql } from './_db.js'

export default async function handler(req, res) {
  try {
    await ensureSchema()

    if (req.method === 'GET') {
      const rows = await sql`SELECT data FROM company_profile WHERE id = 'default'`
      return res.status(200).json(rows[0] ? rows[0].data : null)
    }

    if (req.method === 'POST' || req.method === 'PUT') {
      const profile = req.body
      if (!profile) return res.status(400).json({ error: 'Missing profile data' })
      await sql`
        INSERT INTO company_profile (id, data, updated_at)
        VALUES ('default', ${JSON.stringify(profile)}::jsonb, now())
        ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = now()
      `
      return res.status(200).json({ ok: true })
    }

    res.setHeader('Allow', 'GET, POST, PUT')
    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
