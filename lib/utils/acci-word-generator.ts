import * as fflate from "fflate"
import type { AcciInvoiceData, AcciPackingListData } from "@/lib/types/acci-documents"

function escapeXml(unsafe?: string | number | null): string {
  if (unsafe === null || unsafe === undefined) return ""
  return String(unsafe)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

const CONTENT_TYPES_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>`

const RELS_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`

const STYLES_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults>
    <w:rPrDefault>
      <w:rPr>
        <w:rFonts w:ascii="Cambria" w:eastAsia="Cambria" w:hAnsi="Cambria" w:cs="Cambria"/>
        <w:sz w:val="20"/>
        <w:szCs w:val="20"/>
        <w:lang w:val="en-US"/>
      </w:rPr>
    </w:rPrDefault>
    <w:pPrDefault>
      <w:pPr>
        <w:spacing w:line="240" w:lineRule="auto" w:after="0" w:before="0"/>
      </w:pPr>
    </w:pPrDefault>
  </w:docDefaults>
</w:styles>`

function pXml(
  text: string,
  options?: {
    bold?: boolean
    underline?: boolean
    align?: "left" | "center" | "right"
    sizeHalfPt?: number
    spacingAfter?: number
    spacingBefore?: number
  }
): string {
  const align = options?.align || "left"
  const size = options?.sizeHalfPt || 20
  const after = options?.spacingAfter ?? 30
  const before = options?.spacingBefore ?? 0
  const bold = options?.bold ? "<w:b/><w:bCs/>" : ""
  const underline = options?.underline ? '<w:u w:val="single"/>' : ""

  return `<w:p>
    <w:pPr>
      <w:jc w:val="${align}"/>
      <w:spacing w:before="${before}" w:after="${after}" w:line="240" w:lineRule="auto"/>
    </w:pPr>
    <w:r>
      <w:rPr>
        <w:rFonts w:ascii="Cambria" w:hAnsi="Cambria"/>
        ${bold}
        ${underline}
        <w:sz w:val="${size}"/>
        <w:szCs w:val="${size}"/>
      </w:rPr>
      <w:t xml:space="preserve">${escapeXml(text)}</w:t>
    </w:r>
  </w:p>`
}

function applyCambriaFont(xml: string): string {
  return xml.replaceAll("Times New Roman", "Cambria")
}

export function generateAcciInvoiceDocx(data: AcciInvoiceData): Uint8Array {
  const item = data.items[0] || {
    no: 1,
    packagesCount: 0,
    packageType: "BAGS",
    netWeight: 0,
    grossWeight: 0,
    description: "",
    unitPrice: 0,
    totalPrice: 0,
    origin: "(Origin Afghanistan)",
  }

  const consigneeExtraLines = [
    data.consignee.gstin ? `GSTIN: ${data.consignee.gstin}` : "",
    data.consignee.pan ? `PAN: ${data.consignee.pan}` : "",
    data.consignee.iec ? `IEC: ${data.consignee.iec}` : "",
    data.consignee.phone ? `Mobile No: ${data.consignee.phone}` : "",
    data.consignee.email ? `Email: ${data.consignee.email}` : "",
  ]
    .filter(Boolean)
    .join("   ")

  const notifyLines = data.notifyParty
    ? `
    ${pXml("NOTIFY PARTY:", { bold: true, sizeHalfPt: 17, spacingBefore: 40, spacingAfter: 10 })}
    ${pXml(data.notifyParty.name, { bold: true, sizeHalfPt: 17, spacingAfter: 10 })}
    ${pXml(data.notifyParty.address + (data.notifyParty.trn ? ` TRN: ${data.notifyParty.trn}` : ""), { sizeHalfPt: 16, spacingAfter: 20 })}
  `
    : ""

  const regNo = (data.acciChamber.regNo || "0000").replace(/^-+|-+$/g, "").trim() || "0000"
  const feeNo = (data.acciChamber.feeNo || "0000").replace(/^-+|-+$/g, "").trim() || "0000"
  const shamsiDate = (data.acciChamber.shamsiDate || "28/07/1405").replace(/^-+|-+$/g, "").trim() || "28/07/1405"

  const docXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <!-- Document Title: INVOICE with Asterisks -->
    ${pXml("INVOICE", { align: "center", bold: true, sizeHalfPt: 34, spacingAfter: 10 })}
    ${pXml("***************", { align: "center", bold: true, sizeHalfPt: 20, spacingAfter: 100 })}

    <!-- Top Section: Side-by-Side 2 Columns (5300 dxa and 5300 dxa) -->
    <w:tbl>
      <w:tblPr>
        <w:tblW w:w="10800" w:type="dxa"/>
        <w:tblBorders>
          <w:top w:val="none"/>
          <w:left w:val="none"/>
          <w:bottom w:val="none"/>
          <w:right w:val="none"/>
          <w:insideH w:val="none"/>
          <w:insideV w:val="none"/>
        </w:tblBorders>
        <w:tblCellMar>
          <w:top w:w="0" w:type="dxa"/>
          <w:left w:w="0" w:type="dxa"/>
          <w:bottom w:w="0" w:type="dxa"/>
          <w:right w:w="100" w:type="dxa"/>
        </w:tblCellMar>
      </w:tblPr>
      <w:tr>
        <!-- Left Column: Outer Bordered Party Box -->
        <w:tc>
          <w:tcPr>
            <w:tcW w:w="5300" w:type="dxa"/>
            <w:tcBorders>
              <w:top w:val="single" w:sz="8" w:space="0" w:color="000000"/>
              <w:left w:val="single" w:sz="8" w:space="0" w:color="000000"/>
              <w:bottom w:val="single" w:sz="8" w:space="0" w:color="000000"/>
              <w:right w:val="single" w:sz="8" w:space="0" w:color="000000"/>
            </w:tcBorders>
            <w:tcMar>
              <w:top w:w="80" w:type="dxa"/>
              <w:left w:w="120" w:type="dxa"/>
              <w:bottom w:w="80" w:type="dxa"/>
              <w:right w:w="120" w:type="dxa"/>
            </w:tcMar>
            <w:vAlign w:val="top"/>
          </w:tcPr>
          ${pXml(`FROM: ${data.exporter.name}`, { bold: true, sizeHalfPt: 19, spacingAfter: 15 })}
          ${
            (() => {
              const tl = data.exporter.tlNo ? `T.L NO: ${data.exporter.tlNo}  ` : ""
              const add = data.exporter.address ? `ADD: ${data.exporter.address}` : ""
              const full = `${tl}${add}`.trim()
              return full ? pXml(full, { sizeHalfPt: 16, spacingAfter: 15 }) : ""
            })()
          }
          ${
            (() => {
              const tel = data.exporter.phone ? `TEL: ${data.exporter.phone}` : ""
              const em = data.exporter.email ? `EMAIL: ${data.exporter.email}` : ""
              const contact = [tel, em].filter(Boolean).join("  ")
              return contact ? pXml(contact, { sizeHalfPt: 16, spacingAfter: 30 }) : ""
            })()
          }
          ${pXml("--------------------------------------------------------------------------------", { sizeHalfPt: 12, spacingAfter: 20 })}
          ${pXml(`TO: ${data.consignee.name}`, { bold: true, sizeHalfPt: 19, spacingAfter: 15 })}
          ${pXml(data.consignee.address, { sizeHalfPt: 16, spacingAfter: 15 })}
          ${consigneeExtraLines ? pXml(consigneeExtraLines, { sizeHalfPt: 15, spacingAfter: 20 }) : ""}
          ${notifyLines}
        </w:tc>

        <!-- Spacer Column -->
        <w:tc>
          <w:tcPr><w:tcW w:w="200" w:type="dxa"/></w:tcPr>
          ${pXml("")}
        </w:tc>

        <!-- Right Column: No/Date and Afghan Transit Table -->
        <w:tc>
          <w:tcPr>
            <w:tcW w:w="5300" w:type="dxa"/>
            <w:vAlign w:val="top"/>
          </w:tcPr>
          ${pXml(`No: ${data.invoiceNumber}`, { bold: true, sizeHalfPt: 22, spacingAfter: 20 })}
          ${pXml(`Date: ${data.invoiceDate}`, { bold: true, sizeHalfPt: 19, spacingAfter: 40 })}

          <!-- Afghan Transit Form Way Bill Table -->
          <w:tbl>
            <w:tblPr>
              <w:tblW w:w="5300" w:type="dxa"/>
              <w:tblBorders>
                <w:top w:val="single" w:sz="8" w:space="0" w:color="000000"/>
                <w:left w:val="single" w:sz="8" w:space="0" w:color="000000"/>
                <w:bottom w:val="single" w:sz="8" w:space="0" w:color="000000"/>
                <w:right w:val="single" w:sz="8" w:space="0" w:color="000000"/>
                <w:insideH w:val="single" w:sz="6" w:space="0" w:color="000000"/>
                <w:insideV w:val="none"/>
              </w:tblBorders>
              <w:tblCellMar>
                <w:top w:w="60" w:type="dxa"/>
                <w:left w:w="100" w:type="dxa"/>
                <w:bottom w:w="60" w:type="dxa"/>
                <w:right w:w="100" w:type="dxa"/>
              </w:tblCellMar>
            </w:tblPr>
            <w:tr>
              <w:tc>
                <w:tcPr><w:tcW w:w="5300" w:type="dxa"/></w:tcPr>
                <w:p>
                  <w:pPr>
                    <w:spacing w:before="0" w:after="20" w:line="240" w:lineRule="auto"/>
                  </w:pPr>
                  <w:r>
                    <w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:b/><w:bCs/><w:sz w:val="18"/><w:szCs w:val="18"/></w:rPr>
                    <w:t xml:space="preserve">Afghan Transit Form </w:t>
                  </w:r>
                  <w:r>
                    <w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:b/><w:bCs/><w:u w:val="single"/><w:sz w:val="18"/><w:szCs w:val="18"/></w:rPr>
                    <w:t xml:space="preserve">Way Bill</w:t>
                  </w:r>
                </w:p>
              </w:tc>
            </w:tr>
            <w:tr>
              <w:tc>
                <w:tcPr><w:tcW w:w="5300" w:type="dxa"/></w:tcPr>
                <w:p>
                  <w:pPr>
                    <w:tabs><w:tab w:val="right" w:pos="5100"/></w:tabs>
                    <w:spacing w:before="0" w:after="20" w:line="240" w:lineRule="auto"/>
                  </w:pPr>
                  <w:r>
                    <w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:b/><w:bCs/><w:sz w:val="17"/><w:szCs w:val="17"/></w:rPr>
                    <w:t xml:space="preserve">No: ${escapeXml(data.transit.bolNumber || "")}</w:t>
                  </w:r>
                  <w:r><w:tab/></w:r>
                  <w:r>
                    <w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:b/><w:bCs/><w:sz w:val="17"/><w:szCs w:val="17"/></w:rPr>
                    <w:t xml:space="preserve">Date: ${escapeXml(data.transit.bolDate || "")}</w:t>
                  </w:r>
                </w:p>
              </w:tc>
            </w:tr>
            <w:tr>
              <w:tc>
                <w:tcPr><w:tcW w:w="5300" w:type="dxa"/></w:tcPr>
                ${pXml("Terms of Payment", { bold: true, sizeHalfPt: 17, align: "center", spacingAfter: 0 })}
                ${pXml(data.transit.termsOfPayment || "100% Advance Payment", { sizeHalfPt: 16, align: "center", spacingAfter: 20 })}
              </w:tc>
            </w:tr>
            <w:tr>
              <w:tc>
                <w:tcPr><w:tcW w:w="5300" w:type="dxa"/></w:tcPr>
                <w:p>
                  <w:pPr>
                    <w:tabs><w:tab w:val="right" w:pos="5100"/></w:tabs>
                    <w:spacing w:before="0" w:after="10" w:line="240" w:lineRule="auto"/>
                  </w:pPr>
                  <w:r>
                    <w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="16"/><w:szCs w:val="16"/></w:rPr>
                    <w:t xml:space="preserve">${escapeXml(data.transit.letterOfCredit || "Letter Of Credit")}</w:t>
                  </w:r>
                  <w:r><w:tab/></w:r>
                  <w:r>
                    <w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="16"/><w:szCs w:val="16"/></w:rPr>
                    <w:t xml:space="preserve">${escapeXml(data.transit.collectionBasisNo || "Collection Basis")}</w:t>
                  </w:r>
                </w:p>
                ${pXml("No:", { sizeHalfPt: 16, spacingAfter: 15 })}
              </w:tc>
            </w:tr>
            <w:tr>
              <w:tc>
                <w:tcPr><w:tcW w:w="5300" w:type="dxa"/></w:tcPr>
                ${pXml("Through:", { bold: true, sizeHalfPt: 17, spacingAfter: 10 })}
                ${pXml(`Via: ${data.transit.via}`, { bold: true, sizeHalfPt: 16, spacingAfter: 20 })}
              </w:tc>
            </w:tr>
          </w:tbl>
        </w:tc>
      </w:tr>
    </w:tbl>

    <!-- Main Goods Table (Continuous columns to bottom with double line under header & double line right of NO) -->
    ${pXml("", { spacingAfter: 80 })}
    <w:tbl>
      <w:tblPr>
        <w:tblW w:w="10800" w:type="dxa"/>
        <w:tblBorders>
          <w:top w:val="single" w:sz="8" w:space="0" w:color="000000"/>
          <w:left w:val="single" w:sz="8" w:space="0" w:color="000000"/>
          <w:bottom w:val="single" w:sz="8" w:space="0" w:color="000000"/>
          <w:right w:val="single" w:sz="8" w:space="0" w:color="000000"/>
          <w:insideH w:val="none"/>
          <w:insideV w:val="single" w:sz="6" w:space="0" w:color="000000"/>
        </w:tblBorders>
        <w:tblCellMar>
          <w:top w:w="80" w:type="dxa"/>
          <w:left w:w="100" w:type="dxa"/>
          <w:bottom w:w="80" w:type="dxa"/>
          <w:right w:w="100" w:type="dxa"/>
        </w:tblCellMar>
      </w:tblPr>

      <!-- Table Header Row with Double Bottom Border and Double Right Border on NO -->
      <w:tr>
        <w:tc>
          <w:tcPr>
            <w:tcW w:w="650" w:type="dxa"/>
            <w:tcBorders>
              <w:bottom w:val="double" w:sz="12" w:space="0" w:color="000000"/>
              <w:right w:val="double" w:sz="12" w:space="0" w:color="000000"/>
            </w:tcBorders>
          </w:tcPr>
          ${pXml("NO", { align: "center", bold: true, sizeHalfPt: 19 })}
        </w:tc>
        <w:tc>
          <w:tcPr>
            <w:tcW w:w="2000" w:type="dxa"/>
            <w:tcBorders><w:bottom w:val="double" w:sz="12" w:space="0" w:color="000000"/></w:tcBorders>
          </w:tcPr>
          ${pXml("Quantity", { align: "center", bold: true, sizeHalfPt: 19 })}
        </w:tc>
        <w:tc>
          <w:tcPr>
            <w:tcW w:w="5350" w:type="dxa"/>
            <w:tcBorders><w:bottom w:val="double" w:sz="12" w:space="0" w:color="000000"/></w:tcBorders>
          </w:tcPr>
          ${pXml("Description of Goods", { align: "center", bold: true, sizeHalfPt: 19 })}
        </w:tc>
        <w:tc>
          <w:tcPr>
            <w:tcW w:w="1300" w:type="dxa"/>
            <w:tcBorders><w:bottom w:val="double" w:sz="12" w:space="0" w:color="000000"/></w:tcBorders>
          </w:tcPr>
          ${pXml("Unit price", { align: "center", bold: true, sizeHalfPt: 18, spacingAfter: 10 })}
          ${pXml("USD", { align: "center", bold: true, sizeHalfPt: 18 })}
        </w:tc>
        <w:tc>
          <w:tcPr>
            <w:tcW w:w="1500" w:type="dxa"/>
            <w:tcBorders><w:bottom w:val="double" w:sz="12" w:space="0" w:color="000000"/></w:tcBorders>
          </w:tcPr>
          ${pXml("Total price", { align: "center", bold: true, sizeHalfPt: 18, spacingAfter: 10 })}
          ${pXml("USD", { align: "center", bold: true, sizeHalfPt: 18 })}
        </w:tc>
      </w:tr>

      <!-- Main Body Row (Continuous Columns down to Bottom Footer Band) -->
      <w:tr>
        <w:trPr><w:trHeight w:val="5600" w:hRule="atLeast"/><w:cantSplit/></w:trPr>
        <!-- Col 1: NO (Double right border) -->
        <w:tc>
          <w:tcPr>
            <w:tcW w:w="650" w:type="dxa"/>
            <w:tcBorders><w:right w:val="double" w:sz="12" w:space="0" w:color="000000"/></w:tcBorders>
            <w:vAlign w:val="top"/>
          </w:tcPr>
          ${pXml(String(item.no), { align: "center", bold: true, sizeHalfPt: 20 })}
        </w:tc>

        <!-- Col 2: Quantity -->
        <w:tc>
          <w:tcPr><w:tcW w:w="2000" w:type="dxa"/><w:vAlign w:val="top"/></w:tcPr>
          ${pXml(`${item.packagesCount} ${item.packageType}`, { bold: true, sizeHalfPt: 20 })}
          ${pXml(`${item.netWeight} KGS`, { bold: true, sizeHalfPt: 20 })}
        </w:tc>

        <!-- Col 3: Description of Goods & Centered Total Amount Say -->
        <w:tc>
          <w:tcPr><w:tcW w:w="5350" w:type="dxa"/><w:vAlign w:val="top"/></w:tcPr>
          ${pXml(item.description, { bold: true, sizeHalfPt: 21, spacingAfter: 60 })}

          <!-- Center Total Amount Say Block in Column -->
          ${pXml("Total Amount Say: USD:", { align: "center", bold: true, sizeHalfPt: 19, spacingBefore: 1700, spacingAfter: 30 })}
          ${pXml(data.amountInWords.toUpperCase(), { align: "center", bold: true, sizeHalfPt: 21, spacingAfter: 40 })}
          ${pXml(data.originCountry, { align: "center", bold: true, sizeHalfPt: 19, spacingAfter: 600 })}
        </w:tc>

        <!-- Col 4: Unit Price -->
        <w:tc>
          <w:tcPr><w:tcW w:w="1300" w:type="dxa"/><w:vAlign w:val="top"/></w:tcPr>
          ${pXml(item.unitPrice.toFixed(2), { align: "center", bold: true, sizeHalfPt: 20 })}
        </w:tc>

        <!-- Col 5: Item Total Price -->
        <w:tc>
          <w:tcPr><w:tcW w:w="1500" w:type="dxa"/><w:vAlign w:val="top"/></w:tcPr>
          ${pXml(item.totalPrice.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }), { align: "right", bold: true, sizeHalfPt: 20 })}
        </w:tc>
      </w:tr>

      <!-- Bottom Band Row 1: Chamber Fee Block (merged across stamp row) + Edge-to-Edge TOTAL C&F & Final Total Amount -->
      <w:tr>
        <w:trPr><w:cantSplit/></w:trPr>
        <w:tc>
          <w:tcPr>
            <w:tcW w:w="650" w:type="dxa"/>
            <w:vMerge w:val="restart"/>
            <w:tcBorders><w:right w:val="double" w:sz="12" w:space="0" w:color="000000"/></w:tcBorders>
          </w:tcPr>
          ${pXml("", { spacingAfter: 0 })}
        </w:tc>
        <w:tc>
          <w:tcPr><w:tcW w:w="2000" w:type="dxa"/><w:vMerge w:val="restart"/></w:tcPr>
          ${pXml("", { spacingAfter: 0 })}
        </w:tc>
        <w:tc>
          <w:tcPr>
            <w:tcW w:w="5350" w:type="dxa"/>
            <w:vMerge w:val="restart"/>
            <w:vAlign w:val="center"/>
          </w:tcPr>
          <w:p>
            <w:pPr>
              <w:ind w:left="650" w:right="650"/>
              <w:tabs><w:tab w:val="center" w:leader="hyphen" w:pos="2850"/><w:tab w:val="right" w:leader="hyphen" w:pos="4500"/></w:tabs>
              <w:spacing w:before="0" w:after="20" w:line="240" w:lineRule="auto"/>
            </w:pPr>
            <w:r><w:rPr><w:rFonts w:ascii="Cambria" w:hAnsi="Cambria"/><w:color w:val="1D4ED8"/><w:u w:val="single"/><w:sz w:val="16"/><w:szCs w:val="16"/></w:rPr><w:t xml:space="preserve">Reg No :</w:t></w:r>
            <w:r><w:tab/></w:r>
            <w:r><w:rPr><w:rFonts w:ascii="Cambria" w:hAnsi="Cambria"/><w:sz w:val="16"/><w:szCs w:val="16"/></w:rPr><w:t xml:space="preserve"> ${escapeXml(regNo)} </w:t></w:r>
            <w:r><w:tab/></w:r>
            <w:r><w:rPr><w:rFonts w:ascii="Cambria" w:hAnsi="Cambria"/><w:sz w:val="16"/><w:szCs w:val="16"/></w:rPr><w:t>-</w:t></w:r>
          </w:p>
          <w:p>
            <w:pPr>
              <w:ind w:left="650" w:right="650"/>
              <w:tabs><w:tab w:val="center" w:leader="hyphen" w:pos="2850"/><w:tab w:val="right" w:leader="hyphen" w:pos="4500"/></w:tabs>
              <w:spacing w:before="0" w:after="20" w:line="240" w:lineRule="auto"/>
            </w:pPr>
            <w:r><w:rPr><w:rFonts w:ascii="Cambria" w:hAnsi="Cambria"/><w:color w:val="1D4ED8"/><w:u w:val="single"/><w:sz w:val="16"/><w:szCs w:val="16"/></w:rPr><w:t xml:space="preserve">Fee No :</w:t></w:r>
            <w:r><w:tab/></w:r>
            <w:r><w:rPr><w:rFonts w:ascii="Cambria" w:hAnsi="Cambria"/><w:sz w:val="16"/><w:szCs w:val="16"/></w:rPr><w:t xml:space="preserve"> ${escapeXml(feeNo)} </w:t></w:r>
            <w:r><w:tab/></w:r>
            <w:r><w:rPr><w:rFonts w:ascii="Cambria" w:hAnsi="Cambria"/><w:sz w:val="16"/><w:szCs w:val="16"/></w:rPr><w:t>-</w:t></w:r>
          </w:p>
          <w:p>
            <w:pPr>
              <w:ind w:left="650" w:right="650"/>
              <w:tabs><w:tab w:val="right" w:leader="hyphen" w:pos="4500"/></w:tabs>
              <w:spacing w:before="0" w:after="20" w:line="240" w:lineRule="auto"/>
            </w:pPr>
            <w:r><w:rPr><w:rFonts w:ascii="Cambria" w:hAnsi="Cambria"/><w:b/><w:bCs/><w:sz w:val="17"/><w:szCs w:val="17"/></w:rPr><w:t xml:space="preserve">Received the sum of------</w:t></w:r>
            <w:r><w:tab/></w:r>
            <w:r><w:rPr><w:rFonts w:ascii="Cambria" w:hAnsi="Cambria"/><w:b/><w:bCs/><w:sz w:val="17"/><w:szCs w:val="17"/></w:rPr><w:t xml:space="preserve"> ${escapeXml(data.acciChamber.receivedSum || "2,330")}</w:t></w:r>
          </w:p>
          <w:p>
            <w:pPr>
              <w:ind w:left="650" w:right="650"/>
              <w:tabs><w:tab w:val="center" w:leader="hyphen" w:pos="2850"/><w:tab w:val="right" w:leader="hyphen" w:pos="4500"/></w:tabs>
              <w:spacing w:before="0" w:after="20" w:line="240" w:lineRule="auto"/>
            </w:pPr>
            <w:r><w:rPr><w:rFonts w:ascii="Cambria" w:hAnsi="Cambria"/><w:color w:val="1D4ED8"/><w:u w:val="single"/><w:sz w:val="16"/><w:szCs w:val="16"/></w:rPr><w:t xml:space="preserve">Date :</w:t></w:r>
            <w:r><w:tab/></w:r>
            <w:r><w:rPr><w:rFonts w:ascii="Cambria" w:hAnsi="Cambria"/><w:sz w:val="16"/><w:szCs w:val="16"/></w:rPr><w:t xml:space="preserve"> ${escapeXml(shamsiDate)} </w:t></w:r>
            <w:r><w:tab/></w:r>
            <w:r><w:rPr><w:rFonts w:ascii="Cambria" w:hAnsi="Cambria"/><w:sz w:val="16"/><w:szCs w:val="16"/></w:rPr><w:t>-</w:t></w:r>
          </w:p>
          <w:p>
            <w:pPr>
              <w:ind w:left="650" w:right="650"/>
              <w:tabs><w:tab w:val="right" w:leader="hyphen" w:pos="4500"/></w:tabs>
              <w:spacing w:before="0" w:after="40" w:line="240" w:lineRule="auto"/>
            </w:pPr>
            <w:r><w:rPr><w:rFonts w:ascii="Cambria" w:hAnsi="Cambria"/><w:color w:val="1D4ED8"/><w:u w:val="single"/><w:sz w:val="16"/><w:szCs w:val="16"/></w:rPr><w:t xml:space="preserve">Signature : </w:t></w:r>
            <w:r><w:tab/></w:r>
            <w:r><w:rPr><w:rFonts w:ascii="Cambria" w:hAnsi="Cambria"/><w:sz w:val="16"/><w:szCs w:val="16"/></w:rPr><w:t>-</w:t></w:r>
          </w:p>
        </w:tc>
        <!-- Col 4: TOTAL C&F with continuous top & bottom border -->
        <w:tc>
          <w:tcPr>
            <w:tcW w:w="1300" w:type="dxa"/>
            <w:tcBorders>
              <w:top w:val="single" w:sz="6" w:space="0" w:color="000000"/>
              <w:bottom w:val="single" w:sz="6" w:space="0" w:color="000000"/>
            </w:tcBorders>
            <w:vAlign w:val="center"/>
          </w:tcPr>
          ${pXml("TOTAL", { align: "center", bold: true, sizeHalfPt: 18, spacingAfter: 10 })}
          ${pXml(data.incoterm || "C&F", { align: "center", bold: true, sizeHalfPt: 18, spacingAfter: 0 })}
        </w:tc>
        <!-- Col 5: Final Total Amount with continuous top & bottom border -->
        <w:tc>
          <w:tcPr>
            <w:tcW w:w="1500" w:type="dxa"/>
            <w:tcBorders>
              <w:top w:val="single" w:sz="6" w:space="0" w:color="000000"/>
              <w:bottom w:val="single" w:sz="6" w:space="0" w:color="000000"/>
            </w:tcBorders>
            <w:vAlign w:val="center"/>
          </w:tcPr>
          ${pXml(data.totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }), { align: "right", bold: true, sizeHalfPt: 20, spacingAfter: 0 })}
        </w:tc>
      </w:tr>

      <!-- Bottom Band Row 2: SKY ARIANA LTD Signature Stamp -->
      <w:tr>
        <w:trPr><w:cantSplit/></w:trPr>
        <w:tc>
          <w:tcPr>
            <w:tcW w:w="650" w:type="dxa"/>
            <w:vMerge/>
            <w:tcBorders><w:right w:val="double" w:sz="12" w:space="0" w:color="000000"/></w:tcBorders>
          </w:tcPr>
          ${pXml("", { spacingAfter: 0 })}
        </w:tc>
        <w:tc>
          <w:tcPr><w:tcW w:w="2000" w:type="dxa"/><w:vMerge/></w:tcPr>
          ${pXml("", { spacingAfter: 0 })}
        </w:tc>
        <w:tc>
          <w:tcPr><w:tcW w:w="5350" w:type="dxa"/><w:vMerge/></w:tcPr>
          ${pXml("", { spacingAfter: 0 })}
        </w:tc>
        <w:tc>
          <w:tcPr><w:tcW w:w="1300" w:type="dxa"/></w:tcPr>
          ${pXml("", { spacingAfter: 0 })}
        </w:tc>
        <w:tc>
          <w:tcPr><w:tcW w:w="1500" w:type="dxa"/><w:vAlign w:val="center"/></w:tcPr>
          ${pXml("SKY", { align: "center", bold: true, sizeHalfPt: 22, spacingBefore: 80, spacingAfter: 10 })}
          ${pXml("ARIANA LTD", { align: "center", bold: true, sizeHalfPt: 22, spacingAfter: 20 })}
          ${pXml("------------------------", { align: "center", sizeHalfPt: 16, spacingAfter: 80 })}
        </w:tc>
      </w:tr>
    </w:tbl>

    <w:sectPr>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="720" w:right="720" w:bottom="720" w:left="720"/>
    </w:sectPr>
  </w:body>
</w:document>`

  const files: Record<string, Uint8Array> = {
    "[Content_Types].xml": fflate.strToU8(CONTENT_TYPES_XML),
    "_rels/.rels": fflate.strToU8(RELS_XML),
    "word/styles.xml": fflate.strToU8(STYLES_XML),
    "word/document.xml": fflate.strToU8(applyCambriaFont(docXml)),
  }

  return fflate.zipSync(files)
}

