from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine
import models
from routers import products, sales, auth

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Wines & Spirits POS API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(products.router)
app.include_router(sales.router)
app.include_router(auth.router)

@app.get("/")
def read_root():
    return {"message": "POS Backend is running and connected!"}