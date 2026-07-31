import { sql, ensureSchema } from './_db.js'
import { scryptSync, randomBytes, timingSafeEqual } from 'crypto'

// ── WHITELIST ─────────────────────────────────────────────────────────────────
// Only these phone numbers and emails are permitted to register or log in.
// Phones are stored/matched without country code prefix.
const ALLOWED_PHONES = new Set([
  '7770855666',
  '6475408800',
  '9098815367',
])

const ALLOWED_EMAILS = new Set([
  'virk.milan006@gmail.com',
  'amarjot.johal@yahoo.com',
  'johalamrit30@gmail.com',
])

function normalizePhone(raw = '') {
  // Strip spaces, dashes, parentheses, leading + and country code (91)
  let p = raw.replace(/[\s\-().+]/g, '')
  if (p.startsWith('91') && p.length === 12) p = p.slice(2)
  return p
}

function isAllowed(phoneRaw = '', emailRaw = '') {
  const phone = normalizePhone(phoneRaw)
  const email = (emailRaw || '').trim().toLowerCase()
  return ALLOWED_PHONES.has(phone) || ALLOWED_EMAILS.has(email)
}
// ─────────────────────────────────────────────────────────────────────────────

function hashPassword(password, salt) {
  return scryptSync(password, salt, 64).toString('hex')
}

function generateToken() {
  return randomBytes(32).toString('hex')
}

function generateId() {
  return randomBytes(16).toString('hex')
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  if (!sql) return res.status(503).json({ error: 'Database not configured' })

  try {
    await ensureSchema()
  } catch (err) {
    return res.status(503).json({ error: 'Database unavailable: ' + err.message })
  }

  const { action, phone, password, name, email } = req.body || {}

  // ── check_users: does any user exist yet? ─────────────────────────────
  if (action === 'check_users') {
    try {
      const rows = await sql`SELECT COUNT(*)::int AS count FROM users`
      return res.json({ hasUsers: rows[0].count > 0 })
    } catch (err) {
      return res.status(500).json({ error: err.message })
    }
  }

  // ── register: create first / additional account ───────────────────────
  if (action === 'register') {
    if (!phone || !password || !name)
      return res.status(400).json({ error: 'Phone, name and password are required.' })
    if (password.length < 4)
      return res.status(400).json({ error: 'Password must be at least 4 characters.' })

    // Whitelist check — must match phone OR email
    if (!isAllowed(phone, email))
      return res.status(403).json({ error: 'Access denied. This phone number or email is not authorised to use this app.' })

    try {
      const existing = await sql`SELECT id FROM users WHERE phone = ${phone.trim()}`
      if (existing.length > 0)
        return res.status(409).json({ error: 'This phone number is already registered.' })

      const salt = randomBytes(16).toString('hex')
      const hash = hashPassword(password, salt)
      const id = generateId()
      const displayName = name.trim()

      await sql`
        INSERT INTO users (id, phone, name, password_hash, salt)
        VALUES (${id}, ${phone.trim()}, ${displayName}, ${hash}, ${salt})
      `

      const token = generateToken()
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      await sql`
        INSERT INTO auth_sessions (token, user_id, expires_at)
        VALUES (${token}, ${id}, ${expiresAt})
      `

      return res.json({ token, personName: displayName, phone: phone.trim() })
    } catch (err) {
      return res.status(500).json({ error: err.message })
    }
  }

  // ── login ─────────────────────────────────────────────────────────────
  if (action === 'login') {
    if (!phone || !password)
      return res.status(400).json({ error: 'Phone and password are required.' })

    // Whitelist check — prevents locked-out accounts from being brute-forced
    if (!isAllowed(phone, ''))
      return res.status(403).json({ error: 'Access denied. This phone number is not authorised to use this app.' })

    try {
      const rows = await sql`SELECT * FROM users WHERE phone = ${phone.trim()}`
      if (rows.length === 0)
        return res.status(401).json({ error: 'Invalid phone number or password.' })

      const user = rows[0]
      const attempted = Buffer.from(hashPassword(password, user.salt), 'hex')
      const stored   = Buffer.from(user.password_hash, 'hex')

      if (attempted.length !== stored.length || !timingSafeEqual(attempted, stored))
        return res.status(401).json({ error: 'Invalid phone number or password.' })

      const token = generateToken()
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      await sql`
        INSERT INTO auth_sessions (token, user_id, expires_at)
        VALUES (${token}, ${user.id}, ${expiresAt})
      `

      return res.json({ token, personName: user.name, phone: user.phone })
    } catch (err) {
      return res.status(500).json({ error: err.message })
    }
  }

  // ── verify: validate a stored token (used on app start) ───────────────
  if (action === 'verify') {
    const { token } = req.body || {}
    if (!token) return res.status(400).json({ error: 'Token required.' })

    try {
      const rows = await sql`
        SELECT u.name, u.phone FROM auth_sessions s
        JOIN users u ON s.user_id = u.id
        WHERE s.token = ${token} AND s.expires_at > now()
      `
      if (rows.length === 0)
        return res.status(401).json({ error: 'Session expired. Please log in again.' })

      return res.json({ valid: true, personName: rows[0].name, phone: rows[0].phone })
    } catch (err) {
      return res.status(500).json({ error: err.message })
    }
  }

  return res.status(400).json({ error: 'Unknown action.' })
}
