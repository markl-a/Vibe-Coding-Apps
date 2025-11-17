"""
KPI 監控系統 - Streamlit 儀表板
提供實時 KPI 監控、預警和趨勢分析
"""

import streamlit as st
import pandas as pd
import numpy as np
import plotly.graph_objects as go
import plotly.express as px
from datetime import datetime, timedelta
import os

# 頁面配置
st.set_page_config(
    page_title="KPI 監控系統",
    page_icon="📊",
    layout="wide"
)

# KPI 閾值配置
KPI_THRESHOLDS = {
    'revenue': {'warning': 90000, 'critical': 80000, 'target': 130000},
    'orders': {'warning': 450, 'critical': 400, 'target': 600},
    'active_users': {'warning': 4500, 'critical': 4000, 'target': 6000},
    'conversion_rate': {'warning': 0.08, 'critical': 0.06, 'target': 0.12},
    'avg_order_value': {'warning': 180, 'critical': 150, 'target': 250},
    'error_rate': {'warning': 0.01, 'critical': 0.02, 'target': 0.001},
    'response_time': {'warning': 400, 'critical': 600, 'target': 150}
}

def load_data():
    """載入 KPI 數據"""
    data_file = 'data/kpi_history.csv'
    if not os.path.exists(data_file):
        st.warning("⚠️ 找不到數據文件，請先運行 data_generator.py 生成數據")
        st.code("python data_generator.py")
        st.stop()

    df = pd.read_csv(data_file)
    df['date'] = pd.to_datetime(df['date'])
    return df

def check_alert(value, metric_name, inverse=False):
    """
    檢查 KPI 是否觸發警報
    inverse: True 表示數值越小越好（如錯誤率、響應時間）
    """
    thresholds = KPI_THRESHOLDS.get(metric_name, {})

    if not thresholds:
        return 'normal', '✅'

    if inverse:
        # 數值越小越好
        if value >= thresholds.get('critical', float('inf')):
            return 'critical', '🔴'
        elif value >= thresholds.get('warning', float('inf')):
            return 'warning', '⚠️'
        else:
            return 'normal', '✅'
    else:
        # 數值越大越好
        if value <= thresholds.get('critical', 0):
            return 'critical', '🔴'
        elif value <= thresholds.get('warning', 0):
            return 'warning', '⚠️'
        else:
            return 'normal', '✅'

def create_kpi_card(title, value, unit, metric_name, delta=None, inverse=False):
    """創建 KPI 卡片"""
    status, icon = check_alert(value, metric_name, inverse)

    # 設定顏色
    color_map = {
        'normal': '#28a745',
        'warning': '#ffc107',
        'critical': '#dc3545'
    }
    color = color_map[status]

    # 計算達成率
    target = KPI_THRESHOLDS.get(metric_name, {}).get('target')
    achievement = ""
    if target:
        if inverse:
            achievement_rate = (1 - value / target) * 100 if target > 0 else 0
        else:
            achievement_rate = (value / target) * 100 if target > 0 else 0
        achievement = f"目標達成率: {achievement_rate:.1f}%"

    # 創建卡片
    st.markdown(f"""
    <div style="
        background: linear-gradient(135deg, {color}22 0%, {color}11 100%);
        border-left: 4px solid {color};
        padding: 20px;
        border-radius: 8px;
        margin: 10px 0;
    ">
        <div style="font-size: 14px; color: #666; margin-bottom: 5px;">
            {icon} {title}
        </div>
        <div style="font-size: 32px; font-weight: bold; color: {color}; margin: 10px 0;">
            {value:,.2f} {unit}
        </div>
        <div style="font-size: 12px; color: #888;">
            {achievement}
        </div>
    </div>
    """, unsafe_allow_html=True)

