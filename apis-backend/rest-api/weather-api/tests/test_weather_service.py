"""
天氣服務測試
測試 WeatherService 類的各種方法
"""
import pytest
from unittest.mock import Mock, patch, MagicMock
import requests

from app.services.weather import WeatherService


@pytest.mark.unit
class TestWeatherServiceInit:
    """測試 WeatherService 初始化"""

    def test_weather_service_initialization(self):
        """測試天氣服務初始化"""
        service = WeatherService()
        assert service.openweather_base_url == "https://api.openweathermap.org/data/2.5"
        assert hasattr(service, 'api_key')


@pytest.mark.unit
class TestGetCurrentWeather:
    """測試獲取當前天氣功能"""

    @patch('app.services.weather.requests.get')
    @patch('app.services.weather.cache_service')
    def test_get_current_weather_by_city(self, mock_cache, mock_get, mock_weather_response):
        """測試通過城市名稱獲取天氣"""
        # 設置模擬
        mock_cache.get.return_value = None
        mock_response = Mock()
        mock_response.json.return_value = mock_weather_response
        mock_response.raise_for_status = Mock()
        mock_get.return_value = mock_response

        # 執行測試
        service = WeatherService()
        result = service.get_current_weather(city='Taipei')

        # 驗證結果
        assert result is not None
        assert 'location' in result
        assert 'current' in result
        assert result['location']['name'] == 'Taipei'
        assert result['current']['temperature'] == 25.5
        assert result['current']['humidity'] == 65

        # 驗證 API 調用
        mock_get.assert_called_once()
        call_args = mock_get.call_args
        assert 'q' in call_args[1]['params']
        assert call_args[1]['params']['q'] == 'Taipei'

    @patch('app.services.weather.requests.get')
    @patch('app.services.weather.cache_service')
    def test_get_current_weather_by_coordinates(self, mock_cache, mock_get, mock_weather_response):
        """測試通過經緯度獲取天氣"""
        mock_cache.get.return_value = None
        mock_response = Mock()
        mock_response.json.return_value = mock_weather_response
        mock_response.raise_for_status = Mock()
        mock_get.return_value = mock_response

        service = WeatherService()
        result = service.get_current_weather(lat=25.0330, lon=121.5654)

        assert result is not None
        assert 'location' in result
        assert 'current' in result

        # 驗證 API 調用參數
        call_args = mock_get.call_args
        assert 'lat' in call_args[1]['params']
        assert 'lon' in call_args[1]['params']
        assert call_args[1]['params']['lat'] == 25.0330
        assert call_args[1]['params']['lon'] == 121.5654

    @patch('app.services.weather.cache_service')
    def test_get_current_weather_from_cache(self, mock_cache):
        """測試從緩存獲取天氣數據"""
        cached_data = {
            'location': {'name': 'Taipei'},
            'current': {'temperature': 25.0}
        }
        mock_cache.get.return_value = cached_data

        service = WeatherService()
        result = service.get_current_weather(city='Taipei')

        # 應該返回緩存的數據
        assert result == cached_data
        # 驗證調用了緩存
        mock_cache.get.assert_called_once()

    @patch('app.services.weather.cache_service')
    def test_get_current_weather_missing_parameters(self, mock_cache):
        """測試缺少必需參數時拋出異常"""
        mock_cache.get.return_value = None

        service = WeatherService()
        with pytest.raises(ValueError) as excinfo:
            service.get_current_weather()

        assert "Must provide either city or lat/lon" in str(excinfo.value)

    @patch('app.services.weather.requests.get')
    @patch('app.services.weather.cache_service')
    def test_get_current_weather_api_error(self, mock_cache, mock_get):
        """測試 API 錯誤處理"""
        mock_cache.get.return_value = None
        mock_response = Mock()
        mock_response.raise_for_status.side_effect = requests.exceptions.HTTPError("API Error")
        mock_get.return_value = mock_response

        service = WeatherService()
        with pytest.raises(requests.exceptions.HTTPError):
            service.get_current_weather(city='InvalidCity')

    @patch('app.services.weather.requests.get')
    @patch('app.services.weather.cache_service')
    def test_get_current_weather_caches_result(self, mock_cache, mock_get, mock_weather_response):
        """測試成功獲取天氣後會緩存結果"""
        mock_cache.get.return_value = None
        mock_response = Mock()
        mock_response.json.return_value = mock_weather_response
        mock_response.raise_for_status = Mock()
        mock_get.return_value = mock_response

        service = WeatherService()
        result = service.get_current_weather(city='Taipei')

        # 驗證設置了緩存
        mock_cache.set.assert_called_once()
        call_args = mock_cache.set.call_args
        assert 'weather:current:Taipei' in call_args[0][0]


