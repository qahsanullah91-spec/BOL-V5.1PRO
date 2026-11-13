# Ledger Redesign - Implementation Checklist

## Phase 1: Components & Infrastructure ✅ COMPLETE

### Core Components Created
- ✅ **LedgerGalleryModal.tsx** - Full-screen media gallery with navigation
  - Support for images, videos, PDFs
  - Previous/next buttons
  - Thumbnail strip (2x2 grid)
  - File counter and metadata
  - Download and delete actions
  - iOS/macOS glassmorphism styling

- ✅ **LedgerRow.tsx** - Premium grid-based row component
  - All 8 columns with proper alignment
  - Display and edit modes
  - Media preview with gallery integration
  - Color-coded debit/credit (red/green)
  - Balance badge with dynamic styling
  - Container type dropdown
  - B/L with consignee support
  - Shipper with RTL support
  - Date with metadata

- ✅ **ledger-grid.css** - Comprehensive CSS Grid layout (900+ lines)
  - 8-column grid (MEDIA | BALANCE | DEBIT/CREDIT | CONTAINER | B/L | SHIPPER | DATE | S.NO)
  - Perfect header-row alignment
  - Sticky header with blur backdrop
  - Row states (hover, selected, editing, error, saving)
  - Responsive design (1024px, 768px breakpoints)
  - Media 2x2 grid layout
  - Premium animations and transitions
  - Print-friendly styles

- ✅ **ledger-helpers.ts** - Utility functions
  - `formatLedgerMoney()` - Format currency
  - `balanceToneClass()` - Dynamic color classes
  - `formatMergedDate()`, `formatMergedDescription()`, `formatMergedDebit()`
  - `detectMediaKind()`, `isAllowedMediaFile()` - Media validation
  - `downloadCsv()`, `parseDelimitedRows()` - CSV export/import
  - `getContainerTypeLabel()` - Container formatting
  - `getTextDirection()`, `isPashtoText()` - RTL detection
  - `dataUrlToBlob()` - Data conversion

- ✅ **EditableCell.tsx** - Enhanced editable cell
  - Support for: text, number, date, textarea, email, tel, url
  - Validation (min, max, pattern, required)
  - List datalists support
  - RTL/LTR direction support
  - Disabled state
  - Custom styling

### Documentation Created
- ✅ **LEDGER_REDESIGN_GUIDE.md** - Complete implementation guide
  - Component overview
  - Integration steps
  - CSS classes reference
  - Styling customization
  - Features checklist
  - Performance tips
  - Accessibility guidelines
  - Troubleshooting

---

## Phase 2: Integration with account-manager.tsx ⚠️ IN PROGRESS

### What Needs to Be Done:

1. **Import New Components**
   - [ ] Import LedgerGalleryModal
   - [ ] Import LedgerRow
   - [ ] Import ledger-helpers functions
   - [ ] Import @/styles/ledger-grid.css

2. **Update Ledger Table Structure**
   - [ ] Replace old table HTML with grid layout
   - [ ] Update table header to use grid
   - [ ] Update table body to map rows using LedgerRow component
   - [ ] Ensure header cells match row cells exactly

3. **Wire Up State Management**
   - [ ] Connect editingRowId state
   - [ ] Connect editingDraft state
   - [ ] Connect mediaViewer state
   - [ ] Connect gallery modal state

4. **Wire Up Edit Handlers**
   - [ ] Connect onEdit handler to start editing
   - [ ] Connect onSave handler to save changes
   - [ ] Connect onCancel handler to discard
   - [ ] Connect onEditChange to update draft state

5. **Wire Up Media Handlers**
   - [ ] Connect onMediaAdd for upload
   - [ ] Connect onMediaDelete for removal
   - [ ] Connect gallery modal open/close
   - [ ] Update getEntryMediaFiles function