def create_trend_chart(df, metric, title):
    """創建趨勢圖"""
    fig = go.Figure()

    # 實際值
    fig.add_trace(go.Scatter(
        x=df['date'],
        y=df[metric],
        mode='lines+markers',
        name='實際值',
        line=dict(color='#2196F3', width=2),
        marker=dict(size=4)
    ))

    # 添加閾值線
    thresholds = KPI_THRESHOLDS.get(metric, {})
    if 'target' in thresholds:
        fig.add_hline(y=thresholds['target'], line_dash="dash",
                     line_color="green", annotation_text="目標值")
    if 'warning' in thresholds:
        fig.add_hline(y=thresholds['warning'], line_dash="dot",
                     line_color="orange", annotation_text="警告線")
    if 'critical' in thresholds:
        fig.add_hline(y=thresholds['critical'], line_dash="dot",
                     line_color="red", annotation_text="臨界線")

    # 添加移動平均線
    df['ma7'] = df[metric].rolling(window=7).mean()
    fig.add_trace(go.Scatter(
        x=df['date'],
        y=df['ma7'],
        mode='lines',
        name='7日移動平均',
        line=dict(color='rgba(255,165,0,0.5)', width=2, dash='dash')
    ))

    fig.update_layout(
        title=title,
        xaxis_title="日期",
        yaxis_title="數值",
        hovermode='x unified',
        height=400
    )

    return fig

def calculate_trend(df, metric, days=7):
    """計算趨勢"""
    recent = df.tail(days)[metric].mean()
    previous = df.tail(days*2).head(days)[metric].mean()

    if previous == 0:
        return 0

    return ((recent - previous) / previous) * 100

