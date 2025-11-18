"""
AI 輔助服務
使用 AI 提供智能天氣建議和分析
"""
import os
from typing import Dict, Any, Optional

class AIAssistant:
    """AI 輔助助手，提供天氣相關的智能建議"""

    def __init__(self):
        self.enabled = os.getenv('ENABLE_AI_SUGGESTIONS', 'false').lower() == 'true'
        self.api_key = os.getenv('OPENAI_API_KEY')

    def get_weather_advice(self, weather_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        根據天氣數據提供智能建議

        Args:
            weather_data: 天氣數據字典

        Returns:
            包含建議的字典
        """
        if not self.enabled:
            return self._get_rule_based_advice(weather_data)

        # 如果啟用了 AI，可以在這裡調用 OpenAI API
        # 目前使用基於規則的建議作為回退
        return self._get_rule_based_advice(weather_data)

    def _get_rule_based_advice(self, weather_data: Dict[str, Any]) -> Dict[str, Any]:
        """基於規則的天氣建議（不需要 AI API）"""
        current = weather_data.get('current', {})
        temp = current.get('temperature', 20)
        humidity = current.get('humidity', 50)
        weather = current.get('weather', '').lower()
        wind_speed = current.get('wind_speed', 0)

        # 穿衣建議
        clothing_advice = self._get_clothing_advice(temp)

        # 活動建議
        activity_advice = self._get_activity_advice(temp, weather, wind_speed)

        # 健康建議
        health_advice = self._get_health_advice(temp, humidity, weather)

        # 出行建議
        travel_advice = self._get_travel_advice(weather, wind_speed)

        return {
            "ai_suggestions": {
                "clothing": clothing_advice,
                "activities": activity_advice,
                "health": health_advice,
                "travel": travel_advice,
                "comfort_index": self._calculate_comfort_index(temp, humidity),
            },
            "powered_by": "規則引擎" if not self.enabled else "AI 輔助"
        }

    def _get_clothing_advice(self, temp: float) -> str:
        """穿衣建議"""
        if temp < 0:
            return "極寒天氣，建議穿著厚重羽絨服、保暖內衣、帽子和手套"
        elif temp < 10:
            return "寒冷天氣，建議穿著厚外套、毛衣和長褲"
        elif temp < 15:
            return "涼爽天氣，建議穿著薄外套或長袖襯衫"
        elif temp < 20:
            return "舒適天氣，建議穿著長袖襯衫或薄毛衣"
        elif temp < 25:
            return "溫暖天氣，建議穿著短袖襯衫或薄長褲"
        elif temp < 30:
            return "炎熱天氣，建議穿著輕便透氣的夏季服裝"
        else:
            return "酷熱天氣，建議穿著最輕便的衣物，並注意防曬"

    def _get_activity_advice(self, temp: float, weather: str, wind_speed: float) -> list:
        """活動建議"""
        activities = []

        if 'rain' in weather or 'drizzle' in weather:
            activities.append("不適合戶外活動，建議室內運動如健身房或游泳")
            activities.append("如需外出，請攜帶雨具")
        elif 'snow' in weather:
            activities.append("適合滑雪、打雪仗等冬季活動")
            activities.append("注意保暖和路面濕滑")
        elif temp > 30:
            activities.append("避免中午時段進行劇烈戶外活動")
            activities.append("適合清晨或傍晚散步、慢跑")
            activities.append("可以考慮游泳或水上活動")
        elif 15 <= temp <= 25:
            activities.append("非常適合戶外活動，如登山、騎自行車")
            activities.append("適合野餐和戶外運動")
        else:
            activities.append("氣溫較低，適合短時間戶外活動")

        if wind_speed > 10:
            activities.append("風力較大，不建議進行風箏、帆船等活動")

        return activities

    def _get_health_advice(self, temp: float, humidity: float, weather: str) -> list:
        """健康建議"""
        advice = []

        if temp > 30:
            advice.append("高溫天氣，請多補充水分，避免中暑")
            advice.append("避免長時間在陽光下暴曬")
        elif temp < 5:
            advice.append("低溫天氣，注意保暖以防感冒")
            advice.append("外出時注意保護耳朵和手部")

        if humidity > 80:
            advice.append("濕度較高，可能感覺悶熱，注意通風")
        elif humidity < 30:
            advice.append("空氣乾燥，建議多喝水並使用保濕產品")

        if 'rain' in weather:
            advice.append("雨天路滑，注意出行安全")

        return advice if advice else ["天氣狀況良好，保持正常作息即可"]

    def _get_travel_advice(self, weather: str, wind_speed: float) -> str:
        """出行建議"""
        if 'thunderstorm' in weather:
            return "雷暴天氣，建議避免外出，如需外出請特別小心"
        elif 'snow' in weather or 'rain' in weather:
            return "降水天氣，路面可能濕滑，駕車請減速慢行，行人注意防滑"
        elif wind_speed > 15:
            return "風力較大，駕車注意橫風，行人注意高空墜物"
        elif 'clear' in weather or 'sun' in weather:
            return "天氣晴朗，適合出行，駕車注意防曬"
        else:
            return "天氣狀況一般，正常出行即可"

    def _calculate_comfort_index(self, temp: float, humidity: float) -> Dict[str, Any]:
        """計算舒適度指數"""
        # 簡化的舒適度計算
        # 理想溫度: 20-25°C, 理想濕度: 40-60%

        temp_score = 100
        if temp < 20:
            temp_score = max(0, 100 - (20 - temp) * 5)
        elif temp > 25:
            temp_score = max(0, 100 - (temp - 25) * 5)

        humidity_score = 100
        if humidity < 40:
            humidity_score = max(0, 100 - (40 - humidity) * 2)
        elif humidity > 60:
            humidity_score = max(0, 100 - (humidity - 60) * 2)

        overall_score = (temp_score + humidity_score) / 2

        if overall_score >= 80:
            level = "非常舒適"
        elif overall_score >= 60:
            level = "舒適"
        elif overall_score >= 40:
            level = "一般"
        elif overall_score >= 20:
            level = "不太舒適"
        else:
            level = "不舒適"

        return {
            "score": round(overall_score, 1),
            "level": level,
            "temperature_score": round(temp_score, 1),
            "humidity_score": round(humidity_score, 1)
        }

    def get_air_quality_advice(self, aqi: int) -> Dict[str, Any]:
        """根據空氣質量指數提供建議"""
        if aqi <= 50:
            level = "優"
            color = "green"
            advice = "空氣質量極佳，適合所有戶外活動"
        elif aqi <= 100:
            level = "良"
            color = "yellow"
            advice = "空氣質量可接受，敏感人群應減少長時間戶外活動"
        elif aqi <= 150:
            level = "輕度污染"
            color = "orange"
            advice = "敏感人群應減少戶外活動，一般人群適量減少戶外活動"
        elif aqi <= 200:
            level = "中度污染"
            color = "red"
            advice = "兒童、老年人及心臟病、呼吸系統疾病患者應停止戶外活動"
        elif aqi <= 300:
            level = "重度污染"
            color = "purple"
            advice = "所有人應避免戶外活動，外出時佩戴口罩"
        else:
            level = "嚴重污染"
            color = "maroon"
            advice = "所有人應停止戶外活動，並盡量留在室內"

        return {
            "aqi": aqi,
            "level": level,
            "color": color,
            "advice": advice,
            "health_effects": self._get_health_effects(aqi)
        }

    def _get_health_effects(self, aqi: int) -> str:
        """獲取空氣質量對健康的影響"""
        if aqi <= 50:
            return "無健康影響"
        elif aqi <= 100:
            return "極少數異常敏感人群應減少戶外活動"
        elif aqi <= 150:
            return "易感人群症狀有輕度加劇，健康人群出現刺激症狀"
        elif aqi <= 200:
            return "進一步加劇易感人群症狀，可能對健康人群心臟、呼吸系統有影響"
        elif aqi <= 300:
            return "心臟病和肺病患者症狀顯著加劇，運動耐受力降低"
        else:
            return "健康人群運動耐受力降低，有明顯強烈症狀，提前出現某些疾病"

# 創建全局實例
ai_assistant = AIAssistant()
