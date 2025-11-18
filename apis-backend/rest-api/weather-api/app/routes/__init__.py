from flask import Blueprint

weather_bp = Blueprint('weather', __name__)
location_bp = Blueprint('location', __name__)
history_bp = Blueprint('history', __name__)
ai_bp = Blueprint('ai', __name__)

from app.routes import weather, location, history, ai_suggestions
