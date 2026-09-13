from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
import models
import schemas
import auth

router = APIRouter(
    prefix="/products",
    tags=["Products"]
)

@router.post("/", response_model=schemas.ProductResponse, dependencies=[Depends(auth.require_role("manager"))])
def create_product(product: schemas.ProductCreate, db: Session = Depends(get_db)):
    db_product = db.query(models.Product).filter(models.Product.barcode == product.barcode).first()
    if db_product:
        raise HTTPException(status_code=400, detail="Product with this barcode already exists")
    
    new_product = models.Product(**product.dict())
    db.add(new_product)
    db.commit()
    db.refresh(new_product)
    return new_product

@router.get("/", response_model=list[schemas.ProductResponse], dependencies=[Depends(auth.get_current_user)])
def get_products(skip: int = 0, limit: int | None = None, db: Session = Depends(get_db)):
    query = db.query(models.Product).offset(skip)
    if limit is not None:
        query = query.limit(limit)
    return query.all()

@router.put("/{product_id}", response_model=schemas.ProductResponse, dependencies=[Depends(auth.require_role("manager"))])
def update_product_full(product_id: int, product_data: schemas.ProductCreate, db: Session = Depends(get_db)):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    for key, value in product_data.dict().items():
        setattr(product, key, value)
    
    db.commit()
    db.refresh(product)
    return product

@router.patch("/{product_id}", response_model=schemas.ProductResponse, dependencies=[Depends(auth.require_role("manager"))])
def update_product_partial(product_id: int, product_data: schemas.ProductUpdate, db: Session = Depends(get_db)):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    update_data = product_data.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(product, key, value)
    
    db.commit()
    db.refresh(product)
    return product

@router.delete("/{product_id}", dependencies=[Depends(auth.require_role("manager"))])
def delete_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    db.delete(product)
    db.commit()
    return {"message": f"Product with ID {product_id} deleted successfully"}

@router.get("/low-stock/", response_model=list[schemas.ProductLowStockResponse], dependencies=[Depends(auth.require_role("manager"))])
def get_low_stock_products(threshold: int = 5, db: Session = Depends(get_db)):
    """
    Returns a list of products whose stock quantity is less than or equal to the threshold.
    Default threshold is set to 5 units.
    """
    low_stock_items = db.query(models.Product).filter(models.Product.stock_quantity <= threshold).all()
    return low_stock_items

@router.post("/{product_id}/stock-in/", response_model=schemas.ProductResponse, dependencies=[Depends(auth.require_role("manager"))])
def stock_in_product(product_id: int, stock_data: schemas.StockInRequest, db: Session = Depends(get_db)):
    """
    Increments the stock quantity of a specific product by the delivered amount.
    Restricted to managers.
    """
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    if stock_data.quantity_to_add <=0:
        raise HTTPException(status_code=400, detail="Quantity to add must be greater than zero")

    product.stock_quantity += stock_data.quantity_to_add
    db.commit()
    db.refresh(product)
    return product

@router.get("/total-value/", dependencies=[Depends(auth.require_role("manager"))])
def get_total_inventory_value(db: Session = Depends(get_db)):
    """
    Calculates the total potential revenue (selling price * stock quantity) 
    for all available products in inventory.
    """
    total_value = db.query(
        func.sum(models.Product.selling_price * models.Product.stock_quantity)
    ).scalar()
    
    return {"total_inventory_selling_value": total_value or 0.0}