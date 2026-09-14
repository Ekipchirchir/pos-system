from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime, timezone
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from database import get_db
import models
import schemas
import auth
from services.mpesa import trigger_stk_push
from services.etims import submit_to_etims

router = APIRouter(
    prefix="/sales",
    tags=["Sales"]
)

@router.post("/", response_model=schemas.SaleResponse)
def create_sale(
    sale_data: schemas.SaleCreate, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(auth.get_current_user)
):
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
        product.stock_quantity -= item.quantity

        sale_items_to_create.append({
            "product_id": product.id,
            "product_name": product.name,
            "quantity": item.quantity,
            "unit_price": product.selling_price,
            "subtotal": item_total
        })

    # Record the main sale entry with user association
    new_sale = models.Sale(
        total_amount=total_amount,
        payment_method=sale_data.payment_method,
        user_id=current_user.id
    )
    db.add(new_sale)
    db.commit()
    db.flush()

    for item_data in sale_items_to_create:
        item_payload = {k: v for k, v in item_data.items() if k != "product_name"}
        sale_item = models.SaleItem(
            sale_id=new_sale.id,
            **item_payload
        )
        db.add(sale_item)

    db.commit()

    try:
        etims_resp = submit_to_etims(new_sale, sale_items_to_create)
        new_sale.fiscal_invoice_number = etims_resp.get("fiscalInvcNo")
        new_sale.qr_code_data = etims_resp.get("qrCodeUrl")
        new_sale.vscu_response_code = etims_resp.get("resultCd")
        db.commit()
    except Exception as e:
        print(f"Mock eTIMS transmission error: {e}")

    db.refresh(new_sale)
    return new_sale


@router.get("/report/shift", response_model=schemas.ShiftReportResponse, dependencies=[Depends(auth.require_role("manager"))])
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


@router.post("/mpesa/stk-push", dependencies=[Depends(auth.get_current_user)])
def initiate_mpesa_payment(phone_number: str, amount: float, order_ref: str, sale_id: int = None, db: Session = Depends(get_db)):
    """
    Triggers an M-Pesa STK Push prompt and saves the transaction state as Pending.
    """
    # Format phone number
    if phone_number.startswith("0"):
        phone_number = "254" + phone_number[1:]
        
    result = trigger_stk_push(phone_number, amount, order_ref)
    
    response_code = result.get("ResponseCode")
    if response_code != "0":
        raise HTTPException(status_code=400, detail=f"Daraja STK push failed: {result.get('errorMessage', result)}")
    
    checkout_request_id = result.get("CheckoutRequestID")
    merchant_request_id = result.get("MerchantRequestID")
    
    # Save transaction record in database
    mpesa_tx = models.MPesaTransaction(
        sale_id=sale_id,
        checkout_request_id=checkout_request_id,
        merchant_request_id=merchant_request_id,
        phone_number=phone_number,
        amount=amount,
        status="Pending"
    )
    db.add(mpesa_tx)
    db.commit()
    
    return {"message": "STK push initiated successfully", "daraja_response": result}


@router.post("/mpesa/callback")
async def mpesa_callback(payload: dict, db: Session = Depends(get_db)):
    """
    Receives payment confirmation or failure results from Safaricom and updates the database record.
    """
    stk_callback = payload.get("Body", {}).get("stkCallback", {})
    result_code = stk_callback.get("ResultCode")
    checkout_request_id = stk_callback.get("CheckoutRequestID")
    result_desc = stk_callback.get("ResultDesc")
    
    mpesa_tx = db.query(models.MPesaTransaction).filter(
        models.MPesaTransaction.checkout_request_id == checkout_request_id
    ).first()
    
    if not mpesa_tx:
        # Transaction not tracked locally, acknowledge callback to prevent Safaricom retries
        return {"ResultCode": 0, "ResultDesc": "Accepted"}
    
    mpesa_tx.result_desc = result_desc
    
    if result_code == 0:
        callback_metadata = stk_callback.get("CallbackMetadata", {}).get("Item", [])
        receipt_number = next((item["Value"] for item in callback_metadata if item["Name"] == "MpesaReceiptNumber"), None)
        
        mpesa_tx.status = "Completed"
        mpesa_tx.receipt_number = receipt_number
    else:
        mpesa_tx.status = "Failed"
        
    db.commit()
    return {"ResultCode": 0, "ResultDesc": "Accepted"}

