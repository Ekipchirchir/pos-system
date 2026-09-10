from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models
import schemas

router = APIRouter(
    prefix="/products",
    tags=["Products"]
)

@router.post("/", response_model=schemas.ProductResponse)
def create_product(product: schemas.ProductCreate, db: Session = Depends(get_db)):
    db_product = db.query(models.Product).filter(models.Product.barcode == product.barcode).first()
    if db_product:
        raise HTTPException(status_code=400, detail="Product with this barcode already exists")
    
    new_product = models.Product(**product.dict())
    db.add(new_product)
    db.commit()
    db.refresh(new_product)
    return new_product

@router.get("/", response_model=list[schemas.ProductResponse])
def get_products(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    products = db.query(models.Product).offset(skip).limit(limit).all()
    return products

@router.get("/low-stock/", response_model=list[schemas.ProductLowStockResponse])
def get_low_stock_products(threshold: int = 5, db: Session = Depends(get_db)):
    """
    Returns a list of products whose stock quantity is less than or equal to the threshold.
    Default threshold is set to 5 units.
    """
    low_stock_items = db.query(models.Product).filter(models.Product.stock_quantity <= threshold).all()
    return low_stock_items