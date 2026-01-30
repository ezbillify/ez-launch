
export interface ProductMaster {
  id: string;
  item_name: string;
  unit: string;
  category: string;
  hsn_code?: string;
  mrp: number;
  tax_rate: number;
  barcode: string;
  created_at: string;
  updated_at?: string;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  last_login: string;
  total_scans: number;
}

export interface OnboardingLog {
  id: string;
  user_id: string;
  barcode: string;
  product_id?: string;
  scanned_at: string;
  status: 'found' | 'not_found' | 'added';
  user_name?: string;
}

export interface Category {
  id: string;
  name: string;
}

export interface Unit {
  id: string;
  name: string;
}
