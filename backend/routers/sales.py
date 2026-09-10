from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
import models
import schemas

router = APIRouter(
    prefix="/sales",
    tags=["Sales"]
)

@router.post("/", response_model=schemas.SaleResponse)
def create_sale(sale_data: schemas.SaleCreate, db: Session = Depends(get_db)):
    total_amount = 0.0
    sale_items_to_create = []

    for item in sale_data.items:
        product = db.query(models.Product).filter(models.Product.id == item.product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail=f"Product with ID {item.product_id} not found")
        
        if product.stock_quantity < item.quantity:
            raise HTTPException(
                status_code=400, 
                detail=f"Insufficient stock for {product.name}. Available: {product.stock_quantity}"
            )

        item_total = product.selling_price * item.quantity
        total_amount += item_total

        # Automatically decrement inventory
        product.stock_quantity -= item.quantity

        sale_items_to_create.append({
            "product_id": product.id,
            "quantity": item.quantity,
            "unit_price": product.selling_price,
            "subtotal": item_total
        })

    # Record the main sale entry
    new_sale = models.Sale(
        total_amount=total_amount,
        payment_method=sale_data.payment_method
    )
    db.add(new_sale)
    db.commit()
    db.flush()

    # Record individual items tied to the sale
    for item_data in sale_items_to_create:
        sale_item = models.SaleItem(
            sale_id=new_sale.id,
            **item_data
        )
        db.add(sale_item)

    db.commit()
    db.refresh(new_sale)
    return new_sale


@router.get("/report/shift", response_model=schemas.ShiftReportResponse)
def get_shift_report(db: Session = Depends(get_db)):
    # Total cash collected and total transaction count
    total_cash, total_transactions = db.query(
        func.sum(models.Sale.total_amount),
        func.count(models.Sale.id)
    ).filter(models.Sale.payment_method == "cash").first()

    total_cash = total_cash or 0.0
    total_transactions = total_transactions or 0

    # Aggregated items sold grouped by product
    sold_items_query = db.query(
        models.Product.name,
        func.sum(models.SaleItem.quantity).label("total_qty"),
        func.sum(models.SaleItem.subtotal).label("total_rev")
    ).join(models.SaleItem, models.Product.id == models.SaleItem.product_id)\
     .group_by(models.Product.name).all()

    items_sold = [
        {
            "product_name": row.name,
            "total_quantity_sold": row.total_qty,
            "total_revenue": row.total_rev
        }
        for row in sold_items_query
    ]

    # Remaining inventory levels for reconciliation
    products = db.query(models.Product).all()
    current_inventory = [
        {
            "product_id": p.id,
            "name": p.name,
            "remaining_stock": p.stock_quantity
        }
        for p in products
    ]

    return {
        "total_cash_collected": total_cash,
        "total_transactions": total_transactions,
        "items_sold": items_sold,
        "current_inventory": current_inventory
    }