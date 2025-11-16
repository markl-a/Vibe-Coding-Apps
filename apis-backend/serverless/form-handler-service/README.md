# 表單處理服務 (Form Handler Service) 📝
🤖 **AI-Driven Form Processing API** 🚀

使用 Serverless 架構構建的表單處理服務，支援表單提交、驗證、郵件通知、資料儲存等功能。

## ✨ 功能特點

- 📝 **表單提交** - 接收各種類型的表單資料
- ✅ **資料驗證** - 自動驗證欄位格式
- 📧 **郵件通知** - 自動發送確認郵件
- 💾 **資料儲存** - 儲存到資料庫或 S3
- 🔔 **Webhook 整合** - 支援 Slack、Discord 通知
- 🛡️ **垃圾郵件防護** - reCAPTCHA 整合
- 📊 **表單分析** - 提交統計和報告
- 🔒 **安全保護** - CSRF、速率限制

## 📋 API 端點

### POST /submit/contact
聯絡表單提交

**請求**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "subject": "Product Inquiry",
  "message": "I'm interested in your product...",
  "recaptchaToken": "optional-recaptcha-token"
}
```

**回應**:
```json
{
  "success": true,
  "message": "Form submitted successfully",
  "submissionId": "sub_1234567890",
  "data": {
    "name": "John Doe",
    "email": "john@example.com",
    "submittedAt": "2025-01-15T10:30:00Z"
  }
}
```

### POST /submit/newsletter
電子報訂閱

**請求**:
```json
{
  "email": "user@example.com",
  "name": "Jane Smith",
  "preferences": {
    "topics": ["tech", "business"],
    "frequency": "weekly"
  }
}
```

### POST /submit/feedback
意見回饋表單

**請求**:
```json
{
  "name": "Bob Wilson",
  "email": "bob@example.com",
  "rating": 5,
  "category": "product",
  "feedback": "Great product!",
  "screenshot": "base64-encoded-image"
}
```

### POST /submit/registration
活動報名表單

**請求**:
```json
{
  "firstName": "Alice",
  "lastName": "Johnson",
  "email": "alice@example.com",
  "phone": "+1234567890",
  "company": "Tech Corp",
  "eventId": "evt_123"
}
```

### GET /submissions
獲取表單提交記錄

**查詢參數**:
- `formType` - 表單類型
- `startDate` - 開始日期
- `endDate` - 結束日期
- `page` - 頁碼
- `limit` - 每頁數量

### POST /validate
驗證表單資料

**請求**:
```json
{
  "formType": "contact",
  "data": {
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

## 🚀 部署方式

### 使用 Serverless Framework

```bash
# 安裝依賴
npm install

# 配置環境變數
cp .env.example .env
# 編輯 .env 填入您的配置

# 部署到 AWS
serverless deploy

# 部署到特定環境
serverless deploy --stage production
```

### 使用 Netlify

```bash
# 安裝依賴
npm install

# 部署
netlify deploy --prod
```

## 🔧 環境變數

```env
# Email Service (SendGrid)
SENDGRID_API_KEY=your-sendgrid-api-key
FROM_EMAIL=noreply@example.com
ADMIN_EMAIL=admin@example.com

# reCAPTCHA (垃圾郵件防護)
RECAPTCHA_SECRET_KEY=your-recaptcha-secret

# Database (DynamoDB / MongoDB)
DATABASE_URL=your-database-url

# Slack Webhook (可選)
SLACK_WEBHOOK_URL=your-slack-webhook-url

# Rate Limiting
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=900000  # 15分鐘

# CORS
ALLOWED_ORIGINS=https://example.com,https://www.example.com
```

## 📦 技術棧

- **Runtime**: Node.js 18+
- **Email**: SendGrid / AWS SES
- **Database**: DynamoDB / MongoDB
- **Validation**: Joi / Yup
- **Rate Limiting**: Redis / DynamoDB
- **部署**: Serverless Framework / Netlify

## 💡 使用範例

### HTML Form

```html
<form id="contactForm">
  <input type="text" name="name" required>
  <input type="email" name="email" required>
  <textarea name="message" required></textarea>
  <button type="submit">Submit</button>
</form>

<script>
document.getElementById('contactForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData);

  const response = await fetch('https://api.example.com/submit/contact', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });

  const result = await response.json();
  console.log(result);
});
</script>
```

### React

```jsx
import { useState } from 'react';

function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    const response = await fetch('https://api.example.com/submit/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    const result = await response.json();
    if (result.success) {
      alert('Form submitted successfully!');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  );
}
```

### cURL

```bash
curl -X POST https://api.example.com/submit/contact \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "message": "Hello!"
  }'
```

## 🔒 安全功能

### 1. reCAPTCHA 驗證
```javascript
// 前端加入 reCAPTCHA token
const token = await grecaptcha.execute('site-key', { action: 'submit' });
```

### 2. 速率限制
- 每 15 分鐘最多 100 次請求
- 基於 IP 位址限制

### 3. 資料驗證
- Email 格式驗證
- 必填欄位檢查
- 資料長度限制
- XSS 防護

### 4. CORS 配置
- 白名單域名
- 安全的 headers

## 📊 表單類型支援

- ✅ 聯絡表單 (Contact Form)
- ✅ 電子報訂閱 (Newsletter)
- ✅ 意見回饋 (Feedback)
- ✅ 活動報名 (Registration)
- ✅ 客服支援 (Support Ticket)
- ✅ 調查問卷 (Survey)
- ✅ 求職申請 (Job Application)

## 📧 郵件範本

服務會自動發送郵件給：
1. **提交者** - 確認郵件
2. **管理員** - 新提交通知

郵件內容可自訂，支援 HTML 格式。

## 💰 成本估算

使用 AWS Lambda + DynamoDB + SES:
- **Lambda**: 免費額度每月 100 萬次請求
- **DynamoDB**: 免費額度 25GB
- **SES**: 前 62,000 封郵件免費
- **預估成本**: 每月 $0-5 (小型網站)

## 🎯 使用場景

- 企業官網聯絡表單
- 電子報訂閱系統
- 客戶意見回饋
- 活動報名系統
- 客服工單系統
- 市場調查問卷

---

**使用 AI 打造高效的表單處理系統！** 🚀
