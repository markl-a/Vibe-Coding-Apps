"""
AI 洞察引擎 - Streamlit Web 应用
提供交互式数据分析和智能洞察发现
"""

import streamlit as st
import pandas as pd
import numpy as np
import plotly.graph_objects as go
import plotly.express as px
from plotly.subplots import make_subplots
import os
from insights_engine import InsightsEngine

# 页面配置
st.set_page_config(
    page_title="AI 洞察引擎",
    page_icon="🧠",
    layout="wide",
    initial_sidebar_state="expanded"
)

# 自定义CSS
st.markdown("""
<style>
    .insight-card {
        padding: 20px;
        border-radius: 10px;
        margin: 10px 0;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .insight-critical { background: linear-gradient(135deg, #ff6b6b 0%, #ff8787 100%); color: white; }
    .insight-high { background: linear-gradient(135deg, #ffd93d 0%, #ffed4e 100%); }
    .insight-medium { background: linear-gradient(135deg, #6bcf7f 0%, #7ee68d 100%); color: white; }
    .insight-low { background: linear-gradient(135deg, #a8dadc 0%, #b8e6e8 100%); }

    .metric-card {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        padding: 20px;
        border-radius: 10px;
        color: white;
        text-align: center;
    }
    .metric-value {
        font-size: 2.5em;
        font-weight: bold;
        margin: 10px 0;
    }
</style>
""", unsafe_allow_html=True)

# 初始化洞察引擎
@st.cache_resource
def get_engine():
    return InsightsEngine()

engine = get_engine()

def load_data():
    """加载数据"""
    data_file = 'data/business_data.csv'

    if not os.path.exists(data_file):
        st.warning("⚠️ 找不到数据文件，请先运行 data_generator.py 生成数据")
        st.code("python data_generator.py", language="bash")
        st.stop()

    df = pd.read_csv(data_file)

    # 转换日期列
    if 'date' in df.columns:
        df['date'] = pd.to_datetime(df['date'])

    return df

def display_metric_card(title, value, subtitle=""):
    """显示指标卡片"""
    st.markdown(f"""
    <div class="metric-card">
        <div style="font-size: 0.9em; opacity: 0.9;">{title}</div>
        <div class="metric-value">{value}</div>
        <div style="font-size: 0.8em; opacity: 0.8;">{subtitle}</div>
    </div>
    """, unsafe_allow_html=True)

def display_insight_card(insight):
    """显示洞察卡片"""
    importance_class = {
        5: 'critical',
        4: 'high',
        3: 'medium',
        2: 'low',
        1: 'low'
    }

    importance_emoji = {
        5: '🚨',
        4: '⚠️',
        3: '📊',
        2: 'ℹ️',
        1: 'ℹ️'
    }

    class_name = importance_class.get(insight['importance'], 'low')
    emoji = importance_emoji.get(insight['importance'], 'ℹ️')

    st.markdown(f"""
    <div class="insight-card insight-{class_name}">
        <h3>{emoji} {insight['title']}</h3>
        <p><strong>描述:</strong> {insight['description']}</p>
        <p><strong>建议:</strong> {insight['recommendation']}</p>
        <p style="opacity: 0.8; font-size: 0.9em;">重要性: {'⭐' * insight['importance']}</p>
    </div>
    """, unsafe_allow_html=True)

def plot_anomalies(data, column, anomalies):
    """绘制异常检测图"""
    fig = go.Figure()

    # 正常数据
    fig.add_trace(go.Scatter(
        x=data.index,
        y=data[column],
        mode='lines',
        name='正常数据',
        line=dict(color='steelblue', width=2)
    ))

    # 异常点
    if anomalies:
        anomaly_indices = [a['index'] for a in anomalies]
        anomaly_values = [a['value'] for a in anomalies]

        fig.add_trace(go.Scatter(
            x=anomaly_indices,
            y=anomaly_values,
            mode='markers',
            name='异常点',
            marker=dict(
                color='red',
                size=10,
                symbol='x',
                line=dict(width=2, color='darkred')
            )
        ))

    fig.update_layout(
        title=f'{column} - 异常检测',
        xaxis_title='数据点',
        yaxis_title=column,
        hovermode='x unified',
        height=400
    )

    return fig

