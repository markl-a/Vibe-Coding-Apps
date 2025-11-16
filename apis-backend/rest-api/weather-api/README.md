# 天氣資訊聚合 REST API

🤖 **AI-Driven | AI-Native** 🚀

一個功能完整的天氣資訊聚合 REST API，使用 **Flask** 和 **Redis** 構建，整合第三方天氣 API 並提供快取功能。

## ✨ 功能特點

### 天氣查詢
- ✅ 當前天氣查詢 (按城市或經緯度)
- ✅ 天氣預報 (1-5 天)
- ✅ 多種單位支持 (攝氏/華氏)
- ✅ 多語言支持

### 地理位置
- ✅ 城市搜尋
- ✅ 反向地理編碼
- ✅ 經緯度轉換

### 性能優化
- ✅ Redis 快取系統
- ✅ 快取過期管理
- ✅ 速率限制 (Rate Limiting)

### 第三方整合
- ✅ OpenWeatherMap API 整合
- ✅ 可擴展的 API 架構

## 🛠️ 技術棧

- **框架**: Flask
- **語言**: Python 3.9+
- **快取**: Redis
- **地理編碼**: geopy
- **速率限制**: Flask-Limiter
- **第三方 API**: OpenWeatherMap

## 📋 需求

- Python >= 3.9
- Redis >= 6.0
- OpenWeatherMap API Key (免費)

## 🚀 快速開始

### 1. 安裝依賴

```bash
# 創建虛擬環境
python -m venv venv

# 啟動虛擬環境
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

# 安裝依賴
pip install -r requirements.txt
```

### 2. 安裝並啟動 Redis

#### macOS (使用 Homebrew)
```bash
brew install redis
brew services start redis
```

#### Ubuntu/Debian
```bash
sudo apt-get install redis-server
sudo systemctl start redis
```

