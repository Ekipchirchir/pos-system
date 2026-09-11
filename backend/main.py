from fastapi import FastAPI
from database import engine
import models
from routers import products, sales, auth

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Wines & Spirits POS API")

# Include the products router
app.include_router(products.router)
app.include_router(sales.router)
app.include_router(auth.router)

@app.get("/")
def read_root():
    return {"message": "POS Backend is running and connected!"}