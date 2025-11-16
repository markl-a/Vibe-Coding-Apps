# ETL 數據管道 ETL Data Pipeline

🔄 企業級 ETL (Extract, Transform, Load) 數據管道，支持多源數據整合、轉換和加載

## 專案簡介

本專案提供完整的 ETL 解決方案，支持從多個數據源提取數據、執行複雜轉換、載入到目標系統。內建數據質量檢查、錯誤處理、監控和日誌功能。

## 功能特點

- ✅ 多數據源支持（數據庫、API、文件、流式數據）
- ✅ 可視化流程設計
- ✅ 數據轉換（清洗、聚合、關聯、計算）
- ✅ 增量更新和全量同步
- ✅ 數據質量檢查
- ✅ 錯誤處理和重試機制
- ✅ 任務調度（Cron、事件觸發）
- ✅ 監控和日誌
- ✅ 並行處理

## 快速開始

### 安裝依賴

```bash
cd etl-pipeline
pip install -r requirements.txt
```

### 1. 配置數據源

編輯 `config/sources.yaml`：

```yaml
sources:
  # PostgreSQL 數據庫
  sales_db:
    type: postgresql
    host: localhost
    port: 5432
    database: sales
    username: ${DB_USER}
    password: ${DB_PASSWORD}

  # REST API
  crm_api:
    type: api
    url: https://api.example.com/customers
    auth:
      type: bearer
      token: ${API_TOKEN}

  # CSV 文件
  product_csv:
    type: csv
    path: data/products.csv
```

### 2. 定義 ETL 流程

創建 `pipelines/sales_etl.py`：

```python
from etl import Pipeline, Extract, Transform, Load

# 創建管道
pipeline = Pipeline(name='sales_etl')

# Extract: 從數據庫提取
extract = Extract(
    source='sales_db',
    query='SELECT * FROM orders WHERE updated_at > :last_run'
)

# Transform: 數據轉換
transform = Transform([
    # 清洗數據
    {'type': 'remove_nulls', 'columns': ['customer_id', 'amount']},
    {'type': 'convert_type', 'column': 'amount', 'to': 'float'},

    # 關聯維度表
    {'type': 'join',
     'right_source': 'product_csv',
     'left_on': 'product_id',
     'right_on': 'id',
     'how': 'left'},

    # 聚合計算
    {'type': 'aggregate',
     'group_by': ['customer_id', 'date'],
     'agg': {'amount': 'sum', 'order_id': 'count'}}
])

# Load: 載入到數據倉儲
load = Load(
    destination='data_warehouse',
    table='fact_sales',
    mode='upsert',  # 或 'append', 'replace'
    key_columns=['customer_id', 'date']
)

# 組裝管道
pipeline.add_step(extract)
pipeline.add_step(transform)
pipeline.add_step(load)
```

### 3. 運行管道

```bash
# 手動運行
python run_pipeline.py --pipeline sales_etl

# 使用調度器
python scheduler.py --config config/schedules.yaml
```

### 4. 監控儀表板

```bash
streamlit run monitor.py
```

訪問 `http://localhost:8501` 查看 ETL 運行狀態。

## 使用範例

### 基礎 ETL 流程

```python
from etl import ETLPipeline

# 創建管道
pipeline = ETLPipeline(name='customer_etl')

# Extract: 從 API 提取數據
data = pipeline.extract(
    source_type='api',
    url='https://api.example.com/customers',
    headers={'Authorization': 'Bearer TOKEN'}
)

# Transform: 轉換數據
data = pipeline.transform(data, [
    # 選擇欄位
    pipeline.select_columns(['id', 'name', 'email', 'created_at']),

    # 重命名欄位
    pipeline.rename_columns({'created_at': 'registration_date'}),

    # 添加計算欄位
    pipeline.add_column('full_name', lambda row: f"{row['first_name']} {row['last_name']}"),

    # 過濾數據
    pipeline.filter_rows(lambda row: row['status'] == 'active')
])

# Load: 載入到數據庫
pipeline.load(
    data,
    destination='postgresql://localhost/warehouse',
    table='dim_customers',
    mode='replace'
)

# 執行並獲取統計
result = pipeline.run()
print(f"處理 {result.rows_processed} 行，耗時 {result.duration:.2f} 秒")
```

### 增量更新

