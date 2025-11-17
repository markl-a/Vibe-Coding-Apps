"""
範例模組 - 用於文檔生成示範

這個模組包含各種類別和函數，展示如何使用 doc_generator.py 生成文檔。
包含詳細的 docstring，遵循 Google 風格指南。
"""

from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from typing import Dict, List, Optional, Union


class UserRole(Enum):
    """使用者角色枚舉

    定義系統中的使用者角色類型。

    Attributes:
        ADMIN: 管理員，擁有完整權限
        MODERATOR: 協調員，擁有部分管理權限
        USER: 一般使用者
        GUEST: 訪客，僅有讀取權限
    """

    ADMIN = "admin"
    MODERATOR = "moderator"
    USER = "user"
    GUEST = "guest"


@dataclass
class User:
    """使用者資料類別

    表示系統中的使用者實體。

    Attributes:
        id: 使用者唯一識別碼
        username: 使用者名稱
        email: 電子郵件地址
        role: 使用者角色
        created_at: 帳號建立時間
        is_active: 帳號是否啟用

    Example:
        >>> user = User(
        ...     id=1,
        ...     username="john_doe",
        ...     email="john@example.com",
        ...     role=UserRole.USER,
        ...     created_at=datetime.now(),
        ...     is_active=True
        ... )
    """

    id: int
    username: str
    email: str
    role: UserRole
    created_at: datetime
    is_active: bool = True


class UserManager:
    """使用者管理器

    提供使用者的 CRUD 操作和相關業務邏輯。

    Attributes:
        users: 使用者字典，以 ID 為鍵
        _next_id: 下一個可用的使用者 ID

    Example:
        >>> manager = UserManager()
        >>> user = manager.create_user("john", "john@example.com")
        >>> print(user.id)
        1
    """

    def __init__(self):
        """初始化使用者管理器"""
        self.users: Dict[int, User] = {}
        self._next_id: int = 1

    def create_user(
        self, username: str, email: str, role: UserRole = UserRole.USER
    ) -> User:
        """建立新使用者

        Args:
            username: 使用者名稱，必須唯一
            email: 電子郵件地址，必須是有效格式
            role: 使用者角色，預設為 USER

        Returns:
            User: 建立的使用者物件

        Raises:
            ValueError: 如果使用者名稱已存在或電子郵件格式無效

        Example:
            >>> manager = UserManager()
            >>> user = manager.create_user("alice", "alice@example.com", UserRole.ADMIN)
            >>> print(user.username)
            alice
        """
        # 驗證使用者名稱是否已存在
        if self._username_exists(username):
            raise ValueError(f"使用者名稱 '{username}' 已存在")

        # 驗證電子郵件格式
        if not self._is_valid_email(email):
            raise ValueError(f"無效的電子郵件地址: {email}")

        # 建立使用者
        user = User(
            id=self._next_id,
            username=username,
            email=email,
            role=role,
            created_at=datetime.now(),
            is_active=True,
        )

        self.users[user.id] = user
        self._next_id += 1

        return user

    def get_user(self, user_id: int) -> Optional[User]:
        """取得使用者

        Args:
            user_id: 使用者 ID

        Returns:
            Optional[User]: 使用者物件，如果不存在則返回 None

        Example:
            >>> manager = UserManager()
            >>> user = manager.create_user("bob", "bob@example.com")
            >>> retrieved = manager.get_user(user.id)
            >>> print(retrieved.username)
            bob
        """
        return self.users.get(user_id)

    def update_user(
        self,
        user_id: int,
        username: Optional[str] = None,
        email: Optional[str] = None,
        role: Optional[UserRole] = None,
    ) -> Optional[User]:
        """更新使用者資料

        Args:
            user_id: 要更新的使用者 ID
            username: 新的使用者名稱（可選）
            email: 新的電子郵件（可選）
            role: 新的角色（可選）

        Returns:
            Optional[User]: 更新後的使用者物件，如果使用者不存在則返回 None

        Raises:
            ValueError: 如果提供的資料無效

        Example:
            >>> manager = UserManager()
            >>> user = manager.create_user("charlie", "charlie@example.com")
            >>> updated = manager.update_user(user.id, email="new@example.com")
            >>> print(updated.email)
            new@example.com
        """
        user = self.users.get(user_id)
        if not user:
            return None

        if username is not None:
            if self._username_exists(username, exclude_id=user_id):
                raise ValueError(f"使用者名稱 '{username}' 已存在")
            user.username = username

        if email is not None:
            if not self._is_valid_email(email):
                raise ValueError(f"無效的電子郵件地址: {email}")
            user.email = email

        if role is not None:
            user.role = role

        return user

    def delete_user(self, user_id: int) -> bool:
        """刪除使用者

        Args:
            user_id: 要刪除的使用者 ID

        Returns:
            bool: 是否成功刪除

        Example:
            >>> manager = UserManager()
            >>> user = manager.create_user("dave", "dave@example.com")
            >>> success = manager.delete_user(user.id)
            >>> print(success)
            True
        """
        if user_id in self.users:
            del self.users[user_id]
            return True
        return False

    def list_users(
        self, role: Optional[UserRole] = None, active_only: bool = False
    ) -> List[User]:
        """列出使用者

        Args:
            role: 篩選特定角色的使用者（可選）
            active_only: 是否只列出啟用的使用者

        Returns:
            List[User]: 使用者列表

        Example:
            >>> manager = UserManager()
            >>> manager.create_user("admin", "admin@example.com", UserRole.ADMIN)
            >>> manager.create_user("user", "user@example.com", UserRole.USER)
            >>> admins = manager.list_users(role=UserRole.ADMIN)
            >>> print(len(admins))
            1
        """
        users = list(self.users.values())

        if role is not None:
            users = [u for u in users if u.role == role]

        if active_only:
            users = [u for u in users if u.is_active]

        return users

    def deactivate_user(self, user_id: int) -> bool:
        """停用使用者帳號

        Args:
            user_id: 使用者 ID

        Returns:
            bool: 是否成功停用

        Note:
            停用的帳號可以重新啟用，與刪除不同

        Example:
            >>> manager = UserManager()
            >>> user = manager.create_user("eve", "eve@example.com")
            >>> manager.deactivate_user(user.id)
            True
        """
        user = self.users.get(user_id)
        if user:
            user.is_active = False
            return True
        return False

    def activate_user(self, user_id: int) -> bool:
        """啟用使用者帳號

        Args:
            user_id: 使用者 ID

        Returns:
            bool: 是否成功啟用

        Example:
            >>> manager = UserManager()
            >>> user = manager.create_user("frank", "frank@example.com")
            >>> manager.deactivate_user(user.id)
            >>> manager.activate_user(user.id)
            True
        """
        user = self.users.get(user_id)
        if user:
            user.is_active = True
            return True
        return False

    def _username_exists(self, username: str, exclude_id: Optional[int] = None) -> bool:
        """檢查使用者名稱是否已存在（內部方法）

        Args:
            username: 要檢查的使用者名稱
            exclude_id: 要排除的使用者 ID（用於更新時）

        Returns:
            bool: 使用者名稱是否存在
        """
        for user in self.users.values():
            if user.id == exclude_id:
                continue
            if user.username == username:
                return True
        return False

    def _is_valid_email(self, email: str) -> bool:
        """驗證電子郵件格式（內部方法）

        Args:
            email: 要驗證的電子郵件地址

        Returns:
            bool: 電子郵件格式是否有效
        """
        import re

        pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
        return bool(re.match(pattern, email))


