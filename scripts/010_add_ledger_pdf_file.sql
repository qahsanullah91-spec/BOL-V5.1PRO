-- Add per-row ledger PDF attachment storage.
-- PDF files are stored on the server/local PC in uploads/ledger-pdfs/.
-- Only the relative file path is stored in the ledger row.

CREATE TABLE IF NOT EXISTS ledger (
  id TEXT PRIMARY KEY,
  company_name TEXT,
  date DATE,
  description TEXT,
  invoice_no TEXT,
  ship_date DATE,
  bol_no TEXT,
  truck_no TEXT,
  container_no TEXT,
  consignee TEXT,
  quantity TEXT,
  driver_rent TEXT,
  debit TEXT,
  credit TEXT,
  pdf_file VARCHAR(500) NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE ledger
ADD COLUMN IF NOT EXISTS pdf_file VARCHAR(500) NULL;

COMMENT ON COLUMN ledger.pdf_file IS 'Relative local/server path to the ledger PDF attachment, for example uploads/ledger-pdfs/ledger_25_1757085452.pdf';
