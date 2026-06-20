from pydantic import BaseModel


class ComplaintCreate(BaseModel):
    order_item_id: int
    message: str


class ComplaintResponse(BaseModel):
    id: int
    order_item_id: int
    product_id: int
    message: str
    status: str
    created_at: str

    model_config = {"from_attributes": True}


class SellerComplaintResponse(BaseModel):
    id: int
    product_name: str
    customer_name: str
    message: str
    status: str
    created_at: str

    model_config = {"from_attributes": True}