def validate_user_data(data: Dict) -> bool:
    """驗證使用者資料

    獨立函數，用於驗證使用者資料字典的完整性和有效性。

    Args:
        data: 包含使用者資料的字典

    Returns:
        bool: 資料是否有效

    Raises:
        ValueError: 如果資料格式不正確

    Example:
        >>> data = {
        ...     "username": "test",
        ...     "email": "test@example.com",
        ...     "role": "user"
        ... }
        >>> validate_user_data(data)
        True
    """
    required_fields = ["username", "email", "role"]

    for field in required_fields:
        if field not in data:
            raise ValueError(f"缺少必要欄位: {field}")

    return True


def serialize_user(user: User) -> Dict:
    """序列化使用者物件

    將使用者物件轉換為字典格式，方便 JSON 序列化。

    Args:
        user: 使用者物件

    Returns:
        Dict: 使用者資料字典

    Example:
        >>> user = User(
        ...     id=1,
        ...     username="test",
        ...     email="test@example.com",
        ...     role=UserRole.USER,
        ...     created_at=datetime.now(),
        ...     is_active=True
        ... )
        >>> data = serialize_user(user)
        >>> print(data["username"])
        test
    """
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "role": user.role.value,
        "created_at": user.created_at.isoformat(),
        "is_active": user.is_active,
    }


def deserialize_user(data: Dict) -> User:
    """反序列化使用者資料

    從字典格式建立使用者物件。

    Args:
        data: 使用者資料字典

    Returns:
        User: 使用者物件

    Raises:
        ValueError: 如果資料格式不正確

    Example:
        >>> data = {
        ...     "id": 1,
        ...     "username": "test",
        ...     "email": "test@example.com",
        ...     "role": "user",
        ...     "created_at": "2024-01-01T00:00:00",
        ...     "is_active": True
        ... }
        >>> user = deserialize_user(data)
        >>> print(user.username)
        test
    """
    return User(
        id=data["id"],
        username=data["username"],
        email=data["email"],
        role=UserRole(data["role"]),
        created_at=datetime.fromisoformat(data["created_at"]),
        is_active=data.get("is_active", True),
    )
