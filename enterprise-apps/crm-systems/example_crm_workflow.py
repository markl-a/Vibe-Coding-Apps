"""
CRM 系統綜合範例
展示如何使用 Lead Management 和 Sales Pipeline 系統
"""

import sys
import os
from datetime import datetime, timedelta
import random

print("""
╔══════════════════════════════════════════════════════════════════════════════╗
║                         CRM 系統綜合範例                                      ║
║                                                                              ║
║  展示客戶關係管理的完整工作流程：                                             ║
║  1. 潛在客戶管理 (Lead Management)                                          ║
║  2. 銷售管道管理 (Sales Pipeline)                                           ║
╚══════════════════════════════════════════════════════════════════════════════╝
""")

def example_1_lead_management():
    """範例 1：潛在客戶管理系統"""
    print("\n" + "🔵" * 40)
    print("範例 1：潛在客戶管理系統 (Django)")
    print("🔵" * 40)

    print("""
📋 Lead Management 系統功能:
   ✓ 潛在客戶資料管理
   ✓ 客戶來源追蹤
   ✓ 優先級評分
   ✓ 活動記錄
   ✓ 轉換率分析

🚀 如何運行:
   1. 進入目錄：
      cd lead-management

   2. 安裝依賴：
      pip install -r requirements.txt

   3. 初始化數據庫：
      python manage.py makemigrations
      python manage.py migrate

   4. 創建管理員帳號：
      python manage.py createsuperuser

   5. 運行服務器：
      python manage.py runserver

   6. 訪問管理後台：
      http://localhost:8000/admin

💡 主要模型結構:

   Lead (潛在客戶):
   - name: 姓名
   - email: 電子郵件
   - phone: 電話
   - company: 公司
   - source: 來源 (網站/推薦/廣告/活動/其他)
   - status: 狀態 (新/聯繫中/合格/不合格/轉換)
   - priority: 優先級 (低/中/高)
   - assigned_to: 負責人
   - notes: 備註
   - created_at: 創建時間

   Activity (活動記錄):
   - lead: 關聯的潛在客戶
   - activity_type: 活動類型 (電話/郵件/會議/備註)
   - description: 描述
   - created_at: 創建時間
   - created_by: 創建人

🎯 使用場景:
   • 銷售團隊追蹤潛在客戶
   • 記錄與客戶的互動歷史
   • 評估潛在客戶質量
   • 分析客戶轉換漏斗
    """)

def example_2_sales_pipeline():
    """範例 2：銷售管道管理系統"""
    print("\n" + "🟢" * 40)
    print("範例 2：銷售管道管理系統 (FastAPI)")
    print("🟢" * 40)

    print("""
📋 Sales Pipeline 系統功能:
   ✓ 銷售機會管理
   ✓ 多階段管道追蹤
   ✓ 預測銷售額
   ✓ 轉換率分析
   ✓ 報表生成

🚀 如何運行:
   1. 進入目錄：
      cd sales-pipeline

   2. 安裝依賴：
      pip install -r requirements.txt

   3. 運行服務器：
      uvicorn app.main:app --reload

   4. 訪問 API 文檔：
      http://localhost:8000/docs

   5. 訪問替代文檔：
      http://localhost:8000/redoc

📡 主要 API 端點:

   認證相關:
   POST   /api/v1/auth/login          - 用戶登入
   POST   /api/v1/auth/register       - 用戶註冊

   銷售機會:
   GET    /api/v1/opportunities        - 獲取機會列表
   POST   /api/v1/opportunities        - 創建新機會
   GET    /api/v1/opportunities/{id}   - 獲取機會詳情
   PUT    /api/v1/opportunities/{id}   - 更新機會
   DELETE /api/v1/opportunities/{id}   - 刪除機會

   管道管理:
   GET    /api/v1/pipeline             - 獲取管道視圖
   GET    /api/v1/pipeline/stats       - 獲取管道統計

   報表:
   GET    /api/v1/reports/conversion   - 轉換率報表
   GET    /api/v1/reports/forecast     - 銷售預測報表

💡 數據模型:

   Opportunity (銷售機會):
   - title: 標題
   - description: 描述
   - stage: 階段 (潛在客戶/聯繫/需求分析/提案/談判/成交/失敗)
   - value: 金額
   - probability: 成交機率 (0-100%)
   - expected_close_date: 預期成交日期
   - owner_id: 負責人ID
   - contact_name: 聯絡人
   - contact_email: 聯絡人郵箱
   - company: 公司名稱

🎯 使用場景:
   • 追蹤銷售機會進度
   • 預測季度/年度銷售額
   • 分析銷售瓶頸
   • 優化銷售流程
    """)

