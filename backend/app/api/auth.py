from typing import Annotated
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.database.models.user import User
from app.database.session import get_db
from app.schemas.auth import TokenResponse, UserLoginRequest, UserRegisterRequest, UserResponse
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=UserResponse, status_code=201)
def register(
    req: UserRegisterRequest,
    db: Annotated[Session, Depends(get_db)],
):
    """Register a new user account."""
    return AuthService.register_user(db, req)


@router.post("/login", response_model=TokenResponse)
def login(
    req: UserLoginRequest,
    db: Annotated[Session, Depends(get_db)],
):
    """Log in and retrieve JWT Bearer access token."""
    return AuthService.login_user(db, req)


@router.get("/me", response_model=UserResponse)
def get_current_user_profile(
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Retrieve profile of currently authenticated user."""
    return UserResponse.model_validate(current_user)


@router.post("/logout")
def logout(
    current_user: Annotated[User, Depends(get_current_user)],
):
    """
    Stateless JWT logout.
    Client should discard access token from local storage or cookie.
    """
    return {"message": "Logged out successfully. Please remove token on client."}
