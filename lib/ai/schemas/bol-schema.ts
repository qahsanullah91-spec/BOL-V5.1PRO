/**
 * Strict JSON Schemas for Gemini Structured Output
 * Sky Ariana Multi-Modal BOL & Accounting Verification
 *
 * Adheres to Gemini API Structured Output standards (OpenAPI 3.0 / JSON Schema subset)
 */

export const BOL_EXTRACTION_JSON_SCHEMA = {
  type: 'object',
  properties: {
    bol_number: {
      type: 'string',
      description: 'Authoritative Bill of Lading reference number (e.g. NSA-583, SKY-0012)',
    },
    issue_date: {
      type: 'string',
      description: 'Date of issuance in YYYY-MM-DD format',
    },
    shipper_name: {
      type: 'string',
      description: 'Name of the exporter or shipping party',
    },
    shipper_address: {
      type: 'string',
      description: 'Physical address or dispatch location of shipper',
    },
    shipper_contact: {
      type: 'string',
      description: 'Phone or contact information for shipper',
    },
    consignee_name: {
      type: 'string',
      description: 'Consignee or recipient company / person name',
    },
    consignee_address: {
      type: 'string',
      description: 'Delivery destination or warehouse address of consignee',
    },
    consignee_contact: {
      type: 'string',
      description: 'Phone or contact information for consignee',
    },
    notify_party: {
      type: 'string',
      description: 'Notify party company name or clearing agent',
    },
    notify_party_address: {
      type: 'string',
      description: 'Address of notify party',
    },
    truck_number: {
      type: 'string',
      description: 'Vehicle license plate or transit truck number (e.g. HRT-81745, KBL-3421)',
    },
    driver_name: {
      type: 'string',
      description: 'Full name of transit driver',
    },
    driver_father_name: {
      type: 'string',
      description: 'Father name of transit driver for border manifest',
    },
    driver_contact: {
      type: 'string',
      description: 'Mobile phone or WhatsApp number of transit driver',
    },
    driver_rent: {
      type: 'string',
      description: 'Driver freight rent including currency (e.g. 46,000 AFN - کرایه واپسی)',
    },
    container_type: {
      type: 'string',
      description: 'Container specification (e.g. 20ft Standard, 40ft High Cube, Reefer)',
    },
    container_size: {
      type: 'string',
      description: 'Container size (e.g. 20ft, 40ft)',
    },
    container_numbers: {
      type: 'string',
      description: 'Standard 4-letter + 7-digit container code (e.g. MSCU1234567, TGHU8901234)',
    },
    seal_numbers: {
      type: 'string',
      description: 'Customs or carrier seal numbers',
    },
    cargo_description: {
      type: 'string',
      description: 'Detailed description of commodities, cartons, packages, and marks',
    },
    number_of_packages: {
      type: 'string',
      description: 'Total package or carton count (e.g. 1427 Cartons)',
    },
    net_weight: {
      type: 'string',
      description: 'Net weight with unit (e.g. 22,832 KGS)',
    },
    gross_weight: {
      type: 'string',
      description: 'Gross weight with unit (e.g. 25,543 KGS)',
    },
    kgs_per_carton: {
      type: 'string',
      description: 'Unit weight per carton (e.g. 16.00 KGS)',
    },
    gross_weight_per_carton: {
      type: 'string',
      description: 'Gross weight per carton (e.g. 17.90 KGS)',
    },
    measurement: {
      type: 'string',
      description: 'Volume measurement in CBM (e.g. 58.4 CBM)',
    },
    rate_per_kgs: {
      type: 'string',
      description: 'Unit freight rate per kg (e.g. $0.18 / KG)',
    },
    goods_value: {
      type: 'string',
      description: 'Commercial invoice goods valuation (USD)',
    },
    freight_amount: {
      type: 'string',
      description: 'Agreed freight cost / logistics revenue',
    },
    freight_currency: {
      type: 'string',
      description: 'Freight currency: USD or AFN',
    },
    port_of_loading: {
      type: 'string',
      description: 'Initial port or origin hub of cargo loading',
    },
    port_of_discharge: {
      type: 'string',
      description: 'Sea discharge port or destination customs port',
    },
    place_of_delivery: {
      type: 'string',
      description: 'Final inland destination or ICD',
    },
    transit_border_station: {
      type: 'string',
      description: 'Afghan border crossing point: Islam Qala, Torghundi, Hairatan, Spin Boldak, Zaranj/Milak',
    },
    cargo_route_note: {
      type: 'string',
      description: 'Special multi-modal transshipment note (Persian / English transit routing)',
    },
    routes: {
      type: 'array',
      description: 'Chronological routing legs from origin to destination',
      items: {
        type: 'object',
        properties: {
          location: { type: 'string', description: 'City / Port name in English' },
          locationPersian: { type: 'string', description: 'City / Port name in Persian / Pashto' },
          stopOrder: { type: 'number', description: '1-indexed sequence order' },
          transportMode: { type: 'string', description: 'truck, vessel, airplane, or train' },
          stopLabel: { type: 'string', description: 'Origin, Stop 1, Stop 2, Destination' },
        },
        required: ['location', 'stopOrder', 'transportMode'],
      },
    },
  },
  required: ['consignee_name', 'cargo_description'],
}

