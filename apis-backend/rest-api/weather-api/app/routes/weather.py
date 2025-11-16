from flask import request, jsonify
from app.routes import weather_bp
from app.services.weather import weather_service

@weather_bp.route('/current', methods=['GET'])
def get_current_weather():
    """獲取當前天氣"""
    try:
        city = request.args.get('city')
        lat = request.args.get('lat')
        lon = request.args.get('lon')

        if not city and not (lat and lon):
            return jsonify({'error': 'Must provide either city or lat/lon parameters'}), 400

        result = weather_service.get_current_weather(city=city, lat=lat, lon=lon)
        return jsonify(result), 200

    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except requests.exceptions.RequestException as e:
        return jsonify({'error': 'Failed to fetch weather data'}), 503
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@weather_bp.route('/forecast', methods=['GET'])
def get_forecast():
    """獲取天氣預報"""
    try:
        city = request.args.get('city')
        lat = request.args.get('lat')
        lon = request.args.get('lon')
        days = int(request.args.get('days', 5))

        if not city and not (lat and lon):
            return jsonify({'error': 'Must provide either city or lat/lon parameters'}), 400

        if days < 1 or days > 5:
            return jsonify({'error': 'Days must be between 1 and 5'}), 400

        result = weather_service.get_forecast(city=city, lat=lat, lon=lon, days=days)
        return jsonify(result), 200

    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except requests.exceptions.RequestException as e:
        return jsonify({'error': 'Failed to fetch forecast data'}), 503
    except Exception as e:
        return jsonify({'error': str(e)}), 500
