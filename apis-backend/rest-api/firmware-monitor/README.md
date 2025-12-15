# Firmware Monitor API

AI-driven REST API for monitoring IoT devices, firmware status, and handling alerts built with Express.js and MongoDB.

## 功能特點

- **設備管理**: 創建、讀取、更新、刪除 IoT 設備
- **狀態監控**: 實時收集和存儲設備狀態報告
- **告警系統**: 自動檢測異常並創建告警
- **用戶認證**: JWT 基於 token 的認證系統
- **統計分析**: 設備和告警的統計數據
- **完整測試**: 20+ 測試用例，覆蓋所有核心功能

## 技術棧

- **Node.js** - 運行環境
- **Express.js** - Web 框架
- **MongoDB** - 數據庫
- **Mongoose** - ODM
- **JWT** - 身份驗證
- **Jest & Supertest** - 測試框架

## 快速開始

### 安裝依賴

```bash
npm install
```

### 環境配置

複製 `.env.example` 到 `.env` 並配置：

```bash
cp .env.example .env
```

編輯 `.env` 文件：

```env
PORT=3003
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/firmware-monitor
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRE=7d
ALERT_THRESHOLD_CPU=80
ALERT_THRESHOLD_MEMORY=85
ALERT_THRESHOLD_TEMPERATURE=75
```

### 運行應用

```bash
# 開發模式
npm run dev

# 生產模式
npm start
```

### 運行測試

```bash
npm test
```

## API 端點

### 認證

- `POST /api/auth/register` - 註冊新用戶
- `POST /api/auth/login` - 用戶登入
- `GET /api/auth/me` - 獲取當前用戶資料

### 設備管理

- `GET /api/devices` - 獲取所有設備
- `GET /api/devices/:id` - 獲取單個設備
- `POST /api/devices` - 創建新設備
- `PUT /api/devices/:id` - 更新設備
- `PATCH /api/devices/:id/status` - 更新設備狀態
- `DELETE /api/devices/:id` - 刪除設備
- `GET /api/devices/stats` - 獲取設備統計

### 告警管理

- `GET /api/alerts` - 獲取所有告警
- `GET /api/alerts/:id` - 獲取單個告警
- `POST /api/alerts` - 創建新告警
- `PATCH /api/alerts/:id/acknowledge` - 確認告警
- `PATCH /api/alerts/:id/resolve` - 解決告警
- `DELETE /api/alerts/:id` - 刪除告警
- `GET /api/alerts/stats` - 獲取告警統計

### 狀態報告

- `GET /api/status-reports` - 獲取所有狀態報告
- `GET /api/status-reports/:id` - 獲取單個報告
- `POST /api/status-reports` - 創建狀態報告
- `GET /api/status-reports/device/:deviceId/latest` - 獲取設備最新狀態
- `GET /api/status-reports/device/:deviceId/stats` - 獲取設備狀態統計

## 測試覆蓋

項目包含 **20+ 個測試用例**，涵蓋：

### 設備測試 (device.test.js)
- ✅ 創建設備（成功/失敗場景）
- ✅ 獲取設備列表（過濾、搜索、分頁）
- ✅ 獲取單個設備
- ✅ 更新設備信息
- ✅ 更新設備狀態
- ✅ 刪除設備
- ✅ 設備統計數據

### 告警測試 (alert.test.js)
- ✅ 創建告警（成功/失敗場景）
- ✅ 獲取告警列表（按嚴重性、類型、狀態過濾）
- ✅ 獲取單個告警
- ✅ 確認告警
- ✅ 解決告警
- ✅ 刪除告警
- ✅ 告警統計數據

### 狀態報告測試 (statusReport.test.js)
- ✅ 創建狀態報告
- ✅ 自動告警觸發（CPU、記憶體、溫度）
- ✅ 獲取報告列表（日期範圍過濾）
- ✅ 獲取設備最新狀態
- ✅ 設備狀態統計
- ✅ 更新設備最後在線時間

