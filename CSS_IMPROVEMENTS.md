# CSS Improvements for Export Account Ledger

## Add to ExportAccountLedgerPrint.css

### 1. Enhanced Page and Table Styling

```css
/* ===== IMPROVED PAGE STYLING ===== */
.export-ledger-print-page {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(255, 255, 255, 0.98)),
    url("/images/account-ledger-background.png");
  background-position: center;
  background-size: cover;
  border: 2px solid rgba(212, 175, 55, 0.85);
  border-radius: 28px;
  box-shadow:
    0 40px 100px rgba(15, 23, 42, 0.28),
    0 16px 40px rgba(37, 99, 235, 0.18),
    inset 0 1px 0 rgba(255, 255, 255, 0.6);
  color: #0f172a;
  font-family:
    Inter,
    "Noto Naskh Arabic",
    "Noto Sans Arabic",
    Tahoma,
    Arial,
    ui-sans-serif,
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif;
  min-height: 198mm;
  overflow: hidden;
  padding: 11mm;
  transform: scale(var(--print-preview-scale, 1));
  transform-origin: top center;
  width: 95%;
  max-width: 285mm;
}

/* ===== IMPROVED TABLE HEADER ===== */
.export-ledger-print-table thead {
  display: table-header-group;
  page-break-after: avoid;
}

.export-ledger-print-table th {
  background: linear-gradient(to bottom, #f7d474 0%, #f4d03f 100%);
  border: 1.2px solid rgba(168, 115, 0, 0.7);
  color: #0b1f4d;
  font-size: 6.6px;
  font-weight: 950;
  letter-spacing: 0.12em;
  line-height: 1.3;
  padding: 2.2mm 1.2mm;
  text-transform: uppercase;
  vertical-align: middle;
  direction: rtl;
  text-align: right;
  white-space: normal;
  overflow-wrap: break-word;
  word-wrap: break-word;
  word-break: break-word;
}

/* ===== IMPROVED TABLE ROWS ===== */
.export-ledger-print-table tbody tr {
  page-break-inside: avoid;
  transition: background-color 0.15s;
}

.export-ledger-print-table tbody tr:nth-child(even) td {
  background: rgba(255, 251, 235, 0.85);
}

.export-ledger-print-table tbody tr:nth-child(odd) td {
  background: rgba(255, 255, 255, 0.92);
}

.export-ledger-print-table tbody tr:hover td {
  background: rgba(219, 234, 254, 0.5);
}

/* ===== IMPROVED TABLE CELLS ===== */
.export-ledger-print-table td {
  border: 1px solid rgba(168, 115, 0, 0.4);
  color: #172033;
  font-size: 6.8px;
  font-weight: 700;
  line-height: 1.4;
  min-height: 12mm;
  overflow-wrap: break-word;
  word-wrap: break-word;
  word-break: break-word;
  padding: 1.8mm 1.2mm;
  vertical-align: top;
  direction: ltr;
  text-align: left;
}

.export-ledger-print-table td[dir="rtl"] {
  direction: rtl;
  text-align: right;
  font-family:
    "Noto Naskh Arabic",
    "Noto Sans Arabic",
    Tahoma,
    "Arial Unicode MS",
    Arial,
    sans-serif !important;
}

/* ===== MERGED CELL STYLING ===== */
.export-ledger-print-table .merged-print-cell {
  display: grid;
  gap: 0.9mm;
  text-align: left;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 2px;
  padding: 0.5mm 0.8mm;
}

.export-ledger-print-table .merged-print-cell span {
  display: block;
  margin: 0;
  opacity: 1;
  word-break: break-word;
  line-height: 1.3;
}

.export-ledger-print-table .merged-print-cell strong {
  color: #0b1f4d;
  font-weight: 950;
  font-size: 6.8px;
  display: block;
  margin-bottom: 0.3mm;
}

.export-ledger-print-table .merged-print-cell .label {
  color: #8b6b00;
  font-size: 5.8px;
  font-weight: 900;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  margin-bottom: 0.4mm;
  display: block;
}

.export-ledger-print-table .merged-print-cell .label.rtl,
.export-ledger-print-table .merged-print-cell span.rtl {
  direction: rtl;
  text-align: right;
  font-family:
    "Noto Naskh Arabic",
    "Noto Sans Arabic",
    Tahoma,
    Arial,
    sans-serif;
}

/* ===== COLUMN WIDTHS FOR MERGED LAYOUT ===== */
.col-sno {
  width: 5%;
}

.col-date-merged {
  width: 14%;
}

.col-description-merged {
  width: 24%;
}

.col-bl-consignee {
  width: 22%;
}

.col-container-merged {
  width: 18%;
}

.col-money-merged {
  width: 12%;
}

/* ===== FOOTER STYLING ===== */
.export-ledger-print-table tfoot td {
  background: #0f172a;
  color: #ffffff;
  font-weight: 950;
  font-size: 7px;
  padding: 2.5mm 1.2mm;
  border: 1.2px solid rgba(212, 175, 55, 0.6);
  text-align: right;
  direction: ltr;
}

.export-ledger-print-table tfoot .positive {
  color: #10b981;
}

.export-ledger-print-table tfoot .negative {
  color: #ef4444;
}

/* ===== PRINT MEDIA SETTINGS ===== */
@media print {
  .export-ledger-print-page {
    background:
      linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(255, 255, 255, 0.99)),
      url("/images/account-ledger-background.png");
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }

  .export-ledger-print-table td,
  .export-ledger-print-table th {
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
    page-break-inside: avoid;
  }

  .export-ledger-print-table tbody tr:nth-child(even) td {
    background: rgba(255, 251, 235, 0.88) !important;
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }

  .export-ledger-print-table tbody tr:nth-child(odd) td {
    background: rgba(255, 255, 255, 0.95) !important;
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }
}
```