@router.post("/sync", response_model=schemas.BatchSyncResponse)
def sync_offline_sales(
    sync_payload: schemas.BatchSyncRequest, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(auth.get_current_user)
):
    synced_count = 0
    failed_count = 0
    results = []

    for sale_data in sync_payload.offline_sales:
        if sale_data.client_sale_id:
            existing_sale = db.query(models.Sale).filter(
                models.Sale.client_sale_id == sale_data.client_sale_id
            ).first()
            if existing_sale:
                results.append({
                    "client_sale_id": sale_data.client_sale_id,
                    "server_sale_id": existing_sale.id,
                    "status": "already_synced",
                    "detail": "Sale already exists on server."
                })
                synced_count += 1
                continue

        try:
            total_amount = 0.0
            sale_items_to_create = []

            for item in sale_data.items:
                product = db.query(models.Product).filter(models.Product.id == item.product_id).first()
                if not product:
                    raise HTTPException(status_code=404, detail=f"Product ID {item.product_id} not found")
                
                if product.stock_quantity < item.quantity:
                    raise HTTPException(
                        status_code=400, 
                        detail=f"Insufficient stock for {product.name}. Available: {product.stock_quantity}"
                    )

                item_total = product.selling_price * item.quantity
                total_amount += item_total
                product.stock_quantity -= item.quantity

                sale_items_to_create.append({
                    "product_id": product.id,
                    "product_name": product.name,
                    "quantity": item.quantity,
                    "unit_price": product.selling_price,
                    "subtotal": item_total
                })

            new_sale = models.Sale(
                client_sale_id=sale_data.client_sale_id,
                total_amount=total_amount,
                payment_method=sale_data.payment_method,
                created_at=sale_data.created_at or datetime.now(timezone.utc),
                user_id=current_user.id
            )
            db.add(new_sale)
            db.commit()
            db.flush()

            for item_data in sale_items_to_create:
                item_payload = {k: v for k, v in item_data.items() if k != "product_name"}
                sale_item = models.SaleItem(sale_id=new_sale.id, **item_payload)
                db.add(sale_item)

            db.commit()

            try:
                etims_resp = submit_to_etims(new_sale, sale_items_to_create)
                new_sale.fiscal_invoice_number = etims_resp.get("fiscalInvcNo")
                new_sale.qr_code_data = etims_resp.get("qrCodeUrl")
                new_sale.vscu_response_code = etims_resp.get("resultCd")
                db.commit()
            except Exception as e:
                print(f"eTIMS sync transmission error: {e}")

            results.append({
                "client_sale_id": sale_data.client_sale_id,
                "server_sale_id": new_sale.id,
                "status": "success"
            })
            synced_count += 1

        except Exception as e:
            db.rollback()
            failed_count += 1
            results.append({
                "client_sale_id": sale_data.client_sale_id,
                "server_sale_id": None,
                "status": "failed",
                "detail": str(e)
            })

    return {
        "synced_count": synced_count,
        "failed_count": failed_count,
        "results": results
    }

@router.get("/history", response_model=list[schemas.SaleDetailResponse])
def get_sales_history(
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(auth.require_role("manager"))
):
    _ = current_user.id
    sales = (
        db.query(models.Sale)
        .options(
            joinedload(models.Sale.items).joinedload(models.SaleItem.product),
            joinedload(models.Sale.user)
        )
        .order_by(models.Sale.created_at.desc())
        .all()
    )
    return sales

@router.get("/mpesa/status/{checkout_request_id}", dependencies=[Depends(auth.get_current_user)])
def get_mpesa_status(checkout_request_id: str, db: Session = Depends(get_db)):
    mpesa_tx = db.query(models.MPesaTransaction).filter(
        models.MPesaTransaction.checkout_request_id == checkout_request_id
    ).first()

    if not mpesa_tx:
        raise HTTPException(status_code=404, detail="Transaction not found")

    return {
        "checkout_request_id": mpesa_tx.checkout_request_id,
        "status": mpesa_tx.status,
        "result_desc": mpesa_tx.result_desc,
        "receipt_number": mpesa_tx.receipt_number
    }