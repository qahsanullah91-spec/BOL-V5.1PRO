-- Create bill_of_lading table with auto-incrementing BOL numbers
CREATE TABLE IF NOT EXISTS bill_of_lading (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bol_number TEXT UNIQUE NOT NULL,
  bol_sequence INTEGER UNIQUE NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  shipper TEXT,
  consignee TEXT,
  notify_party TEXT,
  vessel TEXT,
  voyage TEXT,
  port_of_loading TEXT,
  port_of_discharge TEXT,
  place_of_receipt TEXT,
  place_of_delivery TEXT,
  description TEXT,
  packages INTEGER,
  weight DECIMAL(10,2),
  measurement DECIMAL(10,2),
  freight_terms TEXT DEFAULT 'prepaid',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_bol_number ON bill_of_lading(bol_number);
CREATE INDEX IF NOT EXISTS idx_bol_sequence ON bill_of_lading(bol_sequence);

-- Create a sequence for BOL numbers (starting at 1)
CREATE SEQUENCE IF NOT EXISTS bol_sequence_counter START WITH 1 INCREMENT BY 1;

-- Function to get next BOL number
CREATE OR REPLACE FUNCTION get_next_bol_number()
RETURNS TEXT AS $$
DECLARE
  next_seq INTEGER;
BEGIN
  -- Get the next value from the sequence
  SELECT NEXTVAL('bol_sequence_counter') INTO next_seq;
  -- Return formatted BOL number with leading zeros (3 digits)
  RETURN 'BOL-' || LPAD(next_seq::TEXT, 3, '0');
END;
$$ LANGUAGE plpgsql;

-- Disable RLS for now (no auth required for this app)
ALTER TABLE bill_of_lading DISABLE ROW LEVEL SECURITY;
