"""
範例：格式化後的程式碼 - 符合 PEP 8 和最佳實踐
這個檔案展示了使用 code_formatter.py 格式化後的結果
"""

import json
import os
import sys
from datetime import datetime, timedelta
from typing import Dict, List, Optional


# 函數定義格式良好
def calculate_total(
    items: List[Dict], tax_rate: float = 0.1, discount: float = 0
) -> float:
    """計算項目總額，包含稅金和折扣"""
    total = 0
    for item in items:
        price = item.get("price", 0)
        quantity = item.get("quantity", 1)
        total += price * quantity

    # 計算稅金和折扣
    tax = total * tax_rate
    final_total = total + tax - discount
    return final_total


class UserManager:
    """使用者管理類別"""

    def __init__(self, db_path: str):
        """初始化使用者管理器

        Args:
            db_path: 資料庫路徑
        """
        self.db_path = db_path
        self.users = []

    def add_user(self, name: str, email: str, age: int) -> Dict:
        """新增使用者

        Args:
            name: 使用者名稱
            email: 電子郵件
            age: 年齡

        Returns:
            新增的使用者資料
        """
        user = {
            "id": len(self.users) + 1,
            "name": name,
            "email": email,
            "age": age,
            "created_at": datetime.now().isoformat(),
        }
        self.users.append(user)
        return user

    def find_user(self, user_id: int) -> Optional[Dict]:
        """尋找使用者

        Args:
            user_id: 使用者 ID

        Returns:
            使用者資料，如果找不到則返回 None
        """
        for user in self.users:
            if user["id"] == user_id:
                return user
        return None

    def update_user(self, user_id: int, **kwargs) -> Optional[Dict]:
        """更新使用者資料

        Args:
            user_id: 使用者 ID
            **kwargs: 要更新的欄位

        Returns:
            更新後的使用者資料，如果找不到則返回 None
        """
        user = self.find_user(user_id)
        if user:
            user.update(kwargs)
            return user
        return None

    def delete_user(self, user_id: int) -> bool:
        """刪除使用者

        Args:
            user_id: 使用者 ID

        Returns:
            是否成功刪除
        """
        for idx, user in enumerate(self.users):
            if user["id"] == user_id:
                self.users.pop(idx)
                return True
        return False

    def list_users(self, filter_by: Optional[Dict] = None) -> List[Dict]:
        """列出使用者

        Args:
            filter_by: 過濾條件

        Returns:
            使用者列表
        """
        if not filter_by:
            return self.users

        filtered = []
        for user in self.users:
            match = True
            for key, value in filter_by.items():
                if user.get(key) != value:
                    match = False
                    break
            if match:
                filtered.append(user)
        return filtered


# 資料驗證函數
def validate_email(email: str) -> bool:
    """驗證電子郵件格式

    Args:
        email: 電子郵件地址

    Returns:
        是否為有效的電子郵件格式
    """
    import re

    pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
    return bool(re.match(pattern, email))


def validate_age(age: int) -> bool:
    """驗證年齡

    Args:
        age: 年齡

    Returns:
        年齡是否在有效範圍內
    """
    return 0 < age < 150


# 資料處理函數
def process_data(data: List[Dict], transform_func=None) -> List[Dict]:
    """處理資料列表

    Args:
        data: 要處理的資料列表
        transform_func: 轉換函數

    Returns:
        處理後的資料列表
    """
    result = []
    for item in data:
        if transform_func:
            item = transform_func(item)
        result.append(item)
    return result


# 檔案操作
def save_to_file(data: Dict, filepath: str) -> None:
    """儲存資料到檔案

    Args:
        data: 要儲存的資料
        filepath: 檔案路徑
    """
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def load_from_file(filepath: str) -> Optional[Dict]:
    """從檔案載入資料

    Args:
        filepath: 檔案路徑

    Returns:
        載入的資料，如果檔案不存在則返回 None
    """
    if not os.path.exists(filepath):
        return None
    with open(filepath, "r", encoding="utf-8") as f:
        return json.load(f)


# 主程式
if __name__ == "__main__":
    # 建立使用者管理器
    manager = UserManager("/tmp/users.db")

    # 新增使用者
    user1 = manager.add_user("張三", "zhang@example.com", 25)
    user2 = manager.add_user("李四", "li@example.com", 30)
    user3 = manager.add_user("王五", "wang@example.com", 28)

    # 列出所有使用者
    print("所有使用者:")
    for user in manager.list_users():
        print(f"  {user['id']}: {user['name']} ({user['email']})")

    # 更新使用者
    manager.update_user(1, age=26, city="台北")

    # 刪除使用者
    manager.delete_user(2)

    # 儲存到檔案
    data = {"users": manager.users, "timestamp": datetime.now().isoformat()}
    save_to_file(data, "/tmp/users.json")

    print("\n完成！")