---

## Add to account-manager.tsx globals.css

### RTL & Pashto Font Support

```css
/* ===== PASHTO/ARABIC RTL TEXT SUPPORT ===== */
[dir="rtl"],
.pashto-text,
.ledger-table[dir="rtl"] {
  direction: rtl;
  unicode-bidi: bidi-override;
  font-family:
    "Noto Naskh Arabic",
    "Noto Sans Arabic",
    Tahoma,
    "Arial Unicode MS",
    Arial,
    sans-serif !important;
  text-align: right;
}

.ledger-table[dir="rtl"] {
  text-align: right;
  unicode-bidi: bidi-override;
  border-collapse: collapse;
}

.ledger-table[dir="rtl"] thead th {
  text-align: right;
  direction: rtl;
  unicode-bidi: bidi-override;
  padding-right: 1.2mm;
  padding-left: 0.4mm;
}

.ledger-table[dir="rtl"] td {
  direction: rtl;
  unicode-bidi: bidi-override;
  text-align: right;
  padding-right: 1mm;
  padding-left: 0.4mm;
}

.ledger-table__header-title,
.ledger-table__header-subtitle {
  word-break: break-word;
  overflow-wrap: break-word;
  word-wrap: break-word;
  line-height: 1.2;
  letter-spacing: 0.02em;
}

/* ===== LTR TEXT INSIDE RTL CONTEXT ===== */
[dir="rtl"] [dir="ltr"],
.ledger-sticky-serial {
  direction: ltr;
  text-align: center;
  unicode-bidi: embed;
  font-family: Inter, "SF Pro Display", -apple-system, sans-serif;
}

/* ===== PASHTO LABEL STYLING ===== */
.pashto-label {
  font-family:
    "Noto Naskh Arabic",
    "Noto Sans Arabic",
    Tahoma,
    Arial,
    sans-serif !important;
  direction: rtl;
  unicode-bidi: bidi-override;
  text-align: right;
  font-weight: 700;
  font-size: 0.9em;
  letter-spacing: 0.03em;
  display: block;
  margin-bottom: 0.3rem;
  color: #475569;
}

.pashto-text-large {
  font-family:
    "Noto Naskh Arabic",
    "Noto Sans Arabic",
    Tahoma,
    Arial,
    sans-serif !important;
  direction: rtl;
  unicode-bidi: bidi-override;
  font-size: 1.1em;
  font-weight: 600;
  letter-spacing: 0.02em;
  line-height: 1.4;
}

/* ===== IMPROVED LEDGER ROW STYLING ===== */
.ledger-data-row {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.ledger-data-row:hover {
  background-color: rgba(219, 234, 254, 0.5) !important;
  box-shadow: 0 8px 24px rgba(37, 99, 235, 0.12);
  transform: translateY(-1px);
}

.ledger-data-row td {
  border-radius: 12px;
  border: 1px solid rgba(191, 219, 254, 0.4);
  transition: all 0.15s;
  padding: 12px;
  background: rgba(255, 255, 255, 0.85);
}

.ledger-data-row:nth-child(even) td {
  background: rgba(245, 250, 255, 0.6);
}

.ledger-data-row:hover td {
  background: rgba(240, 248, 255, 0.9);
  border-color: rgba(37, 99, 235, 0.3);
}

/* ===== IMPROVED STICKY COLUMNS ===== */
.ledger-sticky-serial {
  background: linear-gradient(to right, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.85));
  border-radius: 12px 0 0 12px;
  position: sticky;
  left: 0;
  z-index: 10;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.05);
  min-width: 75px;
  padding: 12px !important;
  text-align: center;
}

/* ===== CARD-STYLE CELL LAYOUT ===== */
.ledger-cell-card {
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(191, 219, 254, 0.5);
  border-radius: 12px;
  padding: 10px;
  box-shadow: 0 2px 6px rgba(15, 23, 42, 0.06);
  transition: all 0.15s;
}

.ledger-cell-card:hover {
  border-color: rgba(37, 99, 235, 0.4);
  background: rgba(240, 248, 255, 0.95);
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.1);
}

/* ===== BETTER FORM SPACING ===== */
.ledger-field-label {
  display: block;
  font-size: 0.75rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: #8b6b00;
  margin-bottom: 0.4rem;
  line-height: 1;
}

.ledger-field-input {
  width: 100%;
  padding: 8px 10px;
  border-radius: 10px;
  border: 1px solid rgba(191, 219, 254, 0.6);
  font-size: 0.85rem;
  font-weight: 600;
  transition: all 0.15s;
  background: rgba(255, 255, 255, 0.8);
}

.ledger-field-input:focus {
  outline: none;
  border-color: rgba(37, 99, 235, 0.6);
  background: rgba(255, 255, 255, 0.95);
  ring: 2px;
  ring-color: rgba(37, 99, 235, 0.1);
}

/* ===== IMPROVED BADGES ===== */
.ledger-status-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 900;
  letter-spacing: 0.05em;
  border: 1.5px solid;
  transition: all 0.2s;
  white-space: nowrap;
}

.ledger-status-badge.success {
  border-color: rgba(16, 185, 129, 0.4);
  background: rgba(16, 185, 129, 0.08);
  color: #047857;
}

.ledger-status-badge.info {
  border-color: rgba(59, 130, 246, 0.4);
  background: rgba(59, 130, 246, 0.08);
  color: #1d4ed8;
}

.ledger-status-badge.warning {
  border-color: rgba(212, 175, 55, 0.4);
  background: rgba(212, 175, 55, 0.08);
  color: #a27300;
}

.ledger-status-badge:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
```

