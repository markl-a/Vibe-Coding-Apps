"""
互動式儀表板 - 主應用程序
使用 Dash 和 Plotly 建立互動式業務儀表板
"""

import dash
from dash import dcc, html, Input, Output, State
import dash_bootstrap_components as dbc
import plotly.express as px
import plotly.graph_objects as go
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

# 載入數據
def load_data():
    """載入所有數據"""
    try:
        sales_df = pd.read_csv('data/sales_data.csv')
        sales_df['date'] = pd.to_datetime(sales_df['date'])
        customer_df = pd.read_csv('data/customer_data.csv')
        kpi_df = pd.read_csv('data/kpi_data.csv')
        return sales_df, customer_df, kpi_df
    except FileNotFoundError:
        print("⚠️  數據文件未找到，請先運行 data_generator.py")
        return None, None, None

sales_df, customer_df, kpi_df = load_data()

# 初始化 Dash 應用
app = dash.Dash(
    __name__,
    external_stylesheets=[dbc.themes.BOOTSTRAP],
    suppress_callback_exceptions=True
)
app.title = "互動式商業智能儀表板"

# KPI 卡片組件
def create_kpi_card(title, value, change, icon="📊"):
    """創建 KPI 卡片"""
    change_color = "success" if change >= 0 else "danger"
    change_icon = "↑" if change >= 0 else "↓"

    return dbc.Card([
        dbc.CardBody([
            html.H6(f"{icon} {title}", className="card-subtitle mb-2 text-muted"),
            html.H3(f"{value:,.0f}" if isinstance(value, (int, float)) else value, className="card-title"),
            html.P([
                html.Span(f"{change_icon} {abs(change):.1f}%", className=f"text-{change_color}"),
                html.Span(" vs 上月", className="text-muted ms-2")
            ])
        ])
    ], className="mb-3 shadow-sm")

# 創建過濾器區域
def create_filters():
    """創建過濾器組件"""
    if sales_df is None:
        return html.Div()

    return dbc.Card([
        dbc.CardBody([
            dbc.Row([
                dbc.Col([
                    html.Label("日期範圍", className="fw-bold"),
                    dcc.DatePickerRange(
                        id='date-range',
                        start_date=sales_df['date'].min(),
                        end_date=sales_df['date'].max(),
                        display_format='YYYY-MM-DD',
                        className="form-control"
                    )
                ], md=4),
                dbc.Col([
                    html.Label("產品類別", className="fw-bold"),
                    dcc.Dropdown(
                        id='category-filter',
                        options=[{'label': 'All', 'value': 'All'}] +
                                [{'label': cat, 'value': cat} for cat in sales_df['category'].unique()],
                        value='All',
                        clearable=False
                    )
                ], md=4),
                dbc.Col([
                    html.Label("地區", className="fw-bold"),
                    dcc.Dropdown(
                        id='region-filter',
                        options=[{'label': 'All', 'value': 'All'}] +
                                [{'label': reg, 'value': reg} for reg in sales_df['region'].unique()],
                        value='All',
                        clearable=False
                    )
                ], md=4)
            ])
        ])
    ], className="mb-4 shadow-sm")

# 佈局
def serve_layout():
    """創建應用佈局"""
    if sales_df is None:
        return html.Div([
            dbc.Container([
                html.H1("⚠️ 數據未找到", className="text-center mt-5"),
                html.P("請先運行 data_generator.py 生成示例數據", className="text-center"),
                html.Pre("python data_generator.py", className="text-center")
            ])
        ])

    # 計算 KPI
    total_revenue = sales_df['sales'].sum()
    total_orders = len(sales_df)
    avg_order_value = sales_df.groupby('date')['sales'].sum().mean()
    active_customers = customer_df['is_active'].sum() if customer_df is not None else 0

    # 計算變化（這裡用隨機值示例）
    revenue_change = 15.3
    orders_change = 8.7
    aov_change = -2.1
    customers_change = 23.5

    return dbc.Container([
        # 標題
        dbc.Row([
            dbc.Col([
                html.H1("📊 互動式商業智能儀表板", className="mt-4 mb-2"),
                html.P("實時監控業務關鍵指標", className="text-muted")
            ])
        ]),

        html.Hr(),

        # KPI 卡片區
        dbc.Row([
            dbc.Col(create_kpi_card("總收入", total_revenue, revenue_change, "💰"), md=3),
            dbc.Col(create_kpi_card("訂單數", total_orders, orders_change, "🛒"), md=3),
            dbc.Col(create_kpi_card("平均日銷售", avg_order_value, aov_change, "📈"), md=3),
            dbc.Col(create_kpi_card("活躍客戶", active_customers, customers_change, "👥"), md=3),
        ], className="mb-4"),

        # 過濾器
        create_filters(),

        # 圖表區域
        dbc.Row([
            dbc.Col([
                dbc.Card([
                    dbc.CardHeader(html.H5("📈 銷售趨勢")),
                    dbc.CardBody([
                        dcc.Graph(id='sales-trend-chart')
                    ])
                ], className="shadow-sm")
            ], md=8),
            dbc.Col([
                dbc.Card([
                    dbc.CardHeader(html.H5("🥧 類別佔比")),
                    dbc.CardBody([
                        dcc.Graph(id='category-pie-chart')
                    ])
                ], className="shadow-sm")
            ], md=4)
        ], className="mb-4"),

        dbc.Row([
            dbc.Col([
                dbc.Card([
                    dbc.CardHeader(html.H5("📊 地區銷售對比")),
                    dbc.CardBody([
                        dcc.Graph(id='region-bar-chart')
                    ])
                ], className="shadow-sm")
            ], md=6),
            dbc.Col([
                dbc.Card([
                    dbc.CardHeader(html.H5("🔥 熱力圖 - 類別 × 地區")),
                    dbc.CardBody([
                        dcc.Graph(id='heatmap-chart')
                    ])
                ], className="shadow-sm")
            ], md=6)
        ], className="mb-4"),

        # 頁腳
        html.Hr(),
        html.Footer([
            html.P("© 2024 互動式商業智能儀表板 | Powered by Dash & Plotly",
                   className="text-center text-muted")
        ], className="mb-4")

    ], fluid=True)

