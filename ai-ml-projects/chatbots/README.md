# AI 聊天機器人 Chatbots

🤖 多樣化的 AI 聊天機器人專案集合，涵蓋不同應用場景和整合平台

## 📋 專案概覽

本目錄包含多個實際可用的聊天機器人子專案，每個專案都有不同的特點和應用場景。所有專案都是完整可執行的，包含詳細的文檔和範例代碼。

---

## 🎯 子專案列表

### 1️⃣ [Customer Support Bot](./customer-support-bot/) - 客戶服務機器人

**智能客戶服務解決方案**

#### 核心功能
- ✅ FAQ 自動回答
- ✅ 問題分類與優先級判斷
- ✅ 情緒分析
- ✅ 工單系統整合
- ✅ 人工客服轉接
- ✅ 知識庫整合

#### 適用場景
- 電商客服
- 企業支援中心
- 服務台系統
- 售後服務

#### 快速開始
```bash
cd customer-support-bot
pip install -r requirements.txt
cp .env.example .env
# 編輯 .env 設定 API 金鑰
streamlit run app.py
```

---

### 2️⃣ [RAG Chatbot](./rag-chatbot/) - 檢索增強生成機器人

**基於文檔的智能問答系統**

#### 核心功能
- ✅ 文檔自動索引（PDF、TXT、Markdown、DOCX）
- ✅ 向量資料庫儲存（FAISS）
- ✅ 語義搜尋
- ✅ 來源引用追蹤
- ✅ 上下文感知回答
- ✅ 增量更新索引

#### 適用場景
- 企業知識庫
- 技術文檔助手
- 學術研究工具
- 法律諮詢系統
- 醫療問答系統

#### 快速開始
```bash
cd rag-chatbot
pip install -r requirements.txt
cp .env.example .env
# 將文檔放入 documents/ 目錄
python build_index.py
streamlit run app.py
```

---

### 3️⃣ [Slack Bot](./slack-bot/) - Slack 整合機器人

**Slack 工作空間 AI 助手**

#### 核心功能
- ✅ 斜線命令支援（/ask, /help, /clear）
- ✅ 提及回應（@bot）
- ✅ 私訊對話
- ✅ 互動式按鈕和選單
- ✅ 執行緒回覆
- ✅ 頻道整合

#### 適用場景
- 團隊協作增強
- 工作流程自動化
- 內部知識助手
- 開發團隊工具

#### 快速開始
```bash
cd slack-bot
pip install -r requirements.txt
cp .env.example .env
# 在 Slack API 建立 App 並設定 tokens
python slack_bot.py
```

---

### 4️⃣ [Telegram Bot](./telegram-bot/) - Telegram 聊天機器人

**功能完整的 Telegram AI 助手**

#### 核心功能
- ✅ 命令處理（/start, /help, /ask, /clear）
- ✅ 內聯鍵盤互動
- ✅ 圖片處理與分析
- ✅ 語音訊息轉文字
- ✅ 群組對話支援
- ✅ 多語言支援

#### 適用場景
- 個人 AI 助手
- 社群管理
- 教育輔助工具
- 客戶服務

#### 快速開始
```bash
cd telegram-bot
pip install -r requirements.txt
cp .env.example .env
# 向 @BotFather 建立 bot 並取得 token
python telegram_bot.py
```

---

## 🌟 共同特點

所有專案都具備以下特性：

- ✅ **OpenAI GPT 整合** - 使用最先進的語言模型
- ✅ **對話歷史記錄** - 保持上下文連貫性
- ✅ **環境變數配置** - 安全的 API 金鑰管理
- ✅ **錯誤處理** - 完善的異常處理機制
- ✅ **日誌記錄** - 便於除錯和監控
- ✅ **可擴展架構** - 易於自定義和擴展
- ✅ **詳細文檔** - 完整的使用說明和範例

---

## 🚀 技術棧

