from sqlalchemy.orm import Session
from app.core.errors import AppError, UnauthorizedError
from app.core.security import create_access_token, hash_password, verify_password
from app.database.models.user import User
from app.schemas.auth import TokenResponse, UserLoginRequest, UserRegisterRequest, UserResponse


class AuthService:
    @staticmethod
    def register_user(db: Session, req: UserRegisterRequest) -> UserResponse:
        normalized_email = req.email.strip().lower()
        existing = db.query(User).filter(User.email == normalized_email).first()
        if existing:
            raise AppError(
                code="USER_ALREADY_EXISTS",
                message=f"A user with email '{normalized_email}' already exists.",
                status_code=409,
            )

        new_user = User(
            email=normalized_email,
            password_hash=hash_password(req.password),
            is_active=True,
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        return UserResponse.model_validate(new_user)

    @staticmethod
    def login_user(db: Session, req: UserLoginRequest) -> TokenResponse:
        normalized_email = req.email.strip().lower()
        user = db.query(User).filter(User.email == normalized_email).first()
        if not user or not verify_password(req.password, user.password_hash):
            raise UnauthorizedError("Invalid email or password.")

        if not user.is_active:
            raise AppError(code="USER_INACTIVE", message="User account is inactive.", status_code=403)

        token = create_access_token(subject=user.id, extra_claims={"email": user.email})
        return TokenResponse(access_token=token, expires_in_seconds=3600)
