import { jsPDF } from "jspdf"
import type { AcciInvoiceData, AcciPackingListData } from "@/lib/types/acci-documents"
import { registerPDFFontsSync, hasRegisteredPDFFonts } from "@/lib/utils/pdf-fonts"

export function generateAcciInvoicePdf(data: AcciInvoiceData): jsPDF {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true,
  })

  registerPDFFontsSync(doc)
  const fonts = hasRegisteredPDFFonts(doc)
  const fontRegular = fonts.hasSans ? "NotoSans" : "helvetica"

  const pageWidth = 210
  const marginX = 14
  const contentWidth = 182 // 14mm to 196mm
  let y = 14

  // 1. Header: Centered "INVOICE" with Asterisks
  doc.setFont(fontRegular, "bold")
  doc.setFontSize(16)
  doc.setTextColor(0, 0, 0)
  doc.text("INVOICE", pageWidth / 2, y, { align: "center" })
  y += 4.5

  doc.setFont(fontRegular, "bold")
  doc.setFontSize(10)
  doc.text("***************", pageWidth / 2, y, { align: "center" })
  y += 5.5

  // 2. Top Section: EXACT 2 Columns Side-by-Side (50% / 50% Full-Width Alignment)
  const topSectionStartY = y
  const leftColW = 88
  const rightColW = 90
  const colGap = 4
  const rightColX = marginX + leftColW + colGap // 14 + 88 + 4 = 106mm
  const topSectionH = 49

  // --- Left Column: Bordered Party Box ---
  doc.setDrawColor(0, 0, 0)
  doc.setLineWidth(0.3)
  doc.rect(marginX, topSectionStartY, leftColW, topSectionH)

  let partyY = topSectionStartY + 4
  doc.setFont(fontRegular, "bold")
  doc.setFontSize(8)
  doc.text(`FROM: ${data.exporter.name}`, marginX + 2.5, partyY)
  partyY += 3.5

  doc.setFont(fontRegular, "normal")
  doc.setFontSize(6.8)
  const invTlText = data.exporter.tlNo ? `T.L NO: ${data.exporter.tlNo}  ` : ""
  const invAddText = data.exporter.address ? `ADD: ${data.exporter.address}` : ""
  const exporterAddressLines = doc.splitTextToSize(
    `${invTlText}${invAddText}`.trim(),
    leftColW - 5
  )
  if (exporterAddressLines.length > 0 && exporterAddressLines[0]) {
    doc.text(exporterAddressLines, marginX + 2.5, partyY)
    partyY += exporterAddressLines.length * 3.1
  }

  const invTel = data.exporter.phone ? `TEL: ${data.exporter.phone}` : ""
  const invEmail = data.exporter.email ? `EMAIL: ${data.exporter.email}` : ""
  const invContact = [invTel, invEmail].filter(Boolean).join("  ")
  if (invContact) {
    doc.text(invContact, marginX + 2.5, partyY)
    partyY += 3.5
  }

  // Solid dashed characters divider
  doc.setFont(fontRegular, "normal")
  doc.setFontSize(6)
  doc.setTextColor(140, 140, 140)
  doc.text("--------------------------------------------------------------------------------", marginX + 2.5, partyY)
  doc.setTextColor(0, 0, 0)
  partyY += 3.2

  // Consignee
  doc.setFont(fontRegular, "bold")
  doc.setFontSize(8)
  doc.text(`TO: ${data.consignee.name}`, marginX + 2.5, partyY)
  partyY += 3.3

  doc.setFont(fontRegular, "normal")
  doc.setFontSize(6.8)
  const consigneeAddressLines = doc.splitTextToSize(data.consignee.address, leftColW - 5)
  doc.text(consigneeAddressLines, marginX + 2.5, partyY)
  partyY += consigneeAddressLines.length * 3.1

  const extraIds = [
    data.consignee.gstin ? `GSTIN: ${data.consignee.gstin}` : "",
    data.consignee.pan ? `PAN: ${data.consignee.pan}` : "",
    data.consignee.iec ? `IEC: ${data.consignee.iec}` : "",
    data.consignee.phone ? `Mobile No: ${data.consignee.phone}` : "",
    data.consignee.email ? `Email: ${data.consignee.email}` : "",
  ].filter(Boolean).join("   ")

  if (extraIds) {
    const extraLines = doc.splitTextToSize(extraIds, leftColW - 5)
    doc.text(extraLines, marginX + 2.5, partyY)
    partyY += extraLines.length * 3.0
  }

  // Notify party if present
  if (data.notifyParty && partyY < topSectionStartY + topSectionH - 6) {
    partyY += 1
    doc.setFont(fontRegular, "bold")
    doc.setFontSize(7)
    doc.text("NOTIFY PARTY:", marginX + 2.5, partyY)
    partyY += 2.8
    doc.text(data.notifyParty.name, marginX + 2.5, partyY)
    partyY += 2.8
    doc.setFont(fontRegular, "normal")
    doc.setFontSize(6.5)
    doc.text(
      (data.notifyParty.address + (data.notifyParty.trn ? ` TRN: ${data.notifyParty.trn}` : "")).substring(0, 55),
      marginX + 2.5,
      partyY
    )
  }

  // --- Right Column: No/Date and Afghan Transit Table ---
  doc.setFont(fontRegular, "bold")
  doc.setFontSize(9)
  doc.text(`No: ${data.invoiceNumber}`, rightColX, topSectionStartY + 4)
  doc.setFontSize(8)
  doc.text(`Date: ${data.invoiceDate}`, rightColX, topSectionStartY + 8.5)

  // Afghan Transit Form Way Bill Table (Exact 90mm width, flush with right border 196mm)
  const transitStartY = topSectionStartY + 11
  const transitH = 38
  const halfRightW = rightColW / 2

  doc.setDrawColor(0, 0, 0)
  doc.setLineWidth(0.3)
  doc.rect(rightColX, transitStartY, rightColW, transitH)

  // Row 0: Title (5.5mm)
  doc.rect(rightColX, transitStartY, rightColW, 5.5)
  doc.setFont(fontRegular, "bold")
  doc.setFontSize(7.5)
  doc.text(data.transit.docTitle, rightColX + 2.5, transitStartY + 3.8)

  // Row 1: No & Date (5mm) - Single cell, NO middle divider
  const r1Y = transitStartY + 5.5
  doc.rect(rightColX, r1Y, rightColW, 5)
  doc.setFont(fontRegular, "bold")
  doc.setFontSize(7.2)
  doc.text(`No: ${data.transit.bolNumber || ""}`, rightColX + 2.5, r1Y + 3.5)
  doc.text(`Date: ${data.transit.bolDate || ""}`, rightColX + rightColW - 28, r1Y + 3.5)

  // Row 2: Terms of Payment (5.5mm) - Centered
  const r2Y = r1Y + 5
  doc.rect(rightColX, r2Y, rightColW, 5.5)
  doc.setFont(fontRegular, "bold")
  doc.setFontSize(7)
  doc.text("Terms of Payment", rightColX + rightColW / 2, r2Y + 2.3, { align: "center" })
  doc.setFont(fontRegular, "normal")
  doc.setFontSize(6.8)
  doc.text(data.transit.termsOfPayment || "100% Advance Payment", rightColX + rightColW / 2, r2Y + 4.7, { align: "center" })

  // Row 3: Letter of credit / collection basis (5mm) - Single cell, NO middle divider
  const r3Y = r2Y + 5.5
  doc.rect(rightColX, r3Y, rightColW, 5)
  doc.setFont(fontRegular, "normal")
  doc.setFontSize(6.8)
  doc.text(data.transit.letterOfCredit || "Letter Of Credit", rightColX + 2.5, r3Y + 3.5)
  doc.text(data.transit.collectionBasisNo || "Collection Basis", rightColX + rightColW - 28, r3Y + 3.5)

  // Row 4: Through / Via (17mm)
  const r4Y = r3Y + 5
  const r4H = transitStartY + transitH - r4Y
  doc.rect(rightColX, r4Y, rightColW, r4H)
  doc.setFont(fontRegular, "bold")
  doc.setFontSize(7)
  doc.text("Through:", rightColX + 2.5, r4Y + 3.2)
  const viaLines = doc.splitTextToSize(`Via:${data.transit.via}`, rightColW - 5)
  doc.text(viaLines, rightColX + 2.5, r4Y + 6.8)

  y = topSectionStartY + topSectionH + 3

  // 3. Main Goods Table: EXACT Authentic ACCI Layout
  // Widths: NO (10mm), Quantity (28mm), Description (98mm), Unit Price (20mm), Total Price (26mm) = 182mm
  const colWNo = 10
  const colWQty = 28
  const colWDesc = 98
  const colWUnit = 20
  const colWTotal = 26

  const xNo = marginX // 14
  const xQty = xNo + colWNo // 24
  const xDesc = xQty + colWQty // 52
  const xUnit = xDesc + colWDesc // 150
  const xTotal = xUnit + colWUnit // 170

  // Header row (Pure white background)
  const thHeight = 7.5
  doc.setFillColor(255, 255, 255)
  doc.rect(marginX, y, contentWidth, thHeight, "FD")
  doc.line(xQty, y, xQty, y + thHeight)
  doc.line(xQty + 0.6, y, xQty + 0.6, y + thHeight) // Double vertical line right of NO
  doc.line(xDesc, y, xDesc, y + thHeight)
  doc.line(xUnit, y, xUnit, y + thHeight)
  doc.line(xTotal, y, xTotal, y + thHeight)

  doc.setFont(fontRegular, "bold")
  doc.setFontSize(8)
  doc.text("NO", xNo + colWNo / 2, y + 4.8, { align: "center" })
  doc.text("Quantity", xQty + colWQty / 2, y + 4.8, { align: "center" })
  doc.text("Description of Goods", xDesc + colWDesc / 2, y + 4.8, { align: "center" })
  doc.text("Unit price", xUnit + colWUnit / 2, y + 3.3, { align: "center" })
  doc.text("USD", xUnit + colWUnit / 2, y + 6.5, { align: "center" })
  doc.text("Total price", xTotal + colWTotal / 2, y + 3.3, { align: "center" })
  doc.text("USD", xTotal + colWTotal / 2, y + 6.5, { align: "center" })

  // Double horizontal line under header
  doc.setLineWidth(0.3)
  doc.line(marginX, y + thHeight, marginX + contentWidth, y + thHeight)
  doc.line(marginX, y + thHeight + 0.6, marginX + contentWidth, y + thHeight + 0.6)

  y += thHeight + 0.6

  // Continuous Table Body Columns
  const bodyStartY = y
  const bodyEndY = 278
  const bodyHeight = bodyEndY - bodyStartY

  // Outer border & continuous vertical dividers (with double line after NO)
  doc.rect(marginX, bodyStartY, contentWidth, bodyHeight)
  doc.line(xQty, bodyStartY, xQty, bodyEndY)
  doc.line(xQty + 0.6, bodyStartY, xQty + 0.6, bodyEndY) // Double vertical line
  doc.line(xDesc, bodyStartY, xDesc, bodyEndY)
  doc.line(xUnit, bodyStartY, xUnit, bodyEndY)
  doc.line(xTotal, bodyStartY, xTotal, bodyEndY)

  // --- TOP ROW ITEMS ---
  let itemTopY = bodyStartY + 5
  data.items.forEach((item) => {
    // Col 1: NO
    doc.setFont(fontRegular, "bold")
    doc.setFontSize(8.5)
    doc.text(String(item.no), xNo + colWNo / 2, itemTopY, { align: "center" })

    // Col 2: Quantity
    doc.setFontSize(8)
    doc.text(`${item.packagesCount} ${item.packageType}`, xQty + 2.5, itemTopY)
    doc.text(`${item.netWeight} KGS`, xQty + 2.5, itemTopY + 4.5)

    // Col 3: Description of Goods
    doc.setFontSize(8.5)
    doc.text(item.description, xDesc + 3, itemTopY)

    // Col 4: Unit Price
    doc.setFontSize(8.5)
    doc.text(item.unitPrice.toFixed(2), xUnit + colWUnit / 2, itemTopY, { align: "center" })

    // Col 5: Total Price
    doc.text(
      item.totalPrice.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      xTotal + colWTotal - 2.5,
      itemTopY,
      { align: "right" }
    )

    itemTopY += 12
  })

  // --- CENTER SECTION INSIDE COLUMN 3 (Description of Goods) ---
  // Vertically centered in the open table body space between items and bottom chamber box (Moved upside to center)
  const chamberBoxY = bodyEndY - 35
  const availableMidY = (itemTopY + chamberBoxY) / 2 - 8
  const col3CenterY = Math.max(itemTopY + 12, availableMidY)

  doc.setFont(fontRegular, "bold")
  doc.setFontSize(8.5)
  doc.text("Total Amount Say: USD:", xDesc + colWDesc / 2, col3CenterY, { align: "center" })

  const wordsLines = doc.splitTextToSize(data.amountInWords.toUpperCase(), colWDesc - 8)
  doc.setFontSize(9)
  doc.text(wordsLines, xDesc + colWDesc / 2, col3CenterY + 4.5, { align: "center" })

  const originY = col3CenterY + 4.5 + wordsLines.length * 4 + 1.5
  doc.setFontSize(8.5)
  doc.text(data.originCountry, xDesc + colWDesc / 2, originY, { align: "center" })

  // Chamber Fee Block inside Col 3 (with Outer Border Box matching authentic downside image)
  const chamberBlockW = 66
  const cbLeft = xDesc + (colWDesc - chamberBlockW) / 2
  const cbRight = cbLeft + chamberBlockW

  doc.setLineWidth(0.25)
  doc.setDrawColor(0, 0, 0)
  doc.rect(cbLeft - 2.5, chamberBoxY - 1.5, chamberBlockW + 5, 22.5)

  const regNo = (data.acciChamber.regNo || "0000").replace(/^-+|-+$/g, "").trim() || "0000"
  const feeNo = (data.acciChamber.feeNo || "0000").replace(/^-+|-+$/g, "").trim() || "0000"
  const shamsiDate = (data.acciChamber.shamsiDate || "28/07/1405").replace(/^-+|-+$/g, "").trim() || "28/07/1405"
  const receivedSum = data.acciChamber.receivedSum || "2,330"

  const repeatDashesToWidth = (targetW: number) => {
    if (targetW <= 0) return ""
    const dashW = Math.max(doc.getTextWidth("-"), 0.5)
    const count = Math.max(1, Math.floor(targetW / dashW))
    return "-".repeat(count)
  }

  const drawBlueLabelField = (label: string, value: string | null, rowY: number) => {
    doc.setFont(fontRegular, "normal")
    doc.setFontSize(7)
    doc.setTextColor(29, 78, 216)
    doc.text(label, cbLeft, rowY)
    const labelW = doc.getTextWidth(label)
    doc.setDrawColor(29, 78, 216)
    doc.setLineWidth(0.2)
    doc.line(cbLeft, rowY + 0.6, cbLeft + labelW, rowY + 0.6)

    doc.setTextColor(0, 0, 0)
    doc.setDrawColor(0, 0, 0)
    const fillStart = cbLeft + labelW + 0.8
    if (value === null) {
      doc.text(repeatDashesToWidth(cbRight - fillStart), fillStart, rowY)
      return
    }
    const valW = doc.getTextWidth(value)
    const sideW = Math.max(0, (cbRight - fillStart - valW - 2) / 2)
    doc.text(repeatDashesToWidth(sideW), fillStart, rowY)
    doc.text(value, fillStart + sideW + 1 + valW / 2, rowY, { align: "center" })
    doc.text(repeatDashesToWidth(sideW), fillStart + sideW + valW + 2, rowY)
  }

  drawBlueLabelField("Reg No :", regNo, chamberBoxY + 2)
  drawBlueLabelField("Fee No :", feeNo, chamberBoxY + 6)

  // Row 3: Received the sum of------ 2,330 (same left/right edges)
  doc.setFont(fontRegular, "bold")
  doc.setFontSize(7)
  const receivedLabel = "Received the sum of------"
  doc.text(receivedLabel, cbLeft, chamberBoxY + 10)
  doc.text(receivedSum, cbRight, chamberBoxY + 10, { align: "right" })
  const recLabelW = doc.getTextWidth(receivedLabel)
  const recValW = doc.getTextWidth(receivedSum)
  doc.setFont(fontRegular, "normal")
  doc.text(
    repeatDashesToWidth(cbRight - recValW - 1 - (cbLeft + recLabelW + 0.3)),
    cbLeft + recLabelW + 0.3,
    chamberBoxY + 10
  )

  drawBlueLabelField("Date :", shamsiDate, chamberBoxY + 14)
  drawBlueLabelField("Signature :", null, chamberBoxY + 18)

  // Shared horizontal border across Col 4 & Col 5 for TOTAL C&F and Total Amount (aligned with Chamber block)
  const totalRowY = bodyEndY - 25.5
  doc.setLineWidth(0.3)
  doc.line(xUnit, totalRowY, marginX + contentWidth, totalRowY)
  doc.line(xUnit, totalRowY + 7, marginX + contentWidth, totalRowY + 7)

  // In Col 4: TOTAL C&F
  doc.setFont(fontRegular, "bold")
  doc.setFontSize(7)
  doc.text("TOTAL", xUnit + colWUnit / 2, totalRowY + 3, { align: "center" })
  doc.text(data.incoterm || "C&F", xUnit + colWUnit / 2, totalRowY + 5.8, { align: "center" })

  // In Col 5: Total Amount
  doc.setFontSize(8)
  doc.text(
    data.totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    xTotal + colWTotal - 2.5,
    totalRowY + 4.5,
    { align: "right" }
  )

  // Below Total Row in Col 5: Company Name Stamp with clean centered dashed line
  doc.setFont(fontRegular, "bold")
  doc.setFontSize(10.5)
  doc.text("SKY", xTotal + colWTotal / 2, totalRowY + 12, { align: "center" })
  doc.text("ARIANA LTD", xTotal + colWTotal / 2, totalRowY + 16, { align: "center" })
  doc.setFont(fontRegular, "normal")
  doc.setFontSize(7.5)
  doc.text("------------------------", xTotal + colWTotal / 2, totalRowY + 19.5, { align: "center" })

  return doc
}