def plot_trend(data, column, trend_info):
    """绘制趋势图"""
    fig = go.Figure()

    # 原始数据
    fig.add_trace(go.Scatter(
        x=data.index if 'date' not in data.columns else data['date'],
        y=data[column],
        mode='lines',
        name='实际值',
        line=dict(color='steelblue', width=2)
    ))

    # 趋势线
    if trend_info:
        x = np.arange(len(data))
        trend_line = trend_info['slope'] * x + trend_info['intercept']

        fig.add_trace(go.Scatter(
            x=data.index if 'date' not in data.columns else data['date'],
            y=trend_line,
            mode='lines',
            name='趋势线',
            line=dict(color='red', width=2, dash='dash')
        ))

    fig.update_layout(
        title=f'{column} - 趋势分析',
        xaxis_title='时间',
        yaxis_title=column,
        hovermode='x unified',
        height=400
    )

    return fig

def plot_correlation_heatmap(data):
    """绘制相关性热力图"""
    numeric_cols = data.select_dtypes(include=[np.number]).columns.tolist()

    if len(numeric_cols) < 2:
        return None

    corr_matrix = data[numeric_cols].corr()

    fig = go.Figure(data=go.Heatmap(
        z=corr_matrix.values,
        x=corr_matrix.columns,
        y=corr_matrix.columns,
        colorscale='RdBu',
        zmid=0,
        text=corr_matrix.values,
        texttemplate='%{text:.2f}',
        textfont={"size": 10},
        colorbar=dict(title='相关系数')
    ))

    fig.update_layout(
        title='变量相关性热力图',
        height=500,
        width=700
    )

    return fig

def plot_clusters(data, labels, features):
    """绘制聚类散点图（2D或3D）"""
    if len(features) < 2:
        return None

    # 使用前两个特征
    feat1, feat2 = features[0], features[1]

    fig = px.scatter(
        data,
        x=feat1,
        y=feat2,
        color=labels.astype(str),
        title='聚类分析',
        labels={'color': '簇'},
        color_discrete_sequence=px.colors.qualitative.Set2
    )

    fig.update_traces(marker=dict(size=8, opacity=0.7))
    fig.update_layout(height=500)

    return fig

# ==================== 主应用 ====================

def main():
    st.title("🧠 AI 洞察引擎")
    st.markdown("**智能数据分析 | 自动洞察发现 | AI驱动**")
    st.markdown("---")

    # 加载数据
    data = load_data()

    # 侧边栏
    st.sidebar.title("⚙️ 配置")

    analysis_type = st.sidebar.radio(
        "选择分析类型",
        ["📊 综合洞察", "🔍 异常检测", "📈 趋势分析", "🔗 相关性分析", "🎯 模式发现"]
    )

    st.sidebar.markdown("---")
    st.sidebar.markdown("### 📝 数据概览")
    st.sidebar.info(f"**数据行数:** {len(data):,}\n\n**列数:** {len(data.columns)}")

    # 主内容区
    if analysis_type == "📊 综合洞察":
        show_comprehensive_insights(data)
    elif analysis_type == "🔍 异常检测":
        show_anomaly_detection(data)
    elif analysis_type == "📈 趋势分析":
        show_trend_analysis(data)
    elif analysis_type == "🔗 相关性分析":
        show_correlation_analysis(data)
    elif analysis_type == "🎯 模式发现":
        show_pattern_discovery(data)

def show_comprehensive_insights(data):
    """显示综合洞察"""
    st.header("📊 综合智能洞察")

    col1, col2, col3 = st.columns(3)

    with col1:
        min_importance = st.slider("最小重要性", 1, 5, 3)

    with col2:
        max_insights = st.slider("最大洞察数", 5, 50, 20)

    with col3:
        if st.button("🚀 生成洞察", type="primary"):
            st.session_state.regenerate = True

    if st.button("🔄 重新生成") or st.session_state.get('regenerate', True):
        with st.spinner("🤖 AI 正在分析数据..."):
            insights = engine.generate_insights(
                data,
                min_importance=min_importance,
                max_insights=max_insights
            )

            st.session_state.insights = insights
            st.session_state.regenerate = False

    # 显示洞察
    if 'insights' in st.session_state:
        insights = st.session_state.insights

        if not insights:
            st.info("未发现显著洞察，尝试降低重要性阈值")
            return

        # 统计信息
        st.markdown("### 📈 洞察统计")
        cols = st.columns(4)

        insight_types = {}
        for insight in insights:
            t = insight['type']
            insight_types[t] = insight_types.get(t, 0) + 1

        type_emoji = {
            'anomaly': '🔍',
            'trend': '📈',
            'correlation': '🔗',
            'pattern': '🎯'
        }

        for idx, (itype, count) in enumerate(insight_types.items()):
            with cols[idx % 4]:
                display_metric_card(
                    f"{type_emoji.get(itype, '📊')} {itype.title()}",
                    count,
                    f"{count/len(insights)*100:.0f}%"
                )

        st.markdown("---")

        # 显示洞察卡片
        st.markdown("### 🎯 发现的洞察")

        # 按类型分组
        for insight_type in ['anomaly', 'trend', 'correlation', 'pattern']:
            type_insights = [i for i in insights if i['type'] == insight_type]
            if type_insights:
                st.markdown(f"#### {type_emoji.get(insight_type, '📊')} {insight_type.title()} 洞察")
                for insight in type_insights:
                    display_insight_card(insight)

