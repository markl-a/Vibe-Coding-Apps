"""
財務儀表板 Streamlit Web UI
"""

import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from datetime import datetime, timedelta
from dashboard_generator import DashboardGenerator
from database.db_handler import DatabaseHandler

# 頁面配置
st.set_page_config(
    page_title="財務儀表板",
    page_icon="📊",
    layout="wide"
)

# 初始化
@st.cache_resource
def load_generator():
    return DashboardGenerator()

@st.cache_resource
def load_database():
    return DatabaseHandler()

generator = load_generator()
db = load_database()

# 標題
st.title("📊 財務儀表板")
st.markdown("---")

# 側邊欄
st.sidebar.header("儀表板設定")

# 時間範圍選擇
time_range = st.sidebar.selectbox(
    "時間範圍",
    ["本月", "上月", "本季", "本年", "自訂"]
)

if time_range == "自訂":
    start_date = st.sidebar.date_input("開始日期", value=datetime.now() - timedelta(days=90))
    end_date = st.sidebar.date_input("結束日期", value=datetime.now())
else:
    start_date, end_date = generator.get_date_range(time_range)

# 載入數據
financial_data = db.get_financial_data(start_date.isoformat(), end_date.isoformat())

# === 總覽區域 ===
st.header("📈 財務總覽")

col1, col2, col3, col4 = st.columns(4)

with col1:
    total_revenue = financial_data.get('total_revenue', 0)
    st.metric(
        "總收入",
        f"${total_revenue:,.2f}",
        delta=f"{financial_data.get('revenue_growth', 0):.1f}%"
    )

with col2:
    total_expense = financial_data.get('total_expense', 0)
    st.metric(
        "總支出",
        f"${total_expense:,.2f}",
        delta=f"{financial_data.get('expense_growth', 0):.1f}%",
        delta_color="inverse"
    )

with col3:
    net_profit = total_revenue - total_expense
    profit_margin = (net_profit / total_revenue * 100) if total_revenue > 0 else 0
    st.metric(
        "淨利潤",
        f"${net_profit:,.2f}",
        delta=f"{profit_margin:.1f}%"
    )

with col4:
    cash_flow = financial_data.get('cash_flow', 0)
    st.metric(
        "現金流",
        f"${cash_flow:,.2f}"
    )

st.markdown("---")

# === 圖表區域 ===
tab1, tab2, tab3, tab4 = st.tabs(["收入支出", "利潤分析", "現金流", "財務比率"])

with tab1:
    st.subheader("📊 收入與支出趨勢")

    # 生成趨勢數據
    trend_data = db.get_trend_data(start_date.isoformat(), end_date.isoformat())

    if trend_data:
        df_trend = pd.DataFrame(trend_data)

        fig = go.Figure()

        fig.add_trace(go.Scatter(
            x=df_trend['date'],
            y=df_trend['revenue'],
            name='收入',
            mode='lines+markers',
            line=dict(color='#2ecc71', width=3)
        ))

        fig.add_trace(go.Scatter(
            x=df_trend['date'],
            y=df_trend['expense'],
            name='支出',
            mode='lines+markers',
            line=dict(color='#e74c3c', width=3)
        ))

        fig.update_layout(
            title='收入與支出對比',
            xaxis_title='日期',
            yaxis_title='金額',
            hovermode='x unified',
            height=400
        )

        st.plotly_chart(fig, use_container_width=True)

        # 分類收入支出
        col_rev, col_exp = st.columns(2)

        with col_rev:
            st.subheader("收入來源")
            revenue_by_category = db.get_revenue_by_category(start_date.isoformat(), end_date.isoformat())
            if revenue_by_category:
                fig_rev = px.pie(
                    values=list(revenue_by_category.values()),
                    names=list(revenue_by_category.keys()),
                    title='收入來源分布'
                )
                st.plotly_chart(fig_rev, use_container_width=True)

        with col_exp:
            st.subheader("支出分類")
            expense_by_category = db.get_expense_by_category(start_date.isoformat(), end_date.isoformat())
            if expense_by_category:
                fig_exp = px.pie(
                    values=list(expense_by_category.values()),
                    names=list(expense_by_category.keys()),
                    title='支出分類分布'
                )
                st.plotly_chart(fig_exp, use_container_width=True)

