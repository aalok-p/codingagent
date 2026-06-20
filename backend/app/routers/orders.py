from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import orm

from app.database import get_db
from app.dependencies import get_current_user
from app.models.customer import Customer
from app.models.order import Order
from app.models.order_item import OrderItem
from app.models.product import Product
from app.models.user import User
from app.schemas.order import OrderCreate, OrderResponse, OrderItemResponse

router = APIRouter(prefix="/orders", tags=["orders"])


class _ItemData:
    def __init__(self, product: Product, quantity: int, unit_price: float, subtotal: float) -> None:
        self.product = product
        self.product_name: str = product.name
        self.quantity = quantity
        self.unit_price = unit_price
        self.subtotal = subtotal


@router.post("", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
def place_order(
    req: OrderCreate,
    current_user: User = Depends(get_current_user),
    db: orm.Session = Depends(get_db),
):
    if current_user.role != "buyer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only buyers can place orders",
        )

    customer = db.query(Customer).filter(Customer.user_id == current_user.id).first()
    if not customer:
        customer = Customer(
            user_id=current_user.id,
            full_name=current_user.full_name,
            email=current_user.email,
            phone=current_user.phone or "",
        )
        db.add(customer)
        db.flush()

    items_data: list[_ItemData] = []
    total_amount = 0.0

    for item in req.items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product with id {item.product_id} not found",
            )
        if product.quantity < item.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient stock for '{product.name}': requested {item.quantity}, available {product.quantity}",
            )
        unit_price = product.price
        subtotal = unit_price * item.quantity
        total_amount += subtotal
        items_data.append(_ItemData(product, item.quantity, unit_price, subtotal))

    order = Order(
        customer_id=customer.id,
        total_amount=total_amount,
        status="pending",
    )
    db.add(order)
    db.flush()

    response_items = []
    for d in items_data:
        order_item = OrderItem(
            order_id=order.id,
            product_id=d.product.id,
            quantity=d.quantity,
            unit_price=d.unit_price,
            subtotal=d.subtotal,
        )
        db.add(order_item)
        d.product.quantity -= d.quantity
        response_items.append(OrderItemResponse(
            id=0,
            product_id=d.product.id,
            product_name=d.product_name,
            quantity=d.quantity,
            unit_price=d.unit_price,
            subtotal=d.subtotal,
        ))

    db.commit()
    db.refresh(order)

    for i, item in enumerate(order.items):
        response_items[i].id = item.id

    return OrderResponse(
        id=order.id,
        customer_id=order.customer_id,
        total_amount=order.total_amount,
        status=order.status,
        created_at=order.created_at.isoformat() if hasattr(order.created_at, 'isoformat') else str(order.created_at),
        items=response_items,
    )


@router.get("", response_model=list[OrderResponse])
def list_orders(
    current_user: User = Depends(get_current_user),
    db: orm.Session = Depends(get_db),
):
    if current_user.role == "buyer":
        customer = db.query(Customer).filter(Customer.user_id == current_user.id).first()
        if not customer:
            return []
        orders = db.query(Order).filter(Order.customer_id == customer.id).order_by(Order.created_at.desc()).all()
    elif current_user.role == "seller":
        orders = (
            db.query(Order)
            .join(OrderItem)
            .join(Product)
            .filter(Product.seller_id == current_user.id)
            .distinct()
            .order_by(Order.created_at.desc())
            .all()
        )
    else:
        return []

    result = []
    for order in orders:
        items = []
        for item in order.items:
            items.append(OrderItemResponse(
                id=item.id,
                product_id=item.product_id,
                product_name=item.product.name,
                quantity=item.quantity,
                unit_price=item.unit_price,
                subtotal=item.subtotal,
            ))
        result.append(OrderResponse(
            id=order.id,
            customer_id=order.customer_id,
            total_amount=order.total_amount,
            status=order.status,
            created_at=order.created_at.isoformat() if hasattr(order.created_at, 'isoformat') else str(order.created_at),
            items=items,
        ))
    return result


@router.get("/{order_id}", response_model=OrderResponse)
def get_order(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: orm.Session = Depends(get_db),
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found",
        )

    if current_user.role == "buyer":
        customer = db.query(Customer).filter(Customer.user_id == current_user.id).first()
        if not customer or order.customer_id != customer.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only view your own orders",
            )
    elif current_user.role == "seller":
        product_ids = [item.product_id for item in order.items]
        seller_products = db.query(Product).filter(
            Product.id.in_(product_ids),
            Product.seller_id == current_user.id,
        ).count()
        if seller_products == 0:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only view orders containing your products",
            )

    items = []
    for item in order.items:
        items.append(OrderItemResponse(
            id=item.id,
            product_id=item.product_id,
            product_name=item.product.name,
            quantity=item.quantity,
            unit_price=item.unit_price,
            subtotal=item.subtotal,
        ))
    return OrderResponse(
        id=order.id,
        customer_id=order.customer_id,
        total_amount=order.total_amount,
        status=order.status,
        created_at=order.created_at.isoformat() if hasattr(order.created_at, 'isoformat') else str(order.created_at),
        items=items,
    )
