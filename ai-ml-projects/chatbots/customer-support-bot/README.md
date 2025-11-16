# Customer Support Bot - 客戶服務聊天機器人

🎯 智能客戶服務機器人，具備 FAQ 自動回答、問題分類和升級處理功能

## 功能特點

- ✅ 自動 FAQ 問答
- ✅ 問題分類與優先級判斷
- ✅ 情緒分析
- ✅ 多語言支援
- ✅ 工單創建與追蹤
- ✅ 人工客服轉接
- ✅ 對話品質評分
- ✅ 知識庫整合

## 快速開始

### 安裝依賴

```bash
pip install -r requirements.txt
```

### 配置

複製環境變數範例：
```bash
cp .env.example .env
```

編輯 `.env` 檔案：
```
OPENAI_API_KEY=your_api_key_here
SUPPORT_EMAIL=support@example.com
ESCALATION_THRESHOLD=0.3
```

### 執行

```bash
# 命令列模式
python support_bot.py

# Web UI 模式
streamlit run app.py
```

## 使用範例

```python
from support_bot import CustomerSupportBot

# 初始化機器人
bot = CustomerSupportBot(
    knowledge_base_path="data/faq.json",
    escalation_threshold=0.3
)

# 處理客戶查詢
response = bot.handle_query(
    message="我的訂單還沒收到",
    user_id="user123",
    language="zh-TW"
)

print(f"回覆: {response['answer']}")
print(f"類別: {response['category']}")
print(f"信心度: {response['confidence']}")
print(f"需要升級: {response['needs_escalation']}")
```

## 專案結構

```
customer-support-bot/
├── README.md              # 專案說明
├── requirements.txt       # 依賴套件
├── .env.example          # 環境變數範例
├── support_bot.py        # 客服機器人核心
├── app.py                # Streamlit UI
├── ticket_system.py      # 工單系統
├── knowledge_base.py     # 知識庫管理
├── sentiment_analyzer.py # 情緒分析
├── data/
│   ├── faq.json         # FAQ 資料庫
│   └── responses.json   # 回應模板
└── tests/
    └── test_support_bot.py
```

## 核心功能

### 1. FAQ 自動回答

系統會自動匹配客戶問題與知識庫，提供即時答案。

### 2. 問題分類

自動將問題分類為：
- 訂單查詢
- 產品問題
- 退款退貨
- 技術支援
- 帳戶問題

### 3. 情緒分析

分析客戶情緒（正面/負面/中性），優先處理不滿客戶。

### 4. 智能升級

當機器人無法處理或客戶情緒負面時，自動轉接人工客服。

## 進階配置

### 自定義知識庫

編輯 `data/faq.json`:
```json
{
  "faqs": [
    {
      "question": "如何追蹤訂單？",
      "answer": "您可以在「我的訂單」頁面輸入訂單編號查詢配送狀態。",
      "category": "訂單查詢",
      "keywords": ["訂單", "追蹤", "配送", "物流"]
    }
  ]
}
```

### 調整升級門檻

```python
bot = CustomerSupportBot(
    escalation_threshold=0.2  # 降低門檻，更容易升級到人工
)
```

## 整合方式

### Web 整合

```javascript
// 在網站中嵌入聊天視窗
<script src="chatbot-widget.js"></script>
<script>
  initChatbot({
    apiUrl: 'http://localhost:8000/api/chat',
    botName: '客服小幫手'
  });
</script>
```

### API 整合

```bash
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "我想退貨",
    "user_id": "user123",
    "language": "zh-TW"
  }'
```

## 效能優化

- 使用向量資料庫加速 FAQ 搜尋
- 快取常見問題回應
- 非同步處理減少回應時間
- 批次處理降低 API 成本

## 監控指標

- 問題解決率
- 平均回應時間
- 客戶滿意度評分
- 升級率
- 最常見問題類型

## 技術棧

- **Python 3.8+**
- **OpenAI GPT-4** - 自然語言理解
- **FAISS** - 向量搜尋
- **Streamlit** - Web UI
- **FastAPI** - API 服務
- **SQLite** - 工單資料庫

## 授權

MIT License
