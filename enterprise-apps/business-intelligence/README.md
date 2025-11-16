# 商業智能系統 (Business Intelligence System)
🤖 **AI-Driven | AI-Native** 🚀

商業智能 (BI) 系統幫助企業將數據轉化為洞察,支持數據驅動的決策。使用 AI 輔助開發可以快速建立強大的數據分析和可視化平台。

## 📋 目錄

- [BI 系統概述](#bi-系統概述)
- [核心功能](#核心功能)
- [技術架構](#技術架構)
- [推薦技術棧](#推薦技術棧)
- [AI 增強分析](#ai-增強分析)
- [數據可視化](#數據可視化)

---

## 🎯 BI 系統概述

### 核心功能領域

- **數據整合**：多源數據連接、ETL/ELT 處理
- **數據倉儲**：維度建模、數據立方體
- **報表系統**：標準報表、臨時報表、訂閱
- **儀表板**：實時監控、KPI 追蹤、鑽取分析
- **自助分析**：拖拽式報表、數據探索
- **預測分析**：機器學習、趨勢預測
- **數據治理**：數據質量、元數據管理

---

## 🧩 核心功能

### 1. 數據連接器

```typescript
// 多源數據連接
interface DataSource {
  id: string;
  name: string;
  type: 'DATABASE' | 'API' | 'FILE' | 'STREAM';

  // 連接配置
  connection: {
    // 資料庫
    host?: string;
    port?: number;
    database?: string;
    username?: string;
    password?: string;

    // API
    endpoint?: string;
    apiKey?: string;
    headers?: Record<string, string>;

    // 文件
    filePath?: string;
    fileType?: 'CSV' | 'EXCEL' | 'JSON' | 'PARQUET';
  };

  // 更新策略
  refreshSchedule: RefreshSchedule;

  // 數據範圍
  query?: string;
  filter?: DataFilter;

  status: 'CONNECTED' | 'DISCONNECTED' | 'ERROR';
  lastSync?: Date;
}

interface RefreshSchedule {
  type: 'REALTIME' | 'INTERVAL' | 'SCHEDULED';
  interval?: number; // 分鐘
  cron?: string;
  timezone: string;
}
```

### 2. ETL 流程

```typescript
// 數據轉換管道
interface ETLPipeline {
  id: string;
  name: string;
  description: string;

  // 來源
  source: DataSource;

  // 轉換步驟
  transformations: Transformation[];

  // 目標
  destination: DataWarehouse;

  // 排程
  schedule: RefreshSchedule;

  // 監控
  lastRun?: Date;
  status: 'SUCCESS' | 'FAILED' | 'RUNNING';
  metrics: {
    rowsExtracted: number;
    rowsTransformed: number;
    rowsLoaded: number;
    duration: number;
    errors: number;
  };
}

interface Transformation {
  id: string;
  type: 'FILTER' | 'MAP' | 'AGGREGATE' | 'JOIN' | 'PIVOT' | 'CUSTOM';
  config: any;
  order: number;
}

// 範例：ETL 執行
@Injectable()
export class ETLService {
  async executePipeline(pipelineId: string): Promise<ExecutionResult> {
    const pipeline = await this.getPipeline(pipelineId);

    try {
      // Extract
      const extractedData = await this.extract(pipeline.source);

      // Transform
      let transformedData = extractedData;
      for (const transformation of pipeline.transformations) {
        transformedData = await this.applyTransformation(
          transformedData,
          transformation,
        );
      }

      // Load
      await this.load(transformedData, pipeline.destination);

      // 記錄成功
      return {
        status: 'SUCCESS',
        rowsProcessed: transformedData.length,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      // 記錄錯誤
      await this.logError(pipelineId, error);
      throw error;
    }
  }
}
```

### 3. 數據模型

```typescript
// 維度建模
interface DimensionTable {
  id: string;
  name: string;
  type: 'DIMENSION';

  // 維度屬性
  attributes: DimensionAttribute[];

  // 層級
  hierarchies: Hierarchy[];

  // SCD 類型
  slowlyChangingType: 'TYPE_1' | 'TYPE_2' | 'TYPE_3';
}

interface FactTable {
  id: string;
  name: string;
  type: 'FACT';

  // 度量
  measures: Measure[];

  // 維度外鍵
  dimensions: DimensionReference[];

  // 粒度
  granularity: string;

  // 分區
  partitionKey?: string;
}

interface Measure {
  name: string;
  dataType: 'INTEGER' | 'DECIMAL' | 'CURRENCY';
  aggregation: 'SUM' | 'AVG' | 'MIN' | 'MAX' | 'COUNT' | 'DISTINCT_COUNT';
  format?: string;
}

// 範例：星型架構
const salesDataModel = {
  factTable: {
    name: 'FactSales',
    measures: [
      { name: 'quantity', aggregation: 'SUM' },
      { name: 'amount', aggregation: 'SUM' },
      { name: 'cost', aggregation: 'SUM' },
      { name: 'profit', aggregation: 'SUM' },
    ],
    dimensions: [
      'DimDate',
      'DimProduct',
      'DimCustomer',
      'DimStore',
      'DimEmployee',
    ],
  },
};
```

### 4. 報表設計

```typescript
// 報表定義
interface Report {
  id: string;
  name: string;
  description: string;
  category: string;

  // 數據集
  dataset: Dataset;

  // 視覺化
  visualizations: Visualization[];

  // 參數
  parameters: Parameter[];

  // 過濾器
  filters: Filter[];

  // 排程
  schedule?: ReportSchedule;

  // 訂閱
  subscriptions: Subscription[];

  // 權限
  accessControl: AccessControl;
}

interface Dataset {
  id: string;
  name: string;
  query: string; // SQL or DSL
  dataSource: DataSource;
  refreshMode: 'LIVE' | 'CACHED' | 'SCHEDULED';
  cacheExpiration?: number;
}

interface Visualization {
  id: string;
  type: 'TABLE' | 'CHART' | 'CARD' | 'MAP' | 'PIVOT' | 'CUSTOM';
  title: string;

  // 配置
  config: {
    // 表格
    columns?: ColumnConfig[];
    sorting?: SortConfig[];
    pagination?: boolean;

    // 圖表
    chartType?: 'LINE' | 'BAR' | 'PIE' | 'SCATTER' | 'AREA';
    xAxis?: string;
    yAxis?: string[];
    legend?: boolean;
    tooltip?: boolean;

    // 卡片
    metric?: string;
    comparison?: ComparisonConfig;
  };

  // 佈局
  layout: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}
```

### 5. 儀表板

```typescript
// 互動式儀表板
interface Dashboard {
  id: string;
  name: string;
  description: string;

  // 佈局
  layout: 'GRID' | 'FLOW';
  theme: 'LIGHT' | 'DARK';

  // 組件
  widgets: Widget[];

  // 過濾器
  globalFilters: Filter[];

  // 互動
  interactions: Interaction[];

  // 刷新
  autoRefresh: boolean;
  refreshInterval?: number;

  // 分享
  isPublic: boolean;
  shareLink?: string;
}

interface Widget {
  id: string;
  type: 'CHART' | 'TABLE' | 'METRIC' | 'TEXT' | 'FILTER' | 'IMAGE';
  title: string;
  datasetId: string;
  visualization: Visualization;
  position: GridPosition;
}

interface Interaction {
  type: 'DRILL_DOWN' | 'FILTER' | 'CROSS_FILTER' | 'TOOLTIP';
  source: string; // widget ID
  target: string; // widget ID
  config: any;
}
```

---

## 💻 推薦技術棧

### 數據處理: Apache Spark / Pandas

```python
# 大數據處理範例
from pyspark.sql import SparkSession
from pyspark.sql.functions import col, sum, avg, count

class DataProcessor:
    def __init__(self):
        self.spark = SparkSession.builder \
            .appName("BI Analytics") \
            .getOrCreate()

    def process_sales_data(self, start_date, end_date):
        """處理銷售數據"""

        # 讀取數據
        sales_df = self.spark.read \
            .format("jdbc") \
            .option("url", "jdbc:postgresql://localhost/sales") \
            .option("dbtable", "sales") \
            .load()

        # 過濾日期範圍
        filtered_df = sales_df.filter(
            (col("date") >= start_date) &
            (col("date") <= end_date)
        )

        # 聚合分析
        summary = filtered_df.groupBy("product_category", "region") \
            .agg(
                sum("amount").alias("total_sales"),
                avg("amount").alias("avg_sales"),
                count("*").alias("transaction_count")
            )

        return summary
```

### 可視化: React + D3.js / ECharts

```tsx
// 互動式圖表範例
import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface LineChartProps {
  data: DataPoint[];
  width: number;
  height: number;
}

const LineChart: React.FC<LineChartProps> = ({ data, width, height }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 20, right: 30, bottom: 30, left: 40 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // 比例尺
    const xScale = d3.scaleTime()
      .domain(d3.extent(data, d => d.date))
      .range([0, innerWidth]);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.value)])
      .range([innerHeight, 0]);

    // 畫布
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // X 軸
    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale));

    // Y 軸
    g.append('g')
      .call(d3.axisLeft(yScale));

    // 線條
    const line = d3.line<DataPoint>()
      .x(d => xScale(d.date))
      .y(d => yScale(d.value))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', 'steelblue')
      .attr('stroke-width', 2)
      .attr('d', line);

    // 互動點
    g.selectAll('circle')
      .data(data)
      .enter()
      .append('circle')
      .attr('cx', d => xScale(d.date))
      .attr('cy', d => yScale(d.value))
      .attr('r', 4)
      .attr('fill', 'steelblue')
      .on('mouseover', function(event, d) {
        // 顯示 tooltip
        d3.select(this).attr('r', 6);
      })
      .on('mouseout', function() {
        d3.select(this).attr('r', 4);
      });

  }, [data, width, height]);

  return <svg ref={svgRef} width={width} height={height} />;
};

export default LineChart;
```

---

## 🤖 AI 增強分析

### 1. 自動洞察發現

```python
# AI 自動發現數據洞察
class AutoInsightsEngine:
    def discover_insights(self, dataset: pd.DataFrame) -> List[Insight]:
        """自動發現數據中的洞察"""
        insights = []

        # 1. 趨勢檢測
        trends = self.detect_trends(dataset)
        insights.extend(trends)

        # 2. 異常檢測
        anomalies = self.detect_anomalies(dataset)
        insights.extend(anomalies)

        # 3. 相關性分析
        correlations = self.find_correlations(dataset)
        insights.extend(correlations)

        # 4. 模式識別
        patterns = self.identify_patterns(dataset)
        insights.extend(patterns)

        # 按重要性排序
        insights.sort(key=lambda x: x.significance, reverse=True)

        return insights[:10]  # 返回 top 10

    def detect_trends(self, data: pd.DataFrame) -> List[Insight]:
        """檢測趨勢"""
        from scipy import stats

        insights = []
        for column in data.select_dtypes(include=[np.number]).columns:
            # 線性回歸檢測趨勢
            x = np.arange(len(data))
            y = data[column].values

            slope, intercept, r_value, p_value, std_err = stats.linregress(x, y)

            if abs(r_value) > 0.7 and p_value < 0.05:
                direction = 'increasing' if slope > 0 else 'decreasing'
                insights.append({
                    'type': 'TREND',
                    'column': column,
                    'description': f'{column} shows a {direction} trend',
                    'significance': abs(r_value),
                    'details': {
                        'slope': slope,
                        'r_squared': r_value ** 2,
                    }
                })

        return insights
```

### 2. 自然語言查詢

```typescript
// NLQ - 自然語言轉 SQL
class NaturalLanguageQuery {
  async query(question: string): Promise<QueryResult> {
    // 使用 OpenAI GPT 理解問題並生成 SQL
    const completion = await openai.createCompletion({
      model: 'gpt-4',
      prompt: `
        給定以下數據庫架構:
        ${this.schemaDescription}

        用戶問題: ${question}

        生成相應的 SQL 查詢:
      `,
    });

    const sql = this.extractSQL(completion.choices[0].text);

    // 執行查詢
    const result = await this.database.execute(sql);

    // 生成自然語言解釋
    const explanation = await this.explainResult(question, result);

    return {
      sql,
      data: result,
      explanation,
      visualization: await this.suggestVisualization(result),
    };
  }
}
```

### 3. 預測分析

```python
# 時間序列預測
from prophet import Prophet

class ForecastingService:
    def forecast_metric(
        self,
        metric_name: str,
        historical_data: pd.DataFrame,
        periods: int = 30
    ) -> dict:
        """預測業務指標"""

        # 準備數據
        df = historical_data.rename(columns={
            'date': 'ds',
            metric_name: 'y'
        })

        # 訓練模型
        model = Prophet(
            changepoint_prior_scale=0.05,
            seasonality_mode='multiplicative'
        )

        # 添加節假日
        model.add_country_holidays(country_name='US')

        model.fit(df)

        # 預測
        future = model.make_future_dataframe(periods=periods)
        forecast = model.predict(future)

        # 評估準確度
        from sklearn.metrics import mean_absolute_percentage_error

        actual = df['y'].values
        predicted = forecast['yhat'][:len(df)].values
        mape = mean_absolute_percentage_error(actual, predicted)

        return {
            'forecast': forecast[['ds', 'yhat', 'yhat_lower', 'yhat_upper']],
            'accuracy': {
                'mape': mape,
            },
            'change_points': model.changepoints,
            'components': {
                'trend': forecast['trend'],
                'seasonal': {
                    'yearly': forecast.get('yearly'),
                    'weekly': forecast.get('weekly'),
                }
            }
        }
```

---

## 📊 數據可視化最佳實踐

### KPI 卡片
```typescript
const kpiCard = {
  metric: 'Monthly Revenue',
  value: 1250000,
  change: +15.3, // %
  comparison: 'vs last month',
  trend: [100, 105, 110, 115, 120, 125], // sparkline
  status: 'good', // good | warning | critical
  target: 1200000,
};
```

### 儀表板設計原則
1. **重要指標置頂** - 最關鍵的 KPI 放在最顯眼位置
2. **視覺層次** - 使用大小、顏色區分重要性
3. **互動性** - 支持鑽取、過濾、聯動
4. **響應式** - 適配不同螢幕尺寸
5. **性能優化** - 大數據集使用虛擬滾動、分頁

---

## 📚 參考資源

### 開源 BI 工具
- **Apache Superset** - 現代化 BI 平台
- **Metabase** - 簡單易用的 BI 工具
- **Redash** - 數據查詢和可視化
- **Grafana** - 監控和可視化平台

### 商業 BI 工具
- **Tableau** - 領先的 BI 平台
- **Power BI** - Microsoft 的 BI 解決方案
- **Looker** - Google Cloud 的 BI 工具
- **Qlik Sense** - 關聯分析 BI

---

**🚀 開始使用 AI 建立你的商業智能系統,讓數據驅動決策！**