def show_anomaly_detection(data):
    """显示异常检测"""
    st.header("🔍 异常检测")

    # 选择列和方法
    col1, col2 = st.columns(2)

    numeric_cols = data.select_dtypes(include=[np.number]).columns.tolist()

    with col1:
        selected_column = st.selectbox("选择要分析的列", numeric_cols)

    with col2:
        method = st.selectbox(
            "检测方法",
            ["zscore", "iqr", "isolation_forest", "lof"],
            format_func=lambda x: {
                'zscore': 'Z-Score (统计)',
                'iqr': 'IQR (四分位距)',
                'isolation_forest': 'Isolation Forest (ML)',
                'lof': 'Local Outlier Factor (ML)'
            }[x]
        )

    if st.button("🔍 检测异常", type="primary"):
        with st.spinner("检测中..."):
            anomalies = engine.detect_anomalies(data, selected_column, method=method)

            st.session_state.anomalies = anomalies
            st.session_state.anomaly_column = selected_column

    # 显示结果
    if 'anomalies' in st.session_state and st.session_state.get('anomaly_column') == selected_column:
        anomalies = st.session_state.anomalies

        # 统计信息
        col1, col2, col3 = st.columns(3)

        with col1:
            display_metric_card("检测到异常", len(anomalies), f"{len(anomalies)/len(data)*100:.2f}%")

        with col2:
            if anomalies:
                critical_count = sum(1 for a in anomalies if a.get('severity') in ['critical', 'high'])
                display_metric_card("高严重度", critical_count, f"{critical_count/len(anomalies)*100:.0f}%")

        with col3:
            display_metric_card("正常数据", len(data) - len(anomalies), f"{(1-len(anomalies)/len(data))*100:.2f}%")

        # 可视化
        st.markdown("### 📊 异常可视化")
        fig = plot_anomalies(data, selected_column, anomalies)
        st.plotly_chart(fig, use_container_width=True)

        # 异常详情
        if anomalies:
            st.markdown("### 📋 异常详情")
            anomaly_df = pd.DataFrame(anomalies)
            st.dataframe(anomaly_df, use_container_width=True)

def show_trend_analysis(data):
    """显示趋势分析"""
    st.header("📈 趋势分析")

    numeric_cols = data.select_dtypes(include=[np.number]).columns.tolist()
    selected_column = st.selectbox("选择要分析的列", numeric_cols)

    col1, col2 = st.columns(2)

    with col1:
        min_r_squared = st.slider("最小 R² 值", 0.0, 1.0, 0.5, 0.05)

    with col2:
        min_p_value = st.slider("最大 p 值", 0.0, 0.1, 0.05, 0.01)

    if st.button("📈 分析趋势", type="primary"):
        with st.spinner("分析中..."):
            trends = engine.detect_trends(
                data,
                selected_column,
                min_r_squared=min_r_squared,
                min_p_value=min_p_value
            )

            st.session_state.trends = trends
            st.session_state.trend_column = selected_column

    # 显示结果
    if 'trends' in st.session_state and st.session_state.get('trend_column') == selected_column:
        trends = st.session_state.trends

        if not trends:
            st.info("未发现显著趋势，尝试降低阈值")
            return

        trend = trends[0]

        # 趋势信息
        col1, col2, col3, col4 = st.columns(4)

        with col1:
            display_metric_card("趋势方向", f"{trend['emoji']} {trend['direction']}")

        with col2:
            display_metric_card("变化幅度", f"{trend['change_percent']:.1f}%")

        with col3:
            display_metric_card("R² 值", f"{trend['r_squared']:.3f}", trend['strength'])

        with col4:
            display_metric_card("置信度", f"{trend['confidence']*100:.1f}%")

        # 可视化
        st.markdown("### 📊 趋势可视化")
        fig = plot_trend(data, selected_column, trend)
        st.plotly_chart(fig, use_container_width=True)

        # 季节性分析
        st.markdown("### 🔄 季节性分析")
        period = st.number_input("周期长度（天）", 1, 30, 7)

        if st.button("分析季节性"):
            seasonality = engine.detect_seasonality(data, selected_column, period=period)

            if seasonality['has_seasonality']:
                st.success(f"✅ 检测到季节性模式（强度: {seasonality['strength']:.2%}）")
                st.info(seasonality['interpretation'])

                # 绘制季节性模式
                fig = go.Figure()
                fig.add_trace(go.Bar(
                    x=list(range(1, period + 1)),
                    y=seasonality['pattern'],
                    marker_color='steelblue'
                ))
                fig.update_layout(
                    title='季节性模式',
                    xaxis_title='周期位置',
                    yaxis_title='平均值',
                    height=300
                )
                st.plotly_chart(fig, use_container_width=True)
            else:
                st.warning("❌ 未检测到明显的季节性模式")

