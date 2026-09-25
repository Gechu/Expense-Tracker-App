"""add users table

Revision ID: 040496cc2d5d
Revises:
Create Date: 2026-09-25 15:10:00.000000

Ta migracja nigdy nie trafiła do repo (tabela "users" powstawała poza
Alembikiem na lokalnej bazie deweloperskiej), więc 7d96ccdb0f6d - mimo że
referuje users.id przez FK - było zapisane jako pierwsza migracja
(down_revision=None). Na świeżej bazie to się wywala (UndefinedTable).
Odtworzone na podstawie app/models.py::User i tego, co b8be7b6fca8c
dokłada do "users" (name/avatar_color/avatar_icon - czyli nie było ich
jeszcze na tym etapie).
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '040496cc2d5d'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('hashed_password', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_users_id'), 'users', ['id'], unique=False)
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)


def downgrade() -> None:
    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.drop_index(op.f('ix_users_id'), table_name='users')
    op.drop_table('users')
