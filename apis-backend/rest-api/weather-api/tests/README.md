# Weather API 測試套件

這是 Weather API 的完整測試套件，包含單元測試和集成測試。

## 測試結構

```
tests/
├── __init__.py                 # 測試包初始化
├── conftest.py                 # pytest 配置和共享 fixtures
├── test_weather_service.py     # 天氣服務單元測試
├── test_weather_routes.py      # API 路由集成測試
└── test_ai_assistant.py        # AI 輔助服務單元測試
```

## 測試覆蓋範圍

### 1. test_weather_service.py - 天氣服務測試
**單元測試** - 測試 `WeatherService` 類的核心功能

- **初始化測試**
  - 驗證服務正確初始化

- **獲取當前天氣** (`get_current_weather`)
  - 通過城市名稱獲取天氣
  - 通過經緯度獲取天氣
  - 從緩存獲取數據
  - 參數驗證
  - API 錯誤處理
  - 緩存設置驗證

- **獲取天氣預報** (`get_forecast`)
  - 通過城市名稱獲取預報
  - 默認天數驗證
  - 從緩存獲取數據
  - 參數驗證

- **獲取空氣質量** (`get_air_quality`)
  - 成功獲取空氣質量數據
  - AQI 等級映射測試 (1-5 映射到標準 AQI)
  - API 失敗回退機制
  - 參數驗證
  - 緩存設置驗證

- **集成測試**
  - 完整的天氣服務流程測試

### 2. test_weather_routes.py - API 路由測試
**集成測試** - 測試 API 端點的完整功能

- **健康檢查端點**
  - `/health` 端點測試
  - `/` 首頁端點測試

- **當前天氣端點** (`/api/v1/weather/current`)
  - 通過城市名獲取天氣
  - 通過經緯度獲取天氣
  - 缺少參數的錯誤處理
  - 部分經緯度參數的錯誤處理
  - 服務層錯誤處理
  - 網絡錯誤處理

- **天氣預報端點** (`/api/v1/weather/forecast`)
  - 通過城市名獲取預報
  - 自定義預報天數
  - 無效天數範圍驗證
  - 缺少參數的錯誤處理
  - 通過經緯度獲取預報

- **AI 天氣建議端點** (`/api/v1/ai/weather-advice`)
  - 成功獲取 AI 天氣建議
  - 缺少參數的錯誤處理

- **空氣質量端點** (`/api/v1/ai/air-quality`)
  - 成功獲取空氣質量和建議
  - 缺少參數的錯誤處理

- **完整報告端點** (`/api/v1/ai/complete-report`)
  - 成功獲取完整天氣報告
  - 缺少參數的錯誤處理
  - 空氣質量獲取失敗時的處理

- **速率限制測試**
  - 驗證速率限制機制

- **CORS 測試**
  - 驗證 CORS 配置

### 3. test_ai_assistant.py - AI 輔助服務測試
**單元測試** - 測試 `AIAssistant` 類的所有方法

- **初始化測試**
  - 驗證 AI 輔助正確初始化
  - 從環境變量啟用/禁用 AI

- **獲取天氣建議** (`get_weather_advice`)
  - 基本天氣建議獲取
  - 建議數據結構驗證

- **穿衣建議** (`_get_clothing_advice`)
  - 極寒天氣 (< 0°C)
  - 寒冷天氣 (0-10°C)
  - 涼爽天氣 (10-15°C)
  - 舒適天氣 (15-20°C)
  - 炎熱天氣 (25-30°C)
  - 酷熱天氣 (> 30°C)

- **活動建議** (`_get_activity_advice`)
  - 雨天活動建議
  - 雪天活動建議
  - 高溫天氣活動建議
  - 理想天氣活動建議
  - 大風天氣活動建議

- **健康建議** (`_get_health_advice`)
  - 高溫健康建議
  - 低溫健康建議
  - 高濕度健康建議
  - 低濕度健康建議
  - 雨天健康建議
  - 正常天氣健康建議

- **出行建議** (`_get_travel_advice`)
  - 雷暴天氣出行建議
  - 雨雪天氣出行建議
  - 大風天氣出行建議
  - 晴朗天氣出行建議
  - 一般天氣出行建議

- **舒適度指數** (`_calculate_comfort_index`)
  - 理想條件的舒適度
  - 高溫高濕的舒適度
  - 低溫乾燥的舒適度
  - 舒適度分數範圍驗證

