import random

from pydantic import BaseModel, field_validator


class ProductCreate(BaseModel):
    name: str
    sku: str
    category: str | None = None
    price: float
    quantity: int

    @field_validator("price")
    @classmethod
    def price_positive(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("Price must be greater than 0")
        return v

    @field_validator("quantity")
    @classmethod
    def quantity_non_negative(cls, v: int) -> int:
        if v < 0:
            raise ValueError("Quantity cannot be negative")
        return v


class ProductUpdate(BaseModel):
    name: str | None = None
    sku: str | None = None
    category: str | None = None
    price: float | None = None
    quantity: int | None = None

    @field_validator("price")
    @classmethod
    def price_positive(cls, v: float | None) -> float | None:
        if v is not None and v <= 0:
            raise ValueError("Price must be greater than 0")
        return v

    @field_validator("quantity")
    @classmethod
    def quantity_non_negative(cls, v: int | None) -> int | None:
        if v is not None and v < 0:
            raise ValueError("Quantity cannot be negative")
        return v


class ProductResponse(BaseModel):
    id: int
    name: str
    sku: str
    sui_number: int
    category: str | None = None
    price: float
    quantity: int
    seller_id: int
    created_at: str
    updated_at: str

    model_config = {"from_attributes": True}


def generate_sui_number() -> int:
    return random.randint(10**7, 10**12 - 1)
