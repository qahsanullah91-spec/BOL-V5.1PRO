-- Add net weight field to bill_of_lading records.

ALTER TABLE bill_of_lading
ADD COLUMN IF NOT EXISTS net_weight TEXT;
