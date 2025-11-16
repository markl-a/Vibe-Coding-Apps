# KPI 監控系統 KPI Monitoring System

📈 實時監控企業關鍵績效指標，支持自動預警、目標追蹤和趨勢分析

## 專案簡介

本專案提供企業級 KPI 監控解決方案，實時追蹤業務關鍵指標，自動檢測異常，並在指標偏離目標時及時預警，幫助管理層快速決策。

## 功能特點

- ✅ 多維度 KPI 定義和計算
- ✅ 實時數據更新和監控
- ✅ 自動閾值預警
- ✅ 目標達成追蹤
- ✅ 趨勢分析和預測
- ✅ 自定義儀表板
- ✅ 郵件/Slack/微信通知
- ✅ 歷史數據對比
- ✅ 鑽取分析

## 快速開始

### 安裝依賴

```bash
cd kpi-monitoring
pip install -r requirements.txt
```

### 1. 配置 KPI

編輯 `config/kpis.yaml` 定義你的 KPI：

```yaml
kpis:
  - id: revenue
    name: 總收入
    description: 每日總收入
    query: SELECT SUM(amount) FROM sales WHERE date = CURRENT_DATE
    target: 100000
    warning_threshold: 80000
    critical_threshold: 50000
    unit: currency
    refresh_interval: 300  # 秒

  - id: active_users
    name: 活躍用戶數
    description: 每日活躍用戶
    query: SELECT COUNT(DISTINCT user_id) FROM user_activity WHERE date = CURRENT_DATE
    target: 5000
    warning_threshold: 4000
    critical_threshold: 3000
    unit: number
    refresh_interval: 600
```

### 2. 啟動監控服務

```bash
# 啟動後端監控服務
python monitor.py --config config/kpis.yaml

# 啟動 Web 儀表板
streamlit run app.py
```

### 3. 查看儀表板

訪問 `http://localhost:8501` 查看 KPI 監控儀表板。

## 使用範例

### 定義 KPI

```python
from kpi_monitoring import KPIMonitor, KPI

# 創建監控器
monitor = KPIMonitor()

# 定義 KPI
revenue_kpi = KPI(
    id='daily_revenue',
    name='每日收入',
    description='當日總收入',
    calculation=lambda data: data['sales'].sum(),
    target=100000,
    warning_threshold=80000,
    critical_threshold=50000,
    unit='currency',
    frequency='daily'
)

# 添加到監控器
monitor.add_kpi(revenue_kpi)
```

### 實時監控

```python
from kpi_monitoring import KPIMonitor

monitor = KPIMonitor()
monitor.load_config('config/kpis.yaml')

# 啟動實時監控
monitor.start_monitoring(
    check_interval=60,  # 每分鐘檢查一次
    auto_alert=True    # 自動預警
)

# 獲取當前狀態
status = monitor.get_current_status()
for kpi_id, data in status.items():
    print(f"{kpi_id}: {data['value']:.2f} ({data['status']})")
```

### 設置預警

```python
from kpi_monitoring import AlertManager

alert_manager = AlertManager()

# 配置預警通道
alert_manager.add_channel('email', {
    'smtp_server': 'smtp.gmail.com',
    'smtp_port': 587,
    'username': 'your_email@gmail.com',
    'password': 'your_password',
    'recipients': ['manager@company.com']
})

alert_manager.add_channel('slack', {
    'webhook_url': 'https://hooks.slack.com/services/YOUR/WEBHOOK/URL'
})

# 設置預警規則
alert_manager.add_rule(
    kpi_id='daily_revenue',
    condition='below_threshold',
    threshold=80000,
    channels=['email', 'slack'],
    cooldown=3600  # 1 小時內不重複預警
)
```

### 目標追蹤

```python
from kpi_monitoring import TargetTracker

tracker = TargetTracker()

# 設置月度目標
tracker.set_target(
    kpi_id='monthly_revenue',
    target=3000000,
    period='2024-12',
    breakdown='daily'  # 按日分解
)

# 獲取進度
progress = tracker.get_progress('monthly_revenue')
print(f"目標達成率: {progress['completion_rate']:.1%}")
print(f"預測達成: {progress['forecasted_completion']:.1%}")
print(f"是否達標: {'是' if progress['on_track'] else '否'}")
```

### 趨勢分析

```python
from kpi_monitoring import TrendAnalyzer

analyzer = TrendAnalyzer()

# 分析 KPI 趨勢
trend = analyzer.analyze(
    kpi_id='daily_revenue',
    lookback_days=30
)

print(f"趨勢方向: {trend['direction']}")  # 'increasing', 'decreasing', 'stable'
print(f"變化率: {trend['change_rate']:.2%}")
print(f"預測值: ${trend['forecast_next_day']:,.2f}")
```

## 專案結構

```
kpi-monitoring/
├── README.md                # 專案說明
├── requirements.txt         # 依賴套件
├── monitor.py              # 監控服務主程序
├── app.py                  # Streamlit Web UI
├── kpi_monitoring/         # 核心模組
│   ├── __init__.py
│   ├── kpi.py             # KPI 定義
│   ├── calculator.py      # KPI 計算
│   ├── monitor.py         # 監控器
│   ├── alerts.py          # 預警管理
│   ├── tracker.py         # 目標追蹤
│   └── analyzer.py        # 趨勢分析
├── config/                 # 配置文件
│   ├── kpis.yaml          # KPI 定義
│   ├── alerts.yaml        # 預警規則
│   └── database.yaml      # 數據源配置
├── data/                   # 數據目錄
│   └── kpi_history.db     # 歷史數據
└── logs/                   # 日誌
    └── monitor.log
```