def example_3_integrated_workflow():
    """範例 3：整合工作流程"""
    print("\n" + "🟡" * 40)
    print("範例 3：CRM 整合工作流程")
    print("🟡" * 40)

    print("""
🔄 完整的 CRM 工作流程:

階段 1: 潛在客戶獲取 (Lead Management)
   1️⃣ 從各種渠道收集潛在客戶資訊
   2️⃣ 記錄客戶來源和基本資料
   3️⃣ 分配給適當的銷售代表
   4️⃣ 評估潛在客戶優先級

階段 2: 資格審查 (Lead Management)
   1️⃣ 聯繫潛在客戶
   2️⃣ 記錄溝通活動
   3️⃣ 評估客戶需求和預算
   4️⃣ 判定是否為合格機會

階段 3: 機會管理 (Sales Pipeline)
   1️⃣ 將合格潛在客戶轉為銷售機會
   2️⃣ 設定預期金額和成交日期
   3️⃣ 追蹤機會在管道中的進度
   4️⃣ 定期更新成交機率

階段 4: 成交管理 (Sales Pipeline)
   1️⃣ 進行提案和談判
   2️⃣ 處理客戶異議
   3️⃣ 完成合約簽署
   4️⃣ 記錄成交/失敗原因

階段 5: 分析優化 (Both Systems)
   1️⃣ 分析轉換率
   2️⃣ 識別瓶頸
   3️⃣ 優化銷售流程
   4️⃣ 調整策略

💡 整合示例代碼:
    """)

    # 模擬整合流程
    print("\n模擬完整工作流程:\n")

    # 1. 創建潛在客戶
    leads = [
        {"name": "張三", "company": "ABC 科技", "source": "網站", "email": "zhang@abc.com"},
        {"name": "李四", "company": "XYZ 企業", "source": "推薦", "email": "li@xyz.com"},
        {"name": "王五", "company": "123 公司", "source": "廣告", "email": "wang@123.com"},
    ]

    print("【步驟 1】創建潛在客戶")
    for i, lead in enumerate(leads, 1):
        print(f"   {i}. {lead['name']} - {lead['company']} (來源: {lead['source']})")

    # 2. 潛在客戶活動
    print("\n【步驟 2】記錄銷售活動")
    activities = ["首次電話聯繫", "發送產品資料", "安排會議"]
    for activity in activities:
        print(f"   ✓ {activity}")

    # 3. 轉為銷售機會
    print("\n【步驟 3】將合格潛在客戶轉為銷售機會")
    opportunities = [
        {"title": "ABC 科技 - 企業系統", "value": 50000, "probability": 60},
        {"title": "XYZ 企業 - 雲端服務", "value": 30000, "probability": 40},
    ]

    for opp in opportunities:
        print(f"   💼 {opp['title']}")
        print(f"      金額: ${opp['value']:,} | 成交機率: {opp['probability']}%")

    # 4. 追蹤進度
    print("\n【步驟 4】追蹤銷售管道進度")
    stages = ["潛在客戶", "需求分析", "提案", "談判", "成交"]
    current_stage = 2

    for i, stage in enumerate(stages):
        if i < current_stage:
            print(f"   ✅ {stage}")
        elif i == current_stage:
            print(f"   ▶️  {stage} (當前階段)")
        else:
            print(f"   ⬜ {stage}")

    # 5. 統計分析
    print("\n【步驟 5】統計分析")
    total_leads = len(leads)
    qualified_leads = len(opportunities)
    total_value = sum(opp['value'] for opp in opportunities)
    weighted_value = sum(opp['value'] * opp['probability'] / 100 for opp in opportunities)

    print(f"   總潛在客戶數: {total_leads}")
    print(f"   合格機會數: {qualified_leads}")
    print(f"   合格率: {qualified_leads/total_leads*100:.1f}%")
    print(f"   潛在總價值: ${total_value:,}")
    print(f"   加權預測值: ${weighted_value:,.0f}")

