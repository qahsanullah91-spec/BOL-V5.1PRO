import { decimal, integer, pgTable, text, timestamp, index } from 'drizzle-orm/pg-core'

export const accounts = pgTable('accounts', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

export const companies = pgTable(
  'companies',
  {
    id: text('id').primaryKey(),
    accountId: text('account_id').notNull(),
    name: text('name').notNull(),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => [index('idx_companies_account_id').on(table.accountId)]
)

export const ledgerEntries = pgTable(
  'ledger_entries',
  {
    id: text('id').primaryKey(),
    companyId: text('company_id').notNull(),
    sNo: integer('s_no'),
    date: text('date').notNull(),
    shipperDescription: text('shipper_description'),
    invoiceNo: text('invoice_no'),
    dateOfShip: text('date_of_ship'),
    billOfLanding: text('bill_of_landing'),
    containerNo: text('container_no'),
    consignee: text('consignee'),
    quantity: text('quantity'),
    debit: decimal('debit', { precision: 15, scale: 2 }).default('0'),
    credit: decimal('credit', { precision: 15, scale: 2 }).default('0'),
    balance: decimal('balance', { precision: 15, scale: 2 }).default('0'),
    pdfUrl: text('pdf_url'),
    pdfPathname: text('pdf_pathname'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => [
    index('idx_ledger_entries_company_id').on(table.companyId),
    index('idx_ledger_entries_date').on(table.date),
  ]
)
