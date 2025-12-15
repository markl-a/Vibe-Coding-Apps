"""
安全模組單元測試
測試密碼哈希和 JWT token 功能
"""
import pytest
from datetime import timedelta
from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    decode_access_token
)


@pytest.mark.unit
@pytest.mark.security
class TestPasswordHashing:
    """測試密碼哈希功能"""

    def test_get_password_hash(self):
        """測試密碼哈希生成"""
        password = "testpassword123"
        hashed = get_password_hash(password)

        assert hashed is not None
        assert hashed != password
        assert len(hashed) > 0

    def test_verify_password_correct(self):
        """測試正確密碼驗證"""
        password = "testpassword123"
        hashed = get_password_hash(password)

        assert verify_password(password, hashed) is True

    def test_verify_password_incorrect(self):
        """測試錯誤密碼驗證"""
        password = "testpassword123"
        wrong_password = "wrongpassword"
        hashed = get_password_hash(password)

        assert verify_password(wrong_password, hashed) is False

    def test_different_hashes_for_same_password(self):
        """測試相同密碼生成不同哈希值（因為鹽值不同）"""
        password = "testpassword123"
        hash1 = get_password_hash(password)
        hash2 = get_password_hash(password)

        assert hash1 != hash2
        assert verify_password(password, hash1)
        assert verify_password(password, hash2)


@pytest.mark.unit
@pytest.mark.security
class TestJWTTokens:
    """測試 JWT token 功能"""

    def test_create_access_token_default_expiry(self):
        """測試創建具有默認過期時間的訪問令牌"""
        data = {"sub": "testuser"}
        token = create_access_token(data)

        assert token is not None
        assert isinstance(token, str)
        assert len(token) > 0

    def test_create_access_token_custom_expiry(self):
        """測試創建具有自定義過期時間的訪問令牌"""
        data = {"sub": "testuser"}
        expires_delta = timedelta(minutes=60)
        token = create_access_token(data, expires_delta=expires_delta)

        assert token is not None
        assert isinstance(token, str)

    def test_decode_access_token_valid(self):
        """測試解碼有效的訪問令牌"""
        data = {"sub": "testuser", "user_id": "123"}
        token = create_access_token(data)
        decoded = decode_access_token(token)

        assert decoded is not None
        assert decoded["sub"] == "testuser"
        assert decoded["user_id"] == "123"
        assert "exp" in decoded

    def test_decode_access_token_invalid(self):
        """測試解碼無效的訪問令牌"""
        invalid_token = "invalid.token.here"
        decoded = decode_access_token(invalid_token)

        assert decoded is None

    def test_decode_access_token_expired(self):
        """測試解碼過期的訪問令牌"""
        data = {"sub": "testuser"}
        # 創建已過期的令牌（負數時間差）
        expires_delta = timedelta(seconds=-1)
        token = create_access_token(data, expires_delta=expires_delta)
        decoded = decode_access_token(token)

        # 過期的令牌應返回 None
        assert decoded is None

    def test_create_token_with_multiple_claims(self):
        """測試創建包含多個聲明的令牌"""
        data = {
            "sub": "testuser",
            "user_id": "123",
            "email": "test@example.com",
            "is_admin": False
        }
        token = create_access_token(data)
        decoded = decode_access_token(token)

        assert decoded is not None
        assert decoded["sub"] == "testuser"
        assert decoded["user_id"] == "123"
        assert decoded["email"] == "test@example.com"
        assert decoded["is_admin"] is False
