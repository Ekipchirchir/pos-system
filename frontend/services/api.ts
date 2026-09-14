/*eslint-disable*/
import axios from 'axios';
import { Product, SaleRequest, SaleResponse, ShiftReport, StockInRequest, User, UserCreatePayload } from '@/types';

const API = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

API.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export interface BatchSyncResponse {
  synced_count: number;
  failed_count: number;
  results: Array<{
    client_sale_id: string;
    server_sale_id: number | null;
    status: 'success' | 'already_synced' | 'failed';
    detail?: string;
  }>;
}

export interface ProductNested {
  id: number;
  name: string;
  barcode: string;
}

export interface SaleItemDetail {
  id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  subtotal: number;
  product?: ProductNested | null;
}

export interface SaleDetailResponse {
  id: number;
  total_amount: number;
  payment_method: string;
  created_at: string;
  fiscal_invoice_number?: string | null;
  user_id?: number | null;
  user?: User | null;
  items: SaleItemDetail[];
}

export interface MpesaStatusResponse {
  checkout_request_id: string;
  status: 'Pending' | 'Completed' | 'Failed';
  result_desc?: string;
  receipt_number?: string;
}

export const getProducts = async (): Promise<Product[]> => {
  const response = await API.get('/products/');
  return response.data;
};

export const createProduct = async (productData: Omit<Product, 'id'>): Promise<Product> => {
  const response = await API.post('/products/', productData);
  return response.data;
};

export const stockInProduct = async (productId: number, data: StockInRequest): Promise<Product> => {
  const response = await API.post(`/products/${productId}/stock-in/`, data);
  return response.data;
};

export const createSale = async (saleData: SaleRequest): Promise<SaleResponse> => {
  const response = await API.post('/sales/', saleData);
  return response.data;
};

export const syncOfflineSales = async (offlineSales: any[]): Promise<BatchSyncResponse> => {
  const response = await API.post('/sales/sync', { offline_sales: offlineSales });
  return response.data;
};

export const initiateMpesaPayment = async (phoneNumber: string, amount: number, orderRef: string, saleId?: number) => {
  const response = await API.post('/sales/mpesa/stk-push', null, {
    params: { phone_number: phoneNumber, amount, order_ref: orderRef, sale_id: saleId }
  });
  return response.data;
};

export const checkMpesaStatus = async (checkoutRequestId: string): Promise<MpesaStatusResponse> => {
  const response = await API.get(`/sales/mpesa/status/${checkoutRequestId}`);
  return response.data;
};

export const pollMpesaPayment = async (checkoutRequestId: string, timeoutSeconds = 60): Promise<MpesaStatusResponse> => {
  const startTime = Date.now();
  
  while ((Date.now() - startTime) / 1000 < timeoutSeconds) {
    const data = await checkMpesaStatus(checkoutRequestId);
    
    if (data.status === 'Completed') {
      return data;
    }
    if (data.status === 'Failed') {
      throw new Error(data.result_desc || 'M-Pesa payment failed or cancelled by user.');
    }
    
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  
  throw new Error('M-Pesa payment timed out waiting for PIN input.');
};

export const getShiftReport = async (): Promise<ShiftReport> => {
  const response = await API.get('/sales/report/shift');
  return response.data;
};

export const updateProduct = async (id: number, productData: Partial<Product>): Promise<Product> => {
  const response = await API.put(`/products/${id}`, productData);
  return response.data;
};

export const getUsers = async (): Promise<User[]> => {
  const response = await API.get('/auth/users');
  return response.data;
};

export const createUser = async (data: UserCreatePayload): Promise<User> => {
  const response = await API.post('/auth/users', data);
  return response.data;
};

export const updateUser = async (id: number, data: Partial<UserCreatePayload>): Promise<User> => {
  const response = await API.put(`/auth/users/${id}`, data);
  return response.data;
};

export async function getTotalInventoryValue(): Promise<{ total_inventory_selling_value: number }> {
  const response = await API.get('/products/total-value/');
  return response.data;
}

export const deleteUser = async (id: number): Promise<void> => {
  await API.delete(`/auth/users/${id}`);
};

export const getSalesHistory = async (): Promise<SaleDetailResponse[]> => {
  const response = await API.get('/sales/history');
  return response.data;
};