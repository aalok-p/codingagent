from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import orm

from app.database import get_db
from app.dependencies import get_current_user
from app.models.product import Product
from app.models.user import User
from app.schemas.product import ProductCreate, ProductResponse, ProductUpdate, generate_sui_number

router = APIRouter(prefix="/products", tags=["products"])


@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(
    req: ProductCreate,
    current_user: User = Depends(get_current_user),
    db: orm.Session = Depends(get_db),
):
    if current_user.role != "seller":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only sellers can create products",
        )

    existing = db.query(Product).filter(Product.sku == req.sku).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A product with this SKU already exists",
        )

    sui_number = generate_sui_number()
    while db.query(Product).filter(Product.sui_number == sui_number).first():
        sui_number = generate_sui_number()

    product = Product(
        name=req.name,
        sku=req.sku,
        sui_number=sui_number,
        price=req.price,
        quantity=req.quantity,
        seller_id=current_user.id,
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


@router.get("", response_model=list[ProductResponse])
def list_products(
    current_user: User = Depends(get_current_user),
    db: orm.Session = Depends(get_db),
):
    if current_user.role == "seller":
        products = db.query(Product).filter(Product.seller_id == current_user.id).all()
    else:
        products = db.query(Product).all()
    return products


@router.get("/{product_id}", response_model=ProductResponse)
def get_product(
    product_id: int,
    current_user: User = Depends(get_current_user),
    db: orm.Session = Depends(get_db),
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found",
        )
    return product


@router.put("/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: int,
    req: ProductUpdate,
    current_user: User = Depends(get_current_user),
    db: orm.Session = Depends(get_db),
):
    if current_user.role != "seller":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only sellers can update products",
        )

    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found",
        )

    if product.seller_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only update your own products",
        )

    if req.sku is not None and req.sku != product.sku:
        existing = db.query(Product).filter(Product.sku == req.sku).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A product with this SKU already exists",
            )

    update_data = req.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(product, field, value)

    db.commit()
    db.refresh(product)
    return product


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(
    product_id: int,
    current_user: User = Depends(get_current_user),
    db: orm.Session = Depends(get_db),
):
    if current_user.role != "seller":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only sellers can delete products",
        )

    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found",
        )

    if product.seller_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete your own products",
        )

    db.delete(product)
    db.commit()
