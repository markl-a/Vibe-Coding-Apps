import requests
from app.config import Config
from app.services.cache import cache_service

class WeatherService:
    def __init__(self):
        self.openweather_base_url = "https://api.openweathermap.org/data/2.5"
        self.api_key = Config.OPENWEATHER_API_KEY

    def get_current_weather(self, city=None, lat=None, lon=None):
        """獲取當前天氣"""
        # 生成快取鍵
        cache_key = f"weather:current:{city or f'{lat},{lon}'}"

        # 檢查快取
        cached_data = cache_service.get(cache_key)
        if cached_data:
            return cached_data

        # 構建請求參數
        params = {
            'appid': self.api_key,
            'units': 'metric',  # 使用攝氏度
            'lang': 'zh_tw'
        }

        if city:
            params['q'] = city
        elif lat and lon:
            params['lat'] = lat
            params['lon'] = lon
        else:
            raise ValueError("Must provide either city or lat/lon")

        # 調用 API
        response = requests.get(f"{self.openweather_base_url}/weather", params=params)
        response.raise_for_status()
        data = response.json()

        # 格式化回應
        result = {
            'location': {
                'name': data['name'],
                'country': data['sys']['country'],
                'coordinates': {
                    'lat': data['coord']['lat'],
                    'lon': data['coord']['lon']
                }
            },
            'current': {
                'temperature': data['main']['temp'],
                'feels_like': data['main']['feels_like'],
                'humidity': data['main']['humidity'],
                'pressure': data['main']['pressure'],
                'weather': data['weather'][0]['description'],
                'icon': data['weather'][0]['icon'],
                'wind_speed': data['wind']['speed'],
            },
            'timestamp': data['dt']
        }

        # 存入快取
        cache_service.set(cache_key, result)

        return result

    def get_forecast(self, city=None, lat=None, lon=None, days=5):
        """獲取天氣預報"""
        cache_key = f"weather:forecast:{city or f'{lat},{lon}'}"

        cached_data = cache_service.get(cache_key)
        if cached_data:
            return cached_data

        params = {
            'appid': self.api_key,
            'units': 'metric',
            'lang': 'zh_tw',
            'cnt': days * 8  # 每天8個時間點 (3小時間隔)
        }

        if city:
            params['q'] = city
        elif lat and lon:
            params['lat'] = lat
            params['lon'] = lon
        else:
            raise ValueError("Must provide either city or lat/lon")

        response = requests.get(f"{self.openweather_base_url}/forecast", params=params)
        response.raise_for_status()
        data = response.json()

        result = {
            'location': {
                'name': data['city']['name'],
                'country': data['city']['country'],
            },
            'forecast': [
                {
                    'datetime': item['dt_txt'],
                    'temperature': item['main']['temp'],
                    'weather': item['weather'][0]['description'],
                    'icon': item['weather'][0]['icon'],
                    'humidity': item['main']['humidity'],
                    'wind_speed': item['wind']['speed'],
                }
                for item in data['list']
            ]
        }

        cache_service.set(cache_key, result)

        return result

    def get_air_quality(self, city=None, lat=None, lon=None):
        """獲取空氣質量指數 (AQI)"""
        cache_key = f"weather:aqi:{city or f'{lat},{lon}'}"

        cached_data = cache_service.get(cache_key)
        if cached_data:
            return cached_data

        params = {
            'appid': self.api_key,
        }

        if city:
            params['q'] = city
        elif lat and lon:
            params['lat'] = lat
            params['lon'] = lon
        else:
            raise ValueError("Must provide either city or lat/lon")

        try:
            response = requests.get(f"{self.openweather_base_url}/air_pollution", params=params)
            response.raise_for_status()
            data = response.json()

            if 'list' not in data or len(data['list']) == 0:
                raise ValueError("No air quality data available")

            aqi_data = data['list'][0]

            result = {
                'aqi': aqi_data['main']['aqi'],
                'components': {
                    'co': aqi_data['components'].get('co', 0),
                    'no': aqi_data['components'].get('no', 0),
                    'no2': aqi_data['components'].get('no2', 0),
                    'o3': aqi_data['components'].get('o3', 0),
                    'so2': aqi_data['components'].get('so2', 0),
                    'pm2_5': aqi_data['components'].get('pm2_5', 0),
                    'pm10': aqi_data['components'].get('pm10', 0),
                    'nh3': aqi_data['components'].get('nh3', 0),
                },
                'timestamp': aqi_data['dt']
            }

            # 將 OpenWeatherMap 的 AQI (1-5) 轉換為標準 AQI (0-500)
            aqi_mapping = {1: 50, 2: 100, 3: 150, 4: 200, 5: 300}
            result['aqi_standard'] = aqi_mapping.get(result['aqi'], 150)

            cache_service.set(cache_key, result, expiration=1800)  # 30 分鐘快取

            return result

        except requests.exceptions.RequestException as e:
            # 如果 API 不支持或出錯，返回模擬數據
            return {
                'aqi': 2,
                'aqi_standard': 75,
                'components': {},
                'note': '空氣質量數據暫時不可用',
                'timestamp': 0
            }

weather_service = WeatherService()
