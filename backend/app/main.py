from fastapi import FastAPI

app = FastAPI(title="Grocery Inventory & Order Management System")


@app.get("/health")
def health_check():
    return {"status": "ok"}