6. **Update Existing Functions**
   - [ ] Replace formatMoney with formatLedgerMoney
   - [ ] Replace getBalance with balanceToneClass
   - [ ] Update CSV export to use new helpers
   - [ ] Update any duplicate formatting logic

7. **Testing & Validation**
   - [ ] Run TypeScript compiler - check for errors
   - [ ] Test in browser - verify no runtime errors
   - [ ] Test header-row alignment - measure pixel-perfect match
   - [ ] Test edit mode - edit all column types
   - [ ] Test media upload - drag/drop and file picker
   - [ ] Test gallery modal - navigation and controls
   - [ ] Test responsive - mobile (375px), tablet (768px), desktop (1920px)
   - [ ] Test print preview - layout and formatting
   - [ ] Test CSV export - data integrity
   - [ ] Test with large data sets - performance
   - [ ] Test with Pashto text - RTL support
   - [ ] Test accessibility - keyboard navigation, screen readers

---

## Phase 3: Optional Enhancements

### Performance Optimizations
- [ ] Virtualize long ledger lists (react-window)
- [ ] Lazy load media thumbnails
- [ ] Debounce edit changes
- [ ] Use useMemo for expensive calculations
- [ ] Preload gallery images (next/previous files)

### UX Improvements
- [ ] Add confirmation dialog for delete operations
- [ ] Add undo/redo for edits
- [ ] Add keyboard shortcuts (Esc, Enter, Arrow keys)
- [ ] Add batch operations (select multiple, bulk edit/delete)
- [ ] Add search/filter ledger rows
- [ ] Add sorting by column headers
- [ ] Add row grouping/grouping controls
- [ ] Add export to PDF with custom template

### Accessibility
- [ ] Verify ARIA labels on all interactive elements
- [ ] Test with screen readers (NVDA, JAWS)
- [ ] Verify keyboard navigation completeness
- [ ] Verify color contrast (WCAG AA)
- [ ] Add focus indicators
- [ ] Test with browser zoom levels

### Mobile Features
- [ ] Optimize touch targets (44px minimum)
- [ ] Add swipe gestures for gallery navigation
- [ ] Implement single-column layout on mobile
- [ ] Test on real mobile devices
- [ ] Verify orientation changes (landscape/portrait)

---

## Key Integration Point Location

**File**: `components/accounts/account-manager.tsx`
**Section**: The `AccountLedger` component (large component, starts around line 2600)
**Target Area**: Table rendering section (lines ~2800-3000+)

### Current Structure to Replace:
```tsx
<table className="ledger-table">
  <thead>
    {/* Current header implementation */}
  </thead>
  <tbody>
    {rowsWithBalance.map((row) => (
      // Current row rendering with inline JSX
    ))}
  </tbody>
</table>
```

### New Structure:
```tsx
<div className="ledger-grid-container">
  {/* Sticky header with grid layout */}
  <div className="ledger-table-grid-header-row">
    {/* 8 header cells matching ledgerColumns */}
  </div>
  
  {/* Scrollable body with rows */}
  <div className="ledger-grid-body">
    {rowsWithBalance.map((row, index) => (
      <LedgerRow
        key={row.id}
        row={row}
        sNo={index + 1}
        isEditing={editingRowId === row.id}
        isSelected={selectedId === row.id}
        editingDraft={editingDraft}
        onSelect={() => handleSelectRow(row.id)}
        onEdit={() => startEditingRow(row)}
        onSave={() => saveRowEdit(row.id)}
        onCancel={cancelRowEdit}
        onDelete={() => deleteRow(row.id)}
        onEditChange={(field, value) => updateRowDraft(field, value)}
        onMediaAdd={(files) => uploadMediaFiles(row.id, files)}
        onMediaDelete={(fileId) => deleteMedia(row.id, fileId)}
        getMediaFiles={(r) => r.mediaFiles || []}
      />
    ))}
  </div>
</div>
```

---

## Files Status

