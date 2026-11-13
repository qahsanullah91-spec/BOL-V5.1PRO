## Export Account Ledger Redesign - Quick Reference Card

### 📋 Component Quick Links

| Component | Location | Purpose | Size |
|-----------|----------|---------|------|
| `LedgerGalleryModal` | `components/accounts/LedgerGalleryModal.tsx` | Full-screen media gallery | 250 lines |
| `LedgerRow` | `components/accounts/LedgerRow.tsx` | Grid-based row with 8 columns | 350 lines |
| `EditableCell` | `components/accounts/EditableCell.tsx` | Enhanced input cell | 120 lines |
| `ledger-grid.css` | `styles/ledger-grid.css` | CSS Grid layout & styling | 900 lines |
| `ledger-helpers.ts` | `lib/ledger-helpers.ts` | Utility functions | 300 lines |
| `ledger-types.ts` | `lib/ledger-types.ts` | TypeScript definitions | 350 lines |

---

### 🎯 8-Column Grid Layout

```
[1] MEDIA              Media files (2x2 grid)
[2] BALANCE USD        Running balance with color coding
[3] DEBIT/CREDIT       Two lines: debit (red) / credit (green)
[4] CONTAINER TYPE     Dropdown: 20FT, 40FT, 40HC, 40RF, etc.
[5] B/L NO             Bill of lading + consignee name
[6] SHIPPER (WIDER)    Description + quantity + packing (1.2fr)
[7] DATE               Date + ship date + invoice no
[8] S.NO               Row number (right-aligned)
```

**Grid Template Columns** (must be identical for header AND rows):
```css
grid-template-columns: minmax(80px, 0.8fr) minmax(110px, 1fr) minmax(220px, 1.2fr) minmax(140px, 1fr) minmax(140px, 1fr) minmax(130px, 1fr) minmax(100px, 1fr) minmax(120px, 1fr);
```

---

### 📦 Import Template

```tsx
// Add to account-manager.tsx imports
import { LedgerGalleryModal } from "@/components/accounts/LedgerGalleryModal"
import { LedgerRow } from "@/components/accounts/LedgerRow"
import { EditableCell } from "@/components/accounts/EditableCell"
import {
  formatLedgerMoney,
  balanceToneClass,
  detectMediaKind,
  isAllowedMediaFile,
  getEntryMediaFiles,
  downloadCsv,
  getContainerTypeLabel,
  getTextDirection,
} from "@/lib/ledger-helpers"
import "@/styles/ledger-grid.css"
```

---

### 🔧 LedgerRow Usage

```tsx
<LedgerRow
  row={entry}                              // LedgerEntry object
  sNo={index + 1}                          // Row number
  isEditing={editingRowId === entry.id}   // Currently editing?
  isSelected={selectedId === entry.id}    // Currently selected?
  editingDraft={editingDraft}             // Current edit state
  
  // Callbacks
  onSelect={() => setSelectedId(entry.id)}
  onEdit={() => startEditingRow(entry)}
  onSave={() => saveRowEdit(entry.id)}
  onCancel={() => cancelRowEdit()}
  onDelete={() => deleteRow(entry.id)}
  onEditChange={(field, value) => updateDraft(field, value)}
  onMediaAdd={(files) => uploadMediaFiles(entry.id, files)}
  onMediaDelete={(fileId) => deleteMedia(entry.id, fileId)}
  
  // Helper
  getMediaFiles={(row) => row.mediaFiles || []}
/>
```

---

### 🎨 CSS Classes

**Row States:**
```css
.ledger-table-grid-row              /* Base row */
.ledger-table-grid-row.is-selected  /* Selected */
.ledger-table-grid-row.is-editing   /* Editing mode */
.ledger-table-grid-row:hover        /* Hover effect */
```

**Cell Types:**
```css
.ledger-cell-media              /* Media column (2x2 grid) */
.ledger-cell-balance            /* Balance USD (color coded) */
.ledger-cell-money              /* Debit/Credit (red/green) */
.ledger-cell-container          /* Container type */
.ledger-cell-bol                /* B/L No */
.ledger-cell-shipper            /* Shipper description (wider) */
.ledger-cell-date               /* Date fields */
.ledger-cell-sno                /* Row number (right) */
```

**Edit Mode:**
```css
.ledger-cell-edit-mode          /* Input container */
.ledger-cell-label              /* Label text */
.ledger-cell-value              /* Display value */
```

---

### 🔗 Helper Functions

```tsx
// Formatting
formatLedgerMoney(value)           → "$1,234.56"
balanceToneClass(balance)          → "text-emerald-700" | "text-red-700"
getContainerTypeLabel(type)        → "40FT High Cube (40HC)"

// Media
detectMediaKind(mimeType, name)    → "image" | "video" | "audio" | "document"
isAllowedMediaFile(file)           → boolean
getEntryMediaFiles(entry)          → MediaAttachment[]
dataUrlToBlob(dataUrl)             → Blob

// CSV
downloadCsv(filename, lines)       → void (download file)
parseDelimitedRows(text, delimiter) → string[][]

// Text
getTextDirection(text)             → "ltr" | "rtl"
isPashtoText(text)                 → boolean
```

---

### 🎬 Integration Steps (Quick)

1. **Add imports** (as shown above)
2. **Update table to grid**:
   ```tsx
   // OLD: <table>...</table>
   // NEW: <div className="ledger-grid-container">...</div>
   ```
