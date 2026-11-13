export type AcciTemplateStyle = "kandahar" | "kabul"

export interface AcciInvoiceItem {
  no: number
  packagesCount: string | number
  packageType: string
  netWeight: string | number
  grossWeight?: string | number
  description: string
  unitPrice: number
  totalPrice: number
}

export interface AcciTransitInfo {
  docTitle: string
  bolNumber: string
  bolDate: string
  termsOfPayment: string
  letterOfCredit: string
  collectionBasisNo: string
  through: string
  via: string
}

export interface AcciPartyInfo {
  name: string
  tlNo?: string
  address: string
  phone?: string
  email?: string
  gstin?: string
  pan?: string
  iec?: string
  trn?: string
}

export interface AcciChamberFeeInfo {
  regNo: string
  feeNo: string
  receivedSum: string
  shamsiDate: string
  signature: string
}

export interface AcciInvoiceData {
  invoiceNumber: string
  invoiceDate: string
  templateStyle: AcciTemplateStyle
  exporter: AcciPartyInfo
  consignee: AcciPartyInfo
  notifyParty?: AcciPartyInfo
  transit: AcciTransitInfo
  items: AcciInvoiceItem[]
  totalPackages: string | number
  totalNetWeight: string | number
  totalGrossWeight?: string | number
  totalAmount: number
  currency: string
  amountInWords: string
  originCountry: string
  acciChamber: AcciChamberFeeInfo
  incoterm: string
  signedBy: string
}

export interface AcciPackingListItem {
  no: number
  description: string
  origin: string
  packagesCount: string | number
  packageType: string
  netWeight: string | number
  grossWeight: string | number
}

export interface AcciVehicleInfo {
  truckNumber?: string
  driverName?: string
  driverFatherName?: string
  driverContact?: string
  containerNumber?: string
  sealNumber?: string
}

export interface AcciPackingListData {
  packingListNumber: string
  date: string
  invoiceNumber: string
  templateStyle: AcciTemplateStyle
  exporter: AcciPartyInfo
  consignee: AcciPartyInfo
  notifyParty?: AcciPartyInfo
  transit: AcciTransitInfo
  items: AcciPackingListItem[]
  totalPackages: string | number
  totalNetWeight: string | number
  totalGrossWeight: string | number
  vehicleInfo?: AcciVehicleInfo
  originCountry: string
  signedBy: string
}