export function generateAcciPackingListDocx(data: AcciPackingListData): Uint8Array {
  const item = data.items[0] || {
    no: 1,
    packagesCount: 0,
    packageType: "BAGS",
    netWeight: 0,
    grossWeight: 0,
    description: "",
    origin: "(Origin Afghanistan)",
  }

  const consigneeExtraLines = [
    data.consignee.gstin ? `GSTIN: ${data.consignee.gstin}` : "",
    data.consignee.pan ? `PAN: ${data.consignee.pan}` : "",
    data.consignee.iec ? `IEC: ${data.consignee.iec}` : "",
    data.consignee.phone ? `Mobile No: ${data.consignee.phone}` : "",
    data.consignee.email ? `Email: ${data.consignee.email}` : "",
  ]
    .filter(Boolean)
    .join("   ")

  const notifyLines = data.notifyParty
    ? `
    ${pXml("NOTIFY PARTY:", { bold: true, sizeHalfPt: 17, spacingBefore: 40, spacingAfter: 10 })}
    ${pXml(data.notifyParty.name, { bold: true, sizeHalfPt: 17, spacingAfter: 10 })}
    ${pXml(data.notifyParty.address + (data.notifyParty.trn ? ` TRN: ${data.notifyParty.trn}` : ""), { sizeHalfPt: 16, spacingAfter: 20 })}
  `
    : ""

  const docXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <!-- Document Title: PACKING LIST with Underline (NO Asterisks) -->
    ${pXml("PACKING LIST", { align: "center", bold: true, underline: true, sizeHalfPt: 34, spacingAfter: 100 })}

    <!-- Top Section: Side-by-Side 2 Columns (5300 dxa and 5300 dxa) -->
    <w:tbl>
      <w:tblPr>
        <w:tblW w:w="10800" w:type="dxa"/>
        <w:tblBorders>
          <w:top w:val="none"/>
          <w:left w:val="none"/>
          <w:bottom w:val="none"/>
          <w:right w:val="none"/>
          <w:insideH w:val="none"/>
          <w:insideV w:val="none"/>
        </w:tblBorders>
        <w:tblCellMar>
          <w:top w:w="0" w:type="dxa"/>
          <w:left w:w="0" w:type="dxa"/>
          <w:bottom w:w="0" w:type="dxa"/>
          <w:right w:w="100" w:type="dxa"/>
        </w:tblCellMar>
      </w:tblPr>
      <w:tr>
        <!-- Left Column: Outer Bordered Party Box -->
        <w:tc>
          <w:tcPr>
            <w:tcW w:w="5300" w:type="dxa"/>
            <w:tcBorders>
              <w:top w:val="single" w:sz="8" w:space="0" w:color="000000"/>
              <w:left w:val="single" w:sz="8" w:space="0" w:color="000000"/>
              <w:bottom w:val="single" w:sz="8" w:space="0" w:color="000000"/>
              <w:right w:val="single" w:sz="8" w:space="0" w:color="000000"/>
            </w:tcBorders>
            <w:tcMar>
              <w:top w:w="80" w:type="dxa"/>
              <w:left w:w="120" w:type="dxa"/>
              <w:bottom w:w="80" w:type="dxa"/>
              <w:right w:w="120" w:type="dxa"/>
            </w:tcMar>
            <w:vAlign w:val="top"/>
          </w:tcPr>
          ${pXml(`FROM: ${data.exporter.name}`, { bold: true, sizeHalfPt: 19, spacingAfter: 15 })}
          ${
            (() => {
              const tl = data.exporter.tlNo ? `T.L NO: ${data.exporter.tlNo}  ` : ""
              const add = data.exporter.address ? `ADD: ${data.exporter.address}` : ""
              const full = `${tl}${add}`.trim()
              return full ? pXml(full, { sizeHalfPt: 16, spacingAfter: 15 }) : ""
            })()
          }
          ${
            (() => {
              const tel = data.exporter.phone ? `TEL: ${data.exporter.phone}` : ""
              const em = data.exporter.email ? `EMAIL: ${data.exporter.email}` : ""
              const contact = [tel, em].filter(Boolean).join("  ")
              return contact ? pXml(contact, { sizeHalfPt: 16, spacingAfter: 30 }) : ""
            })()
          }
          ${pXml("--------------------------------------------------------------------------------", { sizeHalfPt: 12, spacingAfter: 20 })}
          ${pXml(`TO: ${data.consignee.name}`, { bold: true, sizeHalfPt: 19, spacingAfter: 15 })}
          ${pXml(data.consignee.address, { sizeHalfPt: 16, spacingAfter: 15 })}
          ${consigneeExtraLines ? pXml(consigneeExtraLines, { sizeHalfPt: 15, spacingAfter: 20 }) : ""}
          ${notifyLines}
        </w:tc>

        <!-- Spacer Column -->
        <w:tc>
          <w:tcPr><w:tcW w:w="200" w:type="dxa"/></w:tcPr>
          ${pXml("")}
        </w:tc>

        <!-- Right Column: No/Date and Afghan Transit Table -->
        <w:tc>
          <w:tcPr>
            <w:tcW w:w="5300" w:type="dxa"/>
            <w:vAlign w:val="top"/>
          </w:tcPr>
          ${pXml(`No: ${data.packingListNumber}`, { bold: true, sizeHalfPt: 22, spacingAfter: 20 })}
          ${pXml(`Date: ${data.date}`, { bold: true, sizeHalfPt: 19, spacingAfter: 40 })}

          <!-- Afghan Transit Form Table -->
          <w:tbl>
            <w:tblPr>
              <w:tblW w:w="5300" w:type="dxa"/>
              <w:tblBorders>
                <w:top w:val="single" w:sz="8" w:space="0" w:color="000000"/>
                <w:left w:val="single" w:sz="8" w:space="0" w:color="000000"/>
                <w:bottom w:val="single" w:sz="8" w:space="0" w:color="000000"/>
                <w:right w:val="single" w:sz="8" w:space="0" w:color="000000"/>
                <w:insideH w:val="single" w:sz="6" w:space="0" w:color="000000"/>
                <w:insideV w:val="none"/>
              </w:tblBorders>
              <w:tblCellMar>
                <w:top w:w="60" w:type="dxa"/>
                <w:left w:w="100" w:type="dxa"/>
                <w:bottom w:w="60" w:type="dxa"/>
                <w:right w:w="100" w:type="dxa"/>
              </w:tblCellMar>
            </w:tblPr>
            <w:tr>
              <w:tc>
                <w:tcPr><w:tcW w:w="5300" w:type="dxa"/></w:tcPr>
                ${pXml(data.transit.docTitle || "Afghan Transit form Airway Bill.", { align: "center", bold: true, sizeHalfPt: 18, spacingAfter: 20 })}
              </w:tc>
            </w:tr>
            <w:tr>
              <w:tc>
                <w:tcPr><w:tcW w:w="5300" w:type="dxa"/></w:tcPr>
                <w:p>
                  <w:pPr>
                    <w:tabs><w:tab w:val="right" w:pos="5100"/></w:tabs>
                    <w:spacing w:before="0" w:after="20" w:line="240" w:lineRule="auto"/>
                  </w:pPr>
                  <w:r>
                    <w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:b/><w:bCs/><w:sz w:val="17"/><w:szCs w:val="17"/></w:rPr>
                    <w:t xml:space="preserve">NO: ${escapeXml(data.transit.bolNumber || "")}</w:t>
                  </w:r>
                  <w:r><w:tab/></w:r>
                  <w:r>
                    <w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:b/><w:bCs/><w:sz w:val="17"/><w:szCs w:val="17"/></w:rPr>
                    <w:t xml:space="preserve">Date: ${escapeXml(data.transit.bolDate || "")}</w:t>
                  </w:r>
                </w:p>
              </w:tc>
            </w:tr>
            <w:tr>
              <w:tc>
                <w:tcPr><w:tcW w:w="5300" w:type="dxa"/></w:tcPr>
                ${pXml(`Terms of Payment: ${data.transit.termsOfPayment || ""}`, { bold: true, sizeHalfPt: 17, align: "center", spacingAfter: 20 })}
              </w:tc>
            </w:tr>
            <w:tr>
              <w:tc>
                <w:tcPr><w:tcW w:w="5300" w:type="dxa"/></w:tcPr>
                <w:p>
                  <w:pPr>
                    <w:tabs><w:tab w:val="right" w:pos="5100"/></w:tabs>
                    <w:spacing w:before="0" w:after="10" w:line="240" w:lineRule="auto"/>
                  </w:pPr>
                  <w:r>
                    <w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="16"/><w:szCs w:val="16"/></w:rPr>
                    <w:t xml:space="preserve">Letter of Credit</w:t>
                  </w:r>
                  <w:r><w:tab/></w:r>
                  <w:r>
                    <w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="16"/><w:szCs w:val="16"/></w:rPr>
                    <w:t xml:space="preserve">Collection Basis</w:t>
                  </w:r>
                </w:p>
                ${pXml("No:", { sizeHalfPt: 16, spacingAfter: 15 })}
              </w:tc>
            </w:tr>
            <w:tr>
              <w:tc>
                <w:tcPr><w:tcW w:w="5300" w:type="dxa"/></w:tcPr>
                ${pXml("Through:", { bold: true, sizeHalfPt: 17, spacingAfter: 10 })}
                ${pXml(`Via: ${data.transit.via}`, { bold: true, sizeHalfPt: 16, spacingAfter: 20 })}
              </w:tc>
            </w:tr>
          </w:tbl>
        </w:tc>
      </w:tr>
    </w:tbl>

    <!-- Main Goods Table (No | Description of Goods | Quantity) with double line under header & double line right of No -->
    ${pXml("", { spacingAfter: 80 })}
    <w:tbl>
      <w:tblPr>
        <w:tblW w:w="10800" w:type="dxa"/>
        <w:tblBorders>
          <w:top w:val="single" w:sz="8" w:space="0" w:color="000000"/>
          <w:left w:val="single" w:sz="8" w:space="0" w:color="000000"/>
          <w:bottom w:val="single" w:sz="8" w:space="0" w:color="000000"/>
          <w:right w:val="single" w:sz="8" w:space="0" w:color="000000"/>
          <w:insideH w:val="none"/>
          <w:insideV w:val="single" w:sz="6" w:space="0" w:color="000000"/>
        </w:tblBorders>
        <w:tblCellMar>
          <w:top w:w="80" w:type="dxa"/>
          <w:left w:w="100" w:type="dxa"/>
          <w:bottom w:w="80" w:type="dxa"/>
          <w:right w:w="100" w:type="dxa"/>
        </w:tblCellMar>
      </w:tblPr>

      <!-- Table Header Row with Double Bottom Border and Double Right Border on No -->
      <w:tr>
        <w:tc>
          <w:tcPr>
            <w:tcW w:w="1000" w:type="dxa"/>
            <w:tcBorders>
              <w:bottom w:val="double" w:sz="12" w:space="0" w:color="000000"/>
              <w:right w:val="double" w:sz="12" w:space="0" w:color="000000"/>
            </w:tcBorders>
          </w:tcPr>
          ${pXml("No", { align: "center", bold: true, sizeHalfPt: 19 })}
        </w:tc>
        <w:tc>
          <w:tcPr>
            <w:tcW w:w="6000" w:type="dxa"/>
            <w:tcBorders><w:bottom w:val="double" w:sz="12" w:space="0" w:color="000000"/></w:tcBorders>
          </w:tcPr>
          ${pXml("Description of Goods", { align: "center", bold: true, sizeHalfPt: 19 })}
        </w:tc>
        <w:tc>
          <w:tcPr>
            <w:tcW w:w="3800" w:type="dxa"/>
            <w:tcBorders><w:bottom w:val="double" w:sz="12" w:space="0" w:color="000000"/></w:tcBorders>
          </w:tcPr>
          ${pXml("Quantity", { align: "center", bold: true, sizeHalfPt: 19 })}
        </w:tc>
      </w:tr>

      <!-- Main Body Row (Continuous Columns) -->
      <w:tr>
        <w:trPr><w:cantSplit/></w:trPr>
        <!-- Col 1: No (Double right border) -->
        <w:tc>
          <w:tcPr>
            <w:tcW w:w="1000" w:type="dxa"/>
            <w:tcBorders><w:right w:val="double" w:sz="12" w:space="0" w:color="000000"/></w:tcBorders>
            <w:vAlign w:val="top"/>
          </w:tcPr>
          ${pXml(`${item.no}.`, { align: "center", bold: true, sizeHalfPt: 20 })}
        </w:tc>

        <!-- Col 2: Description of Goods & Origin (Centered vertically and horizontally) -->
        <w:tc>
          <w:tcPr><w:tcW w:w="6000" w:type="dxa"/><w:vAlign w:val="top"/></w:tcPr>
          ${pXml(item.description.toUpperCase(), { align: "center", bold: true, sizeHalfPt: 21, spacingAfter: 40 })}

          <!-- Origin Afghanistan centered vertically & horizontally -->
          ${pXml(item.origin || "(Origin Afghanistan)", { align: "center", bold: false, sizeHalfPt: 28, spacingBefore: 2400, spacingAfter: 2400 })}
        </w:tc>

        <!-- Col 3: Quantity & Stamp (Centered vertically and horizontally) -->
        <w:tc>
          <w:tcPr><w:tcW w:w="3800" w:type="dxa"/><w:vAlign w:val="top"/></w:tcPr>
          ${pXml(`${item.packagesCount} ${item.packageType}`, { align: "center", bold: true, sizeHalfPt: 20 })}
          ${pXml(`NW: ${item.netWeight} KGS`, { align: "center", bold: true, sizeHalfPt: 20 })}
          ${pXml(`GW: ${item.grossWeight} KGS`, { align: "center", bold: true, sizeHalfPt: 20 })}

          <!-- Stamp centered vertically & horizontally across from Origin -->
          ${pXml("SKY", { align: "center", bold: true, sizeHalfPt: 23, spacingBefore: 1900, spacingAfter: 10 })}
          ${pXml("ARIANA LTD", { align: "center", bold: true, sizeHalfPt: 23, spacingAfter: 20 })}
          ${pXml("------------------------------", { align: "center", sizeHalfPt: 16, spacingAfter: 2400 })}
        </w:tc>
      </w:tr>
    </w:tbl>

    <w:sectPr>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="720" w:right="720" w:bottom="720" w:left="720"/>
    </w:sectPr>
  </w:body>
</w:document>`

  const files: Record<string, Uint8Array> = {
    "[Content_Types].xml": fflate.strToU8(CONTENT_TYPES_XML),
    "_rels/.rels": fflate.strToU8(RELS_XML),
    "word/styles.xml": fflate.strToU8(STYLES_XML),
    "word/document.xml": fflate.strToU8(applyCambriaFont(docXml)),
  }

  return fflate.zipSync(files)
}

export function downloadAcciInvoiceDocx(data: AcciInvoiceData, filename?: string): void {
  const bytes = generateAcciInvoiceDocx(data)
  const blob = new Blob([bytes], {
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename || `ACCI-INVOICE-${data.invoiceNumber || "001"}.docx`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function downloadAcciPackingListDocx(data: AcciPackingListData, filename?: string): void {
  const bytes = generateAcciPackingListDocx(data)
  const blob = new Blob([bytes], {
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename || `PACKING-LIST-${data.invoiceNumber || "001"}.docx`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
