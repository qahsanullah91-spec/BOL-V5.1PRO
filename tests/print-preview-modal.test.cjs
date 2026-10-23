const { test, describe } = require("node:test")
const assert = require("node:assert/strict")
const fs = require("node:fs")
const path = require("node:path")

describe("Print Preview Studio & Windows 11 Modern Print Dialog Fix", () => {
  const rootDir = path.resolve(__dirname, "..")

  test("1. electron/main.ts configures PreferLegacyPrintDialog and PreferLaunchLegacyDialog", () => {
    const mainPath = path.join(rootDir, "electron", "main.ts")
    assert.ok(fs.existsSync(mainPath), "electron/main.ts must exist")
    const content = fs.readFileSync(mainPath, "utf-8")
    assert.ok(
      content.includes("PreferLegacyPrintDialog"),
      "Must configure PreferLegacyPrintDialog in HKCU\\Software\\Microsoft\\Print\\UnifiedPrintDialog"
    )
    assert.ok(
      content.includes("PreferLaunchLegacyDialog"),
      "Must configure PreferLaunchLegacyDialog in HKCU\\Software\\Microsoft\\Print\\UnifiedPrintDialog"
    )
  })

  test("2. electron/ipc/register-ipc.ts registers print:page, print:get-printers, and print:get-preview-pdf", () => {
    const ipcPath = path.join(rootDir, "electron", "ipc", "register-ipc.ts")
    assert.ok(fs.existsSync(ipcPath), "electron/ipc/register-ipc.ts must exist")
    const content = fs.readFileSync(ipcPath, "utf-8")
    assert.ok(content.includes('"print:page"'), "Must register print:page IPC handler")
    assert.ok(content.includes('"print:get-printers"'), "Must register print:get-printers IPC handler")
    assert.ok(content.includes('"print:get-preview-pdf"'), "Must register print:get-preview-pdf IPC handler")
    assert.ok(content.includes("getPrintersAsync"), "Must use getPrintersAsync()")
  })

  test("3. electron/preload.ts and desktop-api.d.ts expose desktop print methods", () => {
    const preloadPath = path.join(rootDir, "electron", "preload.ts")
    const dtsPath = path.join(rootDir, "electron", "desktop-api.d.ts")
    assert.ok(fs.existsSync(preloadPath), "preload.ts must exist")
    assert.ok(fs.existsSync(dtsPath), "desktop-api.d.ts must exist")

    const preloadContent = fs.readFileSync(preloadPath, "utf-8")
    assert.ok(preloadContent.includes("getPrinters:"), "preload must expose getPrinters")
    assert.ok(preloadContent.includes("getPreviewPDF:"), "preload must expose getPreviewPDF")

    const dtsContent = fs.readFileSync(dtsPath, "utf-8")
    assert.ok(dtsContent.includes("getPrinters("), "desktop-api.d.ts must declare getPrinters")
    assert.ok(dtsContent.includes("getPreviewPDF("), "desktop-api.d.ts must declare getPreviewPDF")
  })

  test("4. ReportPrintPreviewModal component exists with A4 vector layout and print styles", () => {
    const modalPath = path.join(rootDir, "components", "reports", "report-print-preview-modal.tsx")
    assert.ok(fs.existsSync(modalPath), "report-print-preview-modal.tsx must exist")
    const content = fs.readFileSync(modalPath, "utf-8")

    assert.ok(content.includes("export function ReportPrintPreviewModal"), "Must export ReportPrintPreviewModal")
    assert.ok(content.includes("orientation"), "Must support orientation state")
    assert.ok(content.includes("density"), "Must support density state")
    assert.ok(content.includes("zoomLevel"), "Must support zoomLevel state")
    assert.ok(content.includes("availablePrinters"), "Must support printer selection")
    assert.ok(content.includes("table-header-group"), "Must repeat headers on each page via table-header-group")
    assert.ok(content.includes("table-footer-group"), "Must preserve footers via table-footer-group")
    assert.ok(content.includes("page-break-inside: avoid"), "Must prevent awkward row splitting via page-break-inside: avoid")
    assert.ok(content.includes("skyDesktop?.print"), "Must support direct high-speed Electron desktop printing")
  })

  test("5. saved-bol-report.tsx wires ReportPrintPreviewModal and provides quick direct print", () => {
    const reportPath = path.join(rootDir, "components", "reports", "saved-bol-report.tsx")
    assert.ok(fs.existsSync(reportPath), "saved-bol-report.tsx must exist")
    const content = fs.readFileSync(reportPath, "utf-8")

    assert.ok(content.includes("ReportPrintPreviewModal"), "Must import and render ReportPrintPreviewModal")
    assert.ok(content.includes("isPrintPreviewModalOpen"), "Must have isPrintPreviewModalOpen state")
    assert.ok(content.includes("handleDirectPrint"), "Must provide handleDirectPrint for quick print")
    assert.ok(content.includes("Print Studio"), "Must have Print Studio button in toolbar")
  })
})