```python
from etl import IncrementalETL

# 增量 ETL
etl = IncrementalETL(
    name='orders_incremental',
    checkpoint_column='updated_at',  # 用於追蹤增量的欄位
    checkpoint_storage='redis://localhost'  # 存儲檢查點
)

# 提取增量數據
last_checkpoint = etl.get_last_checkpoint()
data = etl.extract(
    query=f"SELECT * FROM orders WHERE updated_at > '{last_checkpoint}'"
)

# 處理數據
etl.transform(data)
etl.load(data)

# 更新檢查點
etl.update_checkpoint(data['updated_at'].max())
```

### 數據質量檢查

```python
from etl import DataQuality

# 定義質量規則
quality_checks = DataQuality([
    # 非空檢查
    {'type': 'not_null', 'columns': ['customer_id', 'order_id', 'amount']},

    # 唯一性檢查
    {'type': 'unique', 'columns': ['order_id']},

    # 範圍檢查
    {'type': 'range', 'column': 'amount', 'min': 0, 'max': 1000000},

    # 格式檢查
    {'type': 'regex', 'column': 'email', 'pattern': r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'},

    # 參照完整性
    {'type': 'foreign_key',
     'column': 'customer_id',
     'reference_table': 'customers',
     'reference_column': 'id'}
])

# 執行檢查
results = quality_checks.validate(data)

if not results.passed:
    print(f"質量檢查失敗: {results.failed_checks}")
    # 處理失敗記錄
    failed_rows = results.get_failed_rows()
    failed_rows.to_csv('data/failed_quality_check.csv')
```

### 複雜轉換

```python
from etl import Transform

transform = Transform()

# 數據清洗
data = transform.clean(data, [
    # 去除重複
    transform.deduplicate(subset=['customer_id', 'date']),

    # 填充缺失值
    transform.fill_missing({'region': 'Unknown', 'category': 'Other'}),

    # 標準化文本
    transform.standardize_text(['name', 'address'], lowercase=True, remove_special_chars=True),

    # 處理異常值
    transform.handle_outliers('amount', method='clip', lower_percentile=1, upper_percentile=99)
])

# 數據豐富
data = transform.enrich(data, [
    # 地理編碼
    transform.geocode('address', output_columns=['latitude', 'longitude']),

    # 查找維度
    transform.lookup(
        lookup_table='products',
        on='product_id',
        select=['category', 'brand', 'price']
    ),

    # 計算衍生欄位
    transform.calculate([
        {'name': 'profit', 'expression': 'revenue - cost'},
        {'name': 'profit_margin', 'expression': '(revenue - cost) / revenue * 100'}
    ])
])

# 數據聚合
data = transform.aggregate(
    group_by=['customer_id', 'month'],
    aggregations={
        'amount': ['sum', 'mean', 'count'],
        'order_id': 'nunique'
    }
)
```

### 並行處理

```python
from etl import ParallelETL

# 並行處理大數據集
parallel_etl = ParallelETL(
    name='large_dataset_etl',
    num_workers=4  # 使用 4 個並行進程
)

# 分片處理
parallel_etl.extract_parallel(
    source='postgresql://localhost/bigdata',
    query='SELECT * FROM large_table',
    partition_by='date',  # 按日期分片
    num_partitions=10
)

# 並行轉換
parallel_etl.transform_parallel(transform_function)

# 批量載入
parallel_etl.load_parallel(
    destination='warehouse',
    batch_size=10000
)
```

### 錯誤處理

```python
from etl import ETLPipeline, RetryPolicy

pipeline = ETLPipeline(
    name='resilient_etl',
    retry_policy=RetryPolicy(
        max_retries=3,
        backoff_factor=2,  # 指數退避
        retry_on=['ConnectionError', 'TimeoutError']
    )
)

# 錯誤記錄
pipeline.on_error(lambda error, row: {
    'timestamp': datetime.now(),
    'error_type': type(error).__name__,
    'error_message': str(error),
    'failed_row': row
})

# 死信隊列
pipeline.set_dead_letter_queue('failed_records.csv')
```

## 專案結構

