from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import models, schemas, service
from app.database import get_db
from app.deps import get_current_user
from app.models import utcnow
from app.routers.tabs import get_owned_tab

router = APIRouter(tags=["widgets"])


def get_owned_widget(widget_id: int, db: Session, user: models.User) -> models.Widget:
    widget = (
        db.query(models.Widget)
        .join(models.Tab)
        .filter(models.Widget.id == widget_id, models.Tab.user_id == user.id)
        .first()
    )
    if widget is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pole nie znalezione")
    return widget


def get_owned_entry(entry_id: int, db: Session, user: models.User) -> models.WidgetEntry:
    entry = (
        db.query(models.WidgetEntry)
        .join(models.Widget)
        .join(models.Tab)
        .filter(models.WidgetEntry.id == entry_id, models.Tab.user_id == user.id)
        .first()
    )
    if entry is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Wpis nie znaleziony")
    return entry


@router.post("/tabs/{tab_id}/widgets", response_model=schemas.WidgetOut, status_code=status.HTTP_201_CREATED)
def create_widget(
    tab_id: int,
    payload: schemas.WidgetCreate,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    get_owned_tab(tab_id, db, user)
    widget = models.Widget(
        tab_id=tab_id,
        type=payload.type,
        label=payload.label,
        position=payload.position,
        config=payload.config,
    )
    db.add(widget)
    db.commit()
    db.refresh(widget)
    return service.widget_to_out(widget, db)


@router.patch("/widgets/{widget_id}", response_model=schemas.WidgetOut)
def update_widget(
    widget_id: int,
    payload: schemas.WidgetUpdate,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    widget = get_owned_widget(widget_id, db, user)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(widget, field, value)
    db.commit()
    db.refresh(widget)
    return service.widget_to_out(widget, db)


@router.delete("/widgets/{widget_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_widget(
    widget_id: int,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    widget = get_owned_widget(widget_id, db, user)
    db.delete(widget)
    db.commit()


@router.post("/widgets/{widget_id}/entries", response_model=schemas.WidgetOut, status_code=status.HTTP_201_CREATED)
def create_entry(
    widget_id: int,
    payload: schemas.WidgetEntryCreate,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    widget = get_owned_widget(widget_id, db, user)
    entry = models.WidgetEntry(
        widget_id=widget.id,
        label=payload.label,
        amount=payload.amount,
        entry_date=payload.entry_date,
        position=payload.position,
    )
    db.add(entry)
    widget.updated_at = utcnow()
    db.commit()
    db.refresh(widget)
    return service.widget_to_out(widget, db)


@router.patch("/entries/{entry_id}", response_model=schemas.WidgetOut)
def update_entry(
    entry_id: int,
    payload: schemas.WidgetEntryUpdate,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    entry = get_owned_entry(entry_id, db, user)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(entry, field, value)
    entry.widget.updated_at = utcnow()
    db.commit()
    db.refresh(entry.widget)
    return service.widget_to_out(entry.widget, db)


@router.delete("/entries/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_entry(
    entry_id: int,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    entry = get_owned_entry(entry_id, db, user)
    widget = entry.widget
    db.delete(entry)
    widget.updated_at = utcnow()
    db.commit()
