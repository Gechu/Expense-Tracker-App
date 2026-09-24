from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db
from app.deps import get_current_user
from app.security import create_access_token, hash_password, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])

COOKIE_NAME = "access_token"
COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7  # 7 dni


def set_auth_cookie(response: Response, user_id: int) -> None:
    token = create_access_token(subject=str(user_id))
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        httponly=True,
        samesite="lax",
        secure=False,  # ustawić na True w produkcji (wymaga HTTPS)
        max_age=COOKIE_MAX_AGE_SECONDS,
        path="/",
    )


@router.post("/register", response_model=schemas.UserOut, status_code=status.HTTP_201_CREATED)
def register(payload: schemas.UserCreate, response: Response, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.email == payload.email).first()
    if existing is not None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email już zarejestrowany")

    user = models.User(email=payload.email, hashed_password=hash_password(payload.password), name=payload.name)
    db.add(user)
    db.commit()
    db.refresh(user)

    home_tab = models.Tab(user_id=user.id, name="Strona główna", color="#3fbf94", position=0, is_home=True)
    db.add(home_tab)
    db.commit()

    set_auth_cookie(response, user.id)
    return user


@router.post("/login", response_model=schemas.UserOut)
def login(payload: schemas.UserLogin, response: Response, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == payload.email).first()
    if user is None or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Nieprawidłowy email lub hasło")

    set_auth_cookie(response, user.id)
    return user


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(response: Response):
    response.delete_cookie(COOKIE_NAME, path="/")


@router.get("/me", response_model=schemas.UserOut)
def me(current_user: models.User = Depends(get_current_user)):
    return current_user


@router.patch("/me", response_model=schemas.UserOut)
def update_me(
    payload: schemas.UserUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(current_user, field, value)
    db.commit()
    db.refresh(current_user)
    return current_user


@router.post("/me/password", status_code=status.HTTP_204_NO_CONTENT)
def change_password(
    payload: schemas.PasswordChange,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if not verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Nieprawidłowe obecne hasło")

    current_user.hashed_password = hash_password(payload.new_password)
    db.commit()


@router.post("/me/email", response_model=schemas.UserOut)
def change_email(
    payload: schemas.EmailChange,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if not verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Nieprawidłowe hasło")

    existing = db.query(models.User).filter(models.User.email == payload.new_email).first()
    if existing is not None and existing.id != current_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Ten adres e-mail jest już zajęty")

    current_user.email = payload.new_email
    db.commit()
    db.refresh(current_user)
    return current_user


@router.post("/me/delete", status_code=status.HTTP_204_NO_CONTENT)
def delete_account(
    payload: schemas.AccountDelete,
    response: Response,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if not verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Nieprawidłowe hasło")

    db.delete(current_user)
    db.commit()
    response.delete_cookie(COOKIE_NAME, path="/")
