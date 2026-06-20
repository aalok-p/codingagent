from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import auth, orders, products, seller

app = FastAPI(title="Grocery Inventory & Order Management System")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(products.router)
app.include_router(orders.router)
app.include_router(seller.router)


@app.get("/health")
def health_check():
    return {"status": "ok"}
