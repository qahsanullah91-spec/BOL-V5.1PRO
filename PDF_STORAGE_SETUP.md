# PDF Storage Setup Guide

This guide explains how to set up and use the local PDF storage feature for Bill of Lading documents.

## Overview

The Bill of Lading application now includes a complete PDF storage system that allows users to:
- Generate PDFs from BOL documents
- Store PDFs securely using Vercel Blob storage
- Download stored PDFs
- Manage PDF documents from the sidebar

## Architecture

### Components

1. **PDF Generation** (`lib/utils/pdf-upload.ts`)
   - `generatePDFBlob()` - Converts HTML element to PDF blob using html2pdf.js
   - `uploadPDFToServer()` - Uploads PDF to server storage
   - `downloadPDFFromServer()` - Downloads PDF from storage
   - `deletePDFFromServer()` - Removes PDF from storage

2. **API Routes** (`app/api/bol/pdf/route.ts`)
   - `POST /api/bol/pdf` - Upload and store PDF
   - `GET /api/bol/pdf` - List or download PDFs
   - `DELETE /api/bol/pdf` - Delete stored PDF

3. **UI Components**
   - `PDFDownloadButton` - Download/delete PDF buttons in sidebar
   - `SavedDocuments` - Updated sidebar showing PDF status
   - `BOLEditor` - Export PDF button in toolbar

4. **Database** (`scripts/004_add_pdf_storage.sql`)
   - `pdf_url` - URL to stored PDF in Blob storage
   - `pdf_uploaded_at` - Timestamp when PDF was uploaded
   - `pdf_file_size` - PDF file size in bytes
   - `pdf_storage_path` - Storage path in Blob storage

## Setup Instructions

### 1. Install Dependencies

The required packages are already installed:
```bash
pnpm add html2pdf.js @types/html2pdf.js
```

### 2. Configure Blob Storage

Ensure `BLOB_READ_WRITE_TOKEN` environment variable is set in your Vercel project settings.

### 3. Run Database Migration

Execute the migration script to add PDF fields to the database:

```sql
-- File: scripts/004_add_pdf_storage.sql
ALTER TABLE bill_of_lading
ADD COLUMN IF NOT EXISTS pdf_url TEXT,
ADD COLUMN IF NOT EXISTS pdf_uploaded_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS pdf_file_size INTEGER,
ADD COLUMN IF NOT EXISTS pdf_storage_path TEXT;
```

## Usage

### Exporting a PDF

1. Fill in the BOL form
2. Click "A4 Preview" to view the document
3. Click "Export PDF" button
4. The system will:
   - Generate PDF from the preview
   - Upload to Blob storage
   - Save the PDF URL to the database
   - Display a success message

### Downloading a PDF

1. View saved documents in the sidebar
2. Hover over a document that has a PDF stored
3. Click the "Download" icon to open the PDF
4. Or click the "Delete" icon to remove the PDF

### Managing PDFs

- PDFs are stored in `bol-documents/{BOL_NUMBER}/{FILENAME}` path
- Each BOL can have one PDF stored
- PDFs are private by default (access requires valid token)
- Deleting a PDF removes it from storage and clears the database reference

## Technical Details

### PDF Generation Flow

```
1. User clicks "Export PDF"
2. Find A4Preview element with data-pdf-export="true"
3. Clone element to avoid side effects
4. Generate PDF using html2pdf.js
5. Return Blob
```

### PDF Upload Flow

```
1. Create FormData with PDF blob
2. POST to /api/bol/pdf with bolId and bolNumber
3. Server receives and validates
4. Upload to Blob storage with path: bol-documents/{bolNumber}/{timestamp}.pdf
5. Store URL in database
6. Return success with PDF URL
```

### PDF Download Flow

```
1. User clicks download on saved document
2. Fetch /api/bol/pdf?action=download&bolId={id}
3. Get PDF URL from database
4. Open URL in new window/tab
5. Browser downloads the file
```

## Troubleshooting

### PDF Generation Fails

**Error**: "Attempting to parse an unsupported color function 'lab'"

**Solution**: This is a known limitation of html2pdf with CSS 4 colors. The system automatically handles this with:
- Element cloning to avoid DOM mutations
- Simplified styling during PDF generation
- White background for printing

### Upload Fails

Check:
1. `BLOB_READ_WRITE_TOKEN` is set
2. Database migration has been run
3. Supabase connection is working
4. File size is reasonable (< 50MB)

### PDF Not Accessible After Upload

Verify:
1. PDF URL is saved in database: `select pdf_url from bill_of_lading where bol_number = 'BOL-001';`
2. Blob storage contains the file
3. Token has read permissions for the file

## Files Modified/Created

### New Files
- `lib/utils/pdf-upload.ts` - PDF utilities
- `lib/utils/pdf-generator.ts` - Server-side PDF generation
- `components/bill-of-lading/pdf-download-button.tsx` - UI component
- `app/api/bol/pdf/route.ts` - PDF API endpoints
- `scripts/004_add_pdf_storage.sql` - Database schema

### Modified Files
- `components/bill-of-lading/bol-editor.tsx` - Added Export PDF button
- `components/bill-of-lading/saved-documents.tsx` - Show PDF status
- `components/bill-of-lading/a4-preview.tsx` - Added data-pdf-export marker
- `lib/types/bill-of-lading.ts` - Added id and bol_number fields
- `app/layout.tsx` - Added Sonner toast provider

## Environment Variables

Required:
- `BLOB_READ_WRITE_TOKEN` - Vercel Blob storage token (auto-set by integration)

Optional:
- `NEXT_PUBLIC_BLOB_BASE_URL` - Custom Blob base URL

## Dependencies

- `html2pdf.js` - PDF generation from HTML
- `@types/html2pdf.js` - TypeScript types
- `@vercel/blob` - Cloud storage
- `sonner` - Toast notifications (already present)
