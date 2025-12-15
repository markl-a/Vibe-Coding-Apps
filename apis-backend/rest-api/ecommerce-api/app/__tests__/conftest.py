"""
測試配置和夾具
提供測試所需的數據庫、客戶端和模擬數據
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from typing import Generator
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from app.core.database import Base, get_db
from app.core.security import get_password_hash
from app.models.user import User
from app.models.product import Product, Category
from app.models.cart import Cart, CartItem
from app.models.order import Order, OrderItem, OrderStatus
from main import app

# 使用內存 SQLite 數據庫進行測試
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db() -> Generator:
    """創建測試數據庫會話"""
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db) -> Generator:
    """創建測試客戶端"""
    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def test_user(db) -> User:
    """創建測試用戶"""
    user = User(
        email="test@example.com",
        username="testuser",
        full_name="Test User",
        hashed_password=get_password_hash("testpassword123"),
        is_active=True,
        is_admin=False
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def test_admin(db) -> User:
    """創建測試管理員"""
    admin = User(
        email="admin@example.com",
        username="admin",
        full_name="Admin User",
        hashed_password=get_password_hash("adminpassword123"),
        is_active=True,
        is_admin=True
    )
    db.add(admin)
    db.commit()
    db.refresh(admin)
    return admin


@pytest.fixture
def auth_headers(client, test_user) -> dict:
    """獲取認證頭"""
    response = client.post(
        "/api/v1/auth/login",
        data={
            "username": "testuser",
            "password": "testpassword123"
        }
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def admin_headers(client, test_admin) -> dict:
    """獲取管理員認證頭"""
    response = client.post(
        "/api/v1/auth/login",
        data={
            "username": "admin",
            "password": "adminpassword123"
        }
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def test_category(db) -> Category:
    """創建測試分類"""
    category = Category(
        name="Electronics",
        slug="electronics",
        description="Electronic products"
    )
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


@pytest.fixture
def test_product(db, test_category) -> Product:
    """創建測試商品"""
    product = Product(
        name="Test Laptop",
        slug="test-laptop",
        description="A great laptop for testing",
        price=999.99,
        stock=10,
        image_url="https://example.com/laptop.jpg",
        is_active=True,
        category_id=test_category.id
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


@pytest.fixture
def test_products(db, test_category) -> list:
    """創建多個測試商品"""
    products = []
    for i in range(5):
        product = Product(
            name=f"Test Product {i}",
            slug=f"test-product-{i}",
            description=f"Test product {i} description",
            price=100.0 * (i + 1),
            stock=10 + i,
            image_url=f"https://example.com/product{i}.jpg",
            is_active=True,
            category_id=test_category.id
        )
        db.add(product)
        products.append(product)
    db.commit()
    for product in products:
        db.refresh(product)
    return products


@pytest.fixture
def test_cart(db, test_user) -> Cart:
    """創建測試購物車"""
    cart = Cart(user_id=test_user.id)
    db.add(cart)
    db.commit()
    db.refresh(cart)
    return cart


@pytest.fixture
def test_cart_with_items(db, test_user, test_product) -> Cart:
    """創建包含商品的測試購物車"""
    cart = Cart(user_id=test_user.id)
    db.add(cart)
    db.commit()
    db.refresh(cart)

    cart_item = CartItem(
        cart_id=cart.id,
        product_id=test_product.id,
        quantity=2
    )
    db.add(cart_item)
    db.commit()
    db.refresh(cart)
    return cart


@pytest.fixture
def test_order(db, test_user, test_product) -> Order:
    """創建測試訂單"""
    order = Order(
        user_id=test_user.id,
        total_amount=1999.98,
        status=OrderStatus.PENDING,
        shipping_address="123 Test Street, Test City",
        payment_method="credit_card"
    )
    db.add(order)
    db.commit()
    db.refresh(order)

    order_item = OrderItem(
        order_id=order.id,
        product_id=test_product.id,
        quantity=2,
        price=test_product.price
    )
    db.add(order_item)
    db.commit()
    db.refresh(order)
    return order
