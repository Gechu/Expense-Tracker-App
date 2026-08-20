from fastapi import Cookie, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import models
from app.database import get_db
from app.security import decode_access_token


def get_current_user(
    access_token: str | None = Cookie(default=None),
    db: Session = Depends(get_db),
) -> models.User:
    unauthorized = HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

    if access_token is None:
        raise unauthorized

    payload = decode_access_token(access_token)
    if payload is None:
        raise unauthorized

    user = db.query(models.User).filter(models.User.id == int(payload["sub"])).first()
    if user is None:
        raise unauthorized

    return user
