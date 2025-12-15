"""
AI 輔助服務測試
測試 AIAssistant 類的各種方法
"""
import pytest
from unittest.mock import patch
import os

from app.services.ai_assistant import AIAssistant


@pytest.mark.unit
class TestAIAssistantInit:
    """測試 AI 輔助初始化"""

    def test_ai_assistant_initialization(self):
        """測試 AI 輔助初始化"""
        assistant = AIAssistant()
        assert hasattr(assistant, 'enabled')
        assert hasattr(assistant, 'api_key')

    @patch.dict(os.environ, {'ENABLE_AI_SUGGESTIONS': 'true'})
    def test_ai_enabled_from_env(self):
        """測試從環境變量啟用 AI"""
        assistant = AIAssistant()
        assert assistant.enabled is True

    @patch.dict(os.environ, {'ENABLE_AI_SUGGESTIONS': 'false'})
    def test_ai_disabled_from_env(self):
        """測試從環境變量禁用 AI"""
        assistant = AIAssistant()
        assert assistant.enabled is False


@pytest.mark.unit
class TestGetWeatherAdvice:
    """測試獲取天氣建議"""

    def test_get_weather_advice_basic(self, sample_weather_data):
        """測試基本天氣建議獲取"""
        assistant = AIAssistant()
        result = assistant.get_weather_advice(sample_weather_data)

        assert result is not None
        assert 'ai_suggestions' in result
        assert 'clothing' in result['ai_suggestions']
        assert 'activities' in result['ai_suggestions']
        assert 'health' in result['ai_suggestions']
        assert 'travel' in result['ai_suggestions']
        assert 'comfort_index' in result['ai_suggestions']

    def test_get_weather_advice_structure(self, sample_weather_data):
        """測試建議數據結構"""
        assistant = AIAssistant()
        result = assistant.get_weather_advice(sample_weather_data)

        suggestions = result['ai_suggestions']

        # 穿衣建議應該是字符串
        assert isinstance(suggestions['clothing'], str)

        # 活動建議應該是列表
        assert isinstance(suggestions['activities'], list)

        # 健康建議應該是列表
        assert isinstance(suggestions['health'], list)

        # 出行建議應該是字符串
        assert isinstance(suggestions['travel'], str)

        # 舒適度指數應該是字典
        assert isinstance(suggestions['comfort_index'], dict)
        assert 'score' in suggestions['comfort_index']
        assert 'level' in suggestions['comfort_index']


@pytest.mark.unit
class TestClothingAdvice:
    """測試穿衣建議"""

    def test_clothing_advice_extreme_cold(self):
        """測試極寒天氣穿衣建議"""
        assistant = AIAssistant()
        advice = assistant._get_clothing_advice(-5)

        assert '羽絨服' in advice or '厚重' in advice or '極寒' in advice

    def test_clothing_advice_cold(self):
        """測試寒冷天氣穿衣建議"""
        assistant = AIAssistant()
        advice = assistant._get_clothing_advice(5)

        assert '外套' in advice or '寒冷' in advice

    def test_clothing_advice_cool(self):
        """測試涼爽天氣穿衣建議"""
        assistant = AIAssistant()
        advice = assistant._get_clothing_advice(15)

        assert '外套' in advice or '長袖' in advice or '涼爽' in advice

    def test_clothing_advice_comfortable(self):
        """測試舒適天氣穿衣建議"""
        assistant = AIAssistant()
        advice = assistant._get_clothing_advice(22)

        assert '舒適' in advice or '長袖' in advice

    def test_clothing_advice_hot(self):
        """測試炎熱天氣穿衣建議"""
        assistant = AIAssistant()
        advice = assistant._get_clothing_advice(28)

        assert '炎熱' in advice or '輕便' in advice or '短袖' in advice

    def test_clothing_advice_extreme_hot(self):
        """測試酷熱天氣穿衣建議"""
        assistant = AIAssistant()
        advice = assistant._get_clothing_advice(35)

        assert '酷熱' in advice or '防曬' in advice or '輕便' in advice


