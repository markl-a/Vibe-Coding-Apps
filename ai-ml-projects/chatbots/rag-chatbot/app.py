"""
RAG Chatbot Streamlit UI
RAG 聊天機器人網頁界面
"""

import streamlit as st
from rag_bot import RAGChatbot
from pathlib import Path
import tempfile

# 頁面配置
st.set_page_config(
    page_title="RAG 聊天機器人",
    page_icon="📚",
    layout="wide"
)

# 初始化
if 'bot' not in st.session_state:
    st.session_state.bot = RAGChatbot()

if 'messages' not in st.session_state:
    st.session_state.messages = []

# 標題
st.title("📚 RAG 檢索增強生成聊天機器人")
st.markdown("基於您的文檔資料庫提供精確回答")
st.markdown("---")

# 側邊欄
with st.sidebar:
    st.header("📂 文檔管理")

    # 統計資訊
    stats = st.session_state.bot.get_stats()

    col1, col2 = st.columns(2)
    with col1:
        st.metric("文檔數", stats['total_documents'])
    with col2:
        st.metric("片段數", stats['total_chunks'])

    st.markdown("---")

    # 上傳文檔
    st.subheader("📤 上傳文檔")
    uploaded_file = st.file_uploader(
        "選擇文檔",
        type=['txt', 'md', 'pdf'],
        help="支援 TXT, Markdown, PDF 格式"
    )

    if uploaded_file is not None:
        if st.button("📥 添加到資料庫", use_container_width=True):
            with st.spinner("處理文檔中..."):
                # 儲存臨時文件
                with tempfile.NamedTemporaryFile(delete=False, suffix=Path(uploaded_file.name).suffix) as tmp_file:
                    tmp_file.write(uploaded_file.getvalue())
                    tmp_path = tmp_file.name

                # 添加文檔
                metadata = {
                    'filename': uploaded_file.name,
                    'file_type': Path(uploaded_file.name).suffix
                }

                try:
                    st.session_state.bot.add_document(tmp_path, metadata)
                    st.success(f"✓ 已添加: {uploaded_file.name}")
                    st.rerun()
                except Exception as e:
                    st.error(f"錯誤: {e}")

    st.markdown("---")

    # 檢索設定
    st.subheader("⚙️ 檢索設定")

    top_k = st.slider(
        "檢索片段數",
        min_value=1,
        max_value=10,
        value=3,
        help="檢索最相關的前 N 個文檔片段"
    )

    include_sources = st.checkbox(
        "顯示來源",
        value=True,
        help="在回答中顯示參考來源"
    )

    st.markdown("---")

    # 已索引的文檔
    if stats['sources']:
        st.subheader("📋 已索引文檔")
        for i, source in enumerate(stats['sources'], 1):
            st.text(f"{i}. {Path(source).name}")

    st.markdown("---")

    # 清除對話
    if st.button("🗑️ 清除對話", use_container_width=True):
        st.session_state.messages = []
        st.rerun()

# 主要內容
if stats['total_chunks'] == 0:
    st.info("👈 請先在左側上傳文檔以開始使用")
else:
    # 顯示對話歷史
    for message in st.session_state.messages:
        # 用戶問題
        with st.chat_message("user"):
            st.write(message['question'])

        # 機器人回答
        with st.chat_message("assistant"):
            st.write(message['answer'])

            # 顯示來源
            if message.get('sources') and include_sources:
                with st.expander("📚 參考來源"):
                    for i, source in enumerate(message['sources'], 1):
                        st.markdown(
                            f"**{i}. {Path(source['source']).name}** "
                            f"(相關度: {source['relevance_score']:.2%})"
                        )

            # 顯示信心度
            confidence = message.get('confidence', 0)
            if confidence > 0:
                st.caption(f"信心度: {confidence:.2%}")

    # 輸入框
    user_question = st.chat_input("請輸入您的問題...")

    if user_question:
        # 處理問題
        with st.spinner("搜尋相關資訊並生成回答..."):
            result = st.session_state.bot.query(
                question=user_question,
                top_k=top_k,
                include_sources=include_sources
            )

            # 添加到對話歷史
            message_data = {
                'question': user_question,
                **result
            }
            st.session_state.messages.append(message_data)

        # 重新載入頁面
        st.rerun()

# 頁尾
st.markdown("---")

# 顯示說明
with st.expander("ℹ️ 使用說明"):
    st.markdown("""
    ### 如何使用

    1. **上傳文檔**: 在左側上傳您的文檔（支援 TXT, Markdown, PDF）
    2. **提問**: 在下方輸入框中輸入問題
    3. **查看答案**: 系統會基於您的文檔內容生成答案
    4. **檢查來源**: 點擊「參考來源」查看答案來自哪些文檔

    ### 技術原理

    - **文檔分塊**: 將文檔分割成小片段便於檢索
    - **向量嵌入**: 將文本轉換為數學向量
    - **語義搜尋**: 基於語義相似度找出相關內容
    - **生成回答**: 結合檢索內容生成精確答案

    ### 提示

    - 上傳更多相關文檔可以提高回答品質
    - 問題越具體，答案越準確
    - 檢查來源可以驗證答案的可靠性
    """)

st.caption("📚 RAG Chatbot | Powered by OpenAI GPT & FAISS")
