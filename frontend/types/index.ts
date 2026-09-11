export interface ProductCreate {
  name: string;
  barcode: string;
  buying_price: number;
  selling_price: number;
  stock_quantity: number;
  unit_type?: string;
}

export interface Product extends ProductCreate {
  id: number;
}

export interface ProductUpdate {
  name?: string;
  barcode?: string;
  buying_price?: number;
  selling_price?: number;
  stock_quantity?: number;
  unit_type?: string;
}

export type PaymentMethod = 'cash' | 'mpesa';

export interface SaleItemCreate {
  product_id: number;
  quantity: number;
}

export interface SaleRequest {
  items: SaleItemCreate[];
  payment_method: PaymentMethod;
}

export interface SaleItemResponse {
  id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface SaleResponse {
  id: number;
  total_amount: number;
  payment_method: string;
  created_at: string;
  fiscal_invoice_number: string | null;
  qr_code_data: string | null;
  vscu_response_code: string | null;
  items: SaleItemResponse[];
}

export interface ProductStockReport {
  product_id: number;
  name: string;
  remaining_stock: number;
}

export interface ItemSoldSummary {
  product_name: string;
  total_quantity_sold: number;
  total_revenue: number;
}

export interface ShiftReport {
  total_cash_collected: number;
  total_transactions: number;
  items_sold: ItemSoldSummary[];
  current_inventory: ProductStockReport[];
}

export interface StockInRequest {
  quantity_to_add: number;
}

export interface User {
  id: number;
  username: string;
  role: 'manager' | 'cashier';
}

export interface UserCreatePayload {
  username: string;
  password?: string;
  role: 'manager' | 'cashier';
}