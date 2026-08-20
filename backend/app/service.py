from decimal import Decimal

from sqlalchemy.orm import Session

from app import models, schemas


def compute_widget_value(widget: models.Widget, db: Session) -> Decimal | None:
    if widget.type in ("single_value", "table"):
        return sum((entry.amount for entry in widget.entries), Decimal("0"))

    if widget.type == "currency":
        config = widget.config or {}
        amount = config.get("amount")
        rate = config.get("rate")
        if amount is None or rate is None:
            return None
        return Decimal(str(amount)) * Decimal(str(rate))

    if widget.type == "formula":
        config = widget.config or {}
        total = Decimal("0")
        for term in config.get("terms", []):
            ref_widget = db.query(models.Widget).filter(models.Widget.id == term.get("widget_id")).first()
            # widgety formułowe nie mogą się referencjonować nawzajem - unikamy cykli
            if ref_widget is None or ref_widget.type == "formula":
                continue
            value = compute_widget_value(ref_widget, db)
            sign = Decimal("-1") if term.get("sign") == "-" else Decimal("1")
            total += sign * (value or Decimal("0"))
        return total

    return None


def widget_to_out(widget: models.Widget, db: Session) -> schemas.WidgetOut:
    entries = sorted(widget.entries, key=lambda entry: entry.position)
    return schemas.WidgetOut(
        id=widget.id,
        tab_id=widget.tab_id,
        type=widget.type,
        label=widget.label,
        position=widget.position,
        config=widget.config,
        created_at=widget.created_at,
        updated_at=widget.updated_at,
        entries=[schemas.WidgetEntryOut.model_validate(entry) for entry in entries],
        value=compute_widget_value(widget, db),
    )


def tab_to_out(tab: models.Tab, db: Session) -> schemas.TabOut:
    widgets = sorted(tab.widgets, key=lambda widget: widget.position)
    return schemas.TabOut(
        id=tab.id,
        name=tab.name,
        color=tab.color,
        position=tab.position,
        created_at=tab.created_at,
        widgets=[widget_to_out(widget, db) for widget in widgets],
    )
