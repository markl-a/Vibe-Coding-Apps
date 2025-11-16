from flask import request, jsonify
from geopy.geocoders import Nominatim
from app.routes import location_bp

geolocator = Nominatim(user_agent="weather-api")

@location_bp.route('/search', methods=['GET'])
def search_location():
    """搜尋地理位置"""
    try:
        query = request.args.get('q')
        if not query:
            return jsonify({'error': 'Query parameter q is required'}), 400

        location = geolocator.geocode(query)
        if not location:
            return jsonify({'error': 'Location not found'}), 404

        result = {
            'name': location.address,
            'latitude': location.latitude,
            'longitude': location.longitude,
        }

        return jsonify(result), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@location_bp.route('/reverse', methods=['GET'])
def reverse_geocode():
    """反向地理編碼"""
    try:
        lat = request.args.get('lat')
        lon = request.args.get('lon')

        if not lat or not lon:
            return jsonify({'error': 'Both lat and lon parameters are required'}), 400

        location = geolocator.reverse(f"{lat}, {lon}")
        if not location:
            return jsonify({'error': 'Location not found'}), 404

        result = {
            'address': location.address,
            'latitude': location.latitude,
            'longitude': location.longitude,
        }

        return jsonify(result), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500
