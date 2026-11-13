# Export Account Ledger - Comprehensive UI Fixes

## Summary of 11 Required Fixes

This document provides detailed instructions for implementing all 11 UI/UX improvements to the Export Account Ledger component.

---

## Fix 1: Pashto/RTL Text Display ✅ PARTIAL

### Status
- ✅ globals.css updated with "Noto Naskh Arabic", "Noto Sans Arabic" font stack
- ✅ RTL CSS rules added to globals.css
- ⏳ PENDING: account-manager.tsx ledgerColumns constant needs proper Pashto Unicode

### What to Update in account-manager.tsx (Line ~140)

Replace the corrupted Pashto text in `ledgerColumns`:

```typescript
const ledgerColumns = [
  { id: "sNo", en: "S.NO", ps: "مسلسل شمېره" },
  { id: "date", en: "DATE", ps: "تاریخ" },
  { id: "description", en: "SHIPPER/Description", ps: "لېږدونکی / تفصیل" },
  { id: "billOfLanding", en: "BILL OF LANDING", ps: "بی ال" },
  { id: "containerType", en: "CONTAINER TYPE", ps: "د کانټینر ډول" },
  { id: "debit", en: "DEBIT / CREDIT", ps: "بدهی / اعتبار" },
  { id: "balanceUsd", en: "BALANCE USD", ps: "پاتې بیلانس" },
] as const
```

---

## Fix 2: Merge B/L and Consignee Columns

### Current Implementation
- B/L column shows only `billOfLanding` value
- Consignee is either hidden or in separate column

### Update Required
Modify the B/L table cell (around line 2600) to show both values:

```tsx
<td dir="ltr" className="min-w-0 p-0.5 align-top ...">
  <LedgerFieldLabel>Bill of Lading</LedgerFieldLabel>
  <div className={`rounded-2xl p-2 ...`}>
    <MergedCellLabel label="B/L No" tone="blue" />
    <LedgerCell value={row.billOfLanding} ... />
    
    <MergedCellLabel label="Consignee" tone="gold" />
    <LedgerCell value={row.consignee} ... />
  </div>
</td>
```

---

## Fix 3: Merge Container Columns

### Current Implementation
- Container Type, Container No, and Details may be in separate columns or hidden

### Update Required
Update the Container column (around line 2700) to show all three merged:

```tsx
<td dir="ltr" className="min-w-0 p-0.5 align-top ...">
  <LedgerFieldLabel>Container</LedgerFieldLabel>
  <div className="space-y-2 rounded-[18px] border border-blue-100 bg-white/90 p-2 shadow-sm">
    <div className="flex flex-wrap items-center gap-2">
      <MergedCellLabel label="Type" tone="blue" />
      <ContainerTypeSelect value={row.containerType || ""} ... />
    </div>
    <div className="flex flex-wrap items-center gap-2">
      <MergedCellLabel label="Container No" tone="gold" />
      <LedgerCell value={row.containerNo} ... />
    </div>
    <MergedCellLabel label="Details" tone="slate" />
    <LedgerCell value={row.containerDetails || ""} ... />
  </div>
</td>
```

---

## Fix 4: Merge Date Column with Invoice

### Current Implementation
- Date column shows only `row.date`
- Invoice and ship date may be missing or hidden

### Update Required
Enhance the Date column (around line 2400) to show date, ship date, AND invoice:

```tsx
<td dir="ltr" className="min-w-0 p-0.5 max-lg:grid ...">
  <LedgerFieldLabel>Date</LedgerFieldLabel>
  <div className="space-y-1.5 rounded-[18px] border border-blue-100 bg-white/90 p-2 shadow-sm">
    <MergedCellLabel label="Date" tone="blue" />
    <LedgerCell type="date" value={row.date} ... />
    
    <MergedCellLabel label="Ship Date" tone="blue" />
    <LedgerCell type="date" value={row.dateOfShip} ... />
    
    <div className="flex items-center gap-1.5">
      <span className="rounded-full bg-blue-50 px-2 py-1 text-[9px] font-black uppercase tracking-[0.10em] text-blue-700">
        Invoice
      </span>
      <LedgerCell value={row.invoiceNo} ... />
      {row.invoiceNo && (
        <button type="button" onClick={() => copyText(row.invoiceNo)}>
          <Copy className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  </div>
</td>
```