- **空氣質量建議** (`get_air_quality_advice`)
  - 優秀空氣質量 (AQI ≤ 50)
  - 良好空氣質量 (AQI ≤ 100)
  - 輕度污染 (AQI ≤ 150)
  - 中度污染 (AQI ≤ 200)
  - 重度污染 (AQI ≤ 300)
  - 嚴重污染 (AQI > 300)
  - 建議數據結構驗證

- **健康影響** (`_get_health_effects`)
  - 不同 AQI 範圍的健康影響描述

- **集成測試**
  - 完整的天氣分析流程
  - 建議一致性測試

## 運行測試

### 前置要求

```bash
# 安裝依賴
pip install -r requirements.txt
pip install -r requirements-test.txt
```

### 運行所有測試

```bash
# 使用腳本
./run_tests.sh all

# 或直接使用 pytest
pytest tests/ -v
```

### 運行特定類型的測試

```bash
# 只運行單元測試
./run_tests.sh unit
pytest tests/ -v -m unit

# 只運行集成測試
./run_tests.sh integration
pytest tests/ -v -m integration
```

### 運行特定測試文件

```bash
# 使用腳本
./run_tests.sh file test_weather_service.py

# 或直接使用 pytest
pytest tests/test_weather_service.py -v
```

### 生成測試覆蓋率報告

```bash
# 使用腳本
./run_tests.sh coverage

# 或直接使用 pytest
pytest tests/ -v --cov=app --cov-report=html --cov-report=term
```

覆蓋率報告會生成在 `htmlcov/index.html`

## 測試標記

測試使用 pytest 標記進行分類：

- `@pytest.mark.unit` - 單元測試
- `@pytest.mark.integration` - 集成測試
- `@pytest.mark.slow` - 慢速測試
- `@pytest.mark.api` - API 測試
- `@pytest.mark.cache` - 緩存測試

## 測試配置

測試配置定義在以下文件中：

- `pytest.ini` - pytest 配置
- `conftest.py` - 共享 fixtures 和測試工具
- `requirements-test.txt` - 測試依賴

## Mock 和 Fixtures

### 可用的 Fixtures

- `app` - Flask 測試應用實例
- `client` - Flask 測試客戶端
- `mock_weather_response` - 模擬 OpenWeatherMap 當前天氣響應
- `mock_forecast_response` - 模擬預報響應
- `mock_air_quality_response` - 模擬空氣質量響應
- `mock_weather_service` - 模擬天氣服務
- `mock_cache_service` - 模擬緩存服務
- `mock_requests_get` - 模擬 requests.get 調用
- `sample_weather_data` - 示例天氣數據

### 測試輔助函數

- `assert_valid_weather_response(data)` - 驗證天氣響應格式
- `assert_valid_forecast_response(data)` - 驗證預報響應格式
- `assert_valid_air_quality_response(data)` - 驗證空氣質量響應格式

## 測試最佳實踐

1. **單元測試**
   - 測試單個函數或方法
   - Mock 外部依賴（API 調用、數據庫等）
   - 快速執行
   - 高覆蓋率

2. **集成測試**
   - 測試多個組件的交互
   - 測試完整的 API 端點
   - 驗證錯誤處理
   - 測試邊界條件

3. **測試隔離**
   - 每個測試獨立運行
   - 不依賴測試執行順序
   - 使用 fixtures 提供測試數據

4. **Mock 外部依賴**
   - 不調用真實的外部 API
   - 使用 mock 數據模擬響應
   - 確保測試可靠性和速度

## 持續集成

這些測試可以集成到 CI/CD 流程中：

```yaml
# GitHub Actions 示例
- name: Run tests
  run: |
    pip install -r requirements-test.txt
    pytest tests/ -v --cov=app --cov-report=xml

- name: Upload coverage
  uses: codecov/codecov-action@v3
  with:
    file: ./coverage.xml
```

## 貢獻指南

添加新測試時：

1. 遵循現有的測試結構和命名約定
2. 為新功能添加單元測試和集成測試
3. 使用適當的測試標記
4. 添加必要的 fixtures
5. 確保測試可靠且快速執行
6. 更新此 README 文件

## 測試統計

- **總測試文件**: 3
- **測試類別**: 單元測試、集成測試
- **涵蓋模塊**:
  - `app.services.weather` (天氣服務)
  - `app.services.ai_assistant` (AI 輔助)
  - `app.routes` (API 路由)
- **Mock 策略**: 外部 API 調用、緩存服務
