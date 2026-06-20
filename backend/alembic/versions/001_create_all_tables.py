"""create all tables

Revision ID: 001
Revises:
Create Date: 2026-06-20
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("full_name", sa.String(255), nullable=False),
        sa.Column("email", sa.String(255), unique=True, nullable=False, index=True),
        sa.Column("phone", sa.String(20), nullable=False),
        sa.Column("password_hash", sa.String(255), nullable=True),
        sa.Column("google_id", sa.String(255), nullable=True, unique=True),
        sa.Column("role", sa.Enum("buyer", "seller", name="user_role"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_table(
        "products",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("sku", sa.String(100), unique=True, nullable=False, index=True),
        sa.Column("sui_number", sa.Integer(), unique=True, nullable=False, index=True),
        sa.Column("price", sa.Float(), nullable=False),
        sa.Column("quantity", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("seller_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_table(
        "customers",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), unique=True, nullable=False),
        sa.Column("full_name", sa.String(255), nullable=False),
        sa.Column("email", sa.String(255), unique=True, nullable=False, index=True),
        sa.Column("phone", sa.String(20), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_table(
        "orders",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("customer_id", sa.Integer(), sa.ForeignKey("customers.id"), nullable=False),
        sa.Column("total_amount", sa.Float(), nullable=False),
        sa.Column("status", sa.String(50), nullable=False, server_default="pending"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_table(
        "order_items",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("order_id", sa.Integer(), sa.ForeignKey("orders.id"), nullable=False),
        sa.Column("product_id", sa.Integer(), sa.ForeignKey("products.id"), nullable=False),
        sa.Column("quantity", sa.Integer(), nullable=False),
        sa.Column("unit_price", sa.Float(), nullable=False),
        sa.Column("subtotal", sa.Float(), nullable=False),
    )
    op.create_table(
        "complaints",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("order_item_id", sa.Integer(), sa.ForeignKey("order_items.id"), nullable=False),
        sa.Column("customer_id", sa.Integer(), sa.ForeignKey("customers.id"), nullable=False),
        sa.Column("product_id", sa.Integer(), sa.ForeignKey("products.id"), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("status", sa.String(20), nullable=False, server_default="open"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("complaints")
    op.drop_table("order_items")
    op.drop_table("orders")
    op.drop_table("customers")
    op.drop_table("products")
    op.drop_table("users")
    op.execute("DROP TYPE IF EXISTS user_role")
