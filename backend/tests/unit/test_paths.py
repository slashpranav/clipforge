import pytest
from app.core.errors import AppError
from app.utils.paths import get_storage_root, resolve_safe_path


def test_safe_path_resolution():
    root = get_storage_root()
    safe = resolve_safe_path("uploads/user1/vid1/source.mp4")
    assert safe.is_relative_to(root)


def test_path_traversal_attack_blocked():
    with pytest.raises(AppError) as exc_info:
        resolve_safe_path("../../../Windows/System32/calc.exe")
    assert exc_info.value.code == "UNSAFE_PATH"
