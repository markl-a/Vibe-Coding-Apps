"""
Customer Support Bot Streamlit UI
客戶服務機器人網頁界面
"""

import streamlit as st
from support_bot import CustomerSupportBot
import json
from datetime import datetime

# 頁面配置
st.set_page_config(
    page_title="客戶服務機器人",
    page_icon="🎯",
    layout="wide"
)

# 初始化
if 'bot' not in st.session_state:
    st.session_state.bot = CustomerSupportBot()

if 'messages' not in st.session_state:
    st.session_state.messages = []

if 'user_id' not in st.session_state:
    st.session_state.user_id = f"user_{datetime.now().strftime('%Y%m%d%H%M%S')}"

# 標題
st.title("🎯 客戶服務聊天機器人")
st.markdown("---")

# 側邊欄
with st.sidebar:
    st.header("⚙️ 設定")

    # 升級門檻
    escalation_threshold = st.slider(
        "升級門檻",
        min_value=0.0,
        max_value=1.0,
        value=0.3,
        step=0.1,
        help="越低越容易轉接人工客服"
    )
    st.session_state.bot.escalation_threshold = escalation_threshold

    # 語言設定
    language = st.selectbox(
        "語言",
        ["zh-TW", "zh-CN", "en-US"],
        index=0
    )

    st.markdown("---")

    # 統計資訊
    st.header("📊 統計")
    total_msgs = len(st.session_state.messages)
    st.metric("總對話數", total_msgs)

    if st.session_state.messages:
        escalations = sum(
            1 for msg in st.session_state.messages
            if msg.get('needs_escalation', False)
        )
        st.metric("升級次數", escalations)

    st.markdown("---")

    # 清除對話
    if st.button("🗑️ 清除對話", use_container_width=True):
        st.session_state.messages = []
        st.rerun()

# 主要內容
col1, col2 = st.columns([2, 1])

with col1:
    st.subheader("💬 對話視窗")

    # 顯示對話歷史
    chat_container = st.container()
    with chat_container:
        for message in st.session_state.messages:
            # 客戶訊息
            with st.chat_message("user"):
                st.write(message['query'])

            # 機器人回應
            with st.chat_message("assistant"):
                st.write(message['answer'])

                # 顯示元資料
                col_a, col_b, col_c = st.columns(3)
                with col_a:
                    st.caption(f"類別: {message.get('category', 'N/A')}")
                with col_b:
                    confidence = message.get('confidence', 0)
                    st.caption(f"信心: {confidence:.0%}")
                with col_c:
                    sentiment = message.get('sentiment', 'N/A')
                    emoji = "😊" if sentiment == "正面" else "😞" if sentiment == "負面" else "😐"
                    st.caption(f"情緒: {emoji} {sentiment}")

                if message.get('needs_escalation', False):
                    st.warning("⚠️ 已轉接人工客服")

    # 輸入框
    user_input = st.chat_input("請輸入您的問題...")

    if user_input:
        # 處理用戶輸入
        with st.spinner("處理中..."):
            result = st.session_state.bot.handle_query(
                message=user_input,
                user_id=st.session_state.user_id,
                language=language
            )

            # 添加到對話歷史
            message_data = {
                'query': user_input,
                **result
            }
            st.session_state.messages.append(message_data)

        # 重新載入頁面以顯示新訊息
        st.rerun()

with col2:
    st.subheader("📋 最近問題分類")

    if st.session_state.messages:
        # 統計問題類別
        categories = {}
        for msg in st.session_state.messages[-10:]:  # 最近10條
            cat = msg.get('category', '其他')
            categories[cat] = categories.get(cat, 0) + 1

        # 顯示圓餅圖
        if categories:
            st.bar_chart(categories)

        st.markdown("---")
        st.subheader("🎭 情緒分析")

        # 統計情緒
        sentiments = {}
        for msg in st.session_state.messages[-10:]:
            sent = msg.get('sentiment', '中性')
            sentiments[sent] = sentiments.get(sent, 0) + 1

        # 顯示情緒分佈
        if sentiments:
            for sentiment, count in sentiments.items():
                emoji = "😊" if sentiment == "正面" else "😞" if sentiment == "負面" else "😐"
                st.write(f"{emoji} {sentiment}: {count}")

    else:
        st.info("開始對話後會顯示統計資訊")

# 頁尾
st.markdown("---")
st.caption("🎯 Customer Support Bot | Powered by OpenAI GPT")
