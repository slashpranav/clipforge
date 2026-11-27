from typing import Annotated
from fastapi import Depends, Header, Query, status
from sqlalchemy.orm import Session

from app.core.errors import ForbiddenError, UnauthorizedError
from app.core.security import decode_access_token
from app.database.models.user import User
from app.database.session import get_db


def _resolve_user_from_token(db: Session, token: str) -> User:
    payload = decode_access_token(token)
    user_id = payload.get("sub")
    if not user_id:
        raise UnauthorizedError("Invalid token payload: missing subject.")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise UnauthorizedError("User associated with this token does not exist.")

    if not user.is_active:
        raise ForbiddenError("User account is inactive.")

    return user


async def get_current_user(
    db: Annotated[Session, Depends(get_db)],
    authorization: Annotated[str | None, Header()] = None,
) -> User:
    """Extract and validate JWT Bearer token, returning the authenticated user."""
    if not authorization:
        raise UnauthorizedError("Missing Authorization header.")

    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise UnauthorizedError("Invalid Authorization header format. Must be 'Bearer <token>'.")

    return _resolve_user_from_token(db, parts[1])


async def get_current_user_for_media(
    db: Annotated[Session, Depends(get_db)],
    authorization: Annotated[str | None, Header()] = None,
    token: Annotated[str | None, Query()] = None,
) -> User:
    """Authenticate via Authorization header or ?token= query parameter (for HTML video/download tags)."""
    if authorization:
        parts = authorization.split()
        if len(parts) == 2 and parts[0].lower() == "bearer":
            return _resolve_user_from_token(db, parts[1])
    if token:
        return _resolve_user_from_token(db, token)
    raise UnauthorizedError("Missing Authorization header or media token.")


async def get_current_active_user(
    current_user: Annotated[User, Depends(get_current_user)],
) -> User:
    return current_user