---

## Fix 5: Add PDF Status Badge to S.NO Column

### Current Implementation
- S.NO column shows only the row number
- PDF status may be in separate column or not visible

### Update Required
Update S.NO cell (around line 2350) to include PDF status badges:

```tsx
<td dir="ltr" className="ledger-sticky-serial ...">
  <LedgerFieldLabel>S.NO</LedgerFieldLabel>
  <div className="space-y-2">
    <span className="text-lg font-black text-slate-900">{row.sNo}</span>
    
    {/* B/L PDF Status */}
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-black ${
      row.pdfName || row.pdfUrl || row.pdfDataUrl 
        ? "border-emerald-200 bg-emerald-50 text-emerald-700" 
        : "border-slate-200 bg-slate-100 text-slate-600"
    }`}>
      <span>B/L PDF</span>
      <span>{row.pdfName || row.pdfUrl || row.pdfDataUrl ? "✓" : "–"}</span>
    </span>
    
    {/* Status PDF Badge */}
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-black ${
      row.statusPdfName || row.statusPdfUrl || row.statusPdfDataUrl 
        ? "border-blue-200 bg-blue-50 text-blue-700" 
        : "border-slate-200 bg-slate-100 text-slate-600"
    }`}>
      <span>Status</span>
      <span>{row.statusPdfName || row.statusPdfUrl || row.statusPdfDataUrl ? "✓" : "–"}</span>
    </span>
  </div>
</td>
```

**Color Legend:**
- Green/Emerald: B/L PDF uploaded
- Blue: Status PDF uploaded
- Gray: No PDF uploaded

---

## Fix 6: Improve Media Preview Gallery

### Current Implementation
- RowMediaManager shows basic thumbnail grid
- Limited media type indication

### Update Required
Enhance RowMediaManager component (around line 3200):

```tsx
// Add file count indicators with icons
<div className="mb-2 grid grid-cols-3 gap-1 text-[8px] font-black">
  <span className="inline-flex items-center justify-center gap-1 rounded-xl border border-sky-100 bg-sky-50/90 px-1.5 py-1 text-sky-700">
    <FileImage className="h-3 w-3" /> {counts.images}
  </span>
  <span className="inline-flex items-center justify-center gap-1 rounded-xl border border-blue-100 bg-blue-50/90 px-1.5 py-1 text-blue-700">
    <FileVideo className="h-3 w-3" /> {counts.videos}
  </span>
  <span className="inline-flex items-center justify-center gap-1 rounded-xl border border-emerald-100 bg-emerald-50/90 px-1.5 py-1 text-emerald-700">
    <FileAudio className="h-3 w-3" /> {counts.audio}
  </span>
</div>

// Show thumbnail grid with labels
<div className="grid grid-cols-3 gap-1 overflow-hidden pb-1">
  {media.slice(0, 3).map((item, index) => (
    <button
      key={item.id}
      type="button"
      onClick={() => onOpen(index)}
      title={item.name}
      className="ledger-media-thumb group relative overflow-hidden rounded-[12px] border border-slate-200 bg-slate-50 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="h-11 w-full overflow-hidden rounded-[12px] bg-slate-100">
        <MediaThumb item={item} />
      </div>
      <div className="absolute inset-x-0 bottom-0 bg-white/85 px-1 py-0.5 text-[7px] font-black text-slate-700 line-clamp-1">
        {item.name}
      </div>
    </button>
  ))}
</div>

// "View Media" button
<button
  type="button"
  onClick={() => onOpen(0)}
  className="mt-1 inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-2xl border border-blue-100 bg-blue-50 px-2 text-[9px] font-black text-blue-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-100"
>
  <Images className="h-3.5 w-3.5" />
  View Media Gallery
</button>
```