app.layout = serve_layout

# 回調函數：過濾數據
def filter_data(start_date, end_date, category, region):
    """根據過濾條件篩選數據"""
    if sales_df is None:
        return pd.DataFrame()

    filtered = sales_df.copy()

    # 日期過濾
    if start_date and end_date:
        filtered = filtered[
            (filtered['date'] >= pd.to_datetime(start_date)) &
            (filtered['date'] <= pd.to_datetime(end_date))
        ]

    # 類別過濾
    if category != 'All':
        filtered = filtered[filtered['category'] == category]

    # 地區過濾
    if region != 'All':
        filtered = filtered[filtered['region'] == region]

    return filtered

# 回調：更新銷售趨勢圖
@app.callback(
    Output('sales-trend-chart', 'figure'),
    [Input('date-range', 'start_date'),
     Input('date-range', 'end_date'),
     Input('category-filter', 'value'),
     Input('region-filter', 'value')]
)
def update_sales_trend(start_date, end_date, category, region):
    """更新銷售趨勢圖"""
    filtered = filter_data(start_date, end_date, category, region)

    if filtered.empty:
        return go.Figure()

    # 按日期聚合
    daily_sales = filtered.groupby('date')['sales'].sum().reset_index()

    fig = px.line(
        daily_sales,
        x='date',
        y='sales',
        title='',
        markers=True
    )

    fig.update_layout(
        xaxis_title="日期",
        yaxis_title="銷售額 ($)",
        hovermode='x unified',
        template='plotly_white'
    )

    return fig

# 回調：更新類別餅圖
@app.callback(
    Output('category-pie-chart', 'figure'),
    [Input('date-range', 'start_date'),
     Input('date-range', 'end_date'),
     Input('category-filter', 'value'),
     Input('region-filter', 'value')]
)
def update_category_pie(start_date, end_date, category, region):
    """更新類別餅圖"""
    filtered = filter_data(start_date, end_date, category, region)

    if filtered.empty:
        return go.Figure()

    # 按類別聚合
    category_sales = filtered.groupby('category')['sales'].sum().reset_index()

    fig = px.pie(
        category_sales,
        values='sales',
        names='category',
        title='',
        hole=0.4
    )

    fig.update_traces(textposition='inside', textinfo='percent+label')
    fig.update_layout(template='plotly_white')

    return fig

# 回調：更新地區柱狀圖
@app.callback(
    Output('region-bar-chart', 'figure'),
    [Input('date-range', 'start_date'),
     Input('date-range', 'end_date'),
     Input('category-filter', 'value'),
     Input('region-filter', 'value')]
)
def update_region_bar(start_date, end_date, category, region):
    """更新地區柱狀圖"""
    filtered = filter_data(start_date, end_date, category, region)

    if filtered.empty:
        return go.Figure()

    # 按地區和類別聚合
    region_sales = filtered.groupby(['region', 'category'])['sales'].sum().reset_index()

    fig = px.bar(
        region_sales,
        x='region',
        y='sales',
        color='category',
        title='',
        barmode='group'
    )

    fig.update_layout(
        xaxis_title="地區",
        yaxis_title="銷售額 ($)",
        template='plotly_white'
    )

    return fig

# 回調：更新熱力圖
@app.callback(
    Output('heatmap-chart', 'figure'),
    [Input('date-range', 'start_date'),
     Input('date-range', 'end_date'),
     Input('category-filter', 'value'),
     Input('region-filter', 'value')]
)
def update_heatmap(start_date, end_date, category, region):
    """更新熱力圖"""
    filtered = filter_data(start_date, end_date, category, region)

    if filtered.empty:
        return go.Figure()

    # 創建數據透視表
    pivot_data = filtered.pivot_table(
        values='sales',
        index='category',
        columns='region',
        aggfunc='sum',
        fill_value=0
    )

    fig = go.Figure(data=go.Heatmap(
        z=pivot_data.values,
        x=pivot_data.columns,
        y=pivot_data.index,
        colorscale='RdYlGn',
        text=pivot_data.values,
        texttemplate='$%{text:,.0f}',
        textfont={"size": 10},
        colorbar=dict(title="銷售額")
    ))

    fig.update_layout(
        xaxis_title="地區",
        yaxis_title="類別",
        template='plotly_white'
    )

    return fig

if __name__ == '__main__':
    print("🚀 啟動互動式儀表板...")
    print("📊 訪問 http://localhost:8050 查看儀表板")
    app.run_server(debug=True, host='0.0.0.0', port=8050)
