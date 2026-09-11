import uuid
from datetime import datetime

def submit_to_etims(sale_data, sale_items):
    """
    Simulates KRA eTIMS transmission locally for development and testing.
    """

    # Generate a realistic mock fiscal invoice number
    mock_invoice_no = f"KRA-MOCK-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"

    return {
        "resultCd": "000",
        "resultMsg": "Success",
        "fiscalInvcNo": mock_invoice_no,
        "qrCodeUrl": f"https://etims.kra.go.ke/qr?invoice={mock_invoice_no}",
        "totalAmount": sale_data.total_amount,
        "timestamp": datetime.utcnow().isoformat()
    }