def main():
    st.title("📊 KPI 監控系統")
    st.markdown("實時監控關鍵業務指標，及時發現異常並採取行動")

    # 載入數據
    df = load_data()

    # 側邊欄篩選
    st.sidebar.header("📅 篩選設定")

    # 日期範圍
    date_range = st.sidebar.slider(
        "選擇天數",
        min_value=7,
        max_value=len(df),
        value=30
    )

    df_filtered = df.tail(date_range)

    # 最新數據
    latest = df_filtered.iloc[-1]

    # 總覽區域
    st.header("📈 今日 KPI 總覽")

    col1, col2, col3, col4 = st.columns(4)

    with col1:
        create_kpi_card(
            "每日收入",
            latest['revenue'],
            "$",
            'revenue',
            delta=calculate_trend(df_filtered, 'revenue')
        )

    with col2:
        create_kpi_card(
            "訂單數",
            latest['orders'],
            "筆",
            'orders',
            delta=calculate_trend(df_filtered, 'orders')
        )

    with col3:
        create_kpi_card(
            "活躍用戶",
            latest['active_users'],
            "人",
            'active_users',
            delta=calculate_trend(df_filtered, 'active_users')
        )

    with col4:
        create_kpi_card(
            "轉化率",
            latest['conversion_rate'] * 100,
            "%",
            'conversion_rate',
            delta=calculate_trend(df_filtered, 'conversion_rate')
        )

    # 技術指標
    st.header("🔧 技術指標")

    col1, col2, col3 = st.columns(3)

    with col1:
        create_kpi_card(
            "錯誤率",
            latest['error_rate'] * 100,
            "%",
            'error_rate',
            inverse=True
        )

    with col2:
        create_kpi_card(
            "響應時間",
            latest['response_time'],
            "ms",
            'response_time',
            inverse=True
        )

    with col3:
        create_kpi_card(
            "客單價",
            latest['avg_order_value'],
            "$",
            'avg_order_value'
        )

    # 預警列表
    st.header("⚠️ 預警清單")

    alerts = []

    # 檢查每個指標
    for metric, display_name, inverse in [
        ('revenue', '每日收入', False),
        ('orders', '訂單數', False),
        ('active_users', '活躍用戶', False),
        ('conversion_rate', '轉化率', False),
        ('error_rate', '錯誤率', True),
        ('response_time', '響應時間', True)
    ]:
        status, icon = check_alert(latest[metric], metric, inverse)
        if status != 'normal':
            alerts.append({
                '指標': display_name,
                '當前值': f"{latest[metric]:.2f}",
                '狀態': f"{icon} {status.upper()}",
                '閾值': f"警告: {KPI_THRESHOLDS[metric]['warning']}, 臨界: {KPI_THRESHOLDS[metric]['critical']}"
            })

    if alerts:
        alert_df = pd.DataFrame(alerts)
        st.dataframe(alert_df, use_container_width=True)
    else:
        st.success("✅ 所有指標正常運行")

    # 趨勢分析
    st.header("📊 趨勢分析")

    tab1, tab2, tab3, tab4 = st.tabs(["收入與訂單", "用戶與轉化", "技術指標", "對比分析"])

    with tab1:
        col1, col2 = st.columns(2)
        with col1:
            st.plotly_chart(
                create_trend_chart(df_filtered, 'revenue', '每日收入趨勢'),
                use_container_width=True
            )
        with col2:
            st.plotly_chart(
                create_trend_chart(df_filtered, 'orders', '訂單數趨勢'),
                use_container_width=True
            )

    with tab2:
        col1, col2 = st.columns(2)
        with col1:
            st.plotly_chart(
                create_trend_chart(df_filtered, 'active_users', '活躍用戶趨勢'),
                use_container_width=True
            )
        with col2:
            st.plotly_chart(
                create_trend_chart(df_filtered, 'conversion_rate', '轉化率趨勢'),
                use_container_width=True
            )

    with tab3:
        col1, col2 = st.columns(2)
        with col1:
            st.plotly_chart(
                create_trend_chart(df_filtered, 'error_rate', '錯誤率趨勢'),
                use_container_width=True
            )
        with col2:
            st.plotly_chart(
                create_trend_chart(df_filtered, 'response_time', '響應時間趨勢'),
                use_container_width=True
            )

    with tab4:
        # 多指標對比
        st.subheader("多指標標準化對比")

        metrics_to_compare = st.multiselect(
            "選擇要對比的指標",
            ['revenue', 'orders', 'active_users', 'conversion_rate'],
            default=['revenue', 'orders']
        )

        if metrics_to_compare:
            # 標準化數據
            fig = go.Figure()
            for metric in metrics_to_compare:
                normalized = (df_filtered[metric] - df_filtered[metric].min()) / (df_filtered[metric].max() - df_filtered[metric].min())
                fig.add_trace(go.Scatter(
                    x=df_filtered['date'],
                    y=normalized,
                    mode='lines',
                    name=metric
                ))

            fig.update_layout(
                title="標準化指標對比（0-1區間）",
                xaxis_title="日期",
                yaxis_title="標準化數值",
                height=400
            )

            st.plotly_chart(fig, use_container_width=True)

    # 統計摘要
    st.header("📋 統計摘要")

    summary_data = {
        '指標': ['收入', '訂單數', '活躍用戶', '轉化率', '客單價', '錯誤率', '響應時間'],
        '當前值': [
            f"${latest['revenue']:,.2f}",
            f"{latest['orders']:,.0f}",
            f"{latest['active_users']:,.0f}",
            f"{latest['conversion_rate']:.2%}",
            f"${latest['avg_order_value']:,.2f}",
            f"{latest['error_rate']:.2%}",
            f"{latest['response_time']:.2f}ms"
        ],
        '7日平均': [
            f"${df_filtered.tail(7)['revenue'].mean():,.2f}",
            f"{df_filtered.tail(7)['orders'].mean():,.0f}",
            f"{df_filtered.tail(7)['active_users'].mean():,.0f}",
            f"{df_filtered.tail(7)['conversion_rate'].mean():.2%}",
            f"${df_filtered.tail(7)['avg_order_value'].mean():,.2f}",
            f"{df_filtered.tail(7)['error_rate'].mean():.2%}",
            f"{df_filtered.tail(7)['response_time'].mean():.2f}ms"
        ],
        '30日平均': [
            f"${df_filtered.tail(30)['revenue'].mean():,.2f}",
            f"{df_filtered.tail(30)['orders'].mean():,.0f}",
            f"{df_filtered.tail(30)['active_users'].mean():,.0f}",
            f"{df_filtered.tail(30)['conversion_rate'].mean():.2%}",
            f"${df_filtered.tail(30)['avg_order_value'].mean():,.2f}",
            f"{df_filtered.tail(30)['error_rate'].mean():.2%}",
            f"{df_filtered.tail(30)['response_time'].mean():.2f}ms"
        ]
    }

    st.dataframe(pd.DataFrame(summary_data), use_container_width=True)

    # 底部資訊
    st.markdown("---")
    st.caption(f"📅 數據更新時間: {latest['date'].strftime('%Y-%m-%d')} | 📊 數據範圍: {date_range} 天")

if __name__ == '__main__':
    main()