export const LEDGER_EXTRACTION_JSON_SCHEMA = {
  type: 'object',
  properties: {
    account_name: {
      type: 'string',
      description: 'Client, supplier, or carrier account name',
    },
    transaction_date: {
      type: 'string',
      description: 'Transaction date in YYYY-MM-DD format',
    },
    transaction_type: {
      type: 'string',
      description: 'Type of transaction: invoice, charge, payment, opening_balance, adjustment, transfer, debit_note, credit_note, expense, refund',
    },
    description: {
      type: 'string',
      description: 'Detailed description of service, shipment leg, or payment voucher',
    },
    reference_number: {
      type: 'string',
      description: 'Voucher, check, or bank transfer reference number',
    },
    bol_number: {
      type: 'string',
      description: 'Associated Bill of Lading reference if linked to freight',
    },
    debit: {
      type: 'number',
      description: 'Debit amount (receivable / customer charge / expense)',
    },
    credit: {
      type: 'number',
      description: 'Credit amount (payment received / supplier liability / income)',
    },
    currency: {
      type: 'string',
      description: 'Currency of transaction: USD or AFN',
    },
    payment_method: {
      type: 'string',
      description: 'Payment channel: Cash, Bank, Exchange, Transfer, Other',
    },
    remarks: {
      type: 'string',
      description: 'Additional accounting notes or Hawala exchange broker details',
    },
  },
  required: ['account_name', 'transaction_date', 'transaction_type', 'currency'],
}

export const VERIFICATION_AUDIT_JSON_SCHEMA = {
  type: 'object',
  properties: {
    status: {
      type: 'string',
      description: 'Overall verification verdict: PASS, FLAGGED, or CRITICAL',
    },
    ledgerAudit: {
      type: 'object',
      properties: {
        identitySatisfied: {
          type: 'boolean',
          description: 'True if Net Balance strictly equals Total Debit minus Total Credit',
        },
        totalDebit: { type: 'number', description: 'Sum of all debit entries' },
        totalCredit: { type: 'number', description: 'Sum of all credit entries' },
        netBalance: { type: 'number', description: 'Calculated Net Balance' },
        discrepancy: { type: 'number', description: 'Absolute discrepancy difference if any' },
        chronologicalOrderValid: {
          type: 'boolean',
          description: 'True if transactions are in ascending chronological order by date',
        },
        currencyConsistent: {
          type: 'boolean',
          description: 'True if USD and AFN are properly segregated without blended totals',
        },
        anomalies: {
          type: 'array',
          items: { type: 'string' },
          description: 'Detailed list of accounting discrepancies or arithmetic anomalies',
        },
      },
      required: ['identitySatisfied', 'totalDebit', 'totalCredit', 'netBalance', 'chronologicalOrderValid'],
    },
    borderRoutingAudit: {
      type: 'object',
      properties: {
        origin: { type: 'string', description: 'Origin dispatch hub' },
        borderStation: { type: 'string', description: 'Identified border crossing' },
        transitPort: { type: 'string', description: 'Intermediate sea / transshipment port' },
        destination: { type: 'string', description: 'Final destination city or port' },
        recognizedBorder: {
          type: 'boolean',
          description: 'True if border station is recognized (Islam Qala, Torghundi, Hairatan, Spin Boldak, Zaranj)',
        },
        routeContinuityValid: {
          type: 'boolean',
          description: 'True if multimodal sequence (Road -> Border -> Ocean) is logically sound',
        },
        transitIssues: {
          type: 'array',
          items: { type: 'string' },
          description: 'Border routing warnings or missing transit metadata',
        },
      },
      required: ['recognizedBorder', 'routeContinuityValid'],
    },
    sanctionsAudit: {
      type: 'object',
      properties: {
        passed: {
          type: 'boolean',
          description: 'True if no sanctioned entities, embargoed destinations, or restricted goods found',
        },
        riskLevel: {
          type: 'string',
          description: 'CLEAN, LOW, MEDIUM, HIGH, or SANCTIONED',
        },
        flaggedKeywords: {
          type: 'array',
          items: { type: 'string' },
          description: 'Any keywords triggering export control or sanction alerts',
        },
        flaggedEntities: {
          type: 'array',
          items: { type: 'string' },
          description: 'Any flagged companies, vessels, or individuals',
        },
        advisory: {
          type: 'string',
          description: 'Compliance guidance and regulatory notes',
        },
      },
      required: ['passed', 'riskLevel'],
    },
    executiveSummary: {
      type: 'string',
      description: 'Concise executive summary of verification findings across logistics and finance',
    },
    actionableRecommendations: {
      type: 'array',
      items: { type: 'string' },
      description: 'Clear next steps for operators to resolve discrepancies or compliance gaps',
    },
  },
  required: ['status', 'ledgerAudit', 'borderRoutingAudit', 'sanctionsAudit', 'executiveSummary'],
}
