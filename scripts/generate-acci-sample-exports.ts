/**
 * Sky Ariana BOL - ACCI Sample Exports Generator
 * Generates sample Word (.docx) and Vector PDF (.pdf) for Commercial Invoice & Packing List
 * to verify centered layout and chamber fee border box.
 */

import fs from 'node:fs'
import path from 'node:path'
import {
  generateAcciInvoiceFromBol,
  generateAcciPackingListFromBol,
} from '../lib/utils/acci-document-generator'
import {
  generateAcciInvoiceDocx,
  generateAcciPackingListDocx,
} from '../lib/utils/acci-word-generator'
import {
  generateAcciInvoicePdf,
  generateAcciPackingListPdf,
} from '../lib/utils/acci-pdf-generator'
import type { BillOfLadingFormData } from '../lib/types/bill-of-lading'

async function run() {
  const outputDir = path.resolve('scratch/acci-exports')
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  // Load sample BOL or construct authentic Afghanistan ACCI BOL dataset
  const bolsRaw = JSON.parse(fs.readFileSync('.local-bols.json', 'utf8'))
  const bolsList: BillOfLadingFormData[] = Array.isArray(bolsRaw) ? bolsRaw : bolsRaw.bols || Object.values(bolsRaw)
  const baseBol: BillOfLadingFormData = bolsList[0] || {}

  // Match the authentic sample from media_1794483254914.png & media_1794470456789.png
  const sampleBol: BillOfLadingFormData = {
    ...baseBol,
    bol_number: '006',
    issue_date: '2026-10-20',
    shipper_name: 'SKY ARIANA LTD',
    shipper_address: 'OFF NO.16 1ST FLR BLOCK 6 ETEMAD RAHIMI MARKET KANDAHAR AFGHANISTAN.',
    shipper_contact: '+93700939365',
    shipper_email: 'INFO@SKYARIANA.COM',
    shipper_licence: '2401-2198',
    consignee_name: 'RCA EXIM PRIVATE LIMITED',
    consignee_address: '1112 2ND AND 3RD FLOOR GANDHI GALI, FATEHPURI DELHI 110006, INDIA.',
    notify_party: 'YAAQOUB HAMDAN FOODSTUFF TRADING CO.LLC',
    notify_party_address: 'SHOP NO: 28 AL HAWAI BUILDING AL RAS, STREET, DEIRA DUBAI UAE TRN NO: 100340961000003',
    port_of_loading: 'KANDAHAR (AFGHANISTAN)',
    port_of_discharge: 'MUNDRA PORT SEA PORT OF MUMBAI (INDIA)',
    place_of_delivery: 'MUNDRA PORT SEA PORT OF MUMBAI (INDIA)',
    cargo_description: 'BLACK RAISINS\n(Origin Afghanistan)',
    number_of_packages: '2320 CTNS',
    gross_weight: '23200 KGS',
    net_weight: '23200 KGS',
  }

  console.log('Generating ACCI Invoice & Packing List Data...')
  const invoiceData = generateAcciInvoiceFromBol(sampleBol, {
    invoiceNumberOverride: '006',
    invoiceDateOverride: '20/10/2026',
  })

  // Ensure items and amounts match authentic sample
  invoiceData.items = [
    {
      no: 1,
      packagesCount: '2320',
      packageType: 'CTNS',
      netWeight: '23200',
      description: 'BLACK RAISINS',
      unitPrice: 2.45,
      totalPrice: 56840.0,
    },
  ]
  invoiceData.totalAmount = 56840.0
  invoiceData.amountInWords = 'FIFTY-SIX THOUSAND EIGHT HUNDRED FORTY ONLY.'
  invoiceData.acciChamber = {
    regNo: '------------------0000--------------------',
    feeNo: '------------------0000--------------------',
    receivedSum: '0000',
    shamsiDate: '-----------------28/07/1405-----------------',
    signature: 'AFGHANISTAN CHAMBER OF COMMERCE & INVESTMENT',
  }

  const packingListData = generateAcciPackingListFromBol(sampleBol, {
    packingListNumberOverride: '1/006',
    packingListDateOverride: '20/10/2026',
  })
  packingListData.items = [
    {
      no: 1,
      packagesCount: '2320',
      packageType: 'CTNS',
      netWeight: '23200',
      grossWeight: '23200',
      description: 'BLACK RAISINS',
      origin: 'AFGHANISTAN',
    },
  ]

  // 1. Generate Invoice DOCX
  console.log('1. Exporting Commercial Invoice (.docx)...')
  const invDocxBytes = generateAcciInvoiceDocx(invoiceData)
  const invDocxPath = path.join(outputDir, 'Sample-Commercial-Invoice-006.docx')
  fs.writeFileSync(invDocxPath, Buffer.from(invDocxBytes))
  console.log(`   -> Created: ${invDocxPath} (${invDocxBytes.length} bytes)`)

  // 2. Generate Packing List DOCX
  console.log('2. Exporting Packing List (.docx)...')
  const plDocxBytes = generateAcciPackingListDocx(packingListData)
  const plDocxPath = path.join(outputDir, 'Sample-Packing-List-1-006.docx')
  fs.writeFileSync(plDocxPath, Buffer.from(plDocxBytes))
  console.log(`   -> Created: ${plDocxPath} (${plDocxBytes.length} bytes)`)

  // 3. Generate Invoice PDF
  console.log('3. Exporting Commercial Invoice Vector PDF (.pdf)...')
  const invPdf = generateAcciInvoicePdf(invoiceData)
  const invPdfPath = path.join(outputDir, 'Sample-Commercial-Invoice-006.pdf')
  const invPdfBuffer = Buffer.from(invPdf.output('arraybuffer'))
  fs.writeFileSync(invPdfPath, invPdfBuffer)
  console.log(`   -> Created: ${invPdfPath} (${invPdfBuffer.length} bytes)`)

  // 4. Generate Packing List PDF
  console.log('4. Exporting Packing List Vector PDF (.pdf)...')
  const plPdf = generateAcciPackingListPdf(packingListData)
  const plPdfPath = path.join(outputDir, 'Sample-Packing-List-1-006.pdf')
  const plPdfBuffer = Buffer.from(plPdf.output('arraybuffer'))
  fs.writeFileSync(plPdfPath, plPdfBuffer)
  console.log(`   -> Created: ${plPdfPath} (${plPdfBuffer.length} bytes)`)

  console.log('\n✅ All 4 authentic ACCI sample exports successfully generated in scratch/acci-exports/!')
}

run().catch((err) => {
  console.error('Error generating exports:', err)
  process.exit(1)
})
