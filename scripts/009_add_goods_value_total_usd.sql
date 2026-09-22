-- Add goods value field to bill_of_lading records.

ALTER TABLE bill_of_lading
ADD COLUMN IF NOT EXISTS goods_value TEXT;
