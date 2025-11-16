# 互動式儀表板系統 Interactive Dashboard

📊 使用 Plotly Dash 建立企業級互動式數據儀表板，支持實時數據更新、多維度分析和自定義視覺化

## 專案簡介

本專案提供一個功能完整的互動式儀表板系統，支持多種圖表類型、實時數據刷新、過濾聯動、鑽取分析等功能，適用於企業數據監控和分析場景。

## 功能特點

- ✅ 多種圖表類型（折線圖、柱狀圖、餅圖、散點圖、熱力圖）
- ✅ 實時數據更新
- ✅ 互動式過濾器
- ✅ 圖表聯動
- ✅ 下鑽分析
- ✅ 數據導出（CSV、Excel、PDF）
- ✅ 響應式設計
- ✅ 主題切換（淺色/深色）
- ✅ 用戶自定義佈局

## 快速開始

### 安裝依賴

```bash
cd interactive-dashboard
pip install -r requirements.txt
```

### 1. 生成示例數據

```bash
python data_generator.py
```

這將生成三個月的模擬業務數據。

### 2. 啟動儀表板

```bash
python app.py
```

儀表板將在 `http://localhost:8050` 運行。

### 3. 使用自定義數據

```bash
python app.py --data your_data.csv
```

## 使用範例

### 基本儀表板

```python
from dashboard import Dashboard
import pandas as pd

# 載入數據
data = pd.read_csv('data/sales_data.csv')

# 創建儀表板
dashboard = Dashboard(title='銷售儀表板')

# 添加 KPI 卡片
dashboard.add_kpi_card(
    title='總銷售額',
    value=data['sales'].sum(),
    change=15.3,  # 同比增長 %
    format='currency'
)

# 添加折線圖
dashboard.add_line_chart(
    data=data,
    x='date',
    y='sales',
    title='銷售趨勢'
)

# 添加柱狀圖
dashboard.add_bar_chart(
    data=data.groupby('category')['sales'].sum().reset_index(),
    x='category',
    y='sales',
    title='按類別銷售'
)

# 啟動
dashboard.run()
```

### 多頁面儀表板

```python
from dashboard import MultiPageDashboard

# 創建多頁面儀表板
app = MultiPageDashboard()

# 頁面 1: 概覽
@app.page('/overview', name='概覽')
def overview_page():
    return [
        app.kpi_section([
            {'title': '總收入', 'value': 1250000, 'change': 15.3},
            {'title': '訂單數', 'value': 3420, 'change': 8.7},
            {'title': '客單價', 'value': 365, 'change': -2.1},
            {'title': '活躍用戶', 'value': 12500, 'change': 23.5},
        ]),
        app.line_chart(data, x='date', y='revenue', title='收入趨勢'),
        app.bar_chart(data, x='product', y='sales', title='產品銷售'),
    ]

# 頁面 2: 銷售分析
@app.page('/sales', name='銷售分析')
def sales_page():
    return [
        app.filter_section(['date_range', 'category', 'region']),
        app.pivot_table(data, rows='category', cols='region', values='sales'),
        app.heat_map(data, x='date', y='category', z='sales'),
    ]

# 啟動
app.run()
```

### 添加互動性

```python
from dashboard import Dashboard
from dash import Input, Output

dashboard = Dashboard()

# 添加過濾器
dashboard.add_filter('date_range', type='date_range', default='last_30_days')
dashboard.add_filter('category', type='dropdown', options=['All', 'A', 'B', 'C'])

# 添加回調函數
@dashboard.callback(
    Output('sales-chart', 'figure'),
    Input('date_range', 'value'),
    Input('category', 'value')
)
def update_chart(date_range, category):
    # 根據過濾條件更新圖表
    filtered_data = filter_data(data, date_range, category)
    return create_figure(filtered_data)

dashboard.run()
```

### 實時更新

