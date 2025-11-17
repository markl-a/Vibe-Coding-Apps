"""
銷售分析系統 - Streamlit 儀表板
提供 RFM 分析、漏斗分析、關聯分析等功能
"""

import streamlit as st
import pandas as pd
import numpy as np
import plotly.graph_objects as go
import plotly.express as px
from datetime import datetime
import os

# 頁面配置
st.set_page_config(
    page_title="銷售分析系統",
    page_icon="📈",
    layout="wide"
)

def load_data():
    """載入銷售數據"""
    sales_file = 'data/sales_data.csv'
    customers_file = 'data/customer_transactions.csv'
    funnel_file = 'data/funnel_data.csv'

    if not os.path.exists(sales_file):
        st.warning("⚠️ 找不到數據文件，請先運行 data_generator.py 生成數據")
        st.code("python data_generator.py")
        st.stop()

    sales_df = pd.read_csv(sales_file)
    customers_df = pd.read_csv(customers_file)
    funnel_df = pd.read_csv(funnel_file)

    sales_df['order_date'] = pd.to_datetime(sales_df['order_date'])
    customers_df['transaction_date'] = pd.to_datetime(customers_df['transaction_date'])

    return sales_df, customers_df, funnel_df

def calculate_rfm(df):
    """計算 RFM 分析"""
    # 以最新日期作為參考點
    reference_date = df['transaction_date'].max()

    rfm = df.groupby('customer_id').agg({
        'transaction_date': lambda x: (reference_date - x.max()).days,  # Recency
        'transaction_id': 'count',  # Frequency
        'amount': 'sum'  # Monetary
    }).reset_index()

    rfm.columns = ['customer_id', 'recency', 'frequency', 'monetary']

    # 計算 RFM 分數 (1-5，5 最好)
    rfm['r_score'] = pd.qcut(rfm['recency'], 5, labels=[5,4,3,2,1], duplicates='drop')
    rfm['f_score'] = pd.qcut(rfm['frequency'].rank(method='first'), 5, labels=[1,2,3,4,5], duplicates='drop')
    rfm['m_score'] = pd.qcut(rfm['monetary'].rank(method='first'), 5, labels=[1,2,3,4,5], duplicates='drop')

    # 轉換為數值
    rfm['r_score'] = rfm['r_score'].astype(int)
    rfm['f_score'] = rfm['f_score'].astype(int)
    rfm['m_score'] = rfm['m_score'].astype(int)

    # 計算總分
    rfm['rfm_score'] = rfm['r_score'] + rfm['f_score'] + rfm['m_score']

    # 客戶分群
    def customer_segment(row):
        if row['rfm_score'] >= 13:
            return '💎 VIP 客戶'
        elif row['rfm_score'] >= 10:
            return '⭐ 重要客戶'
        elif row['rfm_score'] >= 7:
            return '📊 潛力客戶'
        elif row['r_score'] >= 4:
            return '🔔 新客戶'
        else:
            return '⚠️ 流失風險'

    rfm['segment'] = rfm.apply(customer_segment, axis=1)

    return rfm

def analyze_product_association(df, min_support=0.01):
    """簡化的產品關聯分析"""
    # 按訂單分組產品
    order_products = df.groupby('order_id')['product_name'].apply(list).tolist()

    # 計算產品組合頻率
    from itertools import combinations
    from collections import Counter

    # 統計雙產品組合
    pairs = []
    for products in order_products:
        if len(products) >= 2:
            pairs.extend(combinations(sorted(set(products)), 2))

    pair_counts = Counter(pairs)
    total_orders = len(order_products)

    # 計算支持度和提升度
    associations = []
    product_counts = df.groupby('product_name').size()

    for (prod_a, prod_b), count in pair_counts.most_common(20):
        support = count / total_orders
        if support >= min_support:
            # 計算置信度和提升度
            prob_a = product_counts.get(prod_a, 0) / total_orders
            prob_b = product_counts.get(prod_b, 0) / total_orders
            confidence = count / product_counts.get(prod_a, 1)
            lift = support / (prob_a * prob_b) if (prob_a * prob_b) > 0 else 0

            associations.append({
                '產品 A': prod_a,
                '產品 B': prod_b,
                '共現次數': count,
                '支持度': support,
                '置信度': confidence,
                '提升度': lift
            })

    return pd.DataFrame(associations)

