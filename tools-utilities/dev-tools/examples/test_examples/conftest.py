"""
Pytest 配置檔 - 定義共用的 fixtures 和測試設定
"""

import os
import tempfile
from datetime import datetime

import pytest


# ============================================================
# Session 級別 Fixtures
# ============================================================

@pytest.fixture(scope="session")
def test_config():
    """測試配置"""
    return {
        "api_url": "http://localhost:8000",
        "timeout": 30,
        "retry_count": 3,
        "debug": os.getenv("DEBUG", "false").lower() == "true",
    }


@pytest.fixture(scope="session")
def test_database():
    """測試資料庫（session 級別）"""
    # 設置測試資料庫
    db = {"users": [], "posts": []}

    yield db

    # 清理
    db.clear()


# ============================================================
# Function 級別 Fixtures
# ============================================================

@pytest.fixture
def sample_user():
    """範例使用者資料"""
    return {
        "id": 1,
        "name": "測試用戶",
        "email": "test@example.com",
        "created_at": datetime.now().isoformat(),
    }


@pytest.fixture
def sample_users():
    """多個範例使用者"""
    return [
        {"id": 1, "name": "張三", "email": "zhang@example.com"},
        {"id": 2, "name": "李四", "email": "li@example.com"},
        {"id": 3, "name": "王五", "email": "wang@example.com"},
    ]


@pytest.fixture
def temp_directory():
    """臨時目錄"""
    temp_dir = tempfile.mkdtemp()
    yield temp_dir
    # 清理
    import shutil

    if os.path.exists(temp_dir):
        shutil.rmtree(temp_dir)


@pytest.fixture
def temp_json_file():
    """臨時 JSON 檔案"""
    fd, path = tempfile.mkstemp(suffix=".json")
    os.close(fd)
    yield path
    if os.path.exists(path):
        os.remove(path)


# ============================================================
# 自動使用的 Fixtures
# ============================================================

@pytest.fixture(autouse=True)
def reset_environment():
    """每個測試前重置環境變數"""
    # 保存原始環境變數
    original_env = dict(os.environ)

    yield

    # 恢復原始環境變數
    os.environ.clear()
    os.environ.update(original_env)


# ============================================================
# Pytest Hooks
# ============================================================

def pytest_configure(config):
    """Pytest 配置 hook"""
    # 註冊自訂標記
    config.addinivalue_line("markers", "slow: marks tests as slow")
    config.addinivalue_line("markers", "integration: marks integration tests")
    config.addinivalue_line("markers", "unit: marks unit tests")


def pytest_collection_modifyitems(config, items):
    """修改收集到的測試項目"""
    # 自動為慢速測試添加標記
    for item in items:
        if "slow" in item.keywords:
            item.add_marker(pytest.mark.slow)


def pytest_runtest_setup(item):
    """測試執行前的設置"""
    # 在 CI 環境中跳過特定測試
    if "skip_ci" in item.keywords and os.getenv("CI") == "true":
        pytest.skip("Skipped in CI environment")


# ============================================================
# 測試報告相關
# ============================================================

@pytest.hookimpl(tryfirst=True, hookwrapper=True)
def pytest_runtest_makereport(item, call):
    """生成測試報告"""
    outcome = yield
    report = outcome.get_result()

    # 為測試結果添加額外資訊
    if report.when == "call":
        if hasattr(item, "duration"):
            report.duration = item.duration


# ============================================================
# 參數化 Fixtures
# ============================================================

@pytest.fixture(params=["sqlite", "postgresql", "mysql"])
def database_type(request):
    """參數化的資料庫類型"""
    return request.param


@pytest.fixture(params=[10, 100, 1000])
def data_size(request):
    """參數化的資料大小"""
    return request.param


# ============================================================
# Mock Fixtures
# ============================================================

@pytest.fixture
def mock_api_response():
    """Mock API 回應"""
    return {
        "status": "success",
        "data": {"id": 1, "name": "測試"},
        "timestamp": datetime.now().isoformat(),
    }


@pytest.fixture
def mock_error_response():
    """Mock 錯誤回應"""
    return {"status": "error", "message": "發生錯誤", "code": 500}


# ============================================================
# 性能測試相關
# ============================================================

@pytest.fixture
def benchmark_data():
    """性能測試資料"""
    return list(range(10000))


# ============================================================
# 清理 Fixtures
# ============================================================

@pytest.fixture
def cleanup_files():
    """清理測試產生的檔案"""
    created_files = []

    def _track_file(filepath):
        created_files.append(filepath)
        return filepath

    yield _track_file

    # 清理所有追蹤的檔案
    for filepath in created_files:
        if os.path.exists(filepath):
            os.remove(filepath)
