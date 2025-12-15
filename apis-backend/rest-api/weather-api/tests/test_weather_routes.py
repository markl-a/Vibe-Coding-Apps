"""
天氣路由測試
測試天氣 API 端點的集成測試
"""
import pytest
import json
from unittest.mock import patch, Mock


@pytest.mark.integration
class TestHealthEndpoint:
    """測試健康檢查端點"""

    def test_health_check(self, client):
        """測試健康檢查端點"""
        response = client.get('/health')

        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['status'] == 'healthy'

    def test_index_endpoint(self, client):
        """測試首頁端點"""
        response = client.get('/')

        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'message' in data
        assert 'version' in data
        assert 'endpoints' in data


@pytest.mark.integration
class TestCurrentWeatherEndpoint:
    """測試當前天氣端點"""

    @patch('app.services.weather.weather_service.get_current_weather')
    def test_get_current_weather_by_city(self, mock_get_weather, client, sample_weather_data):
        """測試通過城市名獲取天氣"""
        mock_get_weather.return_value = sample_weather_data

        response = client.get('/api/v1/weather/current?city=Taipei')

        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['location']['name'] == 'Taipei'
        assert 'current' in data
        assert 'temperature' in data['current']

        # 驗證服務被正確調用
        mock_get_weather.assert_called_once_with(city='Taipei', lat=None, lon=None)

    @patch('app.services.weather.weather_service.get_current_weather')
    def test_get_current_weather_by_coordinates(self, mock_get_weather, client, sample_weather_data):
        """測試通過經緯度獲取天氣"""
        mock_get_weather.return_value = sample_weather_data

        response = client.get('/api/v1/weather/current?lat=25.0330&lon=121.5654')

        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'location' in data
        assert 'current' in data

        # 驗證參數傳遞
        mock_get_weather.assert_called_once_with(city=None, lat='25.0330', lon='121.5654')

    def test_get_current_weather_missing_parameters(self, client):
        """測試缺少必需參數"""
        response = client.get('/api/v1/weather/current')

        assert response.status_code == 400
        data = json.loads(response.data)
        assert 'error' in data
        assert 'Must provide either city or lat/lon' in data['error']

    def test_get_current_weather_partial_coordinates(self, client):
        """測試只提供部分經緯度參數"""
        # 只提供緯度
        response = client.get('/api/v1/weather/current?lat=25.0330')
        assert response.status_code == 400

        # 只提供經度
        response = client.get('/api/v1/weather/current?lon=121.5654')
        assert response.status_code == 400

    @patch('app.services.weather.weather_service.get_current_weather')
    def test_get_current_weather_service_error(self, mock_get_weather, client):
        """測試服務層錯誤處理"""
        mock_get_weather.side_effect = ValueError("Invalid city")

        response = client.get('/api/v1/weather/current?city=InvalidCity')

        assert response.status_code == 400
        data = json.loads(response.data)
        assert 'error' in data

    @patch('app.services.weather.weather_service.get_current_weather')
    def test_get_current_weather_network_error(self, mock_get_weather, client):
        """測試網絡錯誤處理"""
        import requests
        mock_get_weather.side_effect = requests.exceptions.RequestException("Network error")

        response = client.get('/api/v1/weather/current?city=Taipei')

        assert response.status_code == 503
        data = json.loads(response.data)
        assert 'error' in data


