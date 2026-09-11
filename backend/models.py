from sqlalchemy import Column, Integer, String, Float, ForeignKey
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
    total_amount = Column(Float, nullable=False)
    payment_method = Column(String, default="cash")

    items = relationship("SaleItem", back_populates="sale")

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