## 支持的 KPI 類型

### 1. 業務 KPI

- **收入指標**：總收入、淨收入、ARPU、LTV
- **銷售指標**：訂單數、轉化率、客單價
- **客戶指標**：新增客戶、流失率、滿意度
- **運營指標**：庫存周轉率、訂單履行率

### 2. 產品 KPI

- **用戶指標**：DAU、MAU、留存率
- **參與度**：使用時長、功能使用率
- **增長指標**：用戶增長率、病毒係數

### 3. 技術 KPI

- **性能指標**：響應時間、吞吐量
- **可用性**：正常運行時間、錯誤率
- **基礎設施**：CPU 使用率、內存使用率

## 預警規則

### 閾值預警

```python
# 低於閾值
alert = ThresholdAlert(
    kpi_id='daily_revenue',
    operator='<',
    threshold=80000,
    severity='warning'
)

# 高於閾值
alert = ThresholdAlert(
    kpi_id='error_rate',
    operator='>',
    threshold=0.01,  # 1%
    severity='critical'
)
```

### 變化率預警

```python
# 下降超過 10%
alert = ChangeRateAlert(
    kpi_id='daily_revenue',
    change_rate=-0.10,
    comparison='day_over_day',
    severity='warning'
)
```

### 異常檢測預警

```python
# 使用統計方法檢測異常
alert = AnomalyAlert(
    kpi_id='daily_revenue',
    method='statistical',  # 或 'machine_learning'
    sensitivity=2.0,  # 2 個標準差
    severity='warning'
)
```

## 數據源整合

### 數據庫連接

```python
from kpi_monitoring import DataSource

# PostgreSQL
datasource = DataSource.from_database(
    type='postgresql',
    host='localhost',
    database='analytics',
    username='user',
    password='password'
)

# MySQL
datasource = DataSource.from_database(
    type='mysql',
    host='localhost',
    database='sales',
    username='user',
    password='password'
)
```

### API 數據源

```python
# REST API
datasource = DataSource.from_api(
    url='https://api.example.com/metrics',
    headers={'Authorization': 'Bearer TOKEN'},
    method='GET'
)
```

### 文件數據源

```python
# CSV 文件
datasource = DataSource.from_csv('data/metrics.csv')

# Excel 文件
datasource = DataSource.from_excel('data/kpis.xlsx', sheet_name='Metrics')
```

## 通知渠道

### 郵件通知

```yaml
email:
  smtp_server: smtp.gmail.com
  smtp_port: 587
  username: alerts@company.com
  password: ${EMAIL_PASSWORD}
  recipients:
    - manager@company.com
    - team@company.com
  template: email_alert.html
```

### Slack 通知

```yaml
slack:
  webhook_url: ${SLACK_WEBHOOK_URL}
  channel: '#kpi-alerts'
  username: KPI Monitor
  icon_emoji: ':chart_with_upwards_trend:'
```

### 微信通知

```yaml
wechat:
  corp_id: ${WECHAT_CORP_ID}
  corp_secret: ${WECHAT_CORP_SECRET}
  agent_id: ${WECHAT_AGENT_ID}
  to_user: '@all'
```

## 高級功能

### 自定義計算

```python
# 復合 KPI
def calculate_gross_profit_margin(data):
    revenue = data['revenue'].sum()
    cost = data['cost'].sum()
    return ((revenue - cost) / revenue) * 100 if revenue > 0 else 0

kpi = KPI(
    id='gross_profit_margin',
    name='毛利率',
    calculation=calculate_gross_profit_margin,
    unit='percentage',
    target=30.0
)
```

### 維度鑽取

```python
# 按維度分解 KPI
breakdown = monitor.breakdown_kpi(
    kpi_id='revenue',
    dimensions=['region', 'product_category'],
    period='last_30_days'
)

# 查看各地區表現
for region, value in breakdown['region'].items():
    print(f"{region}: ${value:,.2f}")
```

### 預測分析

```python
from kpi_monitoring import Forecaster

forecaster = Forecaster()

# 預測未來 7 天
forecast = forecaster.predict(
    kpi_id='daily_revenue',
    horizon=7,
    model='prophet'  # 或 'arima', 'lstm'
)

print("未來 7 天預測:")
for date, value in forecast.items():
    print(f"{date}: ${value:,.2f}")
```

## 最佳實踐

1. **KPI 選擇**
   - 聚焦關鍵指標（5-10 個核心 KPI）
   - 確保 KPI 可測量、可行動
   - 與業務目標對齊

2. **閾值設定**
   - 基於歷史數據設定合理閾值
   - 定期審查和調整
   - 使用多級預警（警告、嚴重）

3. **預警管理**
   - 避免預警疲勞
   - 設置冷卻期
   - 優先處理關鍵預警

4. **數據質量**
   - 確保數據準確性
   - 定期驗證計算邏輯
   - 監控數據延遲

## 技術棧

- **Python 3.8+**
- **Pandas** - 數據處理
- **SQLAlchemy** - 數據庫連接
- **APScheduler** - 任務調度
- **Prophet** - 預測分析
- **Streamlit** - Web 界面
- **Redis** - 緩存

## 授權

MIT License
