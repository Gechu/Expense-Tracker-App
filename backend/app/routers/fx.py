from datetime import date

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query, status

from app import models
from app.deps import get_current_user

router = APIRouter(prefix="/fx-rate", tags=["fx"])

FRANKFURTER_URL = "https://api.frankfurter.dev/v1/latest"

# Kursy zmieniają się raz dziennie (dane EBC), więc trzymamy je w pamięci
# procesu na dany dzień zamiast odpytywać Frankfurtera przy każdym kliknięciu.
_cache: dict[tuple[str, str], tuple[date, float]] = {}


@router.get("")
def get_fx_rate(
    from_: str = Query(..., alias="from"),
    to: str = Query(...),
    _user: models.User = Depends(get_current_user),
):
    from_currency = from_.upper()
    to_currency = to.upper()

    cache_key = (from_currency, to_currency)
    cached = _cache.get(cache_key)
    if cached and cached[0] == date.today():
        return {"rate": cached[1]}

    try:
        response = httpx.get(
            FRANKFURTER_URL,
            params={"base": from_currency, "symbols": to_currency},
            timeout=5.0,
        )
        response.raise_for_status()
        rate = response.json()["rates"][to_currency]
    except (httpx.HTTPError, KeyError) as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Nie udało się pobrać kursu waluty",
        ) from exc

    _cache[cache_key] = (date.today(), rate)
    return {"rate": rate}
