from datetime import timedelta
import pytest

from app.core.errors import UnauthorizedError
from app.core.security import (
    create_access_token,
    decode_access_token,
    hash_password,
    verify_password,
)


def test_argon2_password_hashing():
    raw_pass = "SecurePassphrase123$"
    hashed = hash_password(raw_pass)
    assert hashed != raw_pass
    assert hashed.startswith("$argon2")
    assert verify_password(raw_pass, hashed) is True
    assert verify_password("WrongPassword!", hashed) is False


def test_jwt_token_generation_and_decoding():
    token = create_access_token(subject="user-12345", extra_claims={"role": "creator"})
    payload = decode_access_token(token)
    assert payload["sub"] == "user-12345"
    assert payload["role"] == "creator"
    assert "exp" in payload


def test_jwt_expired_token_raises_unauthorized():
    expired_token = create_access_token(subject="user-12345", expires_delta=timedelta(seconds=-10))
    with pytest.raises(UnauthorizedError) as exc_info:
        decode_access_token(expired_token)
    assert "expired" in str(exc_info.value).lower()