### 核心技術
- **Python 3.8+** - 主要程式語言
- **OpenAI GPT API** - AI 模型
- **python-dotenv** - 環境變數管理

### 專案特定技術

| 專案 | 主要框架/工具 |
|------|--------------|
| Customer Support Bot | Streamlit, FAISS (可選) |
| RAG Chatbot | LangChain (概念), FAISS, PyPDF2 |
| Slack Bot | Slack Bolt SDK |
| Telegram Bot | python-telegram-bot |

---

## 📖 使用指南

### 環境需求

所有專案都需要：
1. Python 3.8 或更高版本
2. OpenAI API 金鑰（[取得金鑰](https://platform.openai.com/api-keys)）
3. 相應平台的 API token（Slack、Telegram 等）

### 通用安裝步驟

```bash
# 1. 選擇專案
cd <project-name>

# 2. 安裝依賴
pip install -r requirements.txt

# 3. 配置環境變數
cp .env.example .env
# 編輯 .env 檔案設定你的 API 金鑰

# 4. 執行專案
python <main-file>.py
# 或
streamlit run app.py
```

---

## 🎓 學習路徑

### 初學者推薦順序

1. **Telegram Bot** - 最簡單，適合入門
2. **Customer Support Bot** - 學習實際應用場景
3. **RAG Chatbot** - 了解進階 RAG 技術
4. **Slack Bot** - 企業整合應用

### 進階學習

- 結合多個專案的功能
- 添加資料庫持久化
- 實作用戶認證
- 部署到雲端平台
- 添加監控和分析

---

## 🔧 自定義與擴展

### 修改 AI 行為

所有專案都支援自定義系統提示：

```python
system_prompt = """
你是一個專業的 [領域] 助手。
請用 [語言] 回答問題。
保持回答 [風格]。
"""
```

### 添加新功能

每個專案都有清晰的架構，便於添加：
- 新的命令
- 自定義處理器
- 資料儲存
- 第三方整合

---

## 📊 專案比較

| 特性 | Customer Support | RAG Chatbot | Slack Bot | Telegram Bot |
|------|-----------------|-------------|-----------|--------------|
| 難度 | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| 企業應用 | ✅ | ✅ | ✅ | ❌ |
| 文檔處理 | ❌ | ✅ | ❌ | ⭐ |
| 平台整合 | ❌ | ❌ | ✅ | ✅ |
| 學習價值 | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |

---

## 🤝 貢獻

歡迎提交 Issue 和 Pull Request！

建議的貢獻方向：
- 添加新的聊天機器人專案
- 改進現有功能
- 優化效能
- 增加測試覆蓋率
- 完善文檔

---

## 📚 相關資源

### 官方文檔
- [OpenAI API 文檔](https://platform.openai.com/docs)
- [Slack API 文檔](https://api.slack.com/)
- [Telegram Bot API](https://core.telegram.org/bots/api)

### 學習資源
- [LangChain 教程](https://python.langchain.com/)
- [RAG 技術詳解](https://www.pinecone.io/learn/retrieval-augmented-generation/)
- [Prompt Engineering 指南](https://www.promptingguide.ai/)

---

## ⚠️ 注意事項

1. **API 成本** - 使用 OpenAI API 會產生費用，請注意用量
2. **安全性** - 不要將 API 金鑰提交到版本控制
3. **速率限制** - 遵守各平台的 API 速率限制
4. **資料隱私** - 處理用戶資料時注意隱私保護

---

## 📄 授權

MIT License

所有專案均採用 MIT 授權，可自由使用、修改和分發。

---

## 💡 開發建議

使用 AI 工具（GitHub Copilot、Claude）協助開發：
- 生成對話處理邏輯
- 優化提示工程
- 除錯 API 整合
- 改進使用者體驗
- 撰寫測試用例

---

## 📞 支援

如有問題或建議，請：
1. 查閱各專案的 README
2. 搜尋現有 Issues
3. 建立新的 Issue
4. 參與 Discussions

---

**Happy Coding! 🚀**
