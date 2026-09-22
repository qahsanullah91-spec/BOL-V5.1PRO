-- Add PDF storage fields to bill_of_lading table
ALTER TABLE bill_of_lading
ADD COLUMN IF NOT EXISTS pdf_url TEXT,
ADD COLUMN IF NOT EXISTS pdf_uploaded_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS pdf_file_size INTEGER,
ADD COLUMN IF NOT EXISTS pdf_storage_path TEXT;

-- Create index for faster PDF lookups
CREATE INDEX IF NOT EXISTS idx_pdf_url ON bill_of_lading(pdf_url) WHERE pdf_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pdf_uploaded_at ON bill_of_lading(pdf_uploaded_at DESC);

-- Add comment to document the PDF fields
COMMENT ON COLUMN bill_of_lading.pdf_url IS 'URL to the stored PDF document in Blob storage';
COMMENT ON COLUMN bill_of_lading.pdf_uploaded_at IS 'Timestamp when the PDF was uploaded';
COMMENT ON COLUMN bill_of_lading.pdf_file_size IS 'Size of the PDF file in bytes';
COMMENT ON COLUMN bill_of_lading.pdf_storage_path IS 'Storage path of the PDF in Blob storage';
