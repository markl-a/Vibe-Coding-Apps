"""
範例測試套件 - 展示各種測試類型和最佳實踐
這個檔案展示如何使用 test_runner.py 執行各種測試
"""

import json
import os
import tempfile
import unittest
from datetime import datetime
from unittest.mock import MagicMock, Mock, patch

import pytest


# ============================================================
# 單元測試範例 (Unit Tests)
# ============================================================

class Calculator:
    """簡單的計算器類別用於測試"""

    def add(self, a, b):
        """加法"""
        return a + b

    def subtract(self, a, b):
        """減法"""
        return a - b

    def multiply(self, a, b):
        """乘法"""
        return a * b

    def divide(self, a, b):
        """除法"""
        if b == 0:
            raise ValueError("除數不能為零")
        return a / b


class TestCalculator(unittest.TestCase):
    """計算器單元測試"""

    def setUp(self):
        """測試前準備"""
        self.calc = Calculator()

    def test_add(self):
        """測試加法"""
        self.assertEqual(self.calc.add(2, 3), 5)
        self.assertEqual(self.calc.add(-1, 1), 0)
        self.assertEqual(self.calc.add(0, 0), 0)

    def test_subtract(self):
        """測試減法"""
        self.assertEqual(self.calc.subtract(5, 3), 2)
        self.assertEqual(self.calc.subtract(0, 5), -5)

    def test_multiply(self):
        """測試乘法"""
        self.assertEqual(self.calc.multiply(3, 4), 12)
        self.assertEqual(self.calc.multiply(0, 10), 0)

    def test_divide(self):
        """測試除法"""
        self.assertEqual(self.calc.divide(10, 2), 5)
        self.assertAlmostEqual(self.calc.divide(7, 3), 2.333, places=2)

    def test_divide_by_zero(self):
        """測試除以零的錯誤處理"""
        with self.assertRaises(ValueError):
            self.calc.divide(10, 0)


# ============================================================
# Pytest 風格測試範例
# ============================================================

@pytest.fixture
def sample_data():
    """測試資料 fixture"""
    return {
        "users": [
            {"id": 1, "name": "張三", "email": "zhang@example.com"},
            {"id": 2, "name": "李四", "email": "li@example.com"},
        ]
    }


@pytest.fixture
def temp_file():
    """臨時檔案 fixture"""
    fd, path = tempfile.mkstemp(suffix=".json")
    os.close(fd)
    yield path
    if os.path.exists(path):
        os.remove(path)


def test_data_structure(sample_data):
    """測試資料結構"""
    assert "users" in sample_data
    assert len(sample_data["users"]) == 2
    assert sample_data["users"][0]["name"] == "張三"


def test_file_operations(temp_file, sample_data):
    """測試檔案操作"""
    # 寫入資料
    with open(temp_file, "w") as f:
        json.dump(sample_data, f)

    # 讀取並驗證
    with open(temp_file, "r") as f:
        loaded_data = json.load(f)

    assert loaded_data == sample_data


@pytest.mark.parametrize(
    "input_value,expected",
    [
        (1, 2),
        (2, 4),
        (3, 6),
        (0, 0),
        (-1, -2),
    ],
)
def test_double(input_value, expected):
    """參數化測試範例"""
    assert input_value * 2 == expected


# ============================================================
# Mock 測試範例
# ============================================================

class EmailService:
    """郵件服務類別"""

    def send_email(self, to, subject, body):
        """發送郵件（實際會連接郵件伺服器）"""
        # 實際實作會連接 SMTP 伺服器
        pass


class UserNotifier:
    """使用者通知類別"""

    def __init__(self, email_service):
        self.email_service = email_service

    def notify_user(self, user, message):
        """通知使用者"""
        return self.email_service.send_email(
            to=user["email"], subject="通知", body=message
        )


class TestUserNotifier(unittest.TestCase):
    """使用 Mock 測試通知功能"""

    def test_notify_user_with_mock(self):
        """測試通知功能（使用 Mock）"""
        # 建立 Mock 郵件服務
        mock_email_service = Mock()
        mock_email_service.send_email.return_value = True

        # 建立通知器
        notifier = UserNotifier(mock_email_service)

        # 測試通知
        user = {"email": "test@example.com", "name": "測試用戶"}
        result = notifier.notify_user(user, "測試訊息")

        # 驗證
        mock_email_service.send_email.assert_called_once_with(
            to="test@example.com", subject="通知", body="測試訊息"
        )
        self.assertTrue(result)


# ============================================================
# 整合測試範例
# ============================================================

@pytest.mark.integration
class TestIntegration:
    """整合測試範例"""

    def test_full_workflow(self, temp_file):
        """測試完整工作流程"""
        # 1. 建立資料
        data = {"timestamp": datetime.now().isoformat(), "status": "active"}

        # 2. 儲存到檔案
        with open(temp_file, "w") as f:
            json.dump(data, f)

        # 3. 讀取並處理
        with open(temp_file, "r") as f:
            loaded = json.load(f)

        # 4. 驗證
        assert loaded["status"] == "active"
        assert "timestamp" in loaded


# ============================================================
# 效能測試範例
# ============================================================

@pytest.mark.slow
def test_performance():
    """效能測試範例"""
    import time

    start = time.time()

    # 模擬耗時操作
    result = sum(range(1000000))

    elapsed = time.time() - start

    assert result > 0
    assert elapsed < 1.0  # 應該在 1 秒內完成


# ============================================================
# 異常處理測試範例
# ============================================================

def divide_numbers(a, b):
    """除法函數"""
    if not isinstance(a, (int, float)) or not isinstance(b, (int, float)):
        raise TypeError("參數必須是數字")
    if b == 0:
        raise ValueError("除數不能為零")
    return a / b


class TestExceptionHandling(unittest.TestCase):
    """異常處理測試"""

    def test_type_error(self):
        """測試類型錯誤"""
        with self.assertRaises(TypeError):
            divide_numbers("10", 2)

    def test_value_error(self):
        """測試值錯誤"""
        with self.assertRaises(ValueError):
            divide_numbers(10, 0)

    def test_valid_division(self):
        """測試正常除法"""
        result = divide_numbers(10, 2)
        self.assertEqual(result, 5)


# ============================================================
# 跳過測試範例
# ============================================================

@pytest.mark.skip(reason="功能尚未實作")
def test_future_feature():
    """未來功能測試（跳過）"""
    pass


@pytest.mark.skipif(os.getenv("CI") == "true", reason="CI 環境跳過")
def test_local_only():
    """只在本地執行的測試"""
    assert True


# ============================================================
# 測試類別範例
# ============================================================

class TestUserManagement:
    """使用者管理測試類別"""

    @pytest.fixture(autouse=True)
    def setup(self):
        """每個測試前執行"""
        self.users = []
        yield
        # 清理
        self.users = []

    def test_add_user(self):
        """測試新增使用者"""
        user = {"id": 1, "name": "測試"}
        self.users.append(user)
        assert len(self.users) == 1

    def test_remove_user(self):
        """測試移除使用者"""
        user = {"id": 1, "name": "測試"}
        self.users.append(user)
        self.users.remove(user)
        assert len(self.users) == 0


# ============================================================
# 主程式
# ============================================================

if __name__ == "__main__":
    # 使用 unittest 執行測試
    unittest.main()
