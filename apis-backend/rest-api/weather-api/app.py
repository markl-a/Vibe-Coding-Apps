"""
天氣資訊聚合 REST API
使用 Flask 和 Redis 構建
"""
from flask import Flask
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from app.config import Config
from app.routes import weather_bp, location_bp, history_bp, ai_bp

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # CORS
    CORS(app, origins=app.config['CORS_ORIGINS'])

    # Rate limiting
    limiter = Limiter(
        get_remote_address,
        app=app,
        default_limits=[app.config['RATE_LIMIT']],
        storage_uri=app.config.get('RATE_LIMIT_STORAGE_URL', 'memory://'),
    )

    # Register blueprints
    app.register_blueprint(weather_bp, url_prefix='/api/v1/weather')
    app.register_blueprint(location_bp, url_prefix='/api/v1/location')
    app.register_blueprint(history_bp, url_prefix='/api/v1/history')
    app.register_blueprint(ai_bp, url_prefix='/api/v1/ai')

    @app.route('/')
    def index():
        return {
            'message': '歡迎使用 Weather API with AI Enhancement 🤖',
            'version': '2.0.0',
            'features': [
                '天氣查詢與預報',
                'AI 智能建議',
                '空氣質量指數',
                '完整天氣報告'
            ],
            'endpoints': {
                'current_weather': '/api/v1/weather/current',
                'forecast': '/api/v1/weather/forecast',
                'location_search': '/api/v1/location/search',
                'history': '/api/v1/history',
                'ai_weather_advice': '/api/v1/ai/weather-advice',
                'air_quality': '/api/v1/ai/air-quality',
                'complete_report': '/api/v1/ai/complete-report'
            }
        }

    @app.route('/health')
    def health():
        return {'status': 'healthy'}

    return app

if __name__ == '__main__':
    app = create_app()
    app.run(
        host=app.config['HOST'],
        port=app.config['PORT'],
        debug=app.config['DEBUG']
    )
