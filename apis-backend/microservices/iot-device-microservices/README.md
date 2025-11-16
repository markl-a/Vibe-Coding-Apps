# IoT 設備管理微服務架構 🌐
🤖 **AI-Driven IoT Platform** 🚀

完整的 IoT 設備管理平台微服務架構，展示如何構建可擴展的物聯網應用系統。

## 🏗️ 架構概覽

```
┌────────────┐
│ IoT Devices│ ← 各種智能設備
└──────┬─────┘
       │ MQTT/HTTP
       ▼
┌──────────────┐
│ API Gateway  │ ← 統一接入、認證
└──────┬───────┘
       │
   ┌───┴───┬─────────┬──────────┐
   ▼       ▼         ▼          ▼
┌────────┐┌──────┐┌─────────┐┌────────┐
│Device  ││Data  ││Analytics││Alert   │
│Service ││Service│Service  ││Service │
└───┬────┘└──┬───┘└────┬────┘└───┬────┘
    │        │         │          │
    ▼        ▼         ▼          ▼
┌────────┐┌──────┐┌─────────┐┌────────┐
│MongoDB ││InfluxDB│Redis    ││RabbitMQ│
└────────┘└──────┘└─────────┘└────────┘
```

## 📦 服務列表

### 1. API Gateway (Port 5000)
- 統一入口點
- API Key 認證
- 路由轉發
- 請求日誌
- 速率限制

### 2. Device Service (Port 5001)
- 設備註冊與管理
- 設備狀態追蹤
- 設備配置
- 韌體版本管理
- 設備分組

### 3. Data Service (Port 5002)
- 設備數據收集
- 時序數據存儲 (InfluxDB)
- 數據查詢 API
- 數據聚合
- 歷史數據管理

### 4. Analytics Service (Port 5003)
- 實時數據分析
- 統計計算
- 趨勢預測
- 異常檢測
- 數據可視化 API

### 5. Alert Service (Port 5004)
- 規則引擎
- 閾值監控
- 告警觸發
- 通知推送
- 告警歷史

## 🚀 快速開始

### 使用 Docker Compose

```bash
# 啟動所有服務
docker-compose up -d

# 查看服務狀態
docker-compose ps

# 查看日誌
docker-compose logs -f [service-name]

# 停止服務
docker-compose down

# 清理所有數據
docker-compose down -v
```

### 本地開發

```bash
cd device-service
npm install
npm run dev
```

## 🔧 環境變數

主要配置變數：

```env
# API Gateway
PORT=5000
API_KEY_SECRET=your-api-key-secret

# Device Service
MONGODB_URI=mongodb://localhost:27017/iot_devices

# Data Service
INFLUXDB_URL=http://localhost:8086
INFLUXDB_TOKEN=your-token
INFLUXDB_ORG=iot-org
INFLUXDB_BUCKET=device-data

# Analytics Service
REDIS_URL=redis://localhost:6379

# Alert Service
RABBITMQ_URL=amqp://localhost:5672
```

## 📖 API 文檔

所有請求通過 API Gateway: `http://localhost:5000`

### 認證

使用 API Key 認證：
```bash
curl -H "X-API-Key: your-api-key" http://localhost:5000/api/devices
```

### 設備管理

- POST `/api/devices` - 註冊新設備
- GET `/api/devices` - 獲取設備列表
- GET `/api/devices/:id` - 獲取設備詳情
- PUT `/api/devices/:id` - 更新設備信息
- DELETE `/api/devices/:id` - 刪除設備
- PUT `/api/devices/:id/status` - 更新設備狀態

### 數據收集

- POST `/api/data/:deviceId` - 上傳設備數據
- GET `/api/data/:deviceId` - 查詢設備數據
- GET `/api/data/:deviceId/latest` - 獲取最新數據
- GET `/api/data/:deviceId/stats` - 獲取統計數據

### 分析服務

- GET `/api/analytics/summary` - 整體數據摘要
- GET `/api/analytics/device/:id` - 設備分析報告
- GET `/api/analytics/trends` - 趨勢分析
- GET `/api/analytics/anomalies` - 異常檢測

### 告警管理

- POST `/api/alerts/rules` - 創建告警規則
- GET `/api/alerts/rules` - 獲取告警規則
- GET `/api/alerts` - 獲取告警歷史
- PUT `/api/alerts/:id/acknowledge` - 確認告警

## 🛡️ 安全特性

- ✅ API Key 認證
- ✅ 設備證書認證
- ✅ 數據加密傳輸
- ✅ 訪問控制
- ✅ 速率限制
- ✅ 審計日誌

## 📊 支持的設備類型

1. **溫濕度傳感器**
2. **智能電表**
3. **環境監測站**
4. **工業設備**
5. **智能家居設備**
6. **車聯網設備**

## 🔄 通訊協議

- **HTTP/HTTPS**: RESTful API
- **MQTT**: 設備數據推送
- **WebSocket**: 實時數據流
- **CoAP**: 輕量級設備

## 💾 數據存儲

- **MongoDB**: 設備元數據、配置
- **InfluxDB**: 時序數據
- **Redis**: 緩存、實時狀態
- **RabbitMQ**: 消息隊列、告警

## 📈 性能指標

- 支持 100,000+ 設備同時連接
- 數據寫入速率: 10,000 點/秒
- 查詢響應時間: <100ms
- 告警延遲: <1秒

## 🧪 測試

```bash
# 運行單元測試
npm test

# 運行集成測試
npm run test:integration

# 模擬設備數據
npm run simulate-device
```

## 📝 最佳實踐

1. **設備管理**
   - 使用唯一設備 ID
   - 定期更新設備狀態
   - 實施設備生命週期管理

2. **數據收集**
   - 批量上傳數據以提高效率
   - 使用時間戳同步
   - 數據壓縮傳輸

3. **告警策略**
   - 避免告警疲勞
   - 設置合理閾值
   - 實施告警分級

4. **系統監控**
   - 監控服務健康狀態
   - 追蹤系統性能指標
   - 定期備份數據

## 🔌 設備接入示例

### Python 設備客戶端

```python
import requests

api_key = "your-api-key"
device_id = "device-001"
api_url = "http://localhost:5000"

# 上傳數據
data = {
    "temperature": 25.5,
    "humidity": 60.2,
    "timestamp": "2024-01-01T12:00:00Z"
}

response = requests.post(
    f"{api_url}/api/data/{device_id}",
    json=data,
    headers={"X-API-Key": api_key}
)
print(response.json())
```

### Node.js 設備客戶端

```javascript
const axios = require('axios');

const apiKey = 'your-api-key';
const deviceId = 'device-001';
const apiUrl = 'http://localhost:5000';

async function sendData() {
  const data = {
    temperature: 25.5,
    humidity: 60.2,
    timestamp: new Date().toISOString()
  };

  const response = await axios.post(
    `${apiUrl}/api/data/${deviceId}`,
    data,
    { headers: { 'X-API-Key': apiKey } }
  );

  console.log(response.data);
}

setInterval(sendData, 60000); // 每分鐘發送一次
```

## 📚 擴展功能

- [ ] 設備固件 OTA 更新
- [ ] 地理位置追蹤
- [ ] 能耗分析
- [ ] 預測性維護
- [ ] 機器學習集成
- [ ] 數據可視化儀表板

---

**使用 AI 構建智能物聯網平台！** 🚀
