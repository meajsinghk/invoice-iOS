import { neon } from '@neondatabase/serverless'

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL
export const sql = connectionString ? neon(connectionString) : null

let ready = false

// Idempotent schema creation — runs once per cold start.
export async function ensureSchema() {
  if (!sql) throw new Error('No database configured (DATABASE_URL / POSTGRES_URL missing)')
  if (ready) return
  await sql`
    CREATE TABLE IF NOT EXISTS clients (
      id UUID PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT DEFAULT '',
      phone TEXT DEFAULT '',
      address TEXT DEFAULT '',
      gstin TEXT DEFAULT '',
      pan_number TEXT DEFAULT '',
      avatar_url TEXT DEFAULT '',
      updated_at TIMESTAMPTZ DEFAULT now()
    )
  `
  await sql`ALTER TABLE clients ADD COLUMN IF NOT EXISTS avatar_url TEXT DEFAULT ''`
  await sql`
    CREATE TABLE IF NOT EXISTS operators (
      id UUID PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT DEFAULT '',
      address TEXT DEFAULT '',
      pan_number TEXT DEFAULT '',
      avatar_url TEXT DEFAULT '',
      updated_at TIMESTAMPTZ DEFAULT now()
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS work_rates (
      id UUID PRIMARY KEY,
      title TEXT NOT NULL,
      hsn_code TEXT DEFAULT '',
      unit_rate NUMERIC DEFAULT 0,
      default_tax_percentage NUMERIC DEFAULT 0,
      updated_at TIMESTAMPTZ DEFAULT now()
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS invoices (
      id UUID PRIMARY KEY,
      invoice_number TEXT NOT NULL,
      date_created TIMESTAMPTZ NOT NULL,
      client_name TEXT DEFAULT '',
      client_email TEXT DEFAULT '',
      client_address TEXT DEFAULT '',
      client_gstin TEXT DEFAULT '',
      client_phone TEXT DEFAULT '',
      client_pan TEXT DEFAULT '',
      line_items JSONB DEFAULT '[]',
      subtotal NUMERIC DEFAULT 0,
      tax_total NUMERIC DEFAULT 0,
      grand_total NUMERIC DEFAULT 0,
      signature_data_url TEXT,
      status TEXT DEFAULT 'Draft',
      pdf_filename TEXT DEFAULT '',
      pdf_base64 TEXT,
      generated_by TEXT DEFAULT '',
      updated_at TIMESTAMPTZ DEFAULT now()
    )
  `
  await sql`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS generated_by TEXT DEFAULT ''`
  await sql`
    CREATE TABLE IF NOT EXISTS ledger_entries (
      id UUID PRIMARY KEY,
      timestamp TIMESTAMPTZ NOT NULL,
      transaction_type TEXT NOT NULL,
      amount NUMERIC NOT NULL,
      note_description TEXT DEFAULT '',
      generated_by_person TEXT DEFAULT '',
      entity_type TEXT NOT NULL,
      entity_id UUID NOT NULL,
      invoice_pdf_url TEXT DEFAULT '',
      line_items JSONB DEFAULT '[]',
      updated_at TIMESTAMPTZ DEFAULT now()
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS company_profile (
      id TEXT PRIMARY KEY DEFAULT 'default',
      data JSONB NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT now()
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      phone TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      salt TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT now()
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS auth_sessions (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ DEFAULT now()
    )
  `
  ready = true
}

export function toClient(row) {
  return {
    id: row.id, name: row.name, email: row.email || '', phone: row.phone || '',
    address: row.address || '', gstin: row.gstin || '', panNumber: row.pan_number || '',
    avatarUrl: row.avatar_url || '',
  }
}

export function toOperator(row) {
  return {
    id: row.id, name: row.name, phone: row.phone || '',
    address: row.address || '', panNumber: row.pan_number || '',
    avatarUrl: row.avatar_url || '',
  }
}

export function toWorkRate(row) {
  return {
    id: row.id, title: row.title, hsnCode: row.hsn_code || '',
    unitRate: Number(row.unit_rate) || 0, defaultTaxPercentage: Number(row.default_tax_percentage) || 0,
  }
}

export function toInvoice(row) {
  return {
    id: row.id, invoiceNumber: row.invoice_number, dateCreated: row.date_created,
    clientName: row.client_name || '', clientEmail: row.client_email || '', clientAddress: row.client_address || '',
    clientGSTIN: row.client_gstin || '', clientPhone: row.client_phone || '', clientPAN: row.client_pan || '',
    lineItems: row.line_items || [], subtotal: Number(row.subtotal) || 0, taxTotal: Number(row.tax_total) || 0,
    grandTotal: Number(row.grand_total) || 0, signatureDataUrl: row.signature_data_url || null,
    status: row.status || 'Draft', pdfFilename: row.pdf_filename || '', pdfBase64: row.pdf_base64 || null,
    generatedByPerson: row.generated_by || '',
  }
}

export function toLedgerEntry(row) {
  return {
    id: row.id,
    timestamp: row.timestamp,
    transactionType: row.transaction_type,
    amount: Number(row.amount),
    noteDescription: row.note_description || '',
    generatedByPerson: row.generated_by_person || '',
    entityType: row.entity_type,
    entityId: row.entity_id,
    invoicePDFUrl: row.invoice_pdf_url || '',
    lineItems: row.line_items || [],
  }
}