```
etl-pipeline/
├── README.md                  # 專案說明
├── requirements.txt           # 依賴套件
├── run_pipeline.py           # 管道運行器
├── scheduler.py              # 任務調度器
├── monitor.py                # 監控儀表板
├── etl/                      # ETL 核心模組
│   ├── __init__.py
│   ├── pipeline.py          # 管道基類
│   ├── extractors/          # 數據提取器
│   │   ├── database.py
│   │   ├── api.py
│   │   ├── file.py
│   │   └── stream.py
│   ├── transformers/        # 數據轉換器
│   │   ├── cleaning.py
│   │   ├── aggregation.py
│   │   ├── join.py
│   │   └── calculation.py
│   ├── loaders/             # 數據加載器
│   │   ├── database.py
│   │   ├── file.py
│   │   └── api.py
│   ├── quality.py           # 數據質量
│   └── monitoring.py        # 監控和日誌
├── pipelines/                # ETL 管道定義
│   ├── sales_etl.py
│   ├── customer_etl.py
│   └── product_etl.py
├── config/                   # 配置文件
│   ├── sources.yaml         # 數據源配置
│   ├── destinations.yaml    # 目標配置
│   └── schedules.yaml       # 調度配置
├── data/                     # 數據目錄
│   ├── input/
│   ├── output/
│   └── failed/
└── logs/                     # 日誌
    └── etl.log
```

## 支持的數據源

### 數據庫

- PostgreSQL
- MySQL
- SQL Server
- Oracle
- MongoDB
- Cassandra

### 文件

- CSV
- JSON
- Excel
- Parquet
- Avro

### API

- REST API
- GraphQL
- SOAP

### 流式數據

- Kafka
- RabbitMQ
- AWS Kinesis

### 雲存儲

- AWS S3
- Google Cloud Storage
- Azure Blob Storage

## 調度配置

```yaml
schedules:
  # 每日運行
  daily_sales_etl:
    pipeline: sales_etl
    schedule: '0 2 * * *'  # 每天凌晨 2 點
    timezone: Asia/Taipei

  # 每小時運行
  hourly_events_etl:
    pipeline: events_etl
    schedule: '0 * * * *'  # 每小時整點

  # 事件觸發
  order_received:
    pipeline: order_processing_etl
    trigger: webhook
    endpoint: /webhooks/order
```

## 監控和日誌

### 監控指標

- 運行狀態（成功/失敗/運行中）
- 處理行數
- 執行時間
- 錯誤率
- 數據質量分數

### 日誌配置

```python
import logging

# 配置日誌
logging.config.dictConfig({
    'version': 1,
    'handlers': {
        'file': {
            'class': 'logging.FileHandler',
            'filename': 'logs/etl.log',
            'level': 'INFO'
        },
        'console': {
            'class': 'logging.StreamHandler',
            'level': 'DEBUG'
        }
    },
    'loggers': {
        'etl': {
            'handlers': ['file', 'console'],
            'level': 'INFO'
        }
    }
})
```

## 最佳實踐

1. **設計原則**
   - 單一職責：每個管道專注一個數據流
   - 冪等性：重複運行產生相同結果
   - 可恢復：支持從失敗點恢復

2. **性能優化**
   - 使用增量更新而非全量
   - 並行處理大數據集
   - 批量插入而非逐行
   - 適當使用緩存

3. **數據質量**
   - 源頭驗證數據
   - 轉換過程中檢查
   - 載入前最終驗證

4. **錯誤處理**
   - 記錄所有錯誤
   - 失敗數據隔離
   - 設置重試機制
   - 發送預警通知

5. **監控運維**
   - 監控關鍵指標
   - 設置預警閾值
   - 定期審查日誌
   - 優化慢查詢

## 技術棧

- **Python 3.8+**
- **Pandas** - 數據處理
- **SQLAlchemy** - 數據庫連接
- **Apache Airflow** - 工作流調度（可選）
- **Prefect** - 現代工作流引擎（可選）
- **Great Expectations** - 數據質量
- **Streamlit** - 監控界面

## 常見問題

**Q: 如何處理大數據集？**

A:
- 使用分片/分區處理
- 啟用並行處理
- 使用流式處理
- 考慮使用 Spark 處理 TB 級數據

**Q: 如何確保數據一致性？**

A:
- 使用事務
- 實現冪等性
- 記錄檢查點
- 實施數據質量檢查

**Q: 如何優化性能？**

A:
- 只提取需要的欄位
- 在數據庫端做聚合
- 使用批量操作
- 適當建立索引

## 授權

MIT License
