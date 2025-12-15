"""
用戶路由測試
測試用戶相關的 API 操作
"""
import pytest
from fastapi import status


@pytest.mark.integration
@pytest.mark.users
class TestGetCurrentUser:
    """測試獲取當前用戶信息"""

    def test_get_current_user_success(self, client, auth_headers, test_user):
        """測試成功獲取當前用戶信息"""
        response = client.get("/api/v1/users/me", headers=auth_headers)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["id"] == test_user.id
        assert data["email"] == test_user.email
        assert data["username"] == test_user.username
        assert data["full_name"] == test_user.full_name
        assert data["is_active"] == test_user.is_active
        assert data["is_admin"] == test_user.is_admin
        assert "hashed_password" not in data  # 確保密碼不會被返回

    def test_get_current_user_without_auth(self, client):
        """測試未認證時獲取用戶信息"""
        response = client.get("/api/v1/users/me")

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_get_current_user_invalid_token(self, client):
        """測試使用無效 token 獲取用戶信息"""
        headers = {"Authorization": "Bearer invalid_token_123"}
        response = client.get("/api/v1/users/me", headers=headers)

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_get_current_user_admin(self, client, admin_headers, test_admin):
        """測試管理員獲取自己的信息"""
        response = client.get("/api/v1/users/me", headers=admin_headers)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["id"] == test_admin.id
        assert data["is_admin"] is True
        assert data["username"] == "admin"

    def test_get_current_user_malformed_auth_header(self, client):
        """測試使用格式錯誤的認證頭"""
        # 缺少 "Bearer" 前綴
        headers = {"Authorization": "invalid_format_token"}
        response = client.get("/api/v1/users/me", headers=headers)

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_get_current_user_empty_token(self, client):
        """測試使用空 token"""
        headers = {"Authorization": "Bearer "}
        response = client.get("/api/v1/users/me", headers=headers)

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_get_current_user_response_structure(self, client, auth_headers):
        """測試響應結構是否正確"""
        response = client.get("/api/v1/users/me", headers=auth_headers)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()

        # 確保包含所有必需字段
        required_fields = ["id", "email", "username", "full_name", "is_active", "is_admin"]
        for field in required_fields:
            assert field in data, f"Missing field: {field}"

        # 確保字段類型正確
        assert isinstance(data["id"], int)
        assert isinstance(data["email"], str)
        assert isinstance(data["username"], str)
        assert isinstance(data["full_name"], str)
        assert isinstance(data["is_active"], bool)
        assert isinstance(data["is_admin"], bool)


@pytest.mark.integration
@pytest.mark.users
class TestUserSecurity:
    """測試用戶安全相關功能"""

    def test_password_not_exposed_in_response(self, client, auth_headers):
        """測試密碼不會在響應中暴露"""
        response = client.get("/api/v1/users/me", headers=auth_headers)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()

        # 確保密碼相關字段不在響應中
        assert "password" not in data
        assert "hashed_password" not in data
        assert "pwd" not in data

    def test_user_info_isolation(self, client, test_user, test_admin, db):
        """測試用戶信息隔離 - 用戶只能看到自己的信息"""
        # 獲取普通用戶的 token
        response = client.post(
            "/api/v1/auth/login",
            data={
                "username": "testuser",
                "password": "testpassword123"
            }
        )
        user_token = response.json()["access_token"]
        user_headers = {"Authorization": f"Bearer {user_token}"}

        # 使用普通用戶 token 獲取用戶信息
        response = client.get("/api/v1/users/me", headers=user_headers)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()

        # 確保返回的是當前用戶的信息，不是其他用戶的
        assert data["username"] == "testuser"
        assert data["email"] == "test@example.com"
        assert data["is_admin"] is False

    def test_concurrent_user_requests(self, client, test_user, test_admin):
        """測試並發請求時的用戶認證"""
        # 獲取兩個不同的 token
        user_response = client.post(
            "/api/v1/auth/login",
            data={"username": "testuser", "password": "testpassword123"}
        )
        admin_response = client.post(
            "/api/v1/auth/login",
            data={"username": "admin", "password": "adminpassword123"}
        )

        user_token = user_response.json()["access_token"]
        admin_token = admin_response.json()["access_token"]

        # 使用不同的 token 獲取用戶信息
        user_info = client.get(
            "/api/v1/users/me",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        admin_info = client.get(
            "/api/v1/users/me",
            headers={"Authorization": f"Bearer {admin_token}"}
        )

        # 確保每個 token 返回正確的用戶信息
        assert user_info.json()["username"] == "testuser"
        assert admin_info.json()["username"] == "admin"
        assert user_info.json()["is_admin"] is False
        assert admin_info.json()["is_admin"] is True
