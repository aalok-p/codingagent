from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import orm

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.auth import (
    GoogleAuthResponse,
    GoogleLoginRequest,
    LoginRequest,
    RoleUpdateRequest,
    SignupRequest,
    TokenResponse,
)
from app.utils.security import create_access_token, hash_password, verify_password, verify_google_token

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def signup(req: SignupRequest, db: orm.Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == req.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with this email already exists",
        )

    user = User(
        full_name=req.full_name,
        email=req.email,
        phone=req.phone,
        password_hash=hash_password(req.password),
        role=req.role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": str(user.id), "role": user.role})
    return TokenResponse(access_token=token, user_id=user.id, role=user.role)


@router.post("/google", response_model=GoogleAuthResponse)
def google_login(req: GoogleLoginRequest, db: orm.Session = Depends(get_db)):
    info = verify_google_token(req.id_token)
    if info is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Google token",
        )

    google_id = info.get("sub")
    email = info.get("email", "")
    full_name = info.get("name", "")

    if not google_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid Google token payload",
        )

    user = db.query(User).filter(User.google_id == google_id).first()
    if user:
        token = create_access_token({"sub": str(user.id), "role": user.role})
        return GoogleAuthResponse(
            access_token=token,
            user_id=user.id,
            role=user.role,
            role_pending=False,
        )

    existing_by_email = db.query(User).filter(User.email == email).first()
    if existing_by_email:
        existing_by_email.google_id = google_id
        db.commit()
        db.refresh(existing_by_email)
        token = create_access_token({"sub": str(existing_by_email.id), "role": existing_by_email.role})
        return GoogleAuthResponse(
            access_token=token,
            user_id=existing_by_email.id,
            role=existing_by_email.role,
            role_pending=False,
        )

    user = User(
        full_name=full_name,
        email=email,
        phone=None,
        password_hash=None,
        google_id=google_id,
        role="pending",
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": str(user.id), "role": "pending"})
    return GoogleAuthResponse(
        access_token=token,
        user_id=user.id,
        role="pending",
        role_pending=True,
    )


@router.patch("/role", response_model=TokenResponse)
def update_role(
    req: RoleUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: orm.Session = Depends(get_db),
):
    if current_user.role != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Role already assigned",
        )

    current_user.role = req.role
    db.commit()
    db.refresh(current_user)

    token = create_access_token({"sub": str(current_user.id), "role": current_user.role})
    return TokenResponse(access_token=token, user_id=current_user.id, role=current_user.role)


@router.post("/login", response_model=TokenResponse)
def login(req: LoginRequest, db: orm.Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    if not user or not user.password_hash:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not verify_password(req.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    token = create_access_token({"sub": str(user.id), "role": user.role})
    return TokenResponse(access_token=token, user_id=user.id, role=user.role)
