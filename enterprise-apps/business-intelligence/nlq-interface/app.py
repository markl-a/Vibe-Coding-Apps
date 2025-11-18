"""
NLQ 接口 - Streamlit Web 应用
提供交互式自然语言查询界面
"""

import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import os
from nlq_engine import NLQEngine, QueryResult

# 页面配置
st.set_page_config(
    page_title="自然语言查询接口",
    page_icon="💬",
    layout="wide"
)

# 自定义CSS
st.markdown("""
<style>
    .chat-message {
        padding: 15px;
        border-radius: 10px;
        margin: 10px 0;
        max-width: 80%;
    }
    .user-message {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        margin-left: auto;
    }
    .assistant-message {
        background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        color: white;
    }
    .sql-code {
        background: #f6f8fa;
        padding: 15px;
        border-radius: 5px;
        border-left: 3px solid #667eea;
        font-family: monospace;
        margin: 10px 0;
    }
    .insight-box {
        background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
        padding: 15px;
        border-radius: 10px;
        margin: 10px 0;
    }
    .example-question {
        background: #f0f2f6;
        padding: 10px 15px;
        border-radius: 20px;
        margin: 5px;
        display: inline-block;
        cursor: pointer;
        transition: all 0.3s;
    }
    .example-question:hover {
        background: #667eea;
        color: white;
        transform: translateY(-2px);
    }
</style>
""", unsafe_allow_html=True)

# 初始化引擎
@st.cache_resource
def get_engine():
    db_path = 'data/database.db'
    if not os.path.exists(db_path):
        st.error("⚠️ 数据库文件不存在，请先运行 data_generator.py")
        st.stop()
    return NLQEngine(db_path=db_path)

# 初始化 session state
if 'messages' not in st.session_state:
    st.session_state.messages = []

if 'query_history' not in st.session_state:
    st.session_state.query_history = []

def render_chart(data: pd.DataFrame, viz_config: dict):
    """渲染图表"""
    viz_type = viz_config.get('type', 'table')

    if viz_type == 'card' and not data.empty:
        value = data.iloc[0, 0]
        st.metric(
            label=data.columns[0],
            value=f"{value:,.2f}" if isinstance(value, (int, float)) else value
        )

    elif viz_type == 'bar':
        x_col = viz_config.get('x', data.columns[0])
        y_col = viz_config.get('y', data.columns[1] if len(data.columns) > 1 else data.columns[0])

        fig = px.bar(
            data,
            x=x_col,
            y=y_col,
            title='',
            color_discrete_sequence=['#667eea']
        )
        fig.update_layout(height=400)
        st.plotly_chart(fig, use_container_width=True)

    elif viz_type == 'line':
        x_col = viz_config.get('x', data.columns[0])
        y_col = viz_config.get('y', data.columns[1] if len(data.columns) > 1 else data.columns[0])

        fig = px.line(
            data,
            x=x_col,
            y=y_col,
            title='',
            markers=True,
            color_discrete_sequence=['#667eea']
        )
        fig.update_layout(height=400)
        st.plotly_chart(fig, use_container_width=True)

    elif viz_type == 'pie':
        labels_col = viz_config.get('labels', data.columns[0])
        values_col = viz_config.get('values', data.columns[1] if len(data.columns) > 1 else data.columns[0])

        fig = px.pie(
            data,
            names=labels_col,
            values=values_col,
            title=''
        )
        fig.update_layout(height=400)
        st.plotly_chart(fig, use_container_width=True)

    else:  # table
        st.dataframe(data, use_container_width=True, height=300)

def display_query_result(result: QueryResult):
    """显示查询结果"""

    # SQL 查询
    with st.expander("🔍 查看 SQL 查询", expanded=False):
        st.code(result.sql, language='sql')

    # 自然语言答案
    st.markdown(f"""
    <div class="chat-message assistant-message">
        <strong>💬 回答:</strong> {result.answer}
    </div>
    """, unsafe_allow_html=True)

    # 数据可视化
    if not result.data.empty and result.visualization:
        st.markdown("### 📊 数据可视化")
        render_chart(result.data, result.visualization)

    # 洞察
    if result.insights:
        st.markdown("### 💡 数据洞察")
        for insight in result.insights:
            st.markdown(f"""
            <div class="insight-box">
                ✨ {insight}
            </div>
            """, unsafe_allow_html=True)

    # 详细数据
    if not result.data.empty and len(result.data) > 1:
        with st.expander("📋 查看详细数据"):
            st.dataframe(result.data, use_container_width=True)

            # 下载按钮
            csv = result.data.to_csv(index=False).encode('utf-8')
            st.download_button(
                label="下载 CSV",
                data=csv,
                file_name="query_result.csv",
                mime="text/csv"
            )

    # 元数据
    st.caption(f"⏱️ 执行时间: {result.execution_time*1000:.0f}ms | 📊 返回行数: {len(result.data)}")

