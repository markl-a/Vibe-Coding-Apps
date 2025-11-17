"""
E-commerce API 測試腳本
演示如何使用 E-commerce API 的主要功能

使用方式: python examples/test_api.py
需要先安裝: pip install requests
"""

import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:8000/api/v1"

class EcommerceAPITester:
    def __init__(self):
        self.token = None
        self.user_id = None
        self.product_ids = []
        self.cart_id = None
        self.order_id = None

    def print_section(self, title):
        print(f"\n{'='*60}")
        print(f"  {title}")
        print(f"{'='*60}\n")

    def print_result(self, step, result):
        print(f"✅ {step}")
        print(json.dumps(result, indent=2, ensure_ascii=False))
        print()

    def test_register(self):
        """測試用戶註冊"""
        self.print_section("1. 用戶註冊")

        timestamp = int(datetime.now().timestamp())
        data = {
            "email": f"customer{timestamp}@example.com",
            "password": "SecurePass123",
            "full_name": "測試用戶",
            "phone": "0912345678"
        }

        response = requests.post(f"{BASE_URL}/auth/register", json=data)
        result = response.json()
        self.user_id = result.get("id")

        self.print_result("用戶註冊成功", result)
        return result

    def test_login(self):
        """測試用戶登入"""
        self.print_section("2. 用戶登入")

        # 假設已經有測試用戶
        data = {
            "username": "customer@example.com",  # 使用 email 作為 username
            "password": "SecurePass123"
        }

        response = requests.post(f"{BASE_URL}/auth/login", data=data)
        result = response.json()
        self.token = result.get("access_token")

        self.print_result("用戶登入成功", {
            "token": self.token[:30] + "..." if self.token else None,
            "token_type": result.get("token_type")
        })
        return result

    def get_headers(self):
        """獲取帶有認證的請求頭"""
        return {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }

    def test_create_products(self):
        """測試創建商品"""
        self.print_section("3. 創建商品")

        products = [
            {
                "name": "MacBook Pro 14吋",
                "description": "Apple M3 Pro 晶片，18GB 記憶體，512GB SSD",
                "price": 75900.00,
                "stock": 50,
                "category": "筆記型電腦",
                "sku": "MBP-14-M3PRO-512",
                "images": ["https://example.com/macbook1.jpg"]
            },
            {
                "name": "iPhone 15 Pro",
                "description": "6.1吋 Super Retina XDR 顯示器，A17 Pro 晶片",
                "price": 36900.00,
                "stock": 100,
                "category": "智慧型手機",
                "sku": "IPH-15PRO-128",
                "images": ["https://example.com/iphone1.jpg"]
            },
            {
                "name": "AirPods Pro (第2代)",
                "description": "主動式降噪，空間音訊",
                "price": 7990.00,
                "stock": 200,
                "category": "音訊設備",
                "sku": "APP-GEN2",
                "images": ["https://example.com/airpods1.jpg"]
            }
        ]

        for product in products:
            response = requests.post(
                f"{BASE_URL}/products",
                headers=self.get_headers(),
                json=product
            )
            result = response.json()
            self.product_ids.append(result.get("id"))
            self.print_result(f"創建商品: {product['name']}", result)

    def test_get_products(self):
        """測試獲取商品列表"""
        self.print_section("4. 獲取商品列表")

        response = requests.get(f"{BASE_URL}/products?page=1&size=10")
        result = response.json()

        self.print_result("商品列表", {
            "total": result.get("total"),
            "page": result.get("page"),
            "items_count": len(result.get("items", []))
        })

    def test_get_product_detail(self):
        """測試獲取商品詳情"""
        self.print_section("5. 獲取商品詳情")

        if self.product_ids:
            product_id = self.product_ids[0]
            response = requests.get(f"{BASE_URL}/products/{product_id}")
            result = response.json()

            self.print_result(f"商品詳情 (ID: {product_id})", result)

    def test_add_to_cart(self):
        """測試添加商品到購物車"""
        self.print_section("6. 添加商品到購物車")

        if len(self.product_ids) >= 2:
            # 添加第一個商品
            data1 = {
                "product_id": self.product_ids[0],
                "quantity": 1
            }
            response1 = requests.post(
                f"{BASE_URL}/cart/items",
                headers=self.get_headers(),
                json=data1
            )
            result1 = response1.json()
            self.print_result("添加 MacBook Pro 到購物車", result1)

            # 添加第二個商品
            data2 = {
                "product_id": self.product_ids[1],
                "quantity": 2
            }
            response2 = requests.post(
                f"{BASE_URL}/cart/items",
                headers=self.get_headers(),
                json=data2
            )
            result2 = response2.json()
            self.print_result("添加 iPhone 15 Pro 到購物車", result2)

    def test_get_cart(self):
        """測試獲取購物車"""
        self.print_section("7. 獲取購物車內容")

        response = requests.get(
            f"{BASE_URL}/cart",
            headers=self.get_headers()
        )
        result = response.json()

        self.print_result("購物車內容", result)

    def test_update_cart_item(self):
        """測試更新購物車商品數量"""
        self.print_section("8. 更新購物車商品數量")

        if self.product_ids:
            data = {
                "quantity": 3
            }
            response = requests.put(
                f"{BASE_URL}/cart/items/{self.product_ids[0]}",
                headers=self.get_headers(),
                json=data
            )
            result = response.json()

            self.print_result("更新商品數量", result)

    def test_create_order(self):
        """測試創建訂單"""
        self.print_section("9. 創建訂單")

        data = {
            "shipping_address": {
                "recipient_name": "測試用戶",
                "phone": "0912345678",
                "address": "台北市信義區信義路五段7號",
                "city": "台北市",
                "postal_code": "110"
            },
            "payment_method": "credit_card",
            "notes": "請在平日送達"
        }

        response = requests.post(
            f"{BASE_URL}/orders",
            headers=self.get_headers(),
            json=data
        )
        result = response.json()
        self.order_id = result.get("id")

        self.print_result("訂單創建成功", result)

    def test_get_orders(self):
        """測試獲取訂單列表"""
        self.print_section("10. 獲取訂單列表")

        response = requests.get(
            f"{BASE_URL}/orders",
            headers=self.get_headers()
        )
        result = response.json()

        self.print_result("我的訂單", {
            "total_orders": len(result) if isinstance(result, list) else result.get("total"),
            "orders": result[:2] if isinstance(result, list) else result.get("items", [])[:2]
        })

    def test_get_order_detail(self):
        """測試獲取訂單詳情"""
        self.print_section("11. 獲取訂單詳情")

        if self.order_id:
            response = requests.get(
                f"{BASE_URL}/orders/{self.order_id}",
                headers=self.get_headers()
            )
            result = response.json()

            self.print_result(f"訂單詳情 (ID: {self.order_id})", result)

    def test_search_products(self):
        """測試搜尋商品"""
        self.print_section("12. 搜尋商品")

        response = requests.get(f"{BASE_URL}/products?search=Mac&category=筆記型電腦")
        result = response.json()

        self.print_result("搜尋結果 (關鍵字: Mac)", {
            "found": result.get("total"),
            "items": result.get("items", [])[:2]
        })

    def run_all_tests(self):
        """執行所有測試"""
        print("\n🚀 開始測試 E-commerce API")
        print(f"Base URL: {BASE_URL}")

        try:
            # 註冊和登入
            # self.test_register()  # 如果需要新用戶取消註釋
            self.test_login()

            # 商品相關
            self.test_create_products()
            self.test_get_products()
            self.test_get_product_detail()
            self.test_search_products()

            # 購物車相關
            self.test_add_to_cart()
            self.test_get_cart()
            self.test_update_cart_item()

            # 訂單相關
            self.test_create_order()
            self.test_get_orders()
            self.test_get_order_detail()

            self.print_section("測試完成")
            print("✅ 所有測試執行完畢！")
            print(f"\n📊 測試摘要:")
            print(f"  - 用戶 ID: {self.user_id}")
            print(f"  - 創建的商品數: {len(self.product_ids)}")
            print(f"  - 訂單 ID: {self.order_id}")
            print(f"\n💡 訪問 http://localhost:8000/api/docs 查看完整 API 文檔")

        except requests.exceptions.ConnectionError:
            print("❌ 錯誤: 無法連接到 API 服務器")
            print("請確保 API 服務器正在運行:")
            print("  python main.py")
        except Exception as e:
            print(f"❌ 測試失敗: {str(e)}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    tester = EcommerceAPITester()
    tester.run_all_tests()
