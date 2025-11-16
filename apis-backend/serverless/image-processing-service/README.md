# 圖片處理服務 (Image Processing Service) 📸
🤖 **AI-Driven Image Processing API** 🚀

使用 Serverless 架構構建的圖片處理服務，支援圖片上傳、縮放、優化、格式轉換等功能。

## ✨ 功能特點

- 🖼️ **圖片上傳** - 支援多種格式上傳
- 📏 **尺寸調整** - 自動縮放到指定尺寸
- 🎨 **格式轉換** - 支援 JPEG, PNG, WebP, AVIF
- ⚡ **圖片優化** - 自動壓縮優化
- 🔄 **批次處理** - 同時處理多張圖片
- 💾 **雲端儲存** - 自動上傳到 S3/Cloud Storage
- 🔒 **安全驗證** - API Key 保護

## 📋 API 端點

### POST /upload
上傳圖片

**請求**:
- Content-Type: `multipart/form-data`
- Body: 圖片檔案

**回應**:
```json
{
  "success": true,
  "data": {
    "url": "https://example.com/images/abc123.jpg",
    "filename": "abc123.jpg",
    "size": 245678,
    "width": 1920,
    "height": 1080
  }
}
```

### POST /resize
調整圖片尺寸

**請求**:
```json
{
  "imageUrl": "https://example.com/image.jpg",
  "width": 800,
  "height": 600,
  "fit": "cover"
}
```

**回應**:
```json
{
  "success": true,
  "data": {
    "originalUrl": "https://example.com/image.jpg",
    "resizedUrl": "https://example.com/resized/image_800x600.jpg",
    "width": 800,
    "height": 600
  }
}
```

### POST /convert
轉換圖片格式

**請求**:
```json
{
  "imageUrl": "https://example.com/image.png",
  "format": "webp",
  "quality": 80
}
```

### POST /optimize
優化圖片

**請求**:
```json
{
  "imageUrl": "https://example.com/image.jpg",
  "quality": 85
}
```

### POST /batch
批次處理圖片

**請求**:
```json
{
  "images": [
    {
      "url": "https://example.com/image1.jpg",
      "operations": {
        "resize": { "width": 800 },
        "format": "webp"
      }
    }
  ]
}
```

## 🚀 部署方式

### 使用 Serverless Framework 部署到 AWS

```bash
# 安裝依賴
npm install

# 配置 AWS 憑證
serverless config credentials --provider aws --key YOUR_KEY --secret YOUR_SECRET

# 部署
serverless deploy

# 查看端點
serverless info
```

### 使用 Vercel 部署

```bash
# 安裝依賴
npm install

# 部署
vercel --prod
```

## 🔧 環境變數

```
# AWS S3 (儲存圖片)
AWS_BUCKET_NAME=my-images-bucket
AWS_REGION=us-east-1

# API 驗證
API_KEY=your-secret-api-key

# 圖片處理設定
MAX_FILE_SIZE=10485760  # 10MB
ALLOWED_FORMATS=jpg,jpeg,png,webp,gif

# CDN (optional)
CDN_URL=https://cdn.example.com
```

## 📦 技術棧

- **Runtime**: Node.js 18+
- **圖片處理**: Sharp
- **儲存**: AWS S3 / Cloudflare R2
- **部署**: Serverless Framework / Vercel
- **API**: RESTful

## 💡 使用範例

### JavaScript/TypeScript

```javascript
// 上傳圖片
const formData = new FormData();
formData.append('image', file);

const response = await fetch('https://api.example.com/upload', {
  method: 'POST',
  headers: {
    'X-API-Key': 'your-api-key'
  },
  body: formData
});

const result = await response.json();
console.log(result.data.url);
```

### cURL

```bash
# 上傳圖片
curl -X POST https://api.example.com/upload \
  -H "X-API-Key: your-api-key" \
  -F "image=@/path/to/image.jpg"

# 調整尺寸
curl -X POST https://api.example.com/resize \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "imageUrl": "https://example.com/image.jpg",
    "width": 800,
    "height": 600
  }'
```

## 🔒 安全考量

- API Key 驗證
- 檔案大小限制
- 檔案類型驗證
- 速率限制
- CORS 配置

## 📊 成本估算

使用 AWS Lambda + S3:
- **Lambda**: 免費額度每月 100 萬次請求
- **S3**: 免費額度 5GB 儲存
- **預估成本**: 每月 $5-20 (視使用量而定)

## 🎯 使用場景

- 電商網站圖片處理
- 社交媒體圖片上傳
- 內容管理系統
- 圖片 CDN 服務
- 自動縮圖生成

---

**使用 AI 打造高效的圖片處理服務！** 🚀
