"""add google oauth support

Revision ID: 002
Revises: 001
Create Date: 2026-06-20
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column("users", "phone", nullable=True)
    op.execute("ALTER TYPE user_role ADD VALUE 'pending'")


def downgrade() -> None:
    op.execute("DELETE FROM users WHERE role = 'pending'")
    op.execute("ALTER TYPE user_role RENAME TO user_role_old")
    op.execute("CREATE TYPE user_role AS ENUM('buyer', 'seller')")
    op.execute("ALTER TABLE users ALTER COLUMN role TYPE user_role USING role::text::user_role")
    op.execute("DROP TYPE user_role_old")
    op.alter_column("users", "phone", nullable=False)
