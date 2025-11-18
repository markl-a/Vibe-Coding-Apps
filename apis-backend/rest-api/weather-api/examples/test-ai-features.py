"""
Weather API AI 功能測試腳本
演示 AI 輔助功能：智能建議、空氣質量、完整報告

使用方式: python examples/test-ai-features.py
需要先安裝: pip install requests
"""

import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:5000"

class WeatherAITester:
    def __init__(self):
        self.session = requests.Session()

    def print_section(self, title):
        print(f"\n{'='*70}")
        print(f"  {title}")
        print(f"{'='*70}\n")

    def print_result(self, step, result):
        print(f"✅ {step}")
        if isinstance(result, dict) or isinstance(result, list):
            print(json.dumps(result, indent=2, ensure_ascii=False))
        else:
            print(result)
        print()

    def test_api_info(self):
        """測試 API 信息"""
        self.print_section("1. API 基本信息")

        response = self.session.get(f"{BASE_URL}/")
        result = response.json()

        self.print_result("API 信息", result)

    def test_health_check(self):
        """測試健康檢查"""
        self.print_section("2. 健康檢查")

        response = self.session.get(f"{BASE_URL}/health")
        result = response.json()

        self.print_result("健康狀態", result)

    def test_current_weather(self):
        """測試基本天氣查詢"""
        self.print_section("3. 基本天氣查詢")

        cities = ["Taipei", "Tokyo"]

        for city in cities:
            response = self.session.get(f"{BASE_URL}/api/v1/weather/current", params={
                "city": city
            })

            if response.status_code == 200:
                result = response.json()
                self.print_result(f"城市: {city}", result)
            else:
                print(f"❌ 查詢 {city} 失敗: {response.status_code}")
                print(f"錯誤: {response.text}\n")

    def test_weather_advice(self):
        """測試 AI 天氣建議"""
        self.print_section("4. AI 天氣建議功能")

        cities = ["Taipei", "Tokyo", "London"]

        for city in cities:
            print(f"\n🤖 查詢 {city} 的天氣建議...")
            response = self.session.get(f"{BASE_URL}/api/v1/ai/weather-advice", params={
                "city": city
            })

            if response.status_code == 200:
                result = response.json()

                print(f"\n📍 位置: {result.get('location', {}).get('name')}")
                print(f"🌡️  溫度: {result.get('current', {}).get('temperature')}°C")
                print(f"💧 濕度: {result.get('current', {}).get('humidity')}%")
                print(f"🌤️  天氣: {result.get('current', {}).get('weather')}")

                ai_suggestions = result.get('ai_suggestions', {})
                print(f"\n🤖 AI 建議:")
                print(f"  👔 穿衣: {ai_suggestions.get('clothing')}")
                print(f"  🏃 活動:")
                for activity in ai_suggestions.get('activities', []):
                    print(f"    - {activity}")
                print(f"  💊 健康:")
                for health in ai_suggestions.get('health', []):
                    print(f"    - {health}")
                print(f"  🚗 出行: {ai_suggestions.get('travel')}")

                comfort = ai_suggestions.get('comfort_index', {})
                print(f"  😊 舒適度: {comfort.get('level')} ({comfort.get('score')}/100)")

                print(f"\n✨ 技術支援: {result.get('powered_by')}")
            else:
                print(f"❌ 查詢失敗: {response.status_code}")
                print(f"錯誤: {response.text}")

            print("\n" + "-"*70)

    def test_air_quality(self):
        """測試空氣質量功能"""
        self.print_section("5. 空氣質量指數（AQI）")

        locations = [
            ("Taipei", None, None),
            ("Beijing", None, None),
            (None, "51.5074", "-0.1278"),  # London
        ]

        for city, lat, lon in locations:
            params = {}
            if city:
                params['city'] = city
                location_name = city
            else:
                params['lat'] = lat
                params['lon'] = lon
                location_name = f"座標 ({lat}, {lon})"

            print(f"\n🌬️  查詢 {location_name} 的空氣質量...")
            response = self.session.get(f"{BASE_URL}/api/v1/ai/air-quality", params=params)

            if response.status_code == 200:
                result = response.json()

                aqi = result.get('aqi_standard', result.get('aqi', 0))
                advice_details = result.get('advice_details', {})

                print(f"  AQI 值: {aqi}")
                print(f"  等級: {advice_details.get('level', '未知')}")
                print(f"  建議: {advice_details.get('advice', '無')}")
                print(f"  健康影響: {advice_details.get('health_effects', '無')}")

                components = result.get('components', {})
                if components:
                    print(f"\n  污染物濃度:")
                    if components.get('pm2_5'):
                        print(f"    PM2.5: {components.get('pm2_5')} μg/m³")
                    if components.get('pm10'):
                        print(f"    PM10: {components.get('pm10')} μg/m³")
                    if components.get('o3'):
                        print(f"    O₃: {components.get('o3')} μg/m³")
            else:
                print(f"❌ 查詢失敗: {response.status_code}")
                print(f"錯誤: {response.text}")

            print("\n" + "-"*70)

    def test_complete_report(self):
        """測試完整天氣報告"""
        self.print_section("6. 完整天氣報告（All-in-One）")

        cities = ["Taipei", "Singapore"]

        for city in cities:
            print(f"\n📊 生成 {city} 的完整天氣報告...")
            response = self.session.get(f"{BASE_URL}/api/v1/ai/complete-report", params={
                "city": city
            })

            if response.status_code == 200:
                result = response.json()

                # 位置信息
                location = result.get('location', {})
                print(f"\n📍 位置: {location.get('name')}, {location.get('country')}")

                # 當前天氣
                current = result.get('current_weather', {})
                print(f"\n🌡️  當前天氣:")
                print(f"  溫度: {current.get('temperature')}°C (體感 {current.get('feels_like')}°C)")
                print(f"  天氣: {current.get('weather')}")
                print(f"  濕度: {current.get('humidity')}%")
                print(f"  風速: {current.get('wind_speed')} m/s")

                # AI 建議
                ai = result.get('ai_suggestions', {})
                if ai:
                    print(f"\n🤖 AI 智能建議:")
                    print(f"  穿衣: {ai.get('clothing', '無建議')}")
                    comfort = ai.get('comfort_index', {})
                    print(f"  舒適度: {comfort.get('level', '未知')} ({comfort.get('score', 0)}/100)")

                # 空氣質量
                aqi = result.get('air_quality', {})
                if 'aqi' in aqi:
                    print(f"\n🌬️  空氣質量: AQI {aqi.get('aqi_standard', aqi.get('aqi'))}")

                # 預報（只顯示前3個時間點）
                forecast = result.get('forecast', [])
                if forecast:
                    print(f"\n📅 未來預報（前3個時間點）:")
                    for item in forecast[:3]:
                        print(f"  {item.get('datetime')}: {item.get('temperature')}°C, {item.get('weather')}")

                print(f"\n✨ {result.get('powered_by')}")
            else:
                print(f"❌ 查詢失敗: {response.status_code}")
                print(f"錯誤: {response.text}")

            print("\n" + "-"*70)

    def test_forecast(self):
        """測試天氣預報"""
        self.print_section("7. 天氣預報")

        response = self.session.get(f"{BASE_URL}/api/v1/weather/forecast", params={
            "city": "Taipei",
            "days": 3
        })

        if response.status_code == 200:
            result = response.json()
            print(f"城市: {result.get('location', {}).get('name')}")
            print(f"\n預報數據點: {len(result.get('forecast', []))} 個")
            print("\n前 5 個時間點:")
            for item in result.get('forecast', [])[:5]:
                print(f"  {item.get('datetime')}: {item.get('temperature')}°C, {item.get('weather')}")
        else:
            print(f"❌ 查詢失敗: {response.status_code}")
            print(f"錯誤: {response.text}")

    def run_all_tests(self):
        """執行所有測試"""
        print("\n🤖 開始測試 Weather API AI 功能")
        print(f"Base URL: {BASE_URL}")

        try:
            self.test_api_info()
            self.test_health_check()
            self.test_current_weather()
            self.test_weather_advice()
            self.test_air_quality()
            self.test_complete_report()
            self.test_forecast()

            self.print_section("測試完成")
            print("✅ 所有 AI 功能測試執行完畢！")
            print(f"\n💡 新功能亮點:")
            print(f"  🤖 AI 智能建議（穿衣、活動、健康、出行）")
            print(f"  🌬️  空氣質量指數 (AQI) 和健康建議")
            print(f"  📊 完整天氣報告（一次性獲取所有信息）")
            print(f"  😊 舒適度指數計算")
            print(f"  ✨ 基於規則引擎的智能分析")
            print(f"\n🚀 可選功能:")
            print(f"  - 設置 OPENAI_API_KEY 啟用 GPT 驅動的建議")
            print(f"  - 更智能、更個性化的天氣分析")

        except requests.exceptions.ConnectionError:
            print("❌ 錯誤: 無法連接到 API 服務器")
            print("請確保 API 服務器正在運行:")
            print("  python app.py")
        except Exception as e:
            print(f"❌ 測試失敗: {str(e)}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    tester = WeatherAITester()
    tester.run_all_tests()