export function generateAcciPackingListPdf(data: AcciPackingListData): jsPDF {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true,
  })

  registerPDFFontsSync(doc)
  const fonts = hasRegisteredPDFFonts(doc)
  const fontRegular = fonts.hasSans ? "NotoSans" : "helvetica"

  const pageWidth = 210
  const marginX = 14
  const contentWidth = 182 // 14mm to 196mm
  let y = 14

  // 1. Header: PACKING LIST with Underline (NO Asterisks)
  doc.setFont(fontRegular, "bold")
  doc.setFontSize(16)
  doc.setTextColor(0, 0, 0)
  doc.text("PACKING LIST", pageWidth / 2, y, { align: "center" })
  doc.setLineWidth(0.3)
  doc.line(pageWidth / 2 - 28, y + 1.2, pageWidth / 2 + 28, y + 1.2)
  y += 9

  // 2. Top Section: EXACT 2 Columns Side-by-Side (50% / 50% Full-Width Alignment)
  const topSectionStartY = y
  const leftColW = 88
  const rightColW = 90
  const colGap = 4
  const rightColX = marginX + leftColW + colGap // 106mm
  const topSectionH = 49

  // --- Left Column: Bordered Party Box ---
  doc.setDrawColor(0, 0, 0)
  doc.setLineWidth(0.3)
  doc.rect(marginX, topSectionStartY, leftColW, topSectionH)

  let partyY = topSectionStartY + 4
  doc.setFont(fontRegular, "bold")
  doc.setFontSize(8)
  doc.text(`FROM: ${data.exporter.name}`, marginX + 2.5, partyY)
  partyY += 3.5

  doc.setFont(fontRegular, "normal")
  doc.setFontSize(6.8)
  const plTlText = data.exporter.tlNo ? `T.L NO: ${data.exporter.tlNo}  ` : ""
  const plAddText = data.exporter.address ? `ADD: ${data.exporter.address}` : ""
  const exporterAddressLines = doc.splitTextToSize(
    `${plTlText}${plAddText}`.trim(),
    leftColW - 5
  )
  if (exporterAddressLines.length > 0 && exporterAddressLines[0]) {
    doc.text(exporterAddressLines, marginX + 2.5, partyY)
    partyY += exporterAddressLines.length * 3.1
  }

  const plTel = data.exporter.phone ? `TEL: ${data.exporter.phone}` : ""
  const plEmail = data.exporter.email ? `EMAIL: ${data.exporter.email}` : ""
  const plContact = [plTel, plEmail].filter(Boolean).join("  ")
  if (plContact) {
    doc.text(plContact, marginX + 2.5, partyY)
    partyY += 3.5
  }

  // Dashed characters line
  doc.setFont(fontRegular, "normal")
  doc.setFontSize(6)
  doc.setTextColor(140, 140, 140)
  doc.text("--------------------------------------------------------------------------------", marginX + 2.5, partyY)
  doc.setTextColor(0, 0, 0)
  partyY += 3.2

  // Consignee
  doc.setFont(fontRegular, "bold")
  doc.setFontSize(8)
  doc.text(`TO: ${data.consignee.name}`, marginX + 2.5, partyY)
  partyY += 3.3

  doc.setFont(fontRegular, "normal")
  doc.setFontSize(6.8)
  const consigneeAddressLines = doc.splitTextToSize(data.consignee.address, leftColW - 5)
  doc.text(consigneeAddressLines, marginX + 2.5, partyY)
  partyY += consigneeAddressLines.length * 3.1

  const extraIds = [
    data.consignee.gstin ? `GSTIN: ${data.consignee.gstin}` : "",
    data.consignee.pan ? `PAN: ${data.consignee.pan}` : "",
    data.consignee.iec ? `IEC: ${data.consignee.iec}` : "",
    data.consignee.phone ? `Mobile No: ${data.consignee.phone}` : "",
    data.consignee.email ? `Email: ${data.consignee.email}` : "",
  ].filter(Boolean).join("   ")

  if (extraIds) {
    const extraLines = doc.splitTextToSize(extraIds, leftColW - 5)
    doc.text(extraLines, marginX + 2.5, partyY)
    partyY += extraLines.length * 3.0
  }

  if (data.notifyParty && partyY < topSectionStartY + topSectionH - 6) {
    partyY += 1
    doc.setFont(fontRegular, "bold")
    doc.setFontSize(7)
    doc.text("NOTIFY PARTY:", marginX + 2.5, partyY)
    partyY += 2.8
    doc.text(data.notifyParty.name, marginX + 2.5, partyY)
    partyY += 2.8
    doc.setFont(fontRegular, "normal")
    doc.setFontSize(6.5)
    doc.text(
      (data.notifyParty.address + (data.notifyParty.trn ? ` TRN: ${data.notifyParty.trn}` : "")).substring(0, 55),
      marginX + 2.5,
      partyY
    )
  }

  // --- Right Column: No/Date and Afghan Transit Table ---
  doc.setFont(fontRegular, "bold")
  doc.setFontSize(9)
  doc.text(`No: ${data.packingListNumber}`, rightColX, topSectionStartY + 4)
  doc.setFontSize(8)
  doc.text(`Date: ${data.date}`, rightColX, topSectionStartY + 8.5)

  // Afghan Transit Form Table (Exact 90mm width, flush with right border 196mm)
  const transitStartY = topSectionStartY + 11
  const transitH = 38

  doc.setDrawColor(0, 0, 0)
  doc.setLineWidth(0.3)
  doc.rect(rightColX, transitStartY, rightColW, transitH)

  // Row 0: Title (5.5mm) - Centered
  doc.rect(rightColX, transitStartY, rightColW, 5.5)
  doc.setFont(fontRegular, "bold")
  doc.setFontSize(7.5)
  doc.text(data.transit.docTitle || "Afghan Transit form Airway Bill.", rightColX + rightColW / 2, transitStartY + 3.8, { align: "center" })

  // Row 1: NO & Date (5mm) - Single cell, NO middle divider
  const r1Y = transitStartY + 5.5
  doc.rect(rightColX, r1Y, rightColW, 5)
  doc.setFont(fontRegular, "bold")
  doc.setFontSize(7.2)
  doc.text(`NO: ${data.transit.bolNumber || ""}`, rightColX + 2.5, r1Y + 3.5)
  doc.text(`Date: ${data.transit.bolDate || ""}`, rightColX + rightColW - 28, r1Y + 3.5)

  // Row 2: Terms of Payment (5.5mm) - Centered
  const r2Y = r1Y + 5
  doc.rect(rightColX, r2Y, rightColW, 5.5)
  doc.setFont(fontRegular, "bold")
  doc.setFontSize(7)
  doc.text(`Terms of Payment: ${data.transit.termsOfPayment || ""}`, rightColX + rightColW / 2, r2Y + 3.6, { align: "center" })

  // Row 3: Letter of credit / collection basis (5mm) - Single cell, NO middle divider
  const r3Y = r2Y + 5.5
  doc.rect(rightColX, r3Y, rightColW, 5)
  doc.setFont(fontRegular, "normal")
  doc.setFontSize(6.8)
  doc.text(data.transit.letterOfCredit || "Letter of Credit", rightColX + 2.5, r3Y + 3.5)
  doc.text(data.transit.collectionBasisNo || "Collection Basis", rightColX + rightColW - 28, r3Y + 3.5)

  // Row 4: Through / Via (17mm)
  const r4Y = r3Y + 5
  const r4H = transitStartY + transitH - r4Y
  doc.rect(rightColX, r4Y, rightColW, r4H)
  doc.setFont(fontRegular, "bold")
  doc.setFontSize(7)
  doc.text("Through:", rightColX + 2.5, r4Y + 3.2)
  const viaLines = doc.splitTextToSize(`Via:${data.transit.via}`, rightColW - 5)
  doc.text(viaLines, rightColX + 2.5, r4Y + 6.8)

  y = topSectionStartY + topSectionH + 3

  // 3. Main Goods Table: No | Description of Goods | Quantity
  // Widths: No (16mm), Description (106mm), Quantity (60mm) = 182mm
  const colWNo = 16
  const colWDesc = 106
  const colWQty = 60

  const xNo = marginX // 14
  const xDesc = xNo + colWNo // 30
  const xQty = xDesc + colWDesc // 136

  // Header row (Pure white background)
  const thHeight = 7.5
  doc.setFillColor(255, 255, 255)
  doc.rect(marginX, y, contentWidth, thHeight, "FD")
  doc.line(xDesc, y, xDesc, y + thHeight)
  doc.line(xDesc + 0.6, y, xDesc + 0.6, y + thHeight) // Double vertical line right of No
  doc.line(xQty, y, xQty, y + thHeight)

  doc.setFont(fontRegular, "bold")
  doc.setFontSize(8.5)
  doc.text("No", xNo + colWNo / 2, y + 4.8, { align: "center" })
  doc.text("Description of Goods", xDesc + colWDesc / 2, y + 4.8, { align: "center" })
  doc.text("Quantity", xQty + colWQty / 2, y + 4.8, { align: "center" })

  // Double horizontal line under header
  doc.setLineWidth(0.3)
  doc.line(marginX, y + thHeight, marginX + contentWidth, y + thHeight)
  doc.line(marginX, y + thHeight + 0.6, marginX + contentWidth, y + thHeight + 0.6)

  y += thHeight + 0.6

  // Continuous Table Body Columns
  const bodyStartY = y
  const bodyEndY = 278
  const bodyHeight = bodyEndY - bodyStartY

  doc.rect(marginX, bodyStartY, contentWidth, bodyHeight)
  doc.line(xDesc, bodyStartY, xDesc, bodyEndY)
  doc.line(xDesc + 0.6, bodyStartY, xDesc + 0.6, bodyEndY) // Double vertical line
  doc.line(xQty, bodyStartY, xQty, bodyEndY)

  // --- TOP ROW ITEMS ---
  let itemTopY = bodyStartY + 5
  data.items.forEach((item) => {
    // Col 1: No
    doc.setFont(fontRegular, "bold")
    doc.setFontSize(8.5)
    doc.text(`${item.no}.`, xNo + colWNo / 2, itemTopY, { align: "center" })

    // Col 2: Description (Centered uppercase)
    doc.setFontSize(8.5)
    doc.text(item.description.toUpperCase(), xDesc + colWDesc / 2, itemTopY, { align: "center" })

    // Col 3: Quantity (Packages, NW, GW) - Centered
    doc.setFontSize(8.5)
    doc.text(`${item.packagesCount} ${item.packageType}`, xQty + colWQty / 2, itemTopY, { align: "center" })
    doc.setFontSize(8)
    doc.text(`NW: ${item.netWeight} KGS`, xQty + colWQty / 2, itemTopY + 4.5, { align: "center" })
    doc.text(`GW: ${item.grossWeight} KGS`, xQty + colWQty / 2, itemTopY + 9, { align: "center" })

    itemTopY += 16
  })

  // --- CENTER SECTION INSIDE TABLE COLUMNS (Aligned vertically & horizontally) ---
  const centerY = Math.max(itemTopY + 18, bodyStartY + bodyHeight / 2)

  // In Col 2 (Description): (Origin Afghanistan) centered vertically & horizontally
  doc.setFont(fontRegular, "normal")
  doc.setFontSize(12.5)
  doc.text(data.originCountry, xDesc + colWDesc / 2, centerY + 2, { align: "center" })

  // In Col 3 (Quantity): SKY ARIANA LTD and dashed line aligned vertically across from Origin
  doc.setFont(fontRegular, "bold")
  doc.setFontSize(10.5)
  doc.text("SKY", xQty + colWQty / 2, centerY - 2.5, { align: "center" })
  doc.text("ARIANA LTD", xQty + colWQty / 2, centerY + 2.5, { align: "center" })
  doc.setFont(fontRegular, "normal")
  doc.setFontSize(7.5)
  doc.setTextColor(80, 80, 80)
  doc.text("-----------------------------------", xQty + colWQty / 2, centerY + 6.5, { align: "center" })
  doc.setTextColor(0, 0, 0)

  return doc
}

export function downloadAcciInvoicePdf(data: AcciInvoiceData, filename?: string): void {
  const doc = generateAcciInvoicePdf(data)
  doc.save(filename || `ACCI-INVOICE-${data.invoiceNumber || "001"}.pdf`)
}

export function downloadAcciPackingListPdf(data: AcciPackingListData, filename?: string): void {
  const doc = generateAcciPackingListPdf(data)
  doc.save(filename || `PACKING-LIST-${data.invoiceNumber || "001"}.pdf`)
}