---

## Fix 7: Improve Ledger Row UI

### Current Implementation
- Rows are crowded with text
- Limited spacing and visual hierarchy
- No hover effects

### Update Required
Update row styling in the `<tr>` element (around line 2340):

```tsx
<tr
  className="ledger-data-row group transition duration-200 hover:bg-blue-50/40 hover:shadow-md rounded-2xl cursor-pointer bg-white/80 shadow-sm shadow-slate-200/80 max-lg:grid max-lg:grid-cols-1 max-lg:rounded-[24px] max-lg:border max-lg:border-blue-100 max-lg:bg-white/88 max-lg:p-3 max-lg:shadow-xl max-lg:shadow-blue-100/50 max-lg:backdrop-blur-xl"
  title="Double-click to view media gallery"
  onDoubleClick={...}
>
  {/* Apply card-style to cells */}
  <td className="rounded-[16px] border border-blue-100 bg-white/90 p-3 shadow-sm" />
</tr>
```

**CSS additions to add:**
- Better padding (p-3 instead of p-0.5)
- Rounded borders on cells
- Subtle shadows
- Hover state with slight lift
- Alternating background colors
- Clear visual separation between rows

---

## Fix 8: Improve Company Account Registry UI

### Current Implementation
- Registry section has basic styling
- Limited glassmorphism effect
- Buttons wrap awkwardly

### Update Required
Enhance the registry header section (around line 2260):

```tsx
<header
  data-export-ledger-screen-content="true"
  className="shrink-0 border-b border-blue-100/80 bg-white/86 px-2.5 py-2.5 shadow-lg shadow-blue-100/40 backdrop-blur-2xl md:px-4 md:py-3 sticky top-0 z-30"
>
  <div className="flex max-w-full flex-col gap-3 min-[1180px]:flex-row min-[1180px]:items-center min-[1180px]:justify-between">
    {/* Left section: Title */}
    <div className="flex items-center gap-4">
      <button 
        className="flex h-10 w-10 items-center justify-center rounded-2xl border border-blue-200 bg-white shadow-md shadow-blue-100 text-blue-700 transition hover:-translate-y-0.5 hover:bg-blue-50"
      >
        <ArrowLeft className="h-5 w-5" />
      </button>
      <div>
        <p className="text-[9px] font-black uppercase tracking-[0.24em] text-[#D4AF37]">
          Account Ledger
        </p>
        <h2 className="text-lg font-black leading-tight text-slate-950 md:text-2xl">
          {account.companyName}
        </h2>
      </div>
    </div>
    
    {/* Right section: Buttons with sticky positioning */}
    <div className="flex max-w-full flex-wrap items-center gap-2 overflow-visible sticky right-0">
      {/* Buttons with better spacing */}
      <button className="inline-flex h-10 items-center gap-2 rounded-2xl border border-blue-100 bg-white/90 px-3 text-[11px] font-black shadow-md transition hover:-translate-y-0.5">
        Print Preview
      </button>
      {/* More buttons... */}
    </div>
  </div>
</header>
```

---

## Fix 9: Fix Add New Account Button Visibility

### Current Implementation
- Button may be hidden or wrapped awkwardly
- Not always visible when scrolling

### Update Required
1. Move "Add New Account" button above the table
2. Use sticky positioning
3. Ensure button has clear visibility at all times

```tsx
<div className="sticky top-20 z-20 flex gap-2 rounded-2xl border border-blue-100 bg-white/90 p-3 shadow-lg backdrop-blur-xl">
  <button
    type="button"
    onClick={addEntry}
    className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] px-5 text-sm font-black text-white shadow-lg shadow-blue-500/30 transition hover:-translate-y-0.5"
  >
    <Plus className="h-5 w-5" />
    Add New Account Entry
  </button>
</div>
```

