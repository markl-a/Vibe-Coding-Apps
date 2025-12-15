"""
訂單路由測試
測試訂單的創建、查看和管理
"""
import pytest
from fastapi import status


@pytest.mark.integration
@pytest.mark.orders
class TestCreateOrder:
    """測試創建訂單"""

    def test_create_order_success(self, client, auth_headers, test_cart_with_items, test_product, db):
        """測試成功創建訂單"""
        order_data = {
            "shipping_address": "123 Test Street, Test City, 12345",
            "payment_method": "credit_card"
        }
        response = client.post("/api/v1/orders/", json=order_data, headers=auth_headers)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "id" in data
        assert data["status"] == "pending"
        assert data["shipping_address"] == order_data["shipping_address"]
        # 總價應該是 商品價格 * 數量
        expected_total = test_product.price * 2
        assert data["total_amount"] == expected_total

        # 驗證購物車已清空
        cart_response = client.get("/api/v1/cart/", headers=auth_headers)
        cart = cart_response.json()
        assert len(cart["items"]) == 0

        # 驗證商品庫存已更新
        from app.models.product import Product
        updated_product = db.query(Product).filter(Product.id == test_product.id).first()
        assert updated_product.stock == test_product.stock - 2

    def test_create_order_empty_cart(self, client, auth_headers):
        """測試從空購物車創建訂單"""
        order_data = {
            "shipping_address": "123 Test Street",
            "payment_method": "credit_card"
        }
        response = client.post("/api/v1/orders/", json=order_data, headers=auth_headers)

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "Cart is empty" in response.json()["detail"]

    def test_create_order_insufficient_stock(self, client, auth_headers, db, test_user, test_product):
        """測試創建訂單時庫存不足"""
        from app.models.cart import Cart, CartItem

        # 創建包含超過庫存數量商品的購物車
        cart = Cart(user_id=test_user.id)
        db.add(cart)
        db.commit()
        db.refresh(cart)

        # 設置購物車數量超過實際庫存
        cart_item = CartItem(
            cart_id=cart.id,
            product_id=test_product.id,
            quantity=test_product.stock + 5  # 超過庫存
        )
        db.add(cart_item)
        db.commit()

        order_data = {
            "shipping_address": "123 Test Street",
            "payment_method": "credit_card"
        }
        response = client.post("/api/v1/orders/", json=order_data, headers=auth_headers)

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "Insufficient stock" in response.json()["detail"]

    def test_create_order_without_authentication(self, client):
        """測試未認證用戶創建訂單"""
        order_data = {
            "shipping_address": "123 Test Street",
            "payment_method": "credit_card"
        }
        response = client.post("/api/v1/orders/", json=order_data)

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_create_order_missing_fields(self, client, auth_headers, test_cart_with_items):
        """測試缺少必填字段創建訂單"""
        order_data = {
            "shipping_address": "123 Test Street"
            # 缺少 payment_method
        }
        response = client.post("/api/v1/orders/", json=order_data, headers=auth_headers)

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    def test_create_order_with_multiple_items(self, client, auth_headers, db, test_user, test_products):
        """測試創建包含多個商品的訂單"""
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

        order_data = {
            "shipping_address": "123 Test Street",
            "payment_method": "credit_card"
        }
        response = client.post("/api/v1/orders/", json=order_data, headers=auth_headers)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["total_amount"] == expected_total


@pytest.mark.integration
@pytest.mark.orders
class TestGetOrders:
    """測試獲取訂單列表"""

    def test_get_orders_empty_list(self, client, auth_headers):
        """測試獲取空訂單列表"""
        response = client.get("/api/v1/orders/", headers=auth_headers)

        assert response.status_code == status.HTTP_200_OK
        assert response.json() == []

    def test_get_orders_with_data(self, client, auth_headers, test_order):
        """測試獲取用戶訂單列表"""
        response = client.get("/api/v1/orders/", headers=auth_headers)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data) == 1
        assert data[0]["id"] == test_order.id
        assert data[0]["total_amount"] == test_order.total_amount
        assert data[0]["status"] == test_order.status.value

    def test_get_orders_only_user_orders(self, client, auth_headers, admin_headers, test_order, db, test_admin, test_product):
        """測試只返回當前用戶的訂單"""
        from app.models.order import Order, OrderItem

        # 為管理員創建訂單
        admin_order = Order(
            user_id=test_admin.id,
            total_amount=500.0,
            status="pending",
            shipping_address="Admin Address",
            payment_method="paypal"
        )
        db.add(admin_order)
        db.commit()
        db.refresh(admin_order)

        order_item = OrderItem(
            order_id=admin_order.id,
            product_id=test_product.id,
            quantity=1,
            price=test_product.price
        )
        db.add(order_item)
        db.commit()

        # 使用普通用戶令牌獲取訂單
        response = client.get("/api/v1/orders/", headers=auth_headers)
        user_orders = response.json()

        # 使用管理員令牌獲取訂單
        admin_response = client.get("/api/v1/orders/", headers=admin_headers)
        admin_orders = admin_response.json()

        # 每個用戶應該只看到自己的訂單
        assert len(user_orders) == 1
        assert len(admin_orders) == 1
        assert user_orders[0]["id"] != admin_orders[0]["id"]

    def test_get_orders_without_authentication(self, client):
        """測試未認證用戶獲取訂單列表"""
        response = client.get("/api/v1/orders/")

        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.integration
@pytest.mark.orders
class TestGetOrderById:
    """測試獲取單個訂單"""

    def test_get_order_by_id_success(self, client, auth_headers, test_order):
        """測試成功獲取訂單詳情"""
        response = client.get(f"/api/v1/orders/{test_order.id}", headers=auth_headers)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["id"] == test_order.id
        assert data["total_amount"] == test_order.total_amount
        assert data["status"] == test_order.status.value
        assert data["shipping_address"] == test_order.shipping_address

    def test_get_order_by_id_not_found(self, client, auth_headers):
        """測試獲取不存在的訂單"""
        response = client.get("/api/v1/orders/nonexistent-order-id", headers=auth_headers)

        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert "Order not found" in response.json()["detail"]

    def test_get_order_by_id_wrong_user(self, client, admin_headers, test_order):
        """測試用戶無法訪問其他用戶的訂單"""
        # 使用管理員令牌嘗試訪問普通用戶的訂單
        response = client.get(f"/api/v1/orders/{test_order.id}", headers=admin_headers)

        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_get_order_by_id_without_authentication(self, client, test_order):
        """測試未認證用戶獲取訂單"""
        response = client.get(f"/api/v1/orders/{test_order.id}")

        assert response.status_code == status.HTTP_401_UNAUTHORIZED
