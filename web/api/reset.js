import { sql, ensureSchema } from './_db.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    await ensureSchema()

    // Truncate all data tables; preserve users and auth_sessions (login credentials intact)
    await sql`TRUNCATE clients, operators, invoices, ledger_entries, work_rates RESTART IDENTITY CASCADE`
    await sql`DELETE FROM company_profile`

    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error('[reset]', err)
    return res.status(500).json({ error: err.message })
  }
}
