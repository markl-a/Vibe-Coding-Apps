"""
測試配置和夾具
提供測試所需的應用實例、模擬數據和工具函數
"""
import pytest
import sys
import os
from unittest.mock import Mock, MagicMock, patch

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app
from app.config import Config


class TestConfig(Config):
    """測試配置"""
    TESTING = True
    DEBUG = True
    SECRET_KEY = 'test-secret-key'
    OPENWEATHER_API_KEY = 'test-api-key'
    WEATHERAPI_KEY = 'test-weather-key'
    REDIS_HOST = 'localhost'
    REDIS_PORT = 6379
    REDIS_DB = 1  # 使用不同的數據庫
    CACHE_EXPIRATION = 60
    RATE_LIMIT = '1000 per hour'
    RATE_LIMIT_STORAGE_URL = 'memory://'
    ENVIRONMENT = 'testing'


@pytest.fixture
def app():
    """創建測試應用"""
    app = create_app(TestConfig)
    app.config['TESTING'] = True
    yield app


@pytest.fixture
def client(app):
    """創建測試客戶端"""
    return app.test_client()


@pytest.fixture
def mock_weather_response():
    """模擬 OpenWeatherMap API 當前天氣響應"""
    return {
        'coord': {'lon': 121.5654, 'lat': 25.0330},
        'weather': [
            {
                'id': 800,
                'main': 'Clear',
                'description': '晴朗',
                'icon': '01d'
            }
        ],
        'main': {
            'temp': 25.5,
            'feels_like': 26.0,
            'temp_min': 24.0,
            'temp_max': 27.0,
            'pressure': 1013,
            'humidity': 65
        },
        'wind': {
            'speed': 3.5,
            'deg': 180
        },
        'clouds': {'all': 10},
        'dt': 1640000000,
        'sys': {
            'country': 'TW',
            'sunrise': 1639959600,
            'sunset': 1640000000
        },
        'name': 'Taipei',
        'cod': 200
    }


@pytest.fixture
def mock_forecast_response():
    """模擬 OpenWeatherMap API 預報響應"""
    return {
        'cod': '200',
        'message': 0,
        'cnt': 40,
        'list': [
            {
                'dt': 1640000000 + i * 10800,
                'main': {
                    'temp': 25.0 + i * 0.5,
                    'feels_like': 25.5 + i * 0.5,
                    'humidity': 60 + i,
                    'pressure': 1013
                },
                'weather': [
                    {
                        'id': 800,
                        'main': 'Clear',
                        'description': '晴朗',
                        'icon': '01d'
                    }
                ],
                'wind': {
                    'speed': 3.0 + i * 0.2
                },
                'dt_txt': f'2025-12-{15 + i // 8:02d} {(i % 8) * 3:02d}:00:00'
            }
            for i in range(5)
        ],
        'city': {
            'id': 1668341,
            'name': 'Taipei',
            'coord': {'lat': 25.0330, 'lon': 121.5654},
            'country': 'TW'
        }
    }


@pytest.fixture
def mock_air_quality_response():
    """模擬空氣質量 API 響應"""
    return {
        'coord': {'lon': 121.5654, 'lat': 25.0330},
        'list': [
            {
                'main': {'aqi': 2},
                'components': {
                    'co': 250.5,
                    'no': 0.5,
                    'no2': 15.2,
                    'o3': 45.8,
                    'so2': 5.1,
                    'pm2_5': 12.3,
                    'pm10': 20.5,
                    'nh3': 1.2
                },
                'dt': 1640000000
            }
        ]
    }


@pytest.fixture
def mock_weather_service(mock_weather_response, mock_forecast_response, mock_air_quality_response):
    """模擬天氣服務"""
    with patch('app.services.weather.weather_service') as mock_service:
        # 設置模擬方法的返回值
        mock_service.get_current_weather.return_value = {
            'location': {
                'name': 'Taipei',
                'country': 'TW',
                'coordinates': {'lat': 25.0330, 'lon': 121.5654}
            },
            'current': {
                'temperature': 25.5,
                'feels_like': 26.0,
                'humidity': 65,
                'pressure': 1013,
                'weather': '晴朗',
                'icon': '01d',
                'wind_speed': 3.5
            },
            'timestamp': 1640000000
        }

        mock_service.get_forecast.return_value = {
            'location': {
                'name': 'Taipei',
                'country': 'TW'
            },
            'forecast': [
                {
                    'datetime': f'2025-12-15 {i * 3:02d}:00:00',
                    'temperature': 25.0 + i * 0.5,
                    'weather': '晴朗',
                    'icon': '01d',
                    'humidity': 60 + i,
                    'wind_speed': 3.0 + i * 0.2
                }
                for i in range(5)
            ]
        }

        mock_service.get_air_quality.return_value = {
            'aqi': 2,
            'aqi_standard': 100,
            'components': {
                'co': 250.5,
                'no': 0.5,
                'no2': 15.2,
                'o3': 45.8,
                'so2': 5.1,
                'pm2_5': 12.3,
                'pm10': 20.5,
                'nh3': 1.2
            },
            'timestamp': 1640000000
        }

        yield mock_service


@pytest.fixture
def mock_cache_service():
    """模擬緩存服務"""
    with patch('app.services.cache.cache_service') as mock_cache:
        mock_cache.get.return_value = None  # 默認沒有緩存
        mock_cache.set.return_value = True
        yield mock_cache


@pytest.fixture
def mock_requests_get(mock_weather_response):
    """模擬 requests.get 調用"""
    with patch('requests.get') as mock_get:
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = mock_weather_response
        mock_response.raise_for_status = Mock()
        mock_get.return_value = mock_response
        yield mock_get


@pytest.fixture
def sample_weather_data():
    """提供示例天氣數據用於測試"""
    return {
        'location': {
            'name': 'Taipei',
            'country': 'TW',
            'coordinates': {'lat': 25.0330, 'lon': 121.5654}
        },
        'current': {
            'temperature': 25.5,
            'feels_like': 26.0,
            'humidity': 65,
            'pressure': 1013,
            'weather': '晴朗',
            'icon': '01d',
            'wind_speed': 3.5
        },
        'timestamp': 1640000000
    }


# 測試輔助函數
def assert_valid_weather_response(data):
    """驗證天氣響應數據格式"""
    assert 'location' in data
    assert 'current' in data
    assert 'name' in data['location']
    assert 'temperature' in data['current']
    assert 'humidity' in data['current']
    assert 'weather' in data['current']


def assert_valid_forecast_response(data):
    """驗證預報響應數據格式"""
    assert 'location' in data
    assert 'forecast' in data
    assert isinstance(data['forecast'], list)
    assert len(data['forecast']) > 0

    for item in data['forecast']:
        assert 'datetime' in item
        assert 'temperature' in item
        assert 'weather' in item


def assert_valid_air_quality_response(data):
    """驗證空氣質量響應數據格式"""
    assert 'aqi' in data
    assert isinstance(data['aqi'], int)
    assert 1 <= data['aqi'] <= 5 or 'components' in data