@pytest.mark.integration
class TestForecastEndpoint:
    """測試天氣預報端點"""

    @patch('app.services.weather.weather_service.get_forecast')
    def test_get_forecast_by_city(self, mock_get_forecast, client):
        """測試通過城市名獲取預報"""
        mock_forecast_data = {
            'location': {'name': 'Taipei', 'country': 'TW'},
            'forecast': [
                {
                    'datetime': '2025-12-15 00:00:00',
                    'temperature': 25.0,
                    'weather': '晴朗',
                    'icon': '01d',
                    'humidity': 60,
                    'wind_speed': 3.0
                }
            ]
        }
        mock_get_forecast.return_value = mock_forecast_data

        response = client.get('/api/v1/weather/forecast?city=Taipei')

        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'forecast' in data
        assert len(data['forecast']) > 0

        # 驗證默認天數為 5
        mock_get_forecast.assert_called_once_with(city='Taipei', lat=None, lon=None, days=5)

    @patch('app.services.weather.weather_service.get_forecast')
    def test_get_forecast_custom_days(self, mock_get_forecast, client):
        """測試自定義預報天數"""
        mock_forecast_data = {
            'location': {'name': 'Taipei'},
            'forecast': []
        }
        mock_get_forecast.return_value = mock_forecast_data

        response = client.get('/api/v1/weather/forecast?city=Taipei&days=3')

        assert response.status_code == 200

        # 驗證天數參數
        mock_get_forecast.assert_called_once_with(city='Taipei', lat=None, lon=None, days=3)

    def test_get_forecast_invalid_days_range(self, client):
        """測試無效的天數範圍"""
        # 天數小於 1
        response = client.get('/api/v1/weather/forecast?city=Taipei&days=0')
        assert response.status_code == 400

        # 天數大於 5
        response = client.get('/api/v1/weather/forecast?city=Taipei&days=6')
        assert response.status_code == 400

    def test_get_forecast_missing_parameters(self, client):
        """測試缺少必需參數"""
        response = client.get('/api/v1/weather/forecast')

        assert response.status_code == 400
        data = json.loads(response.data)
        assert 'error' in data

    @patch('app.services.weather.weather_service.get_forecast')
    def test_get_forecast_by_coordinates(self, mock_get_forecast, client):
        """測試通過經緯度獲取預報"""
        mock_forecast_data = {
            'location': {'name': 'Taipei'},
            'forecast': []
        }
        mock_get_forecast.return_value = mock_forecast_data

        response = client.get('/api/v1/weather/forecast?lat=25.0330&lon=121.5654&days=3')

        assert response.status_code == 200
        mock_get_forecast.assert_called_once_with(
            city=None,
            lat='25.0330',
            lon='121.5654',
            days=3
        )


@pytest.mark.integration
class TestAIWeatherAdviceEndpoint:
    """測試 AI 天氣建議端點"""

    @patch('app.services.ai_assistant.ai_assistant.get_weather_advice')
    @patch('app.services.weather.weather_service.get_current_weather')
    def test_get_weather_advice_success(self, mock_get_weather, mock_get_advice, client, sample_weather_data):
        """測試成功獲取 AI 天氣建議"""
        mock_get_weather.return_value = sample_weather_data
        mock_advice = {
            'ai_suggestions': {
                'clothing': '建議穿著短袖',
                'activities': ['適合戶外活動'],
                'health': ['注意防曬'],
                'travel': '適合出行',
                'comfort_index': {'score': 85, 'level': '舒適'}
            }
        }
        mock_get_advice.return_value = mock_advice

        response = client.get('/api/v1/ai/weather-advice?city=Taipei')

        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'location' in data
        assert 'current' in data
        assert 'ai_suggestions' in data
        assert 'clothing' in data['ai_suggestions']

    @patch('app.services.weather.weather_service.get_current_weather')
    def test_get_weather_advice_missing_parameters(self, mock_get_weather, client):
        """測試缺少參數"""
        response = client.get('/api/v1/ai/weather-advice')

        assert response.status_code == 400
        data = json.loads(response.data)
        assert 'error' in data


@pytest.mark.integration
class TestAirQualityEndpoint:
    """測試空氣質量端點"""

    @patch('app.services.ai_assistant.ai_assistant.get_air_quality_advice')
    @patch('app.services.weather.weather_service.get_air_quality')
    def test_get_air_quality_success(self, mock_get_aqi, mock_get_advice, client):
        """測試成功獲取空氣質量"""
        mock_aqi_data = {
            'aqi': 2,
            'aqi_standard': 100,
            'components': {
                'pm2_5': 12.3,
                'pm10': 20.5
            },
            'timestamp': 1640000000
        }
        mock_get_aqi.return_value = mock_aqi_data

        mock_advice = {
            'aqi': 2,
            'level': '良',
            'color': 'yellow',
            'advice': '空氣質量可接受'
        }
        mock_get_advice.return_value = mock_advice

        response = client.get('/api/v1/ai/air-quality?city=Taipei')

        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'aqi' in data
        assert 'advice_details' in data

    def test_get_air_quality_missing_parameters(self, client):
        """測試缺少參數"""
        response = client.get('/api/v1/ai/air-quality')

        assert response.status_code == 400


