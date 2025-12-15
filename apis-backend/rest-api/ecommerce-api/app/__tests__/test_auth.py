"""
認證路由測試
測試用戶註冊、登錄和令牌驗證
"""
import pytest
from fastapi import status


@pytest.mark.integration
@pytest.mark.auth
class TestUserRegistration:
    """測試用戶註冊功能"""

    def test_register_new_user_success(self, client):
        """測試成功註冊新用戶"""
        user_data = {
            "email": "newuser@example.com",
            "username": "newuser",
            "password": "newpassword123",
            "full_name": "New User"
        }
        response = client.post("/api/v1/auth/register", json=user_data)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["email"] == user_data["email"]
        assert data["username"] == user_data["username"]
        assert data["full_name"] == user_data["full_name"]
        assert data["is_active"] is True
        assert data["is_admin"] is False
        assert "id" in data
        assert "created_at" in data
        assert "hashed_password" not in data

    def test_register_duplicate_email(self, client, test_user):
        """測試使用重複郵箱註冊"""
        user_data = {
            "email": test_user.email,
            "username": "differentusername",
            "password": "password123",
            "full_name": "Test"
        }
        response = client.post("/api/v1/auth/register", json=user_data)

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "Email already registered" in response.json()["detail"]

    def test_register_duplicate_username(self, client, test_user):
        """測試使用重複用戶名註冊"""
        user_data = {
            "email": "different@example.com",
            "username": test_user.username,
            "password": "password123",
            "full_name": "Test"
        }
        response = client.post("/api/v1/auth/register", json=user_data)

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "Username already taken" in response.json()["detail"]

    def test_register_invalid_email(self, client):
        """測試使用無效郵箱註冊"""
        user_data = {
            "email": "invalid-email",
            "username": "newuser",
            "password": "password123",
            "full_name": "Test"
        }
        response = client.post("/api/v1/auth/register", json=user_data)

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    def test_register_missing_required_fields(self, client):
        """測試缺少必填字段的註冊"""
        user_data = {
            "email": "test@example.com"
        }
        response = client.post("/api/v1/auth/register", json=user_data)

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


@pytest.mark.integration
@pytest.mark.auth
class TestUserLogin:
    """測試用戶登錄功能"""

    def test_login_success(self, client, test_user):
        """測試成功登錄"""
        login_data = {
            "username": "testuser",
            "password": "testpassword123"
        }
        response = client.post("/api/v1/auth/login", data=login_data)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert len(data["access_token"]) > 0

    def test_login_incorrect_password(self, client, test_user):
        """測試使用錯誤密碼登錄"""
        login_data = {
            "username": "testuser",
            "password": "wrongpassword"
        }
        response = client.post("/api/v1/auth/login", data=login_data)

        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert "Incorrect username or password" in response.json()["detail"]

    def test_login_nonexistent_user(self, client):
        """測試不存在的用戶登錄"""
        login_data = {
            "username": "nonexistentuser",
            "password": "password123"
        }
        response = client.post("/api/v1/auth/login", data=login_data)

        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert "Incorrect username or password" in response.json()["detail"]

    def test_login_missing_credentials(self, client):
        """測試缺少憑證的登錄"""
        response = client.post("/api/v1/auth/login", data={})

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


@pytest.mark.integration
@pytest.mark.auth
class TestAuthentication:
    """測試認證中間件"""

    def test_access_protected_route_with_valid_token(self, client, auth_headers):
        """測試使用有效令牌訪問受保護的路由"""
        response = client.get("/api/v1/cart/", headers=auth_headers)

        # 應該能夠訪問（可能返回空購物車）
        assert response.status_code in [status.HTTP_200_OK]

    def test_access_protected_route_without_token(self, client):
        """測試不帶令牌訪問受保護的路由"""
        response = client.get("/api/v1/cart/")

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_access_protected_route_with_invalid_token(self, client):
        """測試使用無效令牌訪問受保護的路由"""
        headers = {"Authorization": "Bearer invalid_token_here"}
        response = client.get("/api/v1/cart/", headers=headers)

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_access_protected_route_with_malformed_header(self, client):
        """測試使用格式錯誤的認證頭訪問受保護的路由"""
        headers = {"Authorization": "InvalidFormat token123"}
        response = client.get("/api/v1/cart/", headers=headers)

        assert response.status_code == status.HTTP_401_UNAUTHORIZED
