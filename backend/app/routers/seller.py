from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, orm

from app.database import get_db
from app.dependencies import get_current_user
from app.models.order_item import OrderItem
from app.models.product import Product
from app.models.user import User
from app.schemas.seller import LowStockProduct, SellerAnalyticsResponse

router = APIRouter(prefix="/seller", tags=["seller"])


@router.get("/analytics", response_model=SellerAnalyticsResponse)
def get_seller_analytics(
    current_user: User = Depends(get_current_user),
    db: orm.Session = Depends(get_db),
):
    if current_user.role != "seller":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only sellers can view analytics",
        )

    total_products_listed = (
        db.query(func.count(Product.id))
        .filter(Product.seller_id == current_user.id)
        .scalar()
        or 0
    )

    sales_agg = (
        db.query(
            func.coalesce(func.sum(OrderItem.quantity), 0),
            func.coalesce(func.sum(OrderItem.subtotal), 0.0),
        )
        .join(Product)
        .filter(Product.seller_id == current_user.id)
        .first()
    )
    total_units_sold = sales_agg[0] if sales_agg else 0
    total_revenue = float(sales_agg[1]) if sales_agg else 0.0

    low_stock_rows = (
        db.query(Product)
        .filter(
            Product.seller_id == current_user.id,
            Product.quantity <= 5,
        )
        .all()
    )
    low_stock_products = [
        LowStockProduct(id=p.id, name=p.name, quantity=p.quantity)
        for p in low_stock_rows
    ]

    return SellerAnalyticsResponse(
        total_products_listed=total_products_listed,
        total_units_sold=total_units_sold,
        total_revenue=total_revenue,
        low_stock_products=low_stock_products,
    )