### 認證測試 (auth.test.js)
- ✅ 用戶註冊
- ✅ 用戶登入
- ✅ 獲取當前用戶資料
- ✅ JWT token 驗證
- ✅ 密碼加密

### 集成測試 (integration.test.js)
- ✅ 完整的設備監控工作流程
- ✅ 多設備場景處理
- ✅ API 健康檢查
- ✅ 錯誤處理

## 數據模型

### Device (設備)
```javascript
{
  deviceId: String,      // 唯一設備 ID
  name: String,          // 設備名稱
  type: String,          // sensor | actuator | gateway | controller
  firmwareVersion: String,
  status: String,        // online | offline | maintenance | error
  location: String,
  ipAddress: String,
  macAddress: String,
  manufacturer: String,
  model: String,
  lastSeen: Date,
  metadata: Map,
  userId: ObjectId
}
```

### Alert (告警)
```javascript
{
  deviceId: ObjectId,
  severity: String,      // info | warning | critical | emergency
  type: String,          // cpu | memory | temperature | network | firmware
  message: String,
  value: Mixed,
  threshold: Mixed,
  status: String,        // active | acknowledged | resolved | ignored
  acknowledgedBy: ObjectId,
  acknowledgedAt: Date,
  resolvedBy: ObjectId,
  resolvedAt: Date,
  notes: String,
  userId: ObjectId
}
```

### StatusReport (狀態報告)
```javascript
{
  deviceId: ObjectId,
  cpuUsage: Number,      // 0-100
  memoryUsage: Number,   // 0-100
  temperature: Number,
  uptime: Number,        // seconds
  networkStatus: {
    signalStrength: Number,
    bytesReceived: Number,
    bytesSent: Number,
    latency: Number
  },
  batteryLevel: Number,  // 0-100
  firmwareVersion: String,
  errorCount: Number,
  warningCount: Number,
  customMetrics: Map,
  userId: ObjectId,
  timestamp: Date
}
```

## 自動告警機制

當設備狀態報告提交時，系統會自動檢查以下閾值：

- **CPU 使用率** > 80% → Warning 告警
- **CPU 使用率** > 90% → Critical 告警
- **記憶體使用率** > 85% → Warning 告警
- **記憶體使用率** > 95% → Critical 告警
- **溫度** > 75°C → Warning 告警
- **溫度** > 85°C → Critical 告警

閾值可在 `.env` 文件中配置。

## 安全特性

- JWT 基於 token 的認證
- 密碼 bcrypt 加密
- API 速率限制
- 請求驗證
- CORS 配置
- 環境變數保護敏感信息

## 項目結構

```
firmware-monitor/
├── src/
│   ├── __tests__/           # 測試文件
│   │   ├── device.test.js
│   │   ├── alert.test.js
│   │   ├── statusReport.test.js
│   │   ├── auth.test.js
│   │   └── integration.test.js
│   ├── config/              # 配置文件
│   │   └── database.js
│   ├── controllers/         # 控制器
│   │   ├── authController.js
│   │   ├── deviceController.js
│   │   ├── alertController.js
│   │   └── statusReportController.js
│   ├── middleware/          # 中間件
│   │   ├── authMiddleware.js
│   │   └── errorHandler.js
│   ├── models/              # 數據模型
│   │   ├── User.js
│   │   ├── Device.js
│   │   ├── Alert.js
│   │   └── StatusReport.js
│   ├── routes/              # 路由
│   │   ├── authRoutes.js
│   │   ├── deviceRoutes.js
│   │   ├── alertRoutes.js
│   │   └── statusReportRoutes.js
│   └── index.js             # 應用入口
├── .env.example             # 環境變數範例
├── .gitignore
├── jest.config.js           # Jest 配置
├── jest.setup.js            # Jest 設置
├── package.json
└── README.md
```

## 開發建議

1. 使用環境變數管理敏感信息
2. 定期運行測試確保代碼質量
3. 遵循 RESTful API 設計原則
4. 保持代碼模塊化和可維護性
5. 添加適當的日誌記錄

## License

MIT

## 作者

AI-Driven Development Team