---

## Fix 10: Fix Horizontal/Vertical Scrolling

### Current Implementation
- Table may overflow horizontally
- Sticky header not properly positioned
- Bottom content hidden

### Update Required
1. Adjust colgroup widths in table (around line 2370):

```tsx
<colgroup>
  <col style={{ width: "72px" }} />        {/* S.NO */}
  <col style={{ width: "160px" }} />       {/* Date */}
  <col style={{ width: "280px" }} />       {/* Description */}
  <col style={{ width: "220px" }} />       {/* B/L + Consignee */}
  <col style={{ width: "200px" }} />       {/* Container */}
  <col style={{ width: "140px" }} />       {/* Debit/Credit */}
  <col style={{ width: "100px" }} />       {/* Balance */}
  <col style={{ width: "140px" }} />       {/* Media */}
</colgroup>
```

2. Fix scroll container height:

```tsx
<div className="ledger-scroll h-full max-h-[calc(100vh-320px)] max-w-full overflow-y-auto overflow-x-auto overscroll-contain scroll-smooth">
  <table dir="rtl" className={`w-full min-w-[1180px] table-fixed border-separate border-spacing-0 text-[12px] ledger-table ...`}>
```

---

## Fix 11: Improve Print Preview Layout

### Current Implementation
- Print columns may not match merged screen layout
- Pashto text not rendering properly in print
- Page breaks not optimized

### Update Required
1. Update ExportAccountLedgerPrint.tsx printColumns (around line ~2070):

```typescript
const printColumns = [
  { key: "sNo", label: "S.NO", className: "col-sno" },
  { key: "dateInfo", label: "DATE / SHIP / INV", className: "col-date-merged" },
  { key: "description", label: "SHIPPER / DESC / QTY", className: "col-description-merged" },
  { key: "blInfo", label: "B/L / CONSIGNEE", className: "col-bl-consignee" },
  { key: "containerInfo", label: "CONTAINER / TYPE", className: "col-container-merged" },
  { key: "money", label: "DEBIT / CREDIT", className: "col-money-merged" },
]
```

2. Update column widths in ExportAccountLedgerPrint.css:

```css
/* New merged column widths */
.col-sno { width: 5%; }
.col-date-merged { width: 14%; }
.col-description-merged { width: 24%; }
.col-bl-consignee { width: 22%; }
.col-container-merged { width: 18%; }
.col-money-merged { width: 12%; }
```

3. Ensure Pashto font is applied to print (already done in CSS update above).

---

## Implementation Checklist

- [ ] Update ledgerColumns with proper Pashto Unicode
- [ ] Merge B/L + Consignee columns
- [ ] Merge Container Type + No + Details
- [ ] Merge Date + Ship Date + Invoice
- [ ] Add PDF status badges to S.NO column
- [ ] Enhance media gallery with counts and icons
- [ ] Improve row UI with better spacing and shadows
- [ ] Enhance registry header with glassmorphism
- [ ] Fix button visibility with sticky positioning
- [ ] Optimize scrolling with proper dimensions
- [ ] Update print layout with merged columns
- [ ] Test responsive design on all devices
- [ ] Verify Pashto text rendering
- [ ] Test print/PDF output

---

## Testing Checklist

- [ ] Pashto labels display correctly on desktop
- [ ] RTL text aligned properly
- [ ] Table merges don't break data access
- [ ] All data fields preserved (no deletions)
- [ ] Print preview shows merged layout
- [ ] PDF export includes all information
- [ ] Mobile view (max-lg) displays correctly
- [ ] Hover effects work smoothly
- [ ] Double-click to view media works
- [ ] PDF status badges show correctly
- [ ] Buttons always visible (no hiding)
- [ ] No horizontal scroll issues

---

**Status: Implementation Ready** ✅
All CSS updates for RTL/Pashto done. Awaiting code structure updates for merged columns and UI improvements.
