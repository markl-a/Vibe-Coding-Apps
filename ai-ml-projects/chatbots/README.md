# AI 聊天機器人 Chatbot

🤖 智能對話系統，支援多種 AI 模型後端

## 功能特點

- ✅ 支援 OpenAI GPT 模型
- ✅ 支援本地 LLM 模型（透過 Ollama）
- ✅ 對話歷史記錄
- ✅ 上下文管理
- ✅ 流式回應
- ✅ 自定義系統提示
- ✅ 對話儲存與載入

## 安裝

```bash
pip install -r requirements.txt
```

## 配置

複製 `.env.example` 到 `.env` 並設定你的 API 金鑰：

```bash
cp .env.example .env
```

編輯 `.env` 檔案：
```
OPENAI_API_KEY=your_api_key_here
MODEL_PROVIDER=openai  # 或 ollama
DEFAULT_MODEL=gpt-3.5-turbo  # 或 llama2
```

## 使用方式

### 基本使用

```bash
python chatbot.py
```

### 使用 Streamlit UI

```bash
streamlit run app.py
```

### 程式碼範例

```python
from chatbot import Chatbot

# 初始化聊天機器人
bot = Chatbot(
    provider="openai",
    model="gpt-3.5-turbo",
    system_prompt="你是一個友善的 AI 助手"
)

# 發送訊息
response = bot.chat("你好！")
print(response)

# 查看對話歷史
print(bot.get_history())
```

## 專案結構

```
chatbots/
├── README.md           # 專案說明
├── requirements.txt    # 依賴套件
├── .env.example       # 環境變數範例
├── config.py          # 配置管理
├── chatbot.py         # 聊天機器人核心
├── app.py             # Streamlit UI
├── utils.py           # 工具函數
└── tests/             # 測試檔案
    └── test_chatbot.py
```

## 支援的模型

### OpenAI
- gpt-4
- gpt-3.5-turbo
- gpt-4-turbo-preview

### Ollama (本地)
- llama2
- mistral
- codellama
- phi

## 進階功能

### 自定義系統提示

```python
bot = Chatbot(
    provider="openai",
    system_prompt="你是一個專業的程式設計師助手，擅長 Python 和機器學習"
)
```

### 對話歷史管理

```python
# 儲存對話
bot.save_history("conversation.json")

# 載入對話
bot.load_history("conversation.json")

# 清除歷史
bot.clear_history()
```

### 流式回應

```python
for chunk in bot.chat_stream("請解釋機器學習"):
    print(chunk, end="", flush=True)
```

## 技術棧

- **Python 3.8+**
- **OpenAI API** - GPT 模型
- **Ollama** - 本地 LLM
- **Streamlit** - Web UI
- **Python-dotenv** - 環境變數管理

## 開發建議

使用 AI 工具（GitHub Copilot、Claude）協助：
- 生成對話處理邏輯
- 優化提示工程
- 除錯 API 整合
- 改進使用者體驗

## 授權

MIT License
