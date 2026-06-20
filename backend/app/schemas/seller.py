from pydantic import BaseModel


class LowStockProduct(BaseModel):
    id: int
    name: str
    quantity: int


class SellerAnalyticsResponse(BaseModel):
    total_products_listed: int
    total_units_sold: int
    total_revenue: float
    low_stock_products: list[LowStockProduct]
