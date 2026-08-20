from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import models, schemas, service
from app.database import get_db
from app.deps import get_current_user

router = APIRouter(prefix="/tabs", tags=["tabs"])


def get_owned_tab(tab_id: int, db: Session, user: models.User) -> models.Tab:
    tab = db.query(models.Tab).filter(models.Tab.id == tab_id, models.Tab.user_id == user.id).first()
    if tab is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Zakładka nie znaleziona")
    return tab


@router.get("", response_model=list[schemas.TabOut])
def list_tabs(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    tabs = db.query(models.Tab).filter(models.Tab.user_id == user.id).order_by(models.Tab.position).all()
    return [service.tab_to_out(tab, db) for tab in tabs]


@router.post("", response_model=schemas.TabOut, status_code=status.HTTP_201_CREATED)
def create_tab(
    payload: schemas.TabCreate,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    tab = models.Tab(user_id=user.id, name=payload.name, color=payload.color, position=payload.position)
    db.add(tab)
    db.commit()
    db.refresh(tab)
    return service.tab_to_out(tab, db)


@router.patch("/{tab_id}", response_model=schemas.TabOut)
def update_tab(
    tab_id: int,
    payload: schemas.TabUpdate,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    tab = get_owned_tab(tab_id, db, user)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(tab, field, value)
    db.commit()
    db.refresh(tab)
    return service.tab_to_out(tab, db)


@router.delete("/{tab_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_tab(
    tab_id: int,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    tab = get_owned_tab(tab_id, db, user)
    db.delete(tab)
    db.commit()
