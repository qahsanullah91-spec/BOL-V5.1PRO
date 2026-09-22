-- Add rate per KGS field to bill_of_lading records.

ALTER TABLE bill_of_lading
ADD COLUMN IF NOT EXISTS rate_per_kgs TEXT;
