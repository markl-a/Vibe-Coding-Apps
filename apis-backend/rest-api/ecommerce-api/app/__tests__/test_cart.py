"""
購物車路由測試
測試購物車的添加、查看和刪除操作
"""
import pytest
from fastapi import status


@pytest.mark.integration
@pytest.mark.cart
class TestAddToCart:
    """測試添加商品到購物車"""

    def test_add_to_cart_success(self, client, auth_headers, test_product):
        """測試成功添加商品到購物車"""
        cart_data = {
            "product_id": test_product.id,
            "quantity": 2
        }
        response = client.post("/api/v1/cart/add", json=cart_data, headers=auth_headers)

        assert response.status_code == status.HTTP_200_OK
        assert "message" in response.json()
        assert "added to cart" in response.json()["message"].lower()

    def test_add_to_cart_creates_cart_if_not_exists(self, client, auth_headers, test_product, db):
        """測試如果購物車不存在則自動創建"""
        from app.models.cart import Cart

        # 確保用戶沒有購物車
        existing_carts = db.query(Cart).all()
        for cart in existing_carts:
            db.delete(cart)
        db.commit()

        cart_data = {
            "product_id": test_product.id,
            "quantity": 1
        }
        response = client.post("/api/v1/cart/add", json=cart_data, headers=auth_headers)

        assert response.status_code == status.HTTP_200_OK

        # 驗證購物車已創建
        cart = db.query(Cart).first()
        assert cart is not None

    def test_add_to_cart_product_not_found(self, client, auth_headers):
        """測試添加不存在的商品到購物車"""
        cart_data = {
            "product_id": "nonexistent-product-id",
            "quantity": 1
        }
        response = client.post("/api/v1/cart/add", json=cart_data, headers=auth_headers)

        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert "Product not found" in response.json()["detail"]

    def test_add_to_cart_insufficient_stock(self, client, auth_headers, test_product):
        """測試添加超過庫存數量的商品"""
        cart_data = {
            "product_id": test_product.id,
            "quantity": 999  # 超過庫存
        }
        response = client.post("/api/v1/cart/add", json=cart_data, headers=auth_headers)

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "Insufficient stock" in response.json()["detail"]

    def test_add_to_cart_update_existing_item(self, client, auth_headers, test_cart_with_items, test_product):
        """測試更新購物車中已存在的商品數量"""
        # 再次添加相同商品
        cart_data = {
            "product_id": test_product.id,
            "quantity": 1
        }
        response = client.post("/api/v1/cart/add", json=cart_data, headers=auth_headers)

        assert response.status_code == status.HTTP_200_OK

        # 獲取購物車驗證數量已更新
        response = client.get("/api/v1/cart/", headers=auth_headers)
        cart = response.json()
        # 原本是 2，現在應該是 3
        assert cart["items"][0]["quantity"] == 3

    def test_add_to_cart_without_authentication(self, client, test_product):
        """測試未認證用戶添加商品到購物車"""
        cart_data = {
            "product_id": test_product.id,
            "quantity": 1
        }
        response = client.post("/api/v1/cart/add", json=cart_data)

        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.integration
@pytest.mark.cart
class TestGetCart:
    """測試獲取購物車"""

    def test_get_empty_cart(self, client, auth_headers):
        """測試獲取空購物車"""
        response = client.get("/api/v1/cart/", headers=auth_headers)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["items"] == []
        assert data["total"] == 0

    def test_get_cart_with_items(self, client, auth_headers, test_cart_with_items, test_product):
        """測試獲取包含商品的購物車"""
        response = client.get("/api/v1/cart/", headers=auth_headers)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data["items"]) == 1
        assert data["items"][0]["product_id"] == test_product.id
        assert data["items"][0]["quantity"] == 2
        assert data["items"][0]["product_name"] == test_product.name
        assert data["items"][0]["product_price"] == test_product.price
        # 總價應該是 價格 * 數量
        assert data["total"] == test_product.price * 2

    def test_get_cart_without_authentication(self, client):
        """測試未認證用戶獲取購物車"""
        response = client.get("/api/v1/cart/")

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_get_cart_calculates_total_correctly(self, client, auth_headers, db, test_user, test_products):
        """測試購物車正確計算總價"""
        from app.models.cart import Cart, CartItem

        # 創建包含多個商品的購物車
        cart = Cart(user_id=test_user.id)
        db.add(cart)
        db.commit()
        db.refresh(cart)

        expected_total = 0
        for i, product in enumerate(test_products[:3]):
            quantity = i + 1
            cart_item = CartItem(
                cart_id=cart.id,
                product_id=product.id,
                quantity=quantity
            )
            db.add(cart_item)
            expected_total += product.price * quantity

        db.commit()

        response = client.get("/api/v1/cart/", headers=auth_headers)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data["items"]) == 3
        assert data["total"] == expected_total


@pytest.mark.integration
@pytest.mark.cart
class TestRemoveFromCart:
    """測試從購物車移除商品"""

    def test_remove_from_cart_success(self, client, auth_headers, test_cart_with_items):
        """測試成功從購物車移除商品"""
        cart_item_id = test_cart_with_items.items[0].id

        response = client.delete(f"/api/v1/cart/{cart_item_id}", headers=auth_headers)

        assert response.status_code == status.HTTP_200_OK
        assert "removed from cart" in response.json()["message"].lower()

        # 驗證商品已被移除
        response = client.get("/api/v1/cart/", headers=auth_headers)
        cart = response.json()
        assert len(cart["items"]) == 0

    def test_remove_from_cart_item_not_found(self, client, auth_headers):
        """測試移除不存在的購物車商品"""
        response = client.delete("/api/v1/cart/nonexistent-item-id", headers=auth_headers)

        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert "Cart item not found" in response.json()["detail"]

    def test_remove_from_cart_wrong_user(self, client, db, test_admin, test_cart_with_items):
        """測試用戶無法移除其他用戶購物車中的商品"""
        # 使用管理員令牌嘗試移除測試用戶的購物車商品
        login_response = client.post(
            "/api/v1/auth/login",
            data={"username": "admin", "password": "adminpassword123"}
        )
        admin_token = login_response.json()["access_token"]
        admin_headers = {"Authorization": f"Bearer {admin_token}"}

        cart_item_id = test_cart_with_items.items[0].id

        response = client.delete(f"/api/v1/cart/{cart_item_id}", headers=admin_headers)

        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_remove_from_cart_without_authentication(self, client, test_cart_with_items):
        """測試未認證用戶移除購物車商品"""
        cart_item_id = test_cart_with_items.items[0].id

        response = client.delete(f"/api/v1/cart/{cart_item_id}")

        assert response.status_code == status.HTTP_401_UNAUTHORIZED
