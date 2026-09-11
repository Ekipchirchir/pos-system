import axios from 'axios';
import { Product, SaleRequest, SaleResponse, ShiftReport, StockInRequest } from '@/types';

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

export const initiateMpesaPayment = async (phoneNumber: string, amount: number, orderRef: string, saleId?: number) => {
  const response = await API.post('/sales/mpesa/stk-push', null, {
    params: { phone_number: phoneNumber, amount, order_ref: orderRef, sale_id: saleId }
  });
  return response.data;
};

export const getShiftReport = async (): Promise<ShiftReport> => {
  const response = await API.get('/sales/report/shift');
  return response.data;
};

export const updateProduct = async (id: number, productData: Partial<Product>): Promise<Product> => {
  const response = await API.put(`/products/${id}`, productData);
  return response.data;
};