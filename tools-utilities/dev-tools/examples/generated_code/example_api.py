"""
範例：使用 code_generator.py 生成的 API 程式碼
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional

app = FastAPI(
    title="Example API",
    description="使用程式碼生成器建立的範例 API",
    version="1.0.0"
)

# 資料模型
class User(BaseModel):
    id: Optional[int] = None
    name: str
    email: str
    age: int


# 模擬資料庫
users_db = []
next_id = 1


@app.get("/")
async def root():
    """根路徑"""
    return {"message": "Welcome to Example API"}


@app.get("/users", response_model=List[User])
async def list_users():
    """列出所有使用者"""
    return users_db


@app.get("/users/{user_id}", response_model=User)
async def get_user(user_id: int):
    """取得特定使用者"""
    for user in users_db:
        if user.id == user_id:
            return user
    raise HTTPException(status_code=404, detail="User not found")


@app.post("/users", response_model=User)
async def create_user(user: User):
    """建立新使用者"""
    global next_id
    user.id = next_id
    next_id += 1
    users_db.append(user)
    return user


@app.put("/users/{user_id}", response_model=User)
async def update_user(user_id: int, user: User):
    """更新使用者"""
    for idx, existing_user in enumerate(users_db):
        if existing_user.id == user_id:
            user.id = user_id
            users_db[idx] = user
            return user
    raise HTTPException(status_code=404, detail="User not found")


@app.delete("/users/{user_id}")
async def delete_user(user_id: int):
    """刪除使用者"""
    for idx, user in enumerate(users_db):
        if user.id == user_id:
            users_db.pop(idx)
            return {"message": "User deleted"}
    raise HTTPException(status_code=404, detail="User not found")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