def example_4_api_usage():
    """範例 4：API 使用範例"""
    print("\n" + "🟣" * 40)
    print("範例 4：Sales Pipeline API 使用範例")
    print("🟣" * 40)

    print("""
📡 使用 Python requests 調用 API:

```python
import requests

# API 基礎 URL
BASE_URL = "http://localhost:8000/api/v1"

# 1. 用戶登入
login_data = {
    "username": "admin",
    "password": "password123"
}
response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
token = response.json()["access_token"]

# 2. 設定認證標頭
headers = {"Authorization": f"Bearer {token}"}

# 3. 創建銷售機會
opportunity_data = {
    "title": "新客戶 - 企業解決方案",
    "description": "大型企業客戶，需要完整的 ERP 系統",
    "stage": "需求分析",
    "value": 100000,
    "probability": 50,
    "expected_close_date": "2025-12-31",
    "contact_name": "陳經理",
    "contact_email": "chen@example.com",
    "company": "大型企業集團"
}
response = requests.post(
    f"{BASE_URL}/opportunities",
    json=opportunity_data,
    headers=headers
)
opportunity = response.json()
print(f"創建的機會 ID: {opportunity['id']}")

# 4. 獲取所有機會
response = requests.get(f"{BASE_URL}/opportunities", headers=headers)
opportunities = response.json()
print(f"總機會數: {len(opportunities)}")

# 5. 更新機會階段
update_data = {
    "stage": "提案",
    "probability": 70
}
response = requests.put(
    f"{BASE_URL}/opportunities/{opportunity['id']}",
    json=update_data,
    headers=headers
)

# 6. 獲取管道統計
response = requests.get(f"{BASE_URL}/pipeline/stats", headers=headers)
stats = response.json()
print(f"管道統計: {stats}")

# 7. 獲取轉換率報表
response = requests.get(f"{BASE_URL}/reports/conversion", headers=headers)
conversion = response.json()
print(f"總體轉換率: {conversion['overall_conversion_rate']}%")
```

💡 提示:
   • 確保服務器正在運行 (uvicorn app.main:app --reload)
   • 訪問 http://localhost:8000/docs 查看完整 API 文檔
   • 可以直接在文檔頁面測試 API
    """)

def main():
    """主函數"""
    example_1_lead_management()
    example_2_sales_pipeline()
    example_3_integrated_workflow()
    example_4_api_usage()

    print("\n" + "🎉" * 40)
    print("CRM 系統範例介紹完成！")
    print("🎉" * 40)

    print("""
📚 下一步:
   1. 選擇一個子系統開始探索
   2. 按照運行指南啟動系統
   3. 嘗試創建測試數據
   4. 探索 API 或管理界面
   5. 整合到您的業務流程中

💡 建議學習路徑:
   初學者: 先從 Lead Management 開始 (Django Admin 更直觀)
   進階者: 深入 Sales Pipeline API (更靈活，可整合其他系統)
   專家: 整合兩個系統，建立完整的 CRM 解決方案

📖 相關文檔:
   • Django: https://docs.djangoproject.com/
   • FastAPI: https://fastapi.tiangolo.com/
   • PostgreSQL: https://www.postgresql.org/docs/
    """)

if __name__ == '__main__':
    main()
