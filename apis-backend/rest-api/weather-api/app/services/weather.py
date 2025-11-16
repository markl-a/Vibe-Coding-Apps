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

weather_service = WeatherService()
