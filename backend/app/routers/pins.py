from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import models, schemas, service
from app.database import get_db
from app.deps import get_current_user
from app.routers.widgets import get_owned_widget

router = APIRouter(prefix="/pins", tags=["pins"])


def get_owned_pin(pin_id: int, db: Session, user: models.User) -> models.Pin:
    pin = db.query(models.Pin).filter(models.Pin.id == pin_id, models.Pin.user_id == user.id).first()
    if pin is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Przypięcie nie znalezione")
    return pin


@router.get("", response_model=list[schemas.PinOut])
def list_pins(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    pins = db.query(models.Pin).filter(models.Pin.user_id == user.id).order_by(models.Pin.position).all()
    return [service.pin_to_out(pin, pin.widget, db) for pin in pins]


@router.post("", response_model=schemas.PinOut, status_code=status.HTTP_201_CREATED)
def create_pin(
    payload: schemas.PinCreate,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    widget = get_owned_widget(payload.widget_id, db, user)

    existing = (
        db.query(models.Pin)
        .filter(models.Pin.user_id == user.id, models.Pin.widget_id == widget.id)
        .first()
    )
    if existing is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="To pole jest już przypięte")

    pin = models.Pin(user_id=user.id, widget_id=widget.id, position=payload.position)
    db.add(pin)
    db.commit()
    db.refresh(pin)
    return service.pin_to_out(pin, widget, db)


@router.patch("/{pin_id}", response_model=schemas.PinOut)
def update_pin(
    pin_id: int,
    payload: schemas.PinUpdate,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    pin = get_owned_pin(pin_id, db, user)
    pin.position = payload.position
    db.commit()
    db.refresh(pin)
    return service.pin_to_out(pin, pin.widget, db)


@router.delete("/{pin_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_pin(
    pin_id: int,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    pin = get_owned_pin(pin_id, db, user)
    db.delete(pin)
    db.commit()