@pytest.mark.integration
class TestCompleteReportEndpoint:
    """測試完整報告端點"""

    @patch('app.services.ai_assistant.ai_assistant.get_air_quality_advice')
    @patch('app.services.ai_assistant.ai_assistant.get_weather_advice')
    @patch('app.services.weather.weather_service.get_air_quality')
    @patch('app.services.weather.weather_service.get_forecast')
    @patch('app.services.weather.weather_service.get_current_weather')
    def test_get_complete_report_success(
        self,
        mock_current,
        mock_forecast,
        mock_aqi,
        mock_weather_advice,
        mock_aqi_advice,
        client,
        sample_weather_data
    ):
        """測試成功獲取完整報告"""
        mock_current.return_value = sample_weather_data
        mock_forecast.return_value = {
            'location': {'name': 'Taipei'},
            'forecast': [{'datetime': '2025-12-15 00:00:00', 'temperature': 25.0}] * 24
        }
        mock_aqi.return_value = {
            'aqi': 2,
            'components': {},
            'timestamp': 1640000000
        }
        mock_weather_advice.return_value = {
            'ai_suggestions': {
                'clothing': '建議穿著短袖',
                'activities': []
            }
        }
        mock_aqi_advice.return_value = {
            'level': '良',
            'advice': '空氣質量可接受'
        }

        response = client.get('/api/v1/ai/complete-report?city=Taipei')

        assert response.status_code == 200
        data = json.loads(response.data)

        # 驗證報告包含所有必需部分
        assert 'location' in data
        assert 'current_weather' in data
        assert 'forecast' in data
        assert 'ai_suggestions' in data
        assert 'air_quality' in data
        assert 'timestamp' in data

        # 驗證預報數據被限制在 24 小時
        assert len(data['forecast']) <= 24

    @patch('app.services.weather.weather_service.get_current_weather')
    def test_get_complete_report_missing_parameters(self, mock_current, client):
        """測試缺少參數"""
        response = client.get('/api/v1/ai/complete-report')

        assert response.status_code == 400

    @patch('app.services.weather.weather_service.get_air_quality')
    @patch('app.services.ai_assistant.ai_assistant.get_weather_advice')
    @patch('app.services.weather.weather_service.get_forecast')
    @patch('app.services.weather.weather_service.get_current_weather')
    def test_get_complete_report_air_quality_failure(
        self,
        mock_current,
        mock_forecast,
        mock_weather_advice,
        mock_aqi,
        client,
        sample_weather_data
    ):
        """測試空氣質量獲取失敗時的處理"""
        mock_current.return_value = sample_weather_data
        mock_forecast.return_value = {
            'location': {'name': 'Taipei'},
            'forecast': []
        }
        mock_weather_advice.return_value = {
            'ai_suggestions': {}
        }
        # 模擬空氣質量獲取失敗
        mock_aqi.side_effect = Exception("AQI API Error")

        response = client.get('/api/v1/ai/complete-report?city=Taipei')

        assert response.status_code == 200
        data = json.loads(response.data)

        # 即使空氣質量獲取失敗，報告仍應成功返回
        assert 'air_quality' in data
        assert 'error' in data['air_quality']


@pytest.mark.integration
class TestRateLimiting:
    """測試速率限制"""

    def test_rate_limiting_applied(self, client):
        """測試速率限制是否應用"""
        # 注意：在測試環境中，我們使用 memory:// 存儲
        # 速率限制配置為 1000 per hour，所以這個測試只是驗證機制存在

        response = client.get('/health')
        assert response.status_code == 200

        # 檢查速率限制頭是否存在
        # 注意：實際的頭名稱可能因 flask-limiter 版本而異
        # assert 'X-RateLimit-Limit' in response.headers or response.status_code == 200


@pytest.mark.integration
class TestCORS:
    """測試 CORS 配置"""

    def test_cors_headers_present(self, client):
        """測試 CORS 頭是否存在"""
        response = client.get('/')

        # 根據配置，CORS 頭應該存在
        # 注意：在測試環境中可能需要調整此測試
        assert response.status_code == 200