@pytest.mark.unit
class TestActivityAdvice:
    """測試活動建議"""

    def test_activity_advice_rainy_weather(self):
        """測試雨天活動建議"""
        assistant = AIAssistant()
        activities = assistant._get_activity_advice(20, 'rain', 5)

        assert len(activities) > 0
        assert any('室內' in activity or '雨' in activity for activity in activities)

    def test_activity_advice_snowy_weather(self):
        """測試雪天活動建議"""
        assistant = AIAssistant()
        activities = assistant._get_activity_advice(0, 'snow', 3)

        assert len(activities) > 0
        assert any('雪' in activity or '滑雪' in activity for activity in activities)

    def test_activity_advice_hot_weather(self):
        """測試高溫天氣活動建議"""
        assistant = AIAssistant()
        activities = assistant._get_activity_advice(32, 'clear', 2)

        assert len(activities) > 0
        assert any('避免' in activity or '清晨' in activity or '游泳' in activity for activity in activities)

    def test_activity_advice_ideal_weather(self):
        """測試理想天氣活動建議"""
        assistant = AIAssistant()
        activities = assistant._get_activity_advice(20, 'clear', 3)

        assert len(activities) > 0
        assert any('適合' in activity or '戶外' in activity for activity in activities)

    def test_activity_advice_windy_conditions(self):
        """測試大風天氣活動建議"""
        assistant = AIAssistant()
        activities = assistant._get_activity_advice(20, 'clear', 15)

        assert any('風' in activity for activity in activities)


@pytest.mark.unit
class TestHealthAdvice:
    """測試健康建議"""

    def test_health_advice_hot_weather(self):
        """測試高溫健康建議"""
        assistant = AIAssistant()
        advice = assistant._get_health_advice(32, 50, 'clear')

        assert len(advice) > 0
        assert any('水分' in item or '中暑' in item for item in advice)

    def test_health_advice_cold_weather(self):
        """測試低溫健康建議"""
        assistant = AIAssistant()
        advice = assistant._get_health_advice(3, 50, 'clear')

        assert len(advice) > 0
        assert any('保暖' in item or '感冒' in item for item in advice)

    def test_health_advice_high_humidity(self):
        """測試高濕度健康建議"""
        assistant = AIAssistant()
        advice = assistant._get_health_advice(25, 85, 'clear')

        assert len(advice) > 0
        assert any('濕度' in item or '悶熱' in item or '通風' in item for item in advice)

    def test_health_advice_low_humidity(self):
        """測試低濕度健康建議"""
        assistant = AIAssistant()
        advice = assistant._get_health_advice(25, 25, 'clear')

        assert len(advice) > 0
        assert any('乾燥' in item or '水' in item for item in advice)

    def test_health_advice_rainy_weather(self):
        """測試雨天健康建議"""
        assistant = AIAssistant()
        advice = assistant._get_health_advice(20, 70, 'rain')

        assert len(advice) > 0
        assert any('雨' in item or '路滑' in item for item in advice)

    def test_health_advice_normal_conditions(self):
        """測試正常天氣健康建議"""
        assistant = AIAssistant()
        advice = assistant._get_health_advice(22, 55, 'clear')

        assert len(advice) > 0
        # 正常天氣應該返回積極的建議
        assert any('良好' in item or '正常' in item for item in advice)


@pytest.mark.unit
class TestTravelAdvice:
    """測試出行建議"""

    def test_travel_advice_thunderstorm(self):
        """測試雷暴天氣出行建議"""
        assistant = AIAssistant()
        advice = assistant._get_travel_advice('thunderstorm', 5)

        assert '雷' in advice or '避免' in advice

    def test_travel_advice_rain_or_snow(self):
        """測試雨雪天氣出行建議"""
        assistant = AIAssistant()

        rain_advice = assistant._get_travel_advice('rain', 5)
        assert '濕滑' in rain_advice or '減速' in rain_advice

        snow_advice = assistant._get_travel_advice('snow', 5)
        assert '濕滑' in snow_advice or '減速' in snow_advice

    def test_travel_advice_strong_wind(self):
        """測試大風天氣出行建議"""
        assistant = AIAssistant()
        advice = assistant._get_travel_advice('clear', 18)

        assert '風' in advice

    def test_travel_advice_clear_weather(self):
        """測試晴朗天氣出行建議"""
        assistant = AIAssistant()
        advice = assistant._get_travel_advice('clear', 3)

        assert '晴朗' in advice or '適合' in advice

    def test_travel_advice_normal_conditions(self):
        """測試一般天氣出行建議"""
        assistant = AIAssistant()
        advice = assistant._get_travel_advice('clouds', 5)

        assert '正常' in advice or '一般' in advice


@pytest.mark.unit
class TestComfortIndex:
    """測試舒適度指數計算"""

    def test_comfort_index_ideal_conditions(self):
        """測試理想條件的舒適度"""
        assistant = AIAssistant()
        result = assistant._calculate_comfort_index(22, 50)

        assert result['score'] >= 80
        assert result['level'] in ['非常舒適', '舒適']
        assert 'temperature_score' in result
        assert 'humidity_score' in result

    def test_comfort_index_hot_humid(self):
        """測試高溫高濕的舒適度"""
        assistant = AIAssistant()
        result = assistant._calculate_comfort_index(35, 85)

        assert result['score'] < 50
        assert result['level'] in ['不舒適', '不太舒適']

    def test_comfort_index_cold_dry(self):
        """測試低溫乾燥的舒適度"""
        assistant = AIAssistant()
        result = assistant._calculate_comfort_index(5, 20)

        assert result['score'] < 50
        assert result['level'] in ['不舒適', '不太舒適']

    def test_comfort_index_score_range(self):
        """測試舒適度分數範圍"""
        assistant = AIAssistant()

        # 測試多種條件
        test_cases = [
            (0, 30),
            (15, 40),
            (22, 50),
            (30, 70),
            (40, 90)
        ]

        for temp, humidity in test_cases:
            result = assistant._calculate_comfort_index(temp, humidity)
            assert 0 <= result['score'] <= 100
            assert result['level'] in ['非常舒適', '舒適', '一般', '不太舒適', '不舒適']


