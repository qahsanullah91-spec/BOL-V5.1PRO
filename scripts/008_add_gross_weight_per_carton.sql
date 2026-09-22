-- Add gross weight per carton field to bill_of_lading records.

ALTER TABLE bill_of_lading
ADD COLUMN IF NOT EXISTS gross_weight_per_carton TEXT;
