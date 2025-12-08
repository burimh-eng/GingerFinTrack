export type TransactionType = 'Te Hyra' | 'Shpenzime' | 'Transfere';

export const CATEGORIES: TransactionType[] = ['Te Hyra', 'Shpenzime', 'Transfere'];

// Matching Image 2 List
export const SUB_CATEGORIES = [
  'GINGER',
  'POS',
  'Fature personale',
  'Kredi',
  'Borq',
  'Rroga',
  'Nga Migros',
  'GS',
  'Ulpiane',
  'Mabelle',
  'Divident Skenderi',
  'Divident Burimi',
  'TAX',
  'Selamia',
  'Investim/renovim',
  'Shpenzime te Bankes',
  'BANESA te Fisi',
  'Other'
];

export const ACCOUNTS = ['Cash', 'Bank', 'POS', 'Divident'];
export const NAMES = ['Burimi', 'Skenderi'];

export interface Transaction {
  id: string;
  date: string; // ISO string YYYY-MM-DD
  account: string;
  category: TransactionType;
  subCategory: string;
  notes: string;
  amount: number;
  name: string;
  description: string;
}

export type TransactionInput = Omit<Transaction, 'id'>;

// Structure for the complex report in Image 3
export interface MonthlyStats {
  month: string; // e.g., "Jan-25"
  year: number;
  monthIndex: number;
  
  // Burimi Data
  burimi_income_ginger: number;
  burimi_expense_ginger: number;
  burimi_transfer: number;
  burimi_income_other: number;
  burimi_expense_other: number;
  burimi_total: number;

  // Skenderi Data
  skenderi_income_ginger: number;
  skenderi_expense_ginger: number;
  skenderi_transfer: number;
  skenderi_income_other: number;
  skenderi_expense_other: number;
  skenderi_total: number;

  // Global
  pos: number;
  total_net: number;
}