```python
from dashboard import Dashboard

dashboard = Dashboard()

# 添加實時圖表（每 5 秒更新）
dashboard.add_realtime_chart(
    chart_id='live-sales',
    update_interval=5000,  # 毫秒
    data_source='http://api.example.com/sales/realtime'
)

# 自定義更新函數
@dashboard.realtime_callback('live-sales')
def update_live_data():
    # 從數據源獲取最新數據
    latest_data = fetch_latest_sales()
    return latest_data

dashboard.run()
```

## 數據格式

### 輸入數據

支持 CSV、Excel、JSON 格式：

```csv
date,category,region,product,sales,quantity,revenue
2024-01-01,Electronics,North,Laptop,15,5,75000
2024-01-01,Electronics,South,Phone,25,10,25000
2024-01-02,Clothing,East,Shirt,50,20,10000
...
```

### 數據源配置

支持多種數據源：

```python
from dashboard import DataSource

# 數據庫連接
db_source = DataSource.from_database(
    type='postgresql',
    host='localhost',
    database='analytics',
    query='SELECT * FROM sales WHERE date >= NOW() - INTERVAL 30 DAY'
)

# API 數據源
api_source = DataSource.from_api(
    url='https://api.example.com/sales',
    headers={'Authorization': 'Bearer TOKEN'},
    refresh_interval=300  # 每 5 分鐘刷新
)

# CSV 文件
csv_source = DataSource.from_csv('data/sales.csv')

# 使用數據源
dashboard = Dashboard(data_source=db_source)
```

## 專案結構

```
interactive-dashboard/
├── README.md                   # 專案說明
├── requirements.txt            # 依賴套件
├── app.py                      # 主應用程序
├── dashboard.py                # 儀表板核心類
├── data_generator.py          # 數據生成器
├── components/                 # UI 組件
│   ├── __init__.py
│   ├── kpi_card.py            # KPI 卡片
│   ├── charts.py              # 圖表組件
│   ├── filters.py             # 過濾器
│   └── tables.py              # 表格組件
├── utils/                      # 工具函數
│   ├── __init__.py
│   ├── data_loader.py         # 數據加載
│   ├── formatters.py          # 格式化工具
│   └── export.py              # 導出功能
├── assets/                     # 靜態資源
│   ├── styles.css             # 自定義樣式
│   └── logo.png               # Logo
├── data/                       # 數據目錄
│   └── sales_data.csv         # 示例數據
└── config/                     # 配置文件
    ├── dashboard_config.json  # 儀表板配置
    └── theme.json             # 主題配置
```

## 支持的圖表類型

### 1. KPI 卡片

顯示關鍵指標和趨勢：

```python
dashboard.add_kpi_card(
    title='月度收入',
    value=1250000,
    change=15.3,
    trend=[100, 105, 110, 115, 120, 125],  # Sparkline
    target=1200000,
    format='currency'
)
```

### 2. 折線圖

趨勢分析：

```python
dashboard.add_line_chart(
    data=data,
    x='date',
    y=['sales', 'forecast'],
    title='銷售趨勢 vs 預測',
    smooth=True
)
```

### 3. 柱狀圖

分類對比：

```python
dashboard.add_bar_chart(
    data=data,
    x='category',
    y='sales',
    color='region',
    title='各地區分類銷售',
    stacked=True
)
```

### 4. 餅圖

佔比分析：

```python
dashboard.add_pie_chart(
    data=data,
    values='sales',
    names='category',
    title='銷售佔比',
    hole=0.4  # 環形圖
)
```

### 5. 散點圖

相關性分析：

```python
dashboard.add_scatter_chart(
    data=data,
    x='price',
    y='sales',
    size='quantity',
    color='category',
    title='價格 vs 銷售',
    trendline='ols'  # 添加趨勢線
)
```

### 6. 熱力圖

多維度分析：

```python
dashboard.add_heatmap(
    data=data,
    x='hour',
    y='day_of_week',
    z='sales',
    title='銷售熱力圖'
)
```

### 7. 漏斗圖

轉化分析：

```python
dashboard.add_funnel_chart(
    stages=['訪問', '加購', '下單', '支付', '完成'],
    values=[10000, 5000, 2500, 2000, 1800],
    title='購買轉化漏斗'
)
```

