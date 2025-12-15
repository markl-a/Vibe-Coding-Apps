"""
商品路由測試
測試商品的 CRUD 操作
"""
import pytest
from fastapi import status


@pytest.mark.integration
@pytest.mark.products
class TestGetProducts:
    """測試獲取商品列表"""

    def test_get_products_empty_list(self, client):
        """測試獲取空商品列表"""
        response = client.get("/api/v1/products/")

        assert response.status_code == status.HTTP_200_OK
        assert response.json() == []

    def test_get_products_with_data(self, client, test_products):
        """測試獲取商品列表"""
        response = client.get("/api/v1/products/")

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data) == 5
        assert all(isinstance(item, dict) for item in data)
        assert all("id" in item for item in data)
        assert all("name" in item for item in data)
        assert all("price" in item for item in data)

    def test_get_products_pagination(self, client, test_products):
        """測試商品列表分頁"""
        # 獲取前 3 個商品
        response = client.get("/api/v1/products/?skip=0&limit=3")

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data) == 3

        # 獲取接下來的 2 個商品
        response = client.get("/api/v1/products/?skip=3&limit=3")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data) == 2

    def test_get_products_only_active(self, client, db, test_category):
        """測試只返回活動商品"""
        from app.models.product import Product

        # 創建活動和非活動商品
        active_product = Product(
            name="Active Product",
            slug="active-product",
            description="Active",
            price=100.0,
            stock=10,
            image_url="http://example.com/img.jpg",
            is_active=True,
            category_id=test_category.id
        )
        inactive_product = Product(
            name="Inactive Product",
            slug="inactive-product",
            description="Inactive",
            price=100.0,
            stock=10,
            image_url="http://example.com/img.jpg",
            is_active=False,
            category_id=test_category.id
        )
        db.add_all([active_product, inactive_product])
        db.commit()

        response = client.get("/api/v1/products/")

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        # 應該只返回活動商品
        assert len(data) == 1
        assert data[0]["name"] == "Active Product"


@pytest.mark.integration
@pytest.mark.products
class TestGetProductById:
    """測試獲取單個商品"""

    def test_get_product_by_id_success(self, client, test_product):
        """測試成功獲取商品詳情"""
        response = client.get(f"/api/v1/products/{test_product.id}")

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["id"] == test_product.id
        assert data["name"] == test_product.name
        assert data["slug"] == test_product.slug
        assert data["price"] == test_product.price
        assert data["stock"] == test_product.stock
        assert data["description"] == test_product.description

    def test_get_product_by_id_not_found(self, client):
        """測試獲取不存在的商品"""
        response = client.get("/api/v1/products/nonexistent-id")

        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert "Product not found" in response.json()["detail"]

    def test_get_inactive_product_by_id(self, client, db, test_category):
        """測試獲取非活動商品（仍然可以通過 ID 訪問）"""
        from app.models.product import Product

        inactive_product = Product(
            name="Inactive Product",
            slug="inactive-product",
            description="Inactive",
            price=100.0,
            stock=10,
            image_url="http://example.com/img.jpg",
            is_active=False,
            category_id=test_category.id
        )
        db.add(inactive_product)
        db.commit()
        db.refresh(inactive_product)

        response = client.get(f"/api/v1/products/{inactive_product.id}")

        # 通過 ID 仍然可以訪問非活動商品
        assert response.status_code == status.HTTP_200_OK


@pytest.mark.integration
@pytest.mark.products
class TestCreateProduct:
    """測試創建商品"""

    def test_create_product_success(self, client, test_category):
        """測試成功創建商品"""
        product_data = {
            "name": "New Laptop",
            "slug": "new-laptop",
            "description": "A brand new laptop",
            "price": 1299.99,
            "stock": 15,
            "image_url": "https://example.com/new-laptop.jpg",
            "category_id": test_category.id
        }
        response = client.post("/api/v1/products/", json=product_data)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["name"] == product_data["name"]
        assert data["slug"] == product_data["slug"]
        assert data["price"] == product_data["price"]
        assert data["stock"] == product_data["stock"]
        assert data["is_active"] is True
        assert "id" in data

    def test_create_product_missing_fields(self, client):
        """測試缺少必填字段創建商品"""
        product_data = {
            "name": "Incomplete Product"
        }
        response = client.post("/api/v1/products/", json=product_data)

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    def test_create_product_invalid_price(self, client, test_category):
        """測試使用無效價格創建商品"""
        product_data = {
            "name": "Invalid Product",
            "slug": "invalid-product",
            "description": "Test",
            "price": "invalid_price",  # 字符串而不是數字
            "stock": 10,
            "image_url": "http://example.com/img.jpg",
            "category_id": test_category.id
        }
        response = client.post("/api/v1/products/", json=product_data)

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
