-- Migration: Add driver_father_name column
-- Run this migration to add the driver father name field

ALTER TABLE bill_of_lading 
ADD COLUMN IF NOT EXISTS driver_father_name TEXT;

-- Also update container fields if they don't exist
ALTER TABLE bill_of_lading 
ADD COLUMN IF NOT EXISTS container_type TEXT;

ALTER TABLE bill_of_lading 
ADD COLUMN IF NOT EXISTS container_size TEXT;
