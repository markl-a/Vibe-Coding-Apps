# Netlify Functions 示例 ⚡
🤖 **AI-Driven Netlify Functions** 🚀

使用 Netlify Functions 構建的無伺服器函數示例。

## 📋 函數列表

### 1. Hello World
- **路徑**: `/.netlify/functions/hello`
- **方法**: GET
- **功能**: 基礎示例

### 2. Form Submit
- **路徑**: `/.netlify/functions/form-submit`
- **方法**: POST
- **功能**: 處理表單提交

### 3. Webhook Handler
- **路徑**: `/.netlify/functions/webhook`
- **方法**: POST
- **功能**: 處理第三方 webhook

## 🚀 本地開發

```bash
# 安裝 Netlify CLI
npm install -g netlify-cli

# 本地開發
netlify dev

# 測試函數
curl http://localhost:8888/.netlify/functions/hello
```

## 📦 部署

```bash
# 登入 Netlify
netlify login

# 初始化專案
netlify init

# 部署
netlify deploy --prod
```

## 📂 專案結構

```
netlify-functions/
├── functions/
│   ├── hello.js
│   ├── form-submit.js
│   └── webhook.js
├── netlify.toml
└── README.md
```

## ⚙️ netlify.toml 配置

```toml
[build]
  functions = "functions"

[functions]
  node_bundler = "esbuild"
```

---

**快速部署 Netlify Functions！** 🚀
