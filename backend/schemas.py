from pydantic import BaseModel
from typing import List

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

class SaleItemCreate(BaseModel):
    product_id: int
    quantity: int

class SaleCreate(BaseModel):
    items: List[SaleItemCreate]
    payment_method: str ="cash"

class SaleResponse(BaseModel):
    id: int
    total_amount: float
    payment_method: str

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