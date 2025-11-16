from flask import request, jsonify
from app.routes import history_bp
from app.services.cache import cache_service

@history_bp.route('/', methods=['GET'])
def get_history():
    """獲取查詢歷史"""
    try:
        # 這裡可以實作查詢歷史功能
        # 從 Redis 或資料庫中獲取歷史記錄
        return jsonify({
            'message': 'History feature coming soon',
            'data': []
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@history_bp.route('/clear', methods=['POST'])
def clear_cache():
    """清除快取"""
    try:
        cache_service.clear_all()
        return jsonify({'message': 'Cache cleared successfully'}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500