def main():
    st.title("💬 自然语言查询接口")
    st.markdown("**用自然语言提问数据 | AI驱动 | 实时查询**")
    st.markdown("---")

    engine = get_engine()

    # 侧边栏
    with st.sidebar:
        st.title("⚙️ 设置")

        # 示例问题
        st.markdown("### 💡 示例问题")

        example_questions = [
            "总销售额是多少？",
            "按产品类别分组的销售额",
            "销售额最高的5个产品",
            "上个月的订单数量",
            "平均订单金额",
            "每个地区的客户数量",
            "显示所有产品",
        ]

        for question in example_questions:
            if st.button(question, key=f"ex_{question}", use_container_width=True):
                st.session_state.example_question = question

        st.markdown("---")

        # 查询历史
        st.markdown("### 📜 查询历史")
        if st.session_state.query_history:
            for i, q in enumerate(reversed(st.session_state.query_history[-10:])):
                if st.button(f"📌 {q[:30]}...", key=f"hist_{i}", use_container_width=True):
                    st.session_state.example_question = q
        else:
            st.caption("暂无查询历史")

        st.markdown("---")

        # 清除历史
        if st.button("🗑️ 清除对话", use_container_width=True):
            st.session_state.messages = []
            st.session_state.query_history = []
            st.rerun()

    # 主界面 - 使用 Tabs
    tab1, tab2, tab3 = st.tabs(["💬 对话查询", "📊 数据库信息", "ℹ️ 使用指南"])

    with tab1:
        # 显示历史消息
        for message in st.session_state.messages:
            if message['role'] == 'user':
                st.markdown(f"""
                <div class="chat-message user-message">
                    <strong>👤 You:</strong> {message['content']}
                </div>
                """, unsafe_allow_html=True)
            else:
                st.markdown(f"""
                <div class="chat-message assistant-message">
                    <strong>🤖 Assistant:</strong>
                </div>
                """, unsafe_allow_html=True)
                display_query_result(message['result'])

        # 输入框
        col1, col2 = st.columns([6, 1])

        with col1:
            # 检查是否有示例问题
            default_value = st.session_state.pop('example_question', '')
            user_input = st.text_input(
                "输入您的问题:",
                value=default_value,
                placeholder="例如: 总销售额是多少？",
                key="user_input",
                label_visibility="collapsed"
            )

        with col2:
            submit = st.button("发送", type="primary", use_container_width=True)

        # 处理用户输入
        if submit and user_input:
            # 添加用户消息
            st.session_state.messages.append({
                'role': 'user',
                'content': user_input
            })

            # 执行查询
            with st.spinner("🤔 思考中..."):
                result = engine.query(user_input)

            # 添加助手回复
            st.session_state.messages.append({
                'role': 'assistant',
                'result': result
            })

            # 添加到历史
            st.session_state.query_history.append(user_input)

            # 重新运行以显示新消息
            st.rerun()

    with tab2:
        st.header("📊 数据库信息")

        # 显示所有表
        schema = engine.schema_manager.schema

        st.markdown(f"### 数据库包含 {len(schema)} 个表")

        for table_name, table_info in schema.items():
            with st.expander(f"📋 {table_name}", expanded=False):
                st.markdown("**列信息:**")

                # 列表格
                cols_data = []
                for col_name, col_info in table_info['columns'].items():
                    cols_data.append({
                        '列名': col_name,
                        '类型': col_info['type'],
                        '可空': '是' if col_info['nullable'] else '否'
                    })

                cols_df = pd.DataFrame(cols_data)
                st.dataframe(cols_df, use_container_width=True, hide_index=True)

                # 样本数据
                if table_info.get('sample_data'):
                    st.markdown("**样本数据:**")
                    sample_df = pd.DataFrame(
                        table_info['sample_data'],
                        columns=list(table_info['columns'].keys())
                    )
                    st.dataframe(sample_df, use_container_width=True)

    with tab3:
        st.header("ℹ️ 使用指南")

        st.markdown("""
        ### 🎯 如何提问

        本系统可以理解以下类型的问题：

        #### 1️⃣ 聚合查询
        - "总销售额是多少？"
        - "平均订单金额"
        - "最大/最小值"

        #### 2️⃣ 分组统计
        - "每个地区的销售额"
        - "按产品类别分组的订单数"
        - "各城市的客户数量"

        #### 3️⃣ 排名查询
        - "销售额最高的5个产品"
        - "前10名客户"
        - "排名最后的地区"

        #### 4️⃣ 时间范围
        - "本月的销售额"
        - "上周的订单数"
        - "今年的收入"

        #### 5️⃣ 显示数据
        - "显示所有产品"
        - "列出客户信息"
        - "查看订单"

        ### 💡 提问技巧

        ✅ **明确具体**
        - 好: "2024年各地区的销售额"
        - 差: "销售情况"

        ✅ **包含关键词**
        - 总计、平均、最高、最低
        - 按...分组、每个
        - 前N个、Top N

        ✅ **指定时间**
        - 本月、上月、今年
        - 最近7天、最近30天

        ### 🚀 高级功能

        - **上下文对话**: 系统会记住对话历史，可以进行追问
        - **智能可视化**: 自动推荐最合适的图表类型
        - **AI洞察**: 自动发现数据中的关键信息
        - **SQL查看**: 可以查看生成的SQL语句学习
        - **结果导出**: 支持导出为CSV文件

        ### ⚙️ 系统限制

        - 每次查询最多返回 10,000 行
        - 复杂的多表JOIN可能需要手动编写SQL
        - 系统使用只读模式，不能修改数据
        """)

        st.markdown("---")
        st.info("💡 提示: 点击左侧的示例问题快速开始！")

if __name__ == "__main__":
    main()
