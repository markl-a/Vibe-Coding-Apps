"""
客戶流失預測 Web 應用
使用 Streamlit 構建互動式介面
"""

import streamlit as st
import pandas as pd
import numpy as np
import plotly.express as px
import plotly.graph_objects as go
from churn_predictor import ChurnPredictor
import os

# 頁面配置
st.set_page_config(
    page_title="客戶流失預測系統",
    page_icon="🎯",
    layout="wide"
)

# 標題
st.title("🎯 客戶流失預測系統")
st.markdown("---")


@st.cache_resource
def load_predictor():
    """載入預測模型"""
    model_path = 'models/best_model.pkl'
    if not os.path.exists(model_path):
        return None
    predictor = ChurnPredictor()
    predictor.load_model(model_path)
    return predictor


def show_sidebar():
    """顯示側邊欄"""
    st.sidebar.title("⚙️ 設定")
    mode = st.sidebar.radio(
        "選擇功能",
        ["單一客戶預測", "批次預測", "資料分析"]
    )
    return mode


def single_prediction(predictor):
    """單一客戶預測介面"""
    st.header("👤 單一客戶流失預測")

    col1, col2 = st.columns(2)

    with col1:
        st.subheader("基本資訊")
        tenure = st.slider("使用服務月數", 1, 72, 12)
        monthly_charges = st.number_input("月費用 ($)", 18.0, 120.0, 65.0, 1.0)
        total_charges = st.number_input("總費用 ($)", 0.0, 10000.0,
                                        float(tenure * monthly_charges), 10.0)

        senior_citizen = st.selectbox("是否為老年人", [0, 1], format_func=lambda x: "是" if x else "否")
        partner = st.selectbox("是否有伴侶", ["Yes", "No"])
        dependents = st.selectbox("是否有家屬", ["Yes", "No"])

    with col2:
        st.subheader("服務資訊")
        phone_service = st.selectbox("電話服務", ["Yes", "No"])
        internet_service = st.selectbox("網路服務", ["DSL", "Fiber optic", "No"])

        if internet_service != "No":
            online_security = st.selectbox("線上安全", ["Yes", "No"])
            online_backup = st.selectbox("線上備份", ["Yes", "No"])
            device_protection = st.selectbox("設備保護", ["Yes", "No"])
            tech_support = st.selectbox("技術支援", ["Yes", "No"])
            streaming_tv = st.selectbox("串流電視", ["Yes", "No"])
            streaming_movies = st.selectbox("串流電影", ["Yes", "No"])
        else:
            online_security = "No internet service"
            online_backup = "No internet service"
            device_protection = "No internet service"
            tech_support = "No internet service"
            streaming_tv = "No internet service"
            streaming_movies = "No internet service"

    col3, col4 = st.columns(2)

    with col3:
        st.subheader("合約資訊")
        contract_type = st.selectbox("合約類型",
                                     ["Month-to-month", "One year", "Two year"])
        paperless_billing = st.selectbox("無紙化帳單", ["Yes", "No"])

    with col4:
        st.subheader("付款資訊")
        payment_method = st.selectbox("付款方式", [
            "Electronic check",
            "Mailed check",
            "Bank transfer (automatic)",
            "Credit card (automatic)"
        ])

    # 預測按鈕
    if st.button("🔮 預測流失機率", type="primary"):
        customer_data = {
            'tenure': tenure,
            'monthly_charges': monthly_charges,
            'total_charges': total_charges,
            'senior_citizen': senior_citizen,
            'partner': partner,
            'dependents': dependents,
            'phone_service': phone_service,
            'internet_service': internet_service,
            'online_security': online_security,
            'online_backup': online_backup,
            'device_protection': device_protection,
            'tech_support': tech_support,
            'streaming_tv': streaming_tv,
            'streaming_movies': streaming_movies,
            'contract_type': contract_type,
            'paperless_billing': paperless_billing,
            'payment_method': payment_method
        }

        # 執行預測
        churn_prob = predictor.predict_single(customer_data)

        # 顯示結果
        st.markdown("---")
        st.subheader("📊 預測結果")

        # 風險儀表板
        col1, col2, col3 = st.columns(3)

        with col1:
            st.metric("流失機率", f"{churn_prob:.2%}")

        with col2:
            if churn_prob > 0.7:
                risk_level = "🔴 高風險"
                risk_color = "red"
            elif churn_prob > 0.3:
                risk_level = "🟡 中風險"
                risk_color = "orange"
            else:
                risk_level = "🟢 低風險"
                risk_color = "green"
            st.metric("風險等級", risk_level)

        with col3:
            retention_prob = 1 - churn_prob
            st.metric("留存機率", f"{retention_prob:.2%}")

        # 機率視覺化
        fig = go.Figure(go.Indicator(
            mode="gauge+number",
            value=churn_prob * 100,
            title={'text': "流失風險指數"},
            domain={'x': [0, 1], 'y': [0, 1]},
            gauge={
                'axis': {'range': [None, 100]},
                'bar': {'color': risk_color},
                'steps': [
                    {'range': [0, 30], 'color': "lightgreen"},
                    {'range': [30, 70], 'color': "lightyellow"},
                    {'range': [70, 100], 'color': "lightcoral"}
                ],
                'threshold': {
                    'line': {'color': "red", 'width': 4},
                    'thickness': 0.75,
                    'value': 70
                }
            }
        ))
        st.plotly_chart(fig, use_container_width=True)

        # 挽留建議
        st.subheader("💡 挽留建議")
        recommendations = predictor.get_retention_recommendations(customer_data, churn_prob)
        for i, rec in enumerate(recommendations, 1):
            st.info(f"{i}. {rec}")


