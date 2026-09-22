from decimal import Decimal, DivisionByZero, InvalidOperation

from sqlalchemy.orm import Session

from app import models, schemas


def _evaluate_tokens(tokens: list[dict], db: Session, seen: frozenset[int]) -> Decimal:
    """Rekurencyjny parser wyrażenia formuły (pola, liczby, + - * / oraz nawiasy),
    z klasycznym priorytetem działań: factor -> term -> expr."""
    pos = [0]

    def peek() -> dict | None:
        return tokens[pos[0]] if pos[0] < len(tokens) else None

    def consume() -> dict:
        tok = tokens[pos[0]]
        pos[0] += 1
        return tok

    def factor() -> Decimal:
        tok = peek()
        if tok is None:
            return Decimal("0")

        if tok["kind"] == "op" and tok["value"] == "(":
            consume()
            value = expr()
            if peek() is not None and peek()["kind"] == "op" and peek()["value"] == ")":
                consume()
            return value

        if tok["kind"] == "op" and tok["value"] == "-":
            consume()
            return -factor()

        if tok["kind"] == "op" and tok["value"] == "+":
            consume()
            return factor()

        if tok["kind"] == "number":
            consume()
            try:
                return Decimal(str(tok["value"]))
            except InvalidOperation:
                return Decimal("0")

        if tok["kind"] == "field":
            consume()
            widget_id = tok.get("widget_id")
            if widget_id in seen:
                return Decimal("0")
            ref_widget = db.query(models.Widget).filter(models.Widget.id == widget_id).first()
            if ref_widget is None:
                return Decimal("0")
            # UWAGA: przekazujemy "seen" bez dodawania widget_id - to compute_widget_value
            # samo doda swoje id do seen, jeśli i tylko jeśli będzie dalej rekurencyjnie
            # liczyć WŁASNĄ formułę. Dodanie go tutaj z góry sprawiałoby, że widget
            # natychmiast "widziałby sam siebie" i zawsze zwracał 0.
            return compute_widget_value(ref_widget, db, seen) or Decimal("0")

        # nierozpoznany token (np. samotny ")") - pomijamy
        consume()
        return Decimal("0")

    def term() -> Decimal:
        value = factor()
        while True:
            tok = peek()
            if tok is not None and tok["kind"] == "op" and tok["value"] in ("*", "/"):
                op = consume()["value"]
                right = factor()
                if op == "*":
                    value = value * right
                else:
                    try:
                        value = value / right
                    except (DivisionByZero, InvalidOperation):
                        value = Decimal("0")
            else:
                break
        return value

    def expr() -> Decimal:
        value = term()
        while True:
            tok = peek()
            if tok is not None and tok["kind"] == "op" and tok["value"] in ("+", "-"):
                op = consume()["value"]
                right = term()
                value = value + right if op == "+" else value - right
            else:
                break
        return value

    return expr()


def compute_widget_value(
    widget: models.Widget, db: Session, seen: frozenset[int] = frozenset()
) -> Decimal | None:
    # widget odwołujący się (bezpośrednio lub przez łańcuch formuł) do samego siebie -
    # przerywamy tutaj, żeby uniknąć nieskończonej rekurencji
    if widget.id in seen:
        return Decimal("0")

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
        tokens = config.get("tokens", [])
        return _evaluate_tokens(tokens, db, seen | {widget.id})

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


def pin_to_out(pin: models.Pin, widget: models.Widget, db: Session) -> schemas.PinOut:
    tab = widget.tab
    return schemas.PinOut(
        id=pin.id,
        position=pin.position,
        tab_id=tab.id,
        tab_name=tab.name,
        tab_color=tab.color,
        widget=widget_to_out(widget, db),
    )


def tab_to_out(tab: models.Tab, db: Session) -> schemas.TabOut:
    widgets = sorted(tab.widgets, key=lambda widget: widget.position)
    return schemas.TabOut(
        id=tab.id,
        name=tab.name,
        color=tab.color,
        position=tab.position,
        is_home=tab.is_home,
        created_at=tab.created_at,
        widgets=[widget_to_out(widget, db) for widget in widgets],
    )