---

## JavaScript Helper for Merged Cells

### Add to account-manager.tsx helpers

```typescript
// ===== MERGED CELL FORMATTING HELPERS =====

// Format merged date cell with date, ship date, and invoice
const formatMergedDateCell = (entry: LedgerEntry) => ({
  date: entry.date || "",
  dateOfShip: entry.dateOfShip || "",
  invoiceNo: entry.invoiceNo || "",
})

// Format merged B/L cell
const formatMergedBLCell = (entry: LedgerEntry) => ({
  billOfLanding: entry.billOfLanding || "",
  consignee: entry.consignee || "",
  billOfLandingSurrendered: entry.billOfLandingSurrendered || false,
})

// Format merged container cell
const formatMergedContainerCell = (entry: LedgerEntry) => ({
  containerType: entry.containerType || "",
  containerNo: entry.containerNo || "",
  containerDetails: entry.containerDetails || "",
})

// Format merged financial cell
const formatMergedFinancialCell = (entry: LedgerEntry) => ({
  debit: entry.debit || 0,
  credit: entry.credit || 0,
  balanceUsd: entry.balanceUsd || 0,
})

// Get PDF status badges
const getPdfStatusBadges = (entry: LedgerEntry) => ({
  hasBLPdf: !!(entry.pdfName || entry.pdfUrl || entry.pdfDataUrl),
  hasStatusPdf: !!(entry.statusPdfName || entry.statusPdfUrl || entry.statusPdfDataUrl),
})

// Format S.NO with badges
const formatSNOCell = (entry: LedgerEntry, index: number) => {
  const { hasBLPdf, hasStatusPdf } = getPdfStatusBadges(entry)
  return {
    sNo: index + 1,
    hasBLPdf,
    hasStatusPdf,
    badges: [
      {
        type: "bl",
        label: "B/L PDF",
        status: hasBLPdf ? "uploaded" : "missing",
        color: hasBLPdf ? "emerald" : "slate",
      },
      {
        type: "status",
        label: "Status",
        status: hasStatusPdf ? "uploaded" : "missing",
        color: hasStatusPdf ? "blue" : "slate",
      },
    ],
  }
}
```