@pytest.mark.unit
class TestGetForecast:
    """測試獲取天氣預報功能"""

    @patch('app.services.weather.requests.get')
    @patch('app.services.weather.cache_service')
    def test_get_forecast_by_city(self, mock_cache, mock_get, mock_forecast_response):
        """測試通過城市名稱獲取預報"""
        mock_cache.get.return_value = None
        mock_response = Mock()
        mock_response.json.return_value = mock_forecast_response
        mock_response.raise_for_status = Mock()
        mock_get.return_value = mock_response

        service = WeatherService()
        result = service.get_forecast(city='Taipei', days=3)

        assert result is not None
        assert 'location' in result
        assert 'forecast' in result
        assert isinstance(result['forecast'], list)
        assert len(result['forecast']) > 0

        # 驗證 API 調用
        call_args = mock_get.call_args
        assert call_args[1]['params']['cnt'] == 24  # 3 days * 8 intervals

    @patch('app.services.weather.requests.get')
    @patch('app.services.weather.cache_service')
    def test_get_forecast_default_days(self, mock_cache, mock_get, mock_forecast_response):
        """測試默認預報天數"""
        mock_cache.get.return_value = None
        mock_response = Mock()
        mock_response.json.return_value = mock_forecast_response
        mock_response.raise_for_status = Mock()
        mock_get.return_value = mock_response

        service = WeatherService()
        result = service.get_forecast(city='Taipei')

        # 驗證默認使用 5 天
        call_args = mock_get.call_args
        assert call_args[1]['params']['cnt'] == 40  # 5 days * 8 intervals

    @patch('app.services.weather.cache_service')
    def test_get_forecast_from_cache(self, mock_cache):
        """測試從緩存獲取預報數據"""
        cached_data = {
            'location': {'name': 'Taipei'},
            'forecast': []
        }
        mock_cache.get.return_value = cached_data

        service = WeatherService()
        result = service.get_forecast(city='Taipei')

        assert result == cached_data

    @patch('app.services.weather.cache_service')
    def test_get_forecast_missing_parameters(self, mock_cache):
        """測試缺少必需參數"""
        mock_cache.get.return_value = None

        service = WeatherService()
        with pytest.raises(ValueError):
            service.get_forecast()


@pytest.mark.unit
class TestGetAirQuality:
    """測試獲取空氣質量功能"""

    @patch('app.services.weather.requests.get')
    @patch('app.services.weather.cache_service')
    def test_get_air_quality_success(self, mock_cache, mock_get, mock_air_quality_response):
        """測試成功獲取空氣質量"""
        mock_cache.get.return_value = None
        mock_response = Mock()
        mock_response.json.return_value = mock_air_quality_response
        mock_response.raise_for_status = Mock()
        mock_get.return_value = mock_response

        service = WeatherService()
        result = service.get_air_quality(city='Taipei')

        assert result is not None
        assert 'aqi' in result
        assert 'components' in result
        assert 'aqi_standard' in result
        assert result['aqi'] == 2
        assert result['aqi_standard'] == 100  # 映射後的標準 AQI

    @patch('app.services.weather.requests.get')
    @patch('app.services.weather.cache_service')
    def test_get_air_quality_aqi_mapping(self, mock_cache, mock_get):
        """測試 AQI 等級映射"""
        mock_cache.get.return_value = None

        test_cases = [
            (1, 50),   # 優
            (2, 100),  # 良
            (3, 150),  # 輕度污染
            (4, 200),  # 中度污染
            (5, 300),  # 重度污染
        ]

        for aqi_level, expected_standard in test_cases:
            mock_response = Mock()
            mock_response.json.return_value = {
                'list': [{
                    'main': {'aqi': aqi_level},
                    'components': {},
                    'dt': 1640000000
                }]
            }
            mock_response.raise_for_status = Mock()
            mock_get.return_value = mock_response

            service = WeatherService()
            result = service.get_air_quality(city='Taipei')

            assert result['aqi'] == aqi_level
            assert result['aqi_standard'] == expected_standard

    @patch('app.services.weather.requests.get')
    @patch('app.services.weather.cache_service')
    def test_get_air_quality_api_failure_fallback(self, mock_cache, mock_get):
        """測試 API 失敗時的回退機制"""
        mock_cache.get.return_value = None
        mock_get.side_effect = requests.exceptions.RequestException("API Error")

        service = WeatherService()
        result = service.get_air_quality(city='Taipei')

        # 應該返回模擬數據而不是拋出異常
        assert result is not None
        assert 'note' in result or 'aqi' in result

    @patch('app.services.weather.cache_service')
    def test_get_air_quality_missing_parameters(self, mock_cache):
        """測試缺少必需參數"""
        mock_cache.get.return_value = None

        service = WeatherService()
        with pytest.raises(ValueError):
            service.get_air_quality()

    @patch('app.services.weather.requests.get')
    @patch('app.services.weather.cache_service')
    def test_get_air_quality_caches_result(self, mock_cache, mock_get, mock_air_quality_response):
        """測試空氣質量數據會被緩存"""
        mock_cache.get.return_value = None
        mock_response = Mock()
        mock_response.json.return_value = mock_air_quality_response
        mock_response.raise_for_status = Mock()
        mock_get.return_value = mock_response

        service = WeatherService()
        result = service.get_air_quality(city='Taipei')

        # 驗證設置了緩存
        mock_cache.set.assert_called_once()
        call_args = mock_cache.set.call_args
        # 空氣質量數據使用較短的緩存時間（30分鐘）
        assert call_args[1]['expiration'] == 1800


@pytest.mark.integration
class TestWeatherServiceIntegration:
    """集成測試 - 測試多個方法的組合使用"""

    @patch('app.services.weather.requests.get')
    @patch('app.services.weather.cache_service')
    def test_weather_service_complete_flow(self, mock_cache, mock_get, mock_weather_response, mock_forecast_response):
        """測試完整的天氣服務流程"""
        mock_cache.get.return_value = None

        # 設置不同的響應
        def mock_get_response(*args, **kwargs):
            mock_response = Mock()
            mock_response.raise_for_status = Mock()

            if 'weather' in args[0]:
                mock_response.json.return_value = mock_weather_response
            elif 'forecast' in args[0]:
                mock_response.json.return_value = mock_forecast_response

            return mock_response

        mock_get.side_effect = mock_get_response

        service = WeatherService()

        # 獲取當前天氣
        current = service.get_current_weather(city='Taipei')
        assert current is not None

        # 獲取預報
        forecast = service.get_forecast(city='Taipei')
        assert forecast is not None

        # 驗證兩次 API 調用
        assert mock_get.call_count == 2