with tab2:
    st.subheader("💰 利潤分析")

    col_profit1, col_profit2 = st.columns(2)

    with col_profit1:
        # 毛利潤 vs 淨利潤
        gross_profit = financial_data.get('gross_profit', 0)
        net_profit = financial_data.get('net_profit', 0)

        profit_data = pd.DataFrame({
            '類型': ['毛利潤', '淨利潤'],
            '金額': [gross_profit, net_profit]
        })

        fig_profit = px.bar(
            profit_data,
            x='類型',
            y='金額',
            title='利潤比較',
            color='類型'
        )
        st.plotly_chart(fig_profit, use_container_width=True)

    with col_profit2:
        # 利潤率
        gross_margin = (gross_profit / total_revenue * 100) if total_revenue > 0 else 0
        net_margin = (net_profit / total_revenue * 100) if total_revenue > 0 else 0

        st.metric("毛利率", f"{gross_margin:.2f}%")
        st.metric("淨利率", f"{net_margin:.2f}%")

        # 營業費用佔比
        operating_expense = financial_data.get('operating_expense', 0)
        op_expense_ratio = (operating_expense / total_revenue * 100) if total_revenue > 0 else 0
        st.metric("營業費用率", f"{op_expense_ratio:.2f}%")

with tab3:
    st.subheader("💵 現金流分析")

    # 現金流三大活動
    operating_cf = financial_data.get('operating_cash_flow', 0)
    investing_cf = financial_data.get('investing_cash_flow', 0)
    financing_cf = financial_data.get('financing_cash_flow', 0)

    cash_flow_data = pd.DataFrame({
        '活動': ['營運活動', '投資活動', '融資活動'],
        '現金流': [operating_cf, investing_cf, financing_cf]
    })

    fig_cf = px.bar(
        cash_flow_data,
        x='活動',
        y='現金流',
        title='現金流量表',
        color='現金流',
        color_continuous_scale=['red', 'yellow', 'green']
    )
    st.plotly_chart(fig_cf, use_container_width=True)

    # 現金流趨勢
    st.subheader("現金流趨勢")
    cash_flow_trend = db.get_cash_flow_trend(start_date.isoformat(), end_date.isoformat())
    if cash_flow_trend:
        df_cf = pd.DataFrame(cash_flow_trend)
        fig_cf_trend = px.line(
            df_cf,
            x='date',
            y='cash_flow',
            title='現金流量變化'
        )
        st.plotly_chart(fig_cf_trend, use_container_width=True)

with tab4:
    st.subheader("📉 財務比率")

    col_ratio1, col_ratio2, col_ratio3 = st.columns(3)

    with col_ratio1:
        st.write("**流動性比率**")
        current_ratio = financial_data.get('current_ratio', 0)
        quick_ratio = financial_data.get('quick_ratio', 0)

        st.metric("流動比率", f"{current_ratio:.2f}")
        st.metric("速動比率", f"{quick_ratio:.2f}")

    with col_ratio2:
        st.write("**獲利能力比率**")
        roe = financial_data.get('roe', 0)
        roa = financial_data.get('roa', 0)

        st.metric("股東權益報酬率 (ROE)", f"{roe:.2f}%")
        st.metric("資產報酬率 (ROA)", f"{roa:.2f}%")

    with col_ratio3:
        st.write("**槓桿比率**")
        debt_ratio = financial_data.get('debt_ratio', 0)
        debt_to_equity = financial_data.get('debt_to_equity', 0)

        st.metric("負債比率", f"{debt_ratio:.2f}%")
        st.metric("負債權益比", f"{debt_to_equity:.2f}")

st.markdown("---")

# === 數據表格 ===
st.header("📋 詳細數據")

show_details = st.checkbox("顯示詳細交易記錄")

if show_details:
    transactions = db.get_all_transactions(start_date.isoformat(), end_date.isoformat())
    if transactions:
        df_trans = pd.DataFrame(transactions)
        st.dataframe(df_trans, use_container_width=True)

        # 匯出
        csv = df_trans.to_csv(index=False, encoding='utf-8-sig')
        st.download_button(
            label="📥 下載交易記錄",
            data=csv,
            file_name=f"transactions_{start_date}_to_{end_date}.csv",
            mime="text/csv"
        )

# 頁腳
st.markdown("---")
st.markdown(
    """
    <div style='text-align: center'>
        <p>財務儀表板 v1.0 | Powered by Streamlit & Plotly</p>
    </div>
    """,
    unsafe_allow_html=True
)