def batch_prediction(predictor):
    """批次預測介面"""
    st.header("📦 批次客戶流失預測")

    uploaded_file = st.file_uploader("上傳客戶資料 CSV 檔案", type=['csv'])

    if uploaded_file is not None:
        # 讀取檔案
        df = pd.read_csv(uploaded_file)

        st.subheader("📄 資料預覽")
        st.dataframe(df.head(10))
        st.write(f"總筆數: {len(df)}")

        if st.button("🔮 執行批次預測", type="primary"):
            with st.spinner("預測中..."):
                # 執行預測
                result_df = predictor.predict_batch(df)

                # 統計資訊
                st.subheader("📊 預測統計")

                col1, col2, col3 = st.columns(3)

                churn_count = (result_df['churn_prediction'] == 'Yes').sum()
                churn_rate = churn_count / len(result_df) * 100

                with col1:
                    st.metric("總客戶數", len(result_df))

                with col2:
                    st.metric("預測流失", f"{churn_count} ({churn_rate:.1f}%)")

                with col3:
                    st.metric("預測留存", f"{len(result_df) - churn_count} ({100-churn_rate:.1f}%)")

                # 風險分層
                st.subheader("🎯 風險分層")

                high_risk = (result_df['churn_probability'] > 0.7).sum()
                medium_risk = ((result_df['churn_probability'] > 0.3) &
                               (result_df['churn_probability'] <= 0.7)).sum()
                low_risk = (result_df['churn_probability'] <= 0.3).sum()

                risk_data = pd.DataFrame({
                    '風險等級': ['🔴 高風險', '🟡 中風險', '🟢 低風險'],
                    '客戶數': [high_risk, medium_risk, low_risk],
                    '百分比': [
                        f"{high_risk/len(result_df)*100:.1f}%",
                        f"{medium_risk/len(result_df)*100:.1f}%",
                        f"{low_risk/len(result_df)*100:.1f}%"
                    ]
                })

                st.dataframe(risk_data, use_container_width=True)

                # 機率分佈圖
                fig = px.histogram(result_df, x='churn_probability', nbins=50,
                                   title='客戶流失機率分佈',
                                   labels={'churn_probability': '流失機率', 'count': '客戶數'})
                fig.add_vline(x=0.3, line_dash="dash", line_color="orange",
                              annotation_text="中風險門檻")
                fig.add_vline(x=0.7, line_dash="dash", line_color="red",
                              annotation_text="高風險門檻")
                st.plotly_chart(fig, use_container_width=True)

                # 高風險客戶列表
                st.subheader("⚠️ 高風險客戶列表")
                high_risk_customers = result_df[result_df['churn_probability'] > 0.7].sort_values(
                    'churn_probability', ascending=False
                )

                if len(high_risk_customers) > 0:
                    st.dataframe(high_risk_customers.head(20), use_container_width=True)
                else:
                    st.success("沒有高風險客戶！")

                # 下載結果
                st.subheader("💾 下載預測結果")
                csv = result_df.to_csv(index=False).encode('utf-8')
                st.download_button(
                    label="📥 下載 CSV",
                    data=csv,
                    file_name='churn_predictions.csv',
                    mime='text/csv'
                )


