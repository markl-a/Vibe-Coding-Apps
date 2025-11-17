"""
IoT Device Microservices 測試腳本
演示物聯網設備管理微服務的功能

使用方式: python examples/test-iot-services.py
需要先安裝: pip install requests
"""

import requests
import json
import time
from datetime import datetime, timedelta
import random

API_GATEWAY = "http://localhost:8000"

class IoTServicesTester:
    def __init__(self):
        self.session = requests.Session()
        self.device_id = None
        self.data_points = []
        self.alert_id = None

    def print_section(self, title):
        print(f"\n{'='*60}")
        print(f"  {title}")
        print(f"{'='*60}\n")

    def print_result(self, step, result):
        print(f"✅ {step}")
        if isinstance(result, dict) or isinstance(result, list):
            print(json.dumps(result, indent=2, ensure_ascii=False))
        else:
            print(result)
        print()

    def test_register_device(self):
        """測試註冊設備"""
        self.print_section("1. 註冊 IoT 設備")

        data = {
            "deviceId": f"TEMP-SENSOR-{int(time.time())}",
            "name": "溫度感應器 #1",
            "type": "temperature_sensor",
            "location": "辦公室A區",
            "metadata": {
                "manufacturer": "Acme Sensors Inc.",
                "model": "TS-2000",
                "firmware": "v1.2.3"
            },
            "capabilities": ["temperature", "humidity"],
            "status": "online"
        }

        response = self.session.post(f"{API_GATEWAY}/api/devices", json=data)
        if response.status_code in [200, 201]:
            result = response.json()
            self.device_id = result.get("id") or result.get("deviceId")
            self.print_result("設備註冊成功", result)
        else:
            print(f"❌ 註冊失敗: {response.status_code}")

    def test_get_devices(self):
        """測試獲取設備列表"""
        self.print_section("2. 獲取設備列表")

        response = self.session.get(f"{API_GATEWAY}/api/devices?status=online")
        if response.status_code == 200:
            result = response.json()
            self.print_result("設備列表", {
                "total": len(result) if isinstance(result, list) else result.get("total"),
                "devices": result[:3] if isinstance(result, list) else result.get("devices", [])[:3]
            })
        else:
            print(f"❌ 獲取設備列表失敗: {response.status_code}")

    def test_send_device_data(self):
        """測試發送設備數據"""
        self.print_section("3. 發送設備數據")

        # 模擬發送多筆溫度數據
        for i in range(5):
            temperature = round(20 + random.uniform(-5, 10), 2)
            humidity = round(50 + random.uniform(-10, 20), 2)

            data = {
                "deviceId": self.device_id,
                "timestamp": datetime.now().isoformat(),
                "data": {
                    "temperature": temperature,
                    "humidity": humidity,
                    "unit": "celsius"
                }
            }

            response = self.session.post(f"{API_GATEWAY}/api/data", json=data)
            if response.status_code in [200, 201]:
                result = response.json()
                self.data_points.append(result.get("id"))
                print(f"✅ 數據點 {i+1}: 溫度={temperature}°C, 濕度={humidity}%")
            else:
                print(f"❌ 發送數據失敗: {response.status_code}")

            time.sleep(0.5)  # 模擬數據間隔

        print()

    def test_get_device_data(self):
        """測試獲取設備數據"""
        self.print_section("4. 獲取設備數據")

        # 獲取最近的數據
        response = self.session.get(
            f"{API_GATEWAY}/api/data",
            params={
                "deviceId": self.device_id,
                "limit": 10
            }
        )

        if response.status_code == 200:
            result = response.json()
            self.print_result("設備數據", {
                "deviceId": self.device_id,
                "dataPoints": len(result) if isinstance(result, list) else result.get("total"),
                "latest": result[0] if isinstance(result, list) and result else None
            })
        else:
            print(f"❌ 獲取數據失敗: {response.status_code}")

    def test_get_data_analytics(self):
        """測試數據分析"""
        self.print_section("5. 數據分析")

        # 獲取統計數據
        response = self.session.get(
            f"{API_GATEWAY}/api/analytics/stats",
            params={
                "deviceId": self.device_id,
                "metric": "temperature",
                "period": "1h"
            }
        )

        if response.status_code == 200:
            result = response.json()
            self.print_result("溫度統計（1小時）", result)
        else:
            print(f"❌ 獲取分析數據失敗: {response.status_code}")

    def test_create_alert_rule(self):
        """測試創建警報規則"""
        self.print_section("6. 創建警報規則")

        data = {
            "name": "高溫警報",
            "deviceId": self.device_id,
            "condition": {
                "metric": "temperature",
                "operator": "greater_than",
                "threshold": 30,
                "duration": 300  # 5分鐘
            },
            "severity": "high",
            "enabled": True,
            "notificationChannels": ["email", "sms"]
        }

        response = self.session.post(f"{API_GATEWAY}/api/alerts/rules", json=data)
        if response.status_code in [200, 201]:
            result = response.json()
            self.alert_id = result.get("id")
            self.print_result("警報規則已創建", result)
        else:
            print(f"❌ 創建警報規則失敗: {response.status_code}")

    def test_get_alerts(self):
        """測試獲取警報"""
        self.print_section("7. 獲取警報列表")

        response = self.session.get(
            f"{API_GATEWAY}/api/alerts",
            params={
                "deviceId": self.device_id,
                "status": "active"
            }
        )

        if response.status_code == 200:
            result = response.json()
            self.print_result("警報列表", result)
        else:
            print(f"❌ 獲取警報失敗: {response.status_code}")

    def test_device_control(self):
        """測試設備控制"""
        self.print_section("8. 設備控制（發送命令）")

        data = {
            "command": "set_threshold",
            "parameters": {
                "threshold": 28,
                "metric": "temperature"
            }
        }

        response = self.session.post(
            f"{API_GATEWAY}/api/devices/{self.device_id}/command",
            json=data
        )

        if response.status_code == 200:
            result = response.json()
            self.print_result("命令已發送", result)
        else:
            print(f"❌ 發送命令失敗: {response.status_code}")

    def test_device_status(self):
        """測試更新設備狀態"""
        self.print_section("9. 更新設備狀態")

        data = {
            "status": "maintenance",
            "message": "定期維護中"
        }

        response = self.session.put(
            f"{API_GATEWAY}/api/devices/{self.device_id}/status",
            json=data
        )

        if response.status_code == 200:
            result = response.json()
            self.print_result("設備狀態已更新", result)
        else:
            print(f"❌ 更新狀態失敗: {response.status_code}")

    def test_analytics_dashboard(self):
        """測試分析儀表板"""
        self.print_section("10. 分析儀表板數據")

        response = self.session.get(
            f"{API_GATEWAY}/api/analytics/dashboard",
            params={
                "timeRange": "24h"
            }
        )

        if response.status_code == 200:
            result = response.json()
            self.print_result("儀表板數據", result)
        else:
            print(f"❌ 獲取儀表板數據失敗: {response.status_code}")

    def run_all_tests(self):
        """執行所有測試"""
        print("\n🔌 開始測試 IoT Device Microservices")
        print(f"API Gateway: {API_GATEWAY}")

        try:
            self.test_register_device()
            self.test_get_devices()
            self.test_send_device_data()
            self.test_get_device_data()
            self.test_get_data_analytics()
            self.test_create_alert_rule()
            self.test_get_alerts()
            self.test_device_control()
            self.test_device_status()
            self.test_analytics_dashboard()

            self.print_section("測試完成")
            print("✅ 所有測試執行完畢！")
            print(f"\n📊 測試摘要:")
            print(f"  - 設備 ID: {self.device_id}")
            print(f"  - 數據點數: {len(self.data_points)}")
            print(f"  - 警報規則 ID: {self.alert_id}")
            print(f"\n🏗️  微服務架構:")
            print(f"  - Device Service: 設備管理")
            print(f"  - Data Service: 數據收集")
            print(f"  - Analytics Service: 數據分析")
            print(f"  - Alert Service: 警報管理")

        except requests.exceptions.ConnectionError:
            print("❌ 錯誤: 無法連接到 API Gateway")
            print("請確保所有微服務正在運行:")
            print("  docker-compose up")
        except Exception as e:
            print(f"❌ 測試失敗: {str(e)}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    tester = IoTServicesTester()
    tester.run_all_tests()
