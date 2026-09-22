-- Invoice module tables.
-- The app currently stores invoices/accounts locally through API routes;
-- these tables are ready for Supabase/Postgres persistence when connected.

CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY,
  invoice_number TEXT UNIQUE NOT NULL,
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  seller_name TEXT,
  seller_address TEXT,
  seller_contact TEXT,
  buyer_name TEXT,
  buyer_address TEXT,
  buyer_contact TEXT,
  tax TEXT,
  discount TEXT,
  notes TEXT,
  terms TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS invoice_items (
  id TEXT PRIMARY KEY,
  invoice_id TEXT REFERENCES invoices(id) ON DELETE CASCADE,
  description TEXT,
  quantity TEXT,
  unit_price TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  address TEXT,
  contact TEXT,
  type TEXT DEFAULT 'both',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_accounts_name ON accounts(name);