def main():
    st.title("📈 銷售分析系統")
    st.markdown("深入分析銷售數據，洞察客戶行為和產品表現")

    # 載入數據
    sales_df, customers_df, funnel_df = load_data()

    # 側邊欄選單
    st.sidebar.header("📊 分析模組")
    analysis_type = st.sidebar.radio(
        "選擇分析類型",
        ["📊 總覽", "👥 RFM 客戶分析", "🔍 漏斗分析", "🔗 關聯分析", "📦 產品分析"]
    )

    if analysis_type == "📊 總覽":
        st.header("業績總覽")

        # KPI 卡片
        col1, col2, col3, col4 = st.columns(4)

        with col1:
            total_revenue = sales_df['amount'].sum()
            st.metric("總銷售額", f"${total_revenue:,.2f}")

        with col2:
            total_orders = sales_df['order_id'].nunique()
            st.metric("總訂單數", f"{total_orders:,}")

        with col3:
            avg_order_value = total_revenue / total_orders
            st.metric("平均客單價", f"${avg_order_value:,.2f}")

        with col4:
            total_customers = customers_df['customer_id'].nunique()
            st.metric("總客戶數", f"{total_customers:,}")

        # 銷售趨勢
        st.subheader("📈 銷售趨勢")
        daily_sales = sales_df.groupby(sales_df['order_date'].dt.date).agg({
            'amount': 'sum',
            'order_id': 'nunique'
        }).reset_index()

        fig = go.Figure()
        fig.add_trace(go.Scatter(
            x=daily_sales['order_date'],
            y=daily_sales['amount'],
            mode='lines+markers',
            name='每日銷售額',
            line=dict(color='#2196F3', width=2)
        ))

        fig.update_layout(
            title="每日銷售額趨勢",
            xaxis_title="日期",
            yaxis_title="銷售額 ($)",
            hovermode='x unified',
            height=400
        )

        st.plotly_chart(fig, use_container_width=True)

        # 產品類別分佈
        col1, col2 = st.columns(2)

        with col1:
            category_sales = sales_df.groupby('category')['amount'].sum().sort_values(ascending=False)
            fig = px.pie(
                values=category_sales.values,
                names=category_sales.index,
                title="產品類別銷售佔比"
            )
            st.plotly_chart(fig, use_container_width=True)

        with col2:
            region_sales = sales_df.groupby('region')['amount'].sum().sort_values(ascending=False)
            fig = px.bar(
                x=region_sales.index,
                y=region_sales.values,
                title="區域銷售排名",
                labels={'x': '區域', 'y': '銷售額 ($)'}
            )
            st.plotly_chart(fig, use_container_width=True)

    elif analysis_type == "👥 RFM 客戶分析":
        st.header("RFM 客戶分析")
        st.markdown("根據客戶的最近購買時間(Recency)、購買頻率(Frequency)和購買金額(Monetary)進行分群")

        # 計算 RFM
        rfm = calculate_rfm(customers_df)

        # 客戶分群統計
        st.subheader("客戶分群分佈")
        segment_stats = rfm.groupby('segment').agg({
            'customer_id': 'count',
            'monetary': 'sum'
        }).reset_index()
        segment_stats.columns = ['客戶群', '客戶數', '總消費金額']

        col1, col2 = st.columns(2)

        with col1:
            fig = px.pie(
                segment_stats,
                values='客戶數',
                names='客戶群',
                title="客戶群分佈"
            )
            st.plotly_chart(fig, use_container_width=True)

        with col2:
            fig = px.bar(
                segment_stats,
                x='客戶群',
                y='總消費金額',
                title="各客戶群總消費金額",
                color='客戶群'
            )
            st.plotly_chart(fig, use_container_width=True)

        # RFM 3D 散點圖
        st.subheader("RFM 三維分佈")
        fig = px.scatter_3d(
            rfm,
            x='recency',
            y='frequency',
            z='monetary',
            color='segment',
            title='RFM 三維散點圖',
            labels={
                'recency': '最近購買天數',
                'frequency': '購買頻率',
                'monetary': '購買金額'
            },
            height=600
        )
        st.plotly_chart(fig, use_container_width=True)

        # Top 客戶
        st.subheader("Top 20 高價值客戶")
        top_customers = rfm.nlargest(20, 'monetary')[
            ['customer_id', 'recency', 'frequency', 'monetary', 'segment']
        ]
        top_customers.columns = ['客戶ID', '最近購買(天)', '購買次數', '總消費($)', '客戶群']
        st.dataframe(top_customers, use_container_width=True)

    elif analysis_type == "🔍 漏斗分析":
        st.header("銷售漏斗分析")
        st.markdown("分析從曝光到成交的轉化過程")

        # 計算漏斗數據
        funnel_summary = funnel_df.groupby('stage').agg({
            'user_id': 'count'
        }).reset_index()
        funnel_summary.columns = ['階段', '用戶數']

        # 定義漏斗順序
        stage_order = ['曝光', '點擊', '加入購物車', '結帳', '完成購買']
        funnel_summary['階段'] = pd.Categorical(
            funnel_summary['階段'],
            categories=stage_order,
            ordered=True
        )
        funnel_summary = funnel_summary.sort_values('階段')

        # 計算轉化率
        funnel_summary['轉化率'] = (
            funnel_summary['用戶數'] / funnel_summary['用戶數'].iloc[0] * 100
        )

        # 漏斗圖
        fig = go.Figure(go.Funnel(
            y=funnel_summary['階段'],
            x=funnel_summary['用戶數'],
            textposition="inside",
            textinfo="value+percent initial",
            marker=dict(
                color=['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8']
            )
        ))

        fig.update_layout(
            title="銷售漏斗",
            height=500
        )

        st.plotly_chart(fig, use_container_width=True)

        # 轉化率表格
        st.subheader("各階段轉化率")
        funnel_summary['流失用戶'] = funnel_summary['用戶數'].diff(-1).fillna(0).astype(int)
        funnel_summary['流失率(%)'] = (
            funnel_summary['流失用戶'] / funnel_summary['用戶數'] * 100
        ).round(2)

        display_df = funnel_summary[['階段', '用戶數', '轉化率', '流失用戶', '流失率(%)']]
        display_df['轉化率'] = display_df['轉化率'].round(2).astype(str) + '%'

        st.dataframe(display_df, use_container_width=True)

        # 優化建議
        st.subheader("💡 優化建議")
        max_loss_idx = funnel_summary['流失率(%)'].idxmax()
        if pd.notna(max_loss_idx):
            worst_stage = funnel_summary.loc[max_loss_idx, '階段']
            loss_rate = funnel_summary.loc[max_loss_idx, '流失率(%)']
            st.warning(f"⚠️ 關鍵流失點：**{worst_stage}** 階段流失率達 **{loss_rate:.2f}%**，建議重點優化此環節")

    elif analysis_type == "🔗 關聯分析":
        st.header("產品關聯分析")
        st.markdown("發現經常一起購買的產品組合")

        # 計算關聯規則
        associations = analyze_product_association(sales_df, min_support=0.01)

        if len(associations) > 0:
            # 顯示關聯規則
            st.subheader("產品關聯規則 (Top 20)")

            # 格式化顯示
            display_df = associations.copy()
            display_df['支持度'] = (display_df['支持度'] * 100).round(2).astype(str) + '%'
            display_df['置信度'] = (display_df['置信度'] * 100).round(2).astype(str) + '%'
            display_df['提升度'] = display_df['提升度'].round(2)

            st.dataframe(display_df, use_container_width=True)

            # 提升度可視化
            st.subheader("關聯強度可視化")
            top_10 = associations.nlargest(10, 'lift')
            top_10['產品對'] = top_10['產品 A'] + ' + ' + top_10['產品 B']

            fig = px.bar(
                top_10,
                x='產品對',
                y='提升度',
                title='Top 10 產品關聯提升度',
                color='提升度',
                color_continuous_scale='Viridis'
            )
            fig.update_layout(xaxis_tickangle=-45)
            st.plotly_chart(fig, use_container_width=True)

            # 推薦建議
            st.subheader("💡 營銷建議")
            best_pair = associations.nlargest(1, 'lift').iloc[0]
            st.success(
                f"🎯 推薦組合：購買 **{best_pair['產品 A']}** 的客戶有 **{best_pair['置信度']:.1%}** "
                f"的機率會購買 **{best_pair['產品 B']}**，可以考慮進行組合促銷"
            )
        else:
            st.info("暫無足夠的關聯數據，請增加數據量或降低支持度閾值")

    elif analysis_type == "📦 產品分析":
        st.header("產品績效分析")

        # 產品銷售排名
        product_sales = sales_df.groupby('product_name').agg({
            'amount': 'sum',
            'order_id': 'count',
            'quantity': 'sum'
        }).reset_index()
        product_sales.columns = ['產品', '銷售額', '訂單數', '銷售量']
        product_sales = product_sales.sort_values('銷售額', ascending=False)

        # Top 產品
        st.subheader("Top 10 熱銷產品")
        top_10_products = product_sales.head(10)

        fig = px.bar(
            top_10_products,
            x='產品',
            y='銷售額',
            title='Top 10 產品銷售額',
            color='銷售額',
            color_continuous_scale='Blues'
        )
        fig.update_layout(xaxis_tickangle=-45)
        st.plotly_chart(fig, use_container_width=True)

        # 產品表格
        st.subheader("產品銷售明細")
        product_sales['平均訂單金額'] = product_sales['銷售額'] / product_sales['訂單數']
        product_sales['銷售額'] = product_sales['銷售額'].apply(lambda x: f"${x:,.2f}")
        product_sales['平均訂單金額'] = product_sales['平均訂單金額'].apply(lambda x: f"${x:,.2f}")

        st.dataframe(product_sales, use_container_width=True)

    # 底部資訊
    st.markdown("---")
    st.caption(f"📅 數據更新時間: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

if __name__ == '__main__':
    main()
