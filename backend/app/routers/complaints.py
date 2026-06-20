from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import orm

from app.database import get_db
from app.dependencies import get_current_user
from app.models.complaint import Complaint
from app.models.customer import Customer
from app.models.order_item import OrderItem
from app.models.product import Product
from app.models.user import User
from app.schemas.complaint import ComplaintCreate, ComplaintResponse, SellerComplaintResponse

router = APIRouter(prefix="/complaints", tags=["complaints"])


@router.post("", response_model=ComplaintResponse, status_code=status.HTTP_201_CREATED)
def create_complaint(
    req: ComplaintCreate,
    current_user: User = Depends(get_current_user),
    db: orm.Session = Depends(get_db),
):
    if current_user.role != "buyer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only buyers can file complaints",
        )

    customer = db.query(Customer).filter(Customer.user_id == current_user.id).first()
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You must place an order before filing a complaint",
        )

    order_item = db.query(OrderItem).filter(OrderItem.id == req.order_item_id).first()
    if not order_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order item not found",
        )

    existing = db.query(Complaint).filter(Complaint.order_item_id == req.order_item_id).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A complaint already exists for this order item",
        )

    complaint = Complaint(
        order_item_id=req.order_item_id,
        customer_id=customer.id,
        product_id=order_item.product_id,
        message=req.message,
        status="open",
    )
    db.add(complaint)
    db.commit()
    db.refresh(complaint)
    return complaint


@router.get("/seller", response_model=list[SellerComplaintResponse])
def list_seller_complaints(
    current_user: User = Depends(get_current_user),
    db: orm.Session = Depends(get_db),
):
    if current_user.role != "seller":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only sellers can view complaints",
        )

    complaints = (
        db.query(Complaint)
        .join(Product)
        .filter(Product.seller_id == current_user.id)
        .order_by(Complaint.created_at.desc())
        .all()
    )

    result = []
    for c in complaints:
        result.append(SellerComplaintResponse(
            id=c.id,
            product_name=c.product.name,
            customer_name=c.customer.full_name,
            message=c.message,
            status=c.status,
            created_at=c.created_at.isoformat() if hasattr(c.created_at, 'isoformat') else str(c.created_at),
        ))
    return result


@router.patch("/{complaint_id}/resolve", response_model=ComplaintResponse)
def resolve_complaint(
    complaint_id: int,
    current_user: User = Depends(get_current_user),
    db: orm.Session = Depends(get_db),
):
    if current_user.role != "seller":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only sellers can resolve complaints",
        )

    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Complaint not found",
        )

    if complaint.product.seller_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only resolve complaints on your own products",
        )

    if complaint.status == "resolved":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Complaint is already resolved",
        )

    complaint.status = "resolved"
    db.commit()
    db.refresh(complaint)
    return complaint