### 8. 地圖

地理分析：

```python
dashboard.add_map(
    data=data,
    locations='country',
    values='sales',
    title='全球銷售分布'
)
```

## 進階功能

### 1. 自定義主題

```python
dashboard.set_theme({
    'primary_color': '#1f77b4',
    'background_color': '#ffffff',
    'text_color': '#333333',
    'font_family': 'Arial, sans-serif',
    'card_shadow': True,
    'border_radius': 8
})
```

### 2. 數據鑽取

```python
# 配置鑽取層級
dashboard.add_drilldown_chart(
    data=data,
    levels=['region', 'city', 'store'],
    metric='sales',
    title='銷售鑽取分析'
)
```

### 3. 報警設置

```python
# 添加閾值報警
dashboard.add_alert(
    metric='sales',
    threshold=100000,
    operator='<',
    message='銷售額低於目標',
    notification=['email', 'slack']
)
```

### 4. 數據導出

```python
# 添加導出按鈕
dashboard.add_export_button(
    formats=['csv', 'excel', 'pdf'],
    filename_prefix='sales_report'
)
```

### 5. 用戶權限

```python
# 配置用戶訪問權限
dashboard.set_permissions({
    'admin': ['view', 'edit', 'export'],
    'manager': ['view', 'export'],
    'viewer': ['view']
})
```

## 部署

### 本地部署

```bash
python app.py --host 0.0.0.0 --port 8050
```

### Docker 部署

```bash
docker build -t dashboard .
docker run -p 8050:8050 dashboard
```

### 雲端部署

支持部署到：
- Heroku
- AWS (Elastic Beanstalk, ECS)
- Google Cloud (App Engine, Cloud Run)
- Azure (App Service)

## 性能優化

1. **數據緩存**
   - 使用 Redis 緩存查詢結果
   - 設置合理的緩存過期時間

2. **分頁加載**
   - 大數據集使用虛擬滾動
   - 服務端分頁

3. **延遲加載**
   - 懶加載圖表
   - 按需加載組件

4. **壓縮傳輸**
   - 啟用 gzip 壓縮
   - 最小化 JavaScript/CSS

## 最佳實踐

1. **儀表板設計**
   - 最重要的指標放在頂部
   - 使用一致的顏色方案
   - 避免過度擁擠
   - 提供清晰的標籤和說明

2. **性能考慮**
   - 限制單頁圖表數量（建議 < 8）
   - 使用適當的聚合級別
   - 預計算複雜指標

3. **用戶體驗**
   - 提供加載指示器
   - 響應式設計
   - 鍵盤快捷鍵
   - 工具提示說明

## 技術棧

- **Dash** - 互動式 Web 應用框架
- **Plotly** - 數據可視化庫
- **Pandas** - 數據處理
- **SQLAlchemy** - 數據庫 ORM
- **Redis** - 緩存
- **Gunicorn** - WSGI 服務器

## 常見問題

**Q: 如何連接自己的數據庫？**

A: 在 `config/database.json` 中配置數據庫連接信息，或使用環境變量：

```python
import os
from dashboard import Dashboard

dashboard = Dashboard()
dashboard.connect_database(
    type=os.getenv('DB_TYPE'),
    host=os.getenv('DB_HOST'),
    database=os.getenv('DB_NAME'),
    username=os.getenv('DB_USER'),
    password=os.getenv('DB_PASSWORD')
)
```

**Q: 如何添加身份驗證？**

A: 使用 Dash Auth：

```python
from dashboard import Dashboard
import dash_auth

dashboard = Dashboard()

# 基本認證
VALID_USERS = {
    'admin': 'password123',
    'user': 'userpass'
}

auth = dash_auth.BasicAuth(
    dashboard.app,
    VALID_USERS
)

dashboard.run()
```

**Q: 如何處理大數據集？**

A:
- 使用服務端分頁
- 實施數據聚合
- 使用增量更新
- 考慮使用 Dask 處理大數據

## 授權

MIT License
