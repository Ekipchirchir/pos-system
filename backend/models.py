from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from database import Base


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    barcode = Column(String, unique=True, index=True, nullable=False)
    buying_price = Column(Float, nullable=False)
    selling_price = Column(Float, nullable=False)
    stock_quantity = Column(Integer, nullable=False)
    unit_type = Column(String, default="bottle")  # e.g., bottle, tot

class Sale(Base):
    __tablename__ = "sales"

    id = Column(Integer, primary_key=True, index=True)
    client_sale_id = Column(String, unique=True, index=True, nullable=True)
    total_amount = Column(Float, nullable=False)
    payment_method = Column(String, default="cash", nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    fiscal_invoice_number = Column(String, unique=True, index=True, nullable=True)
    qr_code_data = Column(String, nullable=True)
    vscu_response_code = Column(String, nullable=True)

    items = relationship("SaleItem", back_populates="sale")
    user = relationship("User", back_populates="sales")

class SaleItem(Base):
    __tablename__ = "sale_items"

    id = Column(Integer, primary_key=True, index=True)
    sale_id = Column(Integer, ForeignKey("sales.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Float, nullable=False)
    subtotal = Column(Float, nullable=False)

    sale = relationship("Sale", back_populates="items")
    product = relationship("Product")

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="cashier", nullable=False) 

    sales = relationship("Sale", back_populates="user")

class MPesaTransaction(Base):
    __tablename__ = "mpesa_transactions"

    id = Column(Integer, primary_key=True, index=True)
    sale_id = Column(Integer, ForeignKey("sales.id"), nullable=True)
    checkout_request_id = Column(String, unique=True, index=True, nullable=False)
    merchant_request_id = Column(String, nullable=False)
    phone_number = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    status = Column(String, default="Pending", nullable=False)  
    receipt_number = Column(String, unique=True, index=True, nullable=True)
    result_desc = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    sale = relationship("Sale")