### ✅ Created (Ready to Use)
- `components/accounts/LedgerGalleryModal.tsx` - 250+ lines
- `components/accounts/LedgerRow.tsx` - 350+ lines
- `styles/ledger-grid.css` - 900+ lines
- `lib/ledger-helpers.ts` - 300+ lines
- `LEDGER_REDESIGN_GUIDE.md` - Complete documentation

### ⚠️ Modified (Minor Updates)
- `components/accounts/EditableCell.tsx` - Enhanced with more input types

### 🔄 Needs Integration
- `components/accounts/account-manager.tsx` - Large file, needs selective updates

### ✅ Compatible (No Changes Needed)
- `components/accounts/MediaGrid.tsx` - Already compatible
- `components/accounts/Badge.tsx` - Already compatible
- `components/accounts/MoneyInput.tsx` - Already compatible

---

## Critical Implementation Notes

### 1. Grid Alignment
The entire redesign depends on perfect alignment. The header and all rows must use:
```css
grid-template-columns: minmax(80px, 0.8fr) minmax(110px, 1fr) minmax(220px, 1.2fr) minmax(140px, 1fr) minmax(140px, 1fr) minmax(130px, 1fr) minmax(100px, 1fr) minmax(120px, 1fr);
```
**DO NOT** vary this value between header and rows.

### 2. Edit State Management
All edits use `editingDraft` state. Make sure to:
1. Store initial row data when starting edit
2. Update draft on each change (not the actual row)
3. Save draft to row on "Save" click
4. Clear draft on "Cancel" click

### 3. Media Upload
The media upload process:
1. User selects files (drag-drop or file picker)
2. `onMediaAdd` callback is triggered with FileList
3. Validate with `isAllowedMediaFile()`
4. Upload to `/api/account-ledger-files`
5. Get back array of MediaAttachment objects
6. Update row with new media array

### 4. Gallery Modal
Gallery opens when:
1. User clicks media preview in row
2. User double-clicks row
3. User selects "View" in media grid

Gallery closes when:
1. User clicks close button
2. User presses Esc key
3. User clicks backdrop

### 5. TypeScript Compliance
Ensure all type definitions match:
- `LedgerEntry` from account-manager.tsx
- `MediaAttachment` from ExportAccountLedgerPrint.tsx
- `MediaKind` from model definitions

---

## Success Criteria

✅ **When Integration is Complete:**

1. **Visual**: Header cells perfectly aligned with row cells (no pixel drift)
2. **Functional**: All 8 columns are fully editable
3. **Media**: 4-thumbnail grid displays, gallery modal opens, files can be deleted
4. **Performance**: No lag when scrolling through 100+ row ledger
5. **Responsive**: Works on mobile (375px), tablet (768px), desktop (1920px)
6. **Accessibility**: Keyboard navigation works, RTL text displays correctly
7. **Data**: Edits persist, media uploads store correctly, CSV export includes all data
8. **TypeScript**: Zero compiler errors
9. **Print**: Print preview and PDF export work correctly
10. **Browser**: Works in Chrome, Firefox, Safari, Edge

---

## Quick Start Commands

```bash
# Check TypeScript errors
npm run build

# Run dev server
npm run dev

# Test in browser
# 1. Navigate to Account Management section
# 2. Select an Export Account
# 3. Open ledger view
# 4. Try adding a row, editing, and uploading media

# Build for production
npm run build:production
```

---

## Support & Questions

**Before Integration Questions:**
1. Are all imports available and compatible?
2. Does the workspace have @/styles and @/components paths configured?
3. Is the CSS file being properly linked in layout or component?
4. Are all type definitions exported from account-manager.tsx?

**After Integration Issues:**
1. Check browser DevTools console for errors
2. Verify all imports are correct paths
3. Clear Next.js cache (`.next` folder)
4. Rebuild TypeScript
5. Check CSS cascade (newer CSS should override old)
6. Verify state callbacks are properly connected

---

**Last Updated**: 2024
**Version**: 1.0
**Status**: Phase 1 & 2 Documentation Complete
