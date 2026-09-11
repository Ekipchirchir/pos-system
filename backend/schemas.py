from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from enum import Enum

class ProductCreate(BaseModel):
    name: str
    barcode: str
    buying_price: float
    selling_price: float
    stock_quantity: int
    unit_type: str = "bottle"

class ProductResponse(ProductCreate):
    id: int

    class Config:
        from_attributes = True

class PaymentMethod(str, Enum):
    cash = "cash"
    mpesa = "mpesa"

class SaleItemCreate(BaseModel):
    product_id: int
    quantity: int

class SaleCreate(BaseModel):
    items: List[SaleItemCreate]
    payment_method: PaymentMethod = PaymentMethod.cash

class SaleItemResponse(BaseModel):
    id: int
    product_id: int
    quantity: int
    unit_price: float
    subtotal: float

    class Config:
        from_attributes = True

class SaleResponse(BaseModel):
    id: int
    total_amount: float
    payment_method: str
    created_at: datetime
    fiscal_invoice_number: str | None = None
    qr_code_data: str | None = None
    vscu_response_code: str | None = None
    items: List[SaleItemResponse]

    class Config:
        from_attributes = True

class ProductStockReport(BaseModel):
    product_id: int
    name: str
    remaining_stock: int

class ItemSoldSummary(BaseModel):
    product_name: str
    total_quantity_sold: int
    total_revenue: float

class ShiftReportResponse(BaseModel):
    total_cash_collected: float
    total_transactions: int
    items_sold: List[ItemSoldSummary]
    current_inventory: List[ProductStockReport]

    class Config:
        from_attributes = True

class ProductLowStockResponse(BaseModel):
    id: int
    name: str
    barcode: str
    stock_quantity: int
    unit_type: str

    class Config:
        from_attributes = True 

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    barcode: Optional[str] = None
    buying_price: Optional[float] = None
    selling_price: Optional[float] = None
    stock_quantity: Optional[int] = None
    unit_type: Optional[str] = None

class UserCreate(BaseModel):
    username: str
    password: str
    role: str = "cashier" 

class UserResponse(BaseModel):
    id: int
    username: str
    role: str

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None

class StockInRequest(BaseModel):
    quantity_to_add: int     