---

## Component Sub-component Usage

### MergedCellLabel Component (Already exists, usage examples)

```tsx
<MergedCellLabel label="Date" tone="blue" />
<MergedCellLabel label="B/L No" tone="gold" />
<MergedCellLabel label="Container Type" tone="slate" />

// Tone options: "blue" | "gold" | "slate" | "red" | "green"
```

### LedgerFieldLabel Component Usage

```tsx
<LedgerFieldLabel>S.NO</LedgerFieldLabel>
<LedgerFieldLabel>Date</LedgerFieldLabel>
<LedgerFieldLabel>Container Type</LedgerFieldLabel>
```

### LedgerCell Component Usage

```tsx
// Text input
<LedgerCell 
  value={row.billOfLanding} 
  onChange={(billOfLanding) => onUpdateEntry(row.id, { billOfLanding })} 
  className="min-w-[170px]"
/>

// Date input
<LedgerCell 
  type="date" 
  value={row.date} 
  onChange={(date) => onUpdateEntry(row.id, { date })} 
  className="min-w-[112px]" 
/>

// Number input
<LedgerCell 
  type="number" 
  value={String(row.debit)} 
  onChange={(debit) => onUpdateEntry(row.id, { debit: Number(debit || 0) })} 
  className="text-red-700 min-w-[96px] text-right" 
/>

// Multiline text
<LedgerCell 
  multiline 
  value={row.description} 
  onChange={(description) => onUpdateEntry(row.id, { description })} 
  className="min-w-[190px]" 
/>
```

---

## Testing CSS Updates

After adding these CSS improvements, test:

✓ Print preview renders merged columns  
✓ Pashto text displays correctly with proper RTL alignment  
✓ Table rows have smooth hover effects  
✓ Row spacing is comfortable (not crowded)  
✓ Sticky S.NO column still visible when scrolling  
✓ Page breaks handled correctly in print  
✓ Color preservation in PDF output  
✓ Mobile responsiveness maintained  

---

**Ready to Copy-Paste: YES** ✅
All CSS code is ready for direct insertion into stylesheet files.
