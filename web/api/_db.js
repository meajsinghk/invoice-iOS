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
  ready = true
}

export function toClient(row) {
  return {
    id: row.id, name: row.name, email: row.email || '', phone: row.phone || '',
    address: row.address || '', gstin: row.gstin || '', panNumber: row.pan_number || '',
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
  }
}
