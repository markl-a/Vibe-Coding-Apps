"""
预测分析平台 - Streamlit应用
"""

import streamlit as st
import pandas as pd
import plotly.graph_objects as go
import os
from predictor import TimeSeriesPredictor, ClassificationPredictor, RegressionPredictor

st.set_page_config(page_title="预测分析平台", page_icon="🔮", layout="wide")

st.title("🔮 预测分析平台")
st.markdown("**AI驱动的智能预测 | 数据驱动决策**")
st.markdown("---")

# 侧边栏
st.sidebar.title("⚙️ 配置")
analysis_type = st.sidebar.radio(
    "选择分析类型",
    ["📈 时间序列预测", "👥 客户流失预测", "💰 价值预测"]
)

# 加载数据
@st.cache_data
def load_data():
    if os.path.exists('data/time_series.csv'):
        return pd.read_csv('data/time_series.csv')
    return None

if analysis_type == "📈 时间序列预测":
    st.header("📈 时间序列预测")

    data = load_data()
    if data is None:
        st.warning("⚠️ 请先运行 data_generator.py 生成数据")
        st.stop()

    predictor = TimeSeriesPredictor()

    col1, col2 = st.columns(2)
    with col1:
        periods = st.slider("预测天数", 7, 90, 30)
    with col2:
        if st.button("🚀 开始预测", type="primary"):
            with st.spinner("预测中..."):
                result = predictor.predict_prophet(
                    data, 'date', 'value', periods=periods
                )

                st.session_state.result = result

    if 'result' in st.session_state:
        result = st.session_state.result

        # 指标
        col1, col2, col3 = st.columns(3)
        with col1:
            st.metric("模型", result.model_name)
        with col2:
            if 'mape' in result.accuracy_metrics:
                accuracy = (1 - result.accuracy_metrics['mape']) * 100
                st.metric("准确率", f"{accuracy:.1f}%")
        with col3:
            st.metric("预测期数", len(result.predictions))

        # 可视化
        st.markdown("### 📊 预测可视化")
        fig = go.Figure()

        # 历史数据
        fig.add_trace(go.Scatter(
            x=data['date'],
            y=data['value'],
            mode='lines',
            name='历史数据',
            line=dict(color='blue')
        ))

        # 预测数据
        fig.add_trace(go.Scatter(
            x=result.predictions['date'],
            y=result.predictions['prediction'],
            mode='lines',
            name='预测',
            line=dict(color='red', dash='dash')
        ))

        # 置信区间
        if 'upper_bound' in result.predictions.columns:
            fig.add_trace(go.Scatter(
                x=result.predictions['date'],
                y=result.predictions['upper_bound'],
                mode='lines',
                line=dict(width=0),
                showlegend=False
            ))
            fig.add_trace(go.Scatter(
                x=result.predictions['date'],
                y=result.predictions['lower_bound'],
                mode='lines',
                fill='tonexty',
                fillcolor='rgba(255,0,0,0.2)',
                line=dict(width=0),
                name='置信区间'
            ))

        fig.update_layout(height=400, hovermode='x unified')
        st.plotly_chart(fig, use_container_width=True)

        # 洞察
        st.markdown("### 💡 洞察")
        for insight in result.insights:
            st.info(insight)

        # 数据表
        with st.expander("📋 查看预测数据"):
            st.dataframe(result.predictions)

elif analysis_type == "👥 客户流失预测":
    st.header("👥 客户流失预测")
    st.info("此功能需要客户数据，请参考文档配置数据源")

elif analysis_type == "💰 价值预测":
    st.header("💰 价值预测")
    st.info("此功能需要配置特征和目标变量")