def data_analysis():
    """資料分析介面"""
    st.header("📈 資料分析儀表板")

    # 載入示例資料
    data_path = 'data/all_customers.csv'
    if not os.path.exists(data_path):
        st.warning("找不到資料檔案，請先執行 data_generator.py 生成資料")
        return

    df = pd.read_csv(data_path)

    # 基本統計
    st.subheader("📊 基本統計")

    col1, col2, col3, col4 = st.columns(4)

    with col1:
        st.metric("總客戶數", len(df))

    with col2:
        churn_rate = (df['churn'] == 'Yes').sum() / len(df) * 100
        st.metric("流失率", f"{churn_rate:.2f}%")

    with col3:
        avg_tenure = df['tenure'].mean()
        st.metric("平均使用月數", f"{avg_tenure:.1f}")

    with col4:
        avg_charges = df['monthly_charges'].mean()
        st.metric("平均月費用", f"${avg_charges:.2f}")

    # 視覺化分析
    st.subheader("📉 視覺化分析")

    tab1, tab2, tab3, tab4 = st.tabs(["合約類型", "網路服務", "費用分析", "使用期限"])

    with tab1:
        # 合約類型 vs 流失
        contract_churn = pd.crosstab(df['contract_type'], df['churn'], normalize='index') * 100
        fig = px.bar(contract_churn, barmode='group',
                     title='不同合約類型的流失率',
                     labels={'value': '百分比 (%)', 'contract_type': '合約類型'})
        st.plotly_chart(fig, use_container_width=True)

    with tab2:
        # 網路服務 vs 流失
        internet_churn = pd.crosstab(df['internet_service'], df['churn'], normalize='index') * 100
        fig = px.bar(internet_churn, barmode='group',
                     title='不同網路服務的流失率',
                     labels={'value': '百分比 (%)', 'internet_service': '網路服務'})
        st.plotly_chart(fig, use_container_width=True)

    with tab3:
        # 費用分佈
        fig = px.box(df, x='churn', y='monthly_charges',
                     title='月費用分佈（依流失狀態）',
                     labels={'churn': '是否流失', 'monthly_charges': '月費用 ($)'})
        st.plotly_chart(fig, use_container_width=True)

    with tab4:
        # 使用期限分佈
        fig = px.histogram(df, x='tenure', color='churn', nbins=30,
                          title='使用期限分佈',
                          labels={'tenure': '使用月數', 'churn': '是否流失'})
        st.plotly_chart(fig, use_container_width=True)


def main():
    """主函數"""
    # 載入模型
    predictor = load_predictor()

    if predictor is None:
        st.error("❌ 找不到訓練好的模型")
        st.info("請先執行 `python train.py` 訓練模型")
        return

    # 側邊欄
    mode = show_sidebar()

    # 根據模式顯示不同介面
    if mode == "單一客戶預測":
        single_prediction(predictor)
    elif mode == "批次預測":
        batch_prediction(predictor)
    elif mode == "資料分析":
        data_analysis()

    # 頁腳
    st.markdown("---")
    st.markdown(
        """
        <div style='text-align: center'>
            <p>客戶流失預測系統 v1.0 | 使用機器學習技術預測客戶流失風險</p>
        </div>
        """,
        unsafe_allow_html=True
    )


if __name__ == '__main__':
    main()