def show_correlation_analysis(data):
    """显示相关性分析"""
    st.header("🔗 相关性分析")

    col1, col2 = st.columns(2)

    with col1:
        threshold = st.slider("最小相关系数", 0.0, 1.0, 0.5, 0.05)

    with col2:
        method = st.selectbox("相关性方法", ["pearson", "spearman", "kendall"])

    if st.button("🔗 分析相关性", type="primary"):
        with st.spinner("分析中..."):
            correlations = engine.find_correlations(data, threshold=threshold, method=method)
            st.session_state.correlations = correlations

    # 显示结果
    if 'correlations' in st.session_state:
        correlations = st.session_state.correlations

        if not correlations:
            st.info("未发现显著相关性，尝试降低阈值")
            return

        # 统计
        display_metric_card("发现相关性", len(correlations))

        # 热力图
        st.markdown("### 📊 相关性热力图")
        fig = plot_correlation_heatmap(data)
        if fig:
            st.plotly_chart(fig, use_container_width=True)

        # 详细列表
        st.markdown("### 📋 相关性详情")
        for corr in correlations:
            strength_color = {
                'very_strong': '🔴',
                'strong': '🟠',
                'moderate': '🟡',
                'weak': '🟢'
            }
            st.markdown(f"""
            **{strength_color[corr['strength']]} {corr['interpretation']}**
            - 方向: {corr['direction']}
            - 强度: {corr['strength']}
            """)

def show_pattern_discovery(data):
    """显示模式发现"""
    st.header("🎯 模式发现")

    col1, col2 = st.columns(2)

    with col1:
        method = st.selectbox("聚类方法", ["kmeans", "dbscan"])

    with col2:
        if method == 'kmeans':
            n_clusters = st.slider("簇数量", 2, 10, 3)
        else:
            eps = st.slider("EPS", 0.1, 2.0, 0.5, 0.1)

    if st.button("🎯 发现模式", type="primary"):
        with st.spinner("分析中..."):
            if method == 'kmeans':
                result = engine.discover_patterns(data, method='kmeans', n_clusters=n_clusters)
            else:
                result = engine.discover_patterns(data, method='dbscan', eps=eps)

            st.session_state.patterns = result

    # 显示结果
    if 'patterns' in st.session_state:
        result = st.session_state.patterns

        if 'error' in result:
            st.error(result['error'])
            return

        patterns = result['patterns']

        # 统计
        col1, col2 = st.columns(2)
        with col1:
            display_metric_card("发现模式", len(patterns))
        with col2:
            if method == 'dbscan' and 'noise_points' in result:
                display_metric_card("噪声点", result['noise_points'])

        # 可视化
        st.markdown("### 📊 聚类可视化")
        numeric_cols = data.select_dtypes(include=[np.number]).columns.tolist()

        if len(numeric_cols) >= 2:
            labels = pd.Series(result['labels'])
            fig = plot_clusters(data, labels, numeric_cols[:2])
            if fig:
                st.plotly_chart(fig, use_container_width=True)

        # 模式详情
        st.markdown("### 📋 模式详情")
        for pattern in patterns:
            st.markdown(f"""
            **{pattern['description']}**
            - 大小: {pattern['size']} ({pattern['percentage']:.1f}%)
            """)

if __name__ == "__main__":
    main()
