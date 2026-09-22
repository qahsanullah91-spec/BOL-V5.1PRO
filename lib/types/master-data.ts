export type MasterEntityType = 
  | 'SHIPPER' 
  | 'CONSIGNEE' 
  | 'NOTIFY_PARTY' 
  | 'AGENT' 
  | 'SHIPPING_LINE' 
  | 'DRIVER' 
  | 'SUPPLIER'
  | 'CUSTOMER';

export interface MasterEntityBankDetail {
  bankName: string;
  accountNo: string;
  swift?: string;
  iban?: string;
  currency?: string;
}

export interface MasterEntity {
  id: string;
  type: MasterEntityType[];
  name: string;
  alias?: string;
  address?: string;
  taxId?: string; // VAT, TRN, License number
  email?: string;
  phone?: string;
  contactPerson?: string;
  country?: string;
  city?: string;
  bankDetails?: MasterEntityBankDetail[];
  notes?: string;
  isArchived?: boolean;
  createdAt: string;
  updatedAt: string;
}