#### Windows
下載並安裝 [Redis for Windows](https://github.com/microsoftarchive/redis/releases)

#### Docker
```bash
docker run -d -p 6379:6379 redis:latest
```

### 3. 獲取 API 密鑰

1. 註冊 [OpenWeatherMap](https://openweathermap.org/api)
2. 獲取免費 API Key
3. 將 API Key 保存到 `.env` 文件

### 4. 設置環境變數

複製 `.env.example` 為 `.env`：

```bash
cp .env.example .env
```

編輯 `.env` 文件：

```env
# Flask
SECRET_KEY=your-secret-key
DEBUG=True

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
CACHE_EXPIRATION=3600

# OpenWeatherMap
OPENWEATHER_API_KEY=your_api_key_here

# Rate Limiting
RATE_LIMIT=100 per hour
```

### 5. 啟動開發伺服器

```bash
# 使用 Flask
python app.py

# 或使用 Gunicorn (生產環境)
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

伺服器將在 `http://localhost:5000` 啟動。

## 📚 API 端點

### 天氣查詢

#### 當前天氣

```
GET /api/v1/weather/current

參數:
  - city: 城市名稱 (例如: "Taipei")
  - lat: 緯度 (例如: "25.0330")
  - lon: 經度 (例如: "121.5654")
```

#### 天氣預報

```
GET /api/v1/weather/forecast

參數:
  - city: 城市名稱
  - lat: 緯度
  - lon: 經度
  - days: 預報天數 (1-5，預設 5)
```

### 地理位置

#### 搜尋位置

```
GET /api/v1/location/search

參數:
  - q: 搜尋查詢 (例如: "台北市")
```

#### 反向地理編碼

```
GET /api/v1/location/reverse

參數:
  - lat: 緯度
  - lon: 經度
```

### 快取管理

#### 清除快取

```
POST /api/v1/history/clear
```

## 📝 使用範例

### 獲取台北當前天氣

```bash
curl "http://localhost:5000/api/v1/weather/current?city=Taipei"
```

回應：
```json
{
  "location": {
    "name": "Taipei",
    "country": "TW",
    "coordinates": {
      "lat": 25.0478,
      "lon": 121.5319
    }
  },
  "current": {
    "temperature": 28.5,
    "feels_like": 30.2,
    "humidity": 75,
    "pressure": 1013,
    "weather": "多雲",
    "icon": "04d",
    "wind_speed": 3.5
  },
  "timestamp": 1699876543
}
```

### 獲取 5 天天氣預報

```bash
curl "http://localhost:5000/api/v1/weather/forecast?city=Tokyo&days=5"
```

### 使用經緯度查詢

```bash
curl "http://localhost:5000/api/v1/weather/current?lat=25.0330&lon=121.5654"
```

### 搜尋城市

```bash
curl "http://localhost:5000/api/v1/location/search?q=台北市"
```

回應：
```json
{
  "name": "台北市, 台灣",
  "latitude": 25.0478,
  "longitude": 121.5319
}
```

### 反向地理編碼

```bash
curl "http://localhost:5000/api/v1/location/reverse?lat=25.0330&lon=121.5654"
```

## ⚡ Redis 快取機制

### 快取策略

- **當前天氣**: 快取 1 小時
- **天氣預報**: 快取 1 小時
- **地理位置**: 快取 24 小時

### 快取鍵格式

```
weather:current:{city}
weather:forecast:{city}
location:{query}
```

### 快取檢查

```bash
# 使用 redis-cli
redis-cli

# 查看所有鍵
KEYS weather:*

# 查看特定鍵
GET weather:current:Taipei

# 查看 TTL
TTL weather:current:Taipei
```

## 🔒 速率限制

預設速率限制：**100 次請求 / 小時**

可在 `.env` 中調整：

```env
RATE_LIMIT=200 per hour
# 或
RATE_LIMIT=10 per minute
```

超過速率限制時會返回 `429 Too Many Requests`。

## 🧪 測試

```bash
# 安裝測試依賴
pip install pytest pytest-cov

# 運行測試
pytest

# 測試覆蓋率
pytest --cov=app tests/
```

## 📦 部署

### 使用 Docker

```dockerfile
FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 5000

CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "app:app"]
```

### Docker Compose

```yaml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "5000:5000"
    environment:
      - REDIS_HOST=redis
      - OPENWEATHER_API_KEY=${OPENWEATHER_API_KEY}
    depends_on:
      - redis

  redis:
    image: redis:latest
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  redis_data:
```

啟動：
```bash
docker-compose up -d
```

### 使用 Heroku

```bash
# 安裝 Heroku CLI
brew install heroku/brew/heroku

# 登入
heroku login

# 創建應用
heroku create your-weather-api

# 添加 Redis 插件
heroku addons:create heroku-redis:hobby-dev

# 設置環境變數
heroku config:set OPENWEATHER_API_KEY=your_api_key

# 部署
git push heroku main
```

## 🔧 配置選項

### 環境變數

| 變數 | 說明 | 預設值 |
|------|------|--------|
| `OPENWEATHER_API_KEY` | OpenWeatherMap API 密鑰 | 必填 |
| `REDIS_HOST` | Redis 主機 | localhost |
| `REDIS_PORT` | Redis 端口 | 6379 |
| `CACHE_EXPIRATION` | 快取過期時間 (秒) | 3600 |
| `RATE_LIMIT` | 速率限制 | 100 per hour |
| `DEBUG` | 調試模式 | True |

## 🤖 AI 輔助開發

這個專案使用 AI 工具開發：

- **GitHub Copilot** - 程式碼自動完成
- **Claude Code** - API 架構設計
- **ChatGPT** - 問題解決方案

### AI 開發提示範例

```
"幫我創建一個 Flask 天氣 API，整合 OpenWeatherMap，
使用 Redis 快取，並實作速率限制。"

"為天氣 API 添加地理位置搜尋功能，使用 geopy。"

"實作 Redis 快取機制，支持自動過期和快取清除。"
```

## 📖 學習資源

- [Flask 官方文檔](https://flask.palletsprojects.com/)
- [Redis 文檔](https://redis.io/docs/)
- [OpenWeatherMap API 文檔](https://openweathermap.org/api)
- [geopy 文檔](https://geopy.readthedocs.io/)
- [Flask-Limiter 文檔](https://flask-limiter.readthedocs.io/)

## 🚀 擴展功能

- [ ] 支持更多天氣 API (WeatherAPI, AccuWeather)
- [ ] 歷史天氣數據
- [ ] 天氣警報通知
- [ ] 空氣質量指數 (AQI)
- [ ] UV 指數
- [ ] 日出日落時間
- [ ] 月相資訊
- [ ] 天氣圖表數據
- [ ] Webhook 訂閱
- [ ] 多城市批量查詢

## 🔍 常見問題

### Q: 如何獲取免費的 OpenWeatherMap API Key？

訪問 [OpenWeatherMap](https://openweathermap.org/api) 註冊帳號，在 API Keys 頁面複製密鑰。免費方案每分鐘可請求 60 次。

### Q: Redis 連接失敗怎麼辦？

確保 Redis 服務正在運行：
```bash
redis-cli ping
# 應該返回 PONG
```

### Q: 速率限制如何工作？

使用 Flask-Limiter，基於 IP 地址限制請求頻率。超過限制會返回 429 錯誤。

### Q: 如何清除快取？

發送 POST 請求到 `/api/v1/history/clear` 或使用 Redis CLI：
```bash
redis-cli FLUSHDB
```

## 📄 授權

MIT License

---

**使用 AI 工具打造智能天氣 API！** 🌤️🤖✨