3. **Map rows with LedgerRow**:
   ```tsx
   {rowsWithBalance.map((row, index) => (
     <LedgerRow key={row.id} row={row} sNo={index + 1} {...handlers} />
   ))}
   ```
4. **Connect state & handlers**:
   - `editingRowId`, `editingDraft` state
   - Edit handlers: `startEditingRow()`, `saveRowEdit()`, `cancelRowEdit()`
   - Media handlers: `uploadMediaFiles()`, `deleteMedia()`
5. **Test** - alignment, editing, media, responsive

---

### 📱 Responsive Design

| Screen Size | Behavior | Grid Cols |
|------------|----------|-----------|
| < 768px | Stacked layout | Full width |
| 768px-1023px | 2-column layout | Adjusted |
| 1024px+ | Full grid | All 8 columns |

---

### 🎯 Key Props

**LedgerRow:**
- `row` (LedgerEntry) - The row data
- `sNo` (number) - Row number
- `isEditing` (boolean) - Edit mode
- `isSelected` (boolean) - Selection state
- `editingDraft` (Partial<LedgerEntry>) - Current edits
- Handlers: `onSelect`, `onEdit`, `onSave`, `onCancel`, `onDelete`, `onEditChange`, `onMediaAdd`, `onMediaDelete`

**LedgerGalleryModal:**
- `files` (MediaAttachment[]) - Array of media files
- `currentIndex` (number) - Active file index
- `isOpen` (boolean) - Modal visibility
- `onClose` () => void - Close callback
- `onDelete` (fileId) => void - Delete callback
- `rowId` (string, optional) - Associated row ID

**EditableCell:**
- `value` (string | number) - Current value
- `onChange` (value) => void - Change handler
- `isEditing` (boolean) - Edit mode
- `type` (string) - Input type (text, number, date, textarea, etc.)
- Plus validation props: `min`, `max`, `pattern`, `required`, `step`

---

### 🧪 Testing Checklist

```
[ ] Column alignment (header matches rows exactly)
[ ] Row selection works
[ ] Edit mode toggles on double-click
[ ] All columns are editable
[ ] Save persists changes
[ ] Cancel discards changes
[ ] Media preview shows 4 thumbnails
[ ] Gallery modal opens and closes
[ ] Navigation works in gallery (arrow keys)
[ ] Files can be deleted from gallery
[ ] Media upload works (drag-drop and picker)
[ ] Balance updates after edit
[ ] Debit/Credit color coding works
[ ] RTL text displays correctly (Pashto)
[ ] Responsive on mobile (375px)
[ ] Responsive on tablet (768px)
[ ] Responsive on desktop (1920px)
[ ] Print preview works
[ ] CSV export includes all data
[ ] No TypeScript errors
```

---

### 🚀 CSS Colors

```css
/* Accents */
#D4AF37   /* Gold (primary) */
#F4D03F   /* Light gold */

/* Status */
#059669   /* Green (credit) */
#dc2626   /* Red (debit) */
#3b82f6   /* Blue (primary) */

/* Text */
#1f2937   /* Dark gray (primary text) */
#6b7280   /* Medium gray (secondary) */
#f3f4f6   /* Light gray (background) */
```

---

### 📄 File Sizes

| File | Size | Lines |
|------|------|-------|
| ledger-grid.css | ~35 KB | 900 |
| LedgerGalleryModal.tsx | ~12 KB | 250 |
| LedgerRow.tsx | ~14 KB | 350 |
| ledger-helpers.ts | ~10 KB | 300 |
| ledger-types.ts | ~12 KB | 350 |
| **TOTAL** | **~83 KB** | **2,150** |

---

### 🔗 Documentation Links

- **INTEGRATION_CHECKLIST.md** - Phase-by-phase integration guide
- **LEDGER_REDESIGN_GUIDE.md** - Complete implementation guide
- **REDESIGN_SUMMARY.md** - Executive summary
- **ledger-types.ts** - All TypeScript interfaces

---

### ⚡ Performance Tips

1. Use `useMemo()` for balance calculations
2. Lazy load media thumbnails on scroll
3. Debounce edit save (300ms)
4. Virtualize rows if > 200 items (react-window)
5. Preload next/previous gallery images

---

### 🐛 Common Issues & Fixes

| Issue | Solution |
|-------|----------|
| Columns misaligned | Check grid-template-columns on both header AND row |
| Edit mode not working | Verify `editingDraft` state is updating |
| Media not uploading | Check file validation with `isAllowedMediaFile()` |
| Gallery not opening | Ensure `mediaFiles` array is not empty |
| RTL text wrong way | Use `getTextDirection()` to auto-detect |
| TypeScript errors | Check imports and prop types match interfaces |

---

### 📞 Support Resources

1. **LEDGER_REDESIGN_GUIDE.md** - Implementation guide with examples
2. **INTEGRATION_CHECKLIST.md** - Step-by-step checklist
3. **ledger-types.ts** - All type definitions
4. **Browser DevTools** - Console for errors
5. **Component props** - JSDoc comments in each file

---

**Version**: 1.0  
**Status**: Ready for Integration  
**Last Updated**: 2024

---

## Quick Command Reference

```bash
# Check TypeScript
npm run build

# Run dev server
npm run dev

# View in browser
http://localhost:3000

# Clear cache
rm -rf .next

# Full rebuild
npm run build:production
```

---

**Start with**: `INTEGRATION_CHECKLIST.md`  
**Reference**: `LEDGER_REDESIGN_GUIDE.md`  
**Types**: `lib/ledger-types.ts`  
**Utils**: `lib/ledger-helpers.ts`