@pytest.mark.unit
class TestAirQualityAdvice:
    """測試空氣質量建議"""

    def test_air_quality_excellent(self):
        """測試優秀空氣質量建議"""
        assistant = AIAssistant()
        result = assistant.get_air_quality_advice(30)

        assert result['level'] == '優'
        assert result['color'] == 'green'
        assert '適合' in result['advice']

    def test_air_quality_good(self):
        """測試良好空氣質量建議"""
        assistant = AIAssistant()
        result = assistant.get_air_quality_advice(75)

        assert result['level'] == '良'
        assert result['color'] == 'yellow'

    def test_air_quality_moderate(self):
        """測試輕度污染空氣質量建議"""
        assistant = AIAssistant()
        result = assistant.get_air_quality_advice(125)

        assert result['level'] == '輕度污染'
        assert result['color'] == 'orange'
        assert '敏感' in result['advice']

    def test_air_quality_unhealthy(self):
        """測試中度污染空氣質量建議"""
        assistant = AIAssistant()
        result = assistant.get_air_quality_advice(175)

        assert result['level'] == '中度污染'
        assert result['color'] == 'red'

    def test_air_quality_very_unhealthy(self):
        """測試重度污染空氣質量建議"""
        assistant = AIAssistant()
        result = assistant.get_air_quality_advice(250)

        assert result['level'] == '重度污染'
        assert result['color'] == 'purple'
        assert '避免' in result['advice'] or '口罩' in result['advice']

    def test_air_quality_hazardous(self):
        """測試嚴重污染空氣質量建議"""
        assistant = AIAssistant()
        result = assistant.get_air_quality_advice(350)

        assert result['level'] == '嚴重污染'
        assert result['color'] == 'maroon'
        assert '停止' in result['advice'] or '室內' in result['advice']

    def test_air_quality_advice_structure(self):
        """測試空氣質量建議數據結構"""
        assistant = AIAssistant()
        result = assistant.get_air_quality_advice(100)

        # 驗證必需字段
        assert 'aqi' in result
        assert 'level' in result
        assert 'color' in result
        assert 'advice' in result
        assert 'health_effects' in result

        # 驗證數據類型
        assert isinstance(result['aqi'], int)
        assert isinstance(result['level'], str)
        assert isinstance(result['color'], str)
        assert isinstance(result['advice'], str)
        assert isinstance(result['health_effects'], str)


@pytest.mark.unit
class TestHealthEffects:
    """測試健康影響描述"""

    def test_health_effects_range(self):
        """測試不同 AQI 範圍的健康影響"""
        assistant = AIAssistant()

        test_cases = [
            (30, '無健康影響'),
            (75, '極少數'),
            (125, '易感'),
            (175, '心臟'),
            (250, '顯著'),
            (350, '強烈')
        ]

        for aqi, expected_keyword in test_cases:
            result = assistant._get_health_effects(aqi)
            assert expected_keyword in result, f"AQI {aqi} 應包含關鍵詞 '{expected_keyword}'"


@pytest.mark.integration
class TestAIAssistantIntegration:
    """AI 輔助集成測試"""

    def test_complete_weather_analysis(self, sample_weather_data):
        """測試完整的天氣分析流程"""
        assistant = AIAssistant()

        # 獲取天氣建議
        weather_advice = assistant.get_weather_advice(sample_weather_data)
        assert weather_advice is not None

        # 獲取空氣質量建議
        aqi_advice = assistant.get_air_quality_advice(75)
        assert aqi_advice is not None

        # 驗證兩個建議都有內容
        assert len(weather_advice) > 0
        assert len(aqi_advice) > 0

    def test_advice_consistency(self):
        """測試建議的一致性"""
        assistant = AIAssistant()

        # 相同輸入應該產生相同輸出
        weather_data = {
            'location': {'name': 'Test'},
            'current': {
                'temperature': 25,
                'humidity': 60,
                'weather': 'clear',
                'wind_speed': 5
            }
        }

        result1 = assistant.get_weather_advice(weather_data)
        result2 = assistant.get_weather_advice(weather_data)

        assert result1 == result2
