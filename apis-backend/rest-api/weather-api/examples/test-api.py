"""
Weather API 測試腳本
演示天氣查詢 API 的主要功能

使用方式: python examples/test-api.py
需要先安裝: pip install requests
"""

import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:5000/api"

class WeatherAPITester:
    def __init__(self):
        self.session = requests.Session()

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

    def test_health_check(self):
        """測試健康檢查"""
        self.print_section("1. 健康檢查")

        response = self.session.get(f"{BASE_URL}/health")
        result = response.json()

        self.print_result("API 健康狀態", result)

    def test_get_weather_by_city(self):
        """測試按城市查詢天氣"""
        self.print_section("2. 按城市查詢天氣")

        cities = ["Taipei", "Tokyo", "New York", "London"]

        for city in cities:
            response = self.session.get(f"{BASE_URL}/weather/city/{city}")
            if response.status_code == 200:
                result = response.json()
                self.print_result(f"城市: {city}", {
                    "city": result.get("name"),
                    "temperature": result.get("main", {}).get("temp"),
                    "feels_like": result.get("main", {}).get("feels_like"),
                    "humidity": result.get("main", {}).get("humidity"),
                    "weather": result.get("weather", [{}])[0].get("description"),
                    "wind_speed": result.get("wind", {}).get("speed")
                })
            else:
                print(f"❌ 查詢 {city} 失敗: {response.status_code}")

    def test_get_weather_by_coordinates(self):
        """測試按經緯度查詢天氣"""
        self.print_section("3. 按經緯度查詢天氣")

        # 台北座標
        lat, lon = 25.0330, 121.5654

        response = self.session.get(f"{BASE_URL}/weather/coordinates", params={
            "lat": lat,
            "lon": lon
        })

        if response.status_code == 200:
            result = response.json()
            self.print_result(f"座標: ({lat}, {lon})", {
                "location": result.get("name"),
                "country": result.get("sys", {}).get("country"),
                "temperature": result.get("main", {}).get("temp"),
                "description": result.get("weather", [{}])[0].get("description")
            })
        else:
            print(f"❌ 查詢失敗: {response.status_code}")

    def test_get_forecast(self):
        """測試獲取天氣預報"""
        self.print_section("4. 獲取5天天氣預報")

        city = "Taipei"
        response = self.session.get(f"{BASE_URL}/weather/forecast/{city}")

        if response.status_code == 200:
            result = response.json()
            forecasts = result.get("list", [])[:5]  # 只顯示前5筆

            print(f"城市: {result.get('city', {}).get('name')}")
            print(f"國家: {result.get('city', {}).get('country')}")
            print(f"\n預報資料（前5筆）:")

            for forecast in forecasts:
                print(f"\n時間: {forecast.get('dt_txt')}")
                print(f"  溫度: {forecast.get('main', {}).get('temp')}°C")
                print(f"  天氣: {forecast.get('weather', [{}])[0].get('description')}")
                print(f"  濕度: {forecast.get('main', {}).get('humidity')}%")
                print(f"  風速: {forecast.get('wind', {}).get('speed')} m/s")
        else:
            print(f"❌ 查詢失敗: {response.status_code}")

        print()

    def test_search_locations(self):
        """測試搜尋地點"""
        self.print_section("5. 搜尋地點")

        search_terms = ["New", "San", "Paris"]

        for term in search_terms:
            response = self.session.get(f"{BASE_URL}/location/search", params={
                "q": term
            })

            if response.status_code == 200:
                result = response.json()
                self.print_result(f"搜尋: '{term}'", {
                    "found": len(result),
                    "locations": result[:3]  # 只顯示前3個結果
                })
            else:
                print(f"❌ 搜尋 '{term}' 失敗: {response.status_code}")

    def test_get_location_by_zip(self):
        """測試按郵遞區號查詢"""
        self.print_section("6. 按郵遞區號查詢")

        # 測試不同國家的郵遞區號
        zip_codes = [
            ("10001", "US"),  # 紐約
            ("SW1A 1AA", "GB"),  # 倫敦
            ("75001", "FR"),  # 巴黎
        ]

        for zipcode, country in zip_codes:
            response = self.session.get(f"{BASE_URL}/location/zip/{zipcode}", params={
                "country": country
            })

            if response.status_code == 200:
                result = response.json()
                self.print_result(f"郵遞區號: {zipcode}, {country}", result)
            else:
                print(f"❌ 查詢郵遞區號 {zipcode} 失敗")

    def test_get_weather_history(self):
        """測試獲取查詢歷史"""
        self.print_section("7. 獲取查詢歷史")

        response = self.session.get(f"{BASE_URL}/history")

        if response.status_code == 200:
            result = response.json()
            self.print_result("最近的查詢歷史", {
                "total": len(result),
                "recent": result[:5]  # 只顯示最近5筆
            })
        else:
            print(f"❌ 獲取歷史失敗: {response.status_code}")

    def test_get_air_quality(self):
        """測試獲取空氣品質"""
        self.print_section("8. 獲取空氣品質")

        # 台北座標
        lat, lon = 25.0330, 121.5654

        response = self.session.get(f"{BASE_URL}/weather/air-quality", params={
            "lat": lat,
            "lon": lon
        })

        if response.status_code == 200:
            result = response.json()
            self.print_result("台北空氣品質", {
                "aqi": result.get("list", [{}])[0].get("main", {}).get("aqi"),
                "components": result.get("list", [{}])[0].get("components")
            })
        else:
            print(f"❌ 獲取空氣品質失敗: {response.status_code}")

    def test_get_weather_alerts(self):
        """測試獲取天氣警報"""
        self.print_section("9. 獲取天氣警報")

        # 使用容易有天氣警報的地區
        lat, lon = 35.6762, 139.6503  # 東京

        response = self.session.get(f"{BASE_URL}/weather/alerts", params={
            "lat": lat,
            "lon": lon
        })

        if response.status_code == 200:
            result = response.json()
            alerts = result.get("alerts", [])
            if alerts:
                self.print_result("天氣警報", alerts)
            else:
                print("✅ 目前沒有天氣警報")
        else:
            print(f"⚠️  無法獲取警報資訊: {response.status_code}")

        print()

    def test_compare_cities(self):
        """測試比較多個城市的天氣"""
        self.print_section("10. 比較多個城市的天氣")

        cities = ["Taipei", "Tokyo", "Seoul", "Singapore"]
        comparison = []

        for city in cities:
            response = self.session.get(f"{BASE_URL}/weather/city/{city}")
            if response.status_code == 200:
                result = response.json()
                comparison.append({
                    "city": result.get("name"),
                    "temp": result.get("main", {}).get("temp"),
                    "feels_like": result.get("main", {}).get("feels_like"),
                    "weather": result.get("weather", [{}])[0].get("description"),
                    "humidity": result.get("main", {}).get("humidity")
                })

        self.print_result("亞洲主要城市天氣比較", comparison)

    def run_all_tests(self):
        """執行所有測試"""
        print("\n🌤️  開始測試 Weather API")
        print(f"Base URL: {BASE_URL}")

        try:
            self.test_health_check()
            self.test_get_weather_by_city()
            self.test_get_weather_by_coordinates()
            self.test_get_forecast()
            self.test_search_locations()
            self.test_get_location_by_zip()
            self.test_get_weather_history()
            self.test_get_air_quality()
            self.test_get_weather_alerts()
            self.test_compare_cities()

            self.print_section("測試完成")
            print("✅ 所有測試執行完畢！")
            print(f"\n💡 提示:")
            print(f"  - Weather API 支援多種查詢方式")
            print(f"  - 資料會自動緩存以提高性能")
            print(f"  - 支援查詢歷史記錄")

        except requests.exceptions.ConnectionError:
            print("❌ 錯誤: 無法連接到 API 服務器")
            print("請確保 API 服務器正在運行:")
            print("  python app.py")
        except Exception as e:
            print(f"❌ 測試失敗: {str(e)}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    tester = WeatherAPITester()
    tester.run_all_tests()
