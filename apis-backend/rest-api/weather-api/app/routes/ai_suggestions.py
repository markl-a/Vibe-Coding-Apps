"""
AI 建議路由
提供基於天氣的智能建議
"""
from flask import request, jsonify
from app.routes import ai_bp
from app.services.weather import weather_service
from app.services.ai_assistant import ai_assistant

@ai_bp.route('/weather-advice', methods=['GET'])
def get_weather_advice():
    """獲取天氣建議（包含 AI 輔助）"""
    try:
        city = request.args.get('city')
        lat = request.args.get('lat')
        lon = request.args.get('lon')

        if not city and not (lat and lon):
            return jsonify({'error': 'Must provide either city or lat/lon parameters'}), 400

        # 獲取當前天氣
        weather_data = weather_service.get_current_weather(city=city, lat=lat, lon=lon)

        # 獲取 AI 建議
        ai_advice = ai_assistant.get_weather_advice(weather_data)

        # 合併數據
        result = {
            **weather_data,
            **ai_advice
        }

        return jsonify(result), 200

    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@ai_bp.route('/air-quality', methods=['GET'])
def get_air_quality():
    """獲取空氣質量指數和建議"""
    try:
        city = request.args.get('city')
        lat = request.args.get('lat')
        lon = request.args.get('lon')

        if not city and not (lat and lon):
            return jsonify({'error': 'Must provide either city or lat/lon parameters'}), 400

        # 獲取空氣質量數據
        aqi_data = weather_service.get_air_quality(city=city, lat=lat, lon=lon)

        # 獲取空氣質量建議
        if 'aqi' in aqi_data:
            advice = ai_assistant.get_air_quality_advice(aqi_data['aqi'])
            aqi_data['advice_details'] = advice

        return jsonify(aqi_data), 200

    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@ai_bp.route('/complete-report', methods=['GET'])
def get_complete_weather_report():
    """獲取完整的天氣報告（天氣 + 預報 + AI 建議 + 空氣質量）"""
    try:
        city = request.args.get('city')
        lat = request.args.get('lat')
        lon = request.args.get('lon')

        if not city and not (lat and lon):
            return jsonify({'error': 'Must provide either city or lat/lon parameters'}), 400

        # 獲取當前天氣
        current_weather = weather_service.get_current_weather(city=city, lat=lat, lon=lon)

        # 獲取預報
        forecast = weather_service.get_forecast(city=city, lat=lat, lon=lon, days=3)

        # 獲取 AI 建議
        ai_advice = ai_assistant.get_weather_advice(current_weather)

        # 獲取空氣質量
        try:
            air_quality = weather_service.get_air_quality(city=city, lat=lat, lon=lon)
            if 'aqi' in air_quality:
                air_quality['advice'] = ai_assistant.get_air_quality_advice(air_quality['aqi'])
        except:
            air_quality = {'error': '空氣質量數據暫時不可用'}

        # 組合完整報告
        complete_report = {
            'location': current_weather.get('location'),
            'current_weather': current_weather.get('current'),
            'forecast': forecast.get('forecast', [])[:24],  # 只取未來 24 小時
            'ai_suggestions': ai_advice.get('ai_suggestions'),
            'air_quality': air_quality,
            'timestamp': current_weather.get('timestamp'),
            'powered_by': 'Weather API with AI Enhancement'
        }

        return jsonify(complete_report), 200

    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500
