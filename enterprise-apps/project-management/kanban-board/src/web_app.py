"""
任務看板系統 - Streamlit Web 界面
"""

import streamlit as st
import pandas as pd
from kanban_board import KanbanBoard, Task, TaskStatus, TaskPriority
from datetime import datetime


# 初始化 session state
if 'board' not in st.session_state:
    st.session_state.board = KanbanBoard("我的專案看板")

    # 載入或創建示例數據
    try:
        st.session_state.board.import_from_json("data/sample_tasks.json")
    except:
        sample_tasks = [
            Task("實現用戶登入功能", "使用 JWT 實現安全的用戶認證", "張三", "HIGH", 8, ["backend", "security"]),
            Task("設計產品頁面 UI", "創建響應式產品展示頁面", "李四", "MEDIUM", 12, ["frontend", "design"]),
            Task("編寫 API 文檔", "使用 OpenAPI 規範", "王五", "LOW", 4, ["documentation"]),
            Task("數據庫優化", "優化慢查詢", "張三", "URGENT", 6, ["backend", "performance"]),
            Task("編寫單元測試", "提高代碼覆蓋率到 80%", "李四", "MEDIUM", 8, ["testing"])
        ]
        for task in sample_tasks:
            st.session_state.board.add_task(task)

        # 移動一些任務到不同狀態以展示
        tasks_list = list(st.session_state.board.tasks.values())
        if len(tasks_list) > 1:
            st.session_state.board.move_task(tasks_list[0].id, "IN_PROGRESS")
        if len(tasks_list) > 2:
            st.session_state.board.move_task(tasks_list[1].id, "IN_REVIEW")
        if len(tasks_list) > 3:
            st.session_state.board.move_task(tasks_list[2].id, "DONE")


def get_priority_color(priority: str) -> str:
    """獲取優先級顏色"""
    colors = {
        "LOW": "🟢",
        "MEDIUM": "🟡",
        "HIGH": "🟠",
        "URGENT": "🔴"
    }
    return colors.get(priority, "⚪")


def render_task_card(task: Task, col):
    """渲染任務卡片"""
    with col:
        with st.container():
            st.markdown(f"**{get_priority_color(task.priority)} {task.title}**")

            if task.description:
                st.caption(task.description[:100] + "..." if len(task.description) > 100 else task.description)

            # 任務信息
            info_cols = st.columns(3)
            with info_cols[0]:
                if task.assignee:
                    st.text(f"👤 {task.assignee}")
            with info_cols[1]:
                st.text(f"⏱️ {task.actual_hours}/{task.estimated_hours}h")
            with info_cols[2]:
                st.text(f"#{task.id[:8]}")

            # 標籤
            if task.tags:
                st.markdown(" ".join([f"`{tag}`" for tag in task.tags]))

            # 操作按鈕
            btn_cols = st.columns(4)
            with btn_cols[0]:
                if st.button("📝", key=f"edit_{task.id}", help="編輯"):
                    st.session_state.editing_task = task.id
            with btn_cols[1]:
                if st.button("💬", key=f"comment_{task.id}", help="評論"):
                    st.session_state.commenting_task = task.id
            with btn_cols[2]:
                if st.button("📊", key=f"detail_{task.id}", help="詳情"):
                    st.session_state.detail_task = task.id
            with btn_cols[3]:
                if st.button("🗑️", key=f"delete_{task.id}", help="刪除"):
                    st.session_state.board.delete_task(task.id)
                    st.rerun()

            st.divider()


def main():
    """主界面"""
    st.set_page_config(
        page_title="任務看板系統",
        page_icon="📋",
        layout="wide"
    )

    board = st.session_state.board

    # 標題
    st.title("📋 任務看板系統")

    # 側邊欄 - 統計和操作
    with st.sidebar:
        st.header("📊 看板統計")

        stats = board.get_statistics()

        # 統計卡片
        col1, col2 = st.columns(2)
        with col1:
            st.metric("總任務", stats['total_tasks'])
            st.metric("預估工時", f"{stats['total_estimated_hours']}h")
        with col2:
            st.metric("完成率", f"{stats['completion_rate']}%")
            st.metric("實際工時", f"{stats['total_actual_hours']}h")

        if stats['total_actual_hours'] > 0:
            st.metric("效率", f"{stats['efficiency']}%")

        st.divider()

        # 狀態分布
        st.subheader("狀態分布")
        status_df = pd.DataFrame(
            list(stats['status_distribution'].items()),
            columns=['狀態', '數量']
        )
        st.bar_chart(status_df.set_index('狀態'))

        st.divider()

        # 優先級分布
        st.subheader("優先級分布")
        priority_df = pd.DataFrame(
            list(stats['priority_distribution'].items()),
            columns=['優先級', '數量']
        )
        st.bar_chart(priority_df.set_index('優先級'))

        st.divider()

        # 數據管理
        st.subheader("數據管理")
        if st.button("💾 導出數據"):
            if board.export_to_json("kanban_export.json"):
                st.success("已導出到 kanban_export.json")

        uploaded_file = st.file_uploader("導入數據", type=['json'])
        if uploaded_file is not None:
            with open("temp_import.json", "wb") as f:
                f.write(uploaded_file.getbuffer())
            if board.import_from_json("temp_import.json"):
                st.success("導入成功！")
                st.rerun()

    # 主內容區域
    # 搜索和篩選
    col1, col2, col3 = st.columns([3, 1, 1])
    with col1:
        search_keyword = st.text_input("🔍 搜索任務", placeholder="輸入關鍵字...")
    with col2:
        filter_assignee = st.selectbox(
            "負責人",
            ["全部"] + list(set([t.assignee for t in board.tasks.values() if t.assignee]))
        )
    with col3:
        filter_priority = st.selectbox(
            "優先級",
            ["全部"] + [p.value for p in TaskPriority]
        )

    st.divider()

    # 創建任務按鈕
    if st.button("➕ 創建新任務", type="primary"):
        st.session_state.creating_task = True

    # 創建任務對話框
    if st.session_state.get('creating_task', False):
        with st.expander("創建新任務", expanded=True):
            with st.form("create_task_form"):
                title = st.text_input("任務標題 *")
                description = st.text_area("描述")
                col1, col2, col3 = st.columns(3)
                with col1:
                    assignee = st.text_input("負責人")
                with col2:
                    priority = st.selectbox("優先級", [p.value for p in TaskPriority])
                with col3:
                    estimated_hours = st.number_input("預估工時", min_value=0.0, value=0.0, step=0.5)
                tags_input = st.text_input("標籤（用逗號分隔）")

                col1, col2 = st.columns(2)
                with col1:
                    submit = st.form_submit_button("創建", type="primary")
                with col2:
                    cancel = st.form_submit_button("取消")

                if submit and title:
                    tags = [tag.strip() for tag in tags_input.split(",") if tag.strip()]
                    task = Task(
                        title=title,
                        description=description,
                        assignee=assignee,
                        priority=priority,
                        estimated_hours=estimated_hours,
                        tags=tags
                    )
                    board.add_task(task)
                    st.session_state.creating_task = False
                    st.success(f"任務已創建: {task.id[:8]}")
                    st.rerun()

                if cancel:
                    st.session_state.creating_task = False
                    st.rerun()

    st.divider()

    # 看板列
    columns = st.columns(4)
    column_titles = ["📝 待處理", "🔄 進行中", "👀 審查中", "✅ 已完成"]
    statuses = [s.value for s in TaskStatus]

    for idx, (col, title, status) in enumerate(zip(columns, column_titles, statuses)):
        with col:
            st.subheader(title)

            # 獲取任務並應用篩選
            tasks = board.get_tasks_by_status(status)

            # 應用搜索
            if search_keyword:
                tasks = [t for t in tasks if search_keyword.lower() in t.title.lower() or
                        search_keyword.lower() in t.description.lower()]

            # 應用負責人篩選
            if filter_assignee != "全部":
                tasks = [t for t in tasks if t.assignee == filter_assignee]

            # 應用優先級篩選
            if filter_priority != "全部":
                tasks = [t for t in tasks if t.priority == filter_priority]

            st.caption(f"{len(tasks)} 個任務")

            # 渲染任務
            for task in tasks:
                render_task_card(task, col)

            # 狀態轉換按鈕
            if tasks:
                st.divider()
                if idx < 3:  # 不是最後一列
                    selected_task = st.selectbox(
                        "移動任務",
                        ["選擇任務..."] + [f"{t.title[:20]}... ({t.id[:8]})" for t in tasks],
                        key=f"move_from_{status}"
                    )
                    if selected_task != "選擇任務...":
                        task_id = selected_task.split("(")[-1].strip(")")
                        matching_tasks = [tid for tid in board.tasks.keys() if tid.startswith(task_id)]
                        if matching_tasks and st.button(f"→ 移到 {column_titles[idx + 1]}", key=f"move_btn_{status}"):
                            board.move_task(matching_tasks[0], statuses[idx + 1])
                            st.rerun()

    # 任務詳情對話框
    if st.session_state.get('detail_task'):
        task_id = st.session_state.detail_task
        if task_id in board.tasks:
            task = board.tasks[task_id]

            with st.expander(f"任務詳情: {task.title}", expanded=True):
                st.markdown(f"**ID:** `{task.id}`")
                st.markdown(f"**狀態:** {task.status}")
                st.markdown(f"**優先級:** {get_priority_color(task.priority)} {task.priority}")
                st.markdown(f"**負責人:** {task.assignee or '未分配'}")
                st.markdown(f"**描述:** {task.description or '無'}")
                st.markdown(f"**預估工時:** {task.estimated_hours}h")
                st.markdown(f"**實際工時:** {task.actual_hours}h")
                st.markdown(f"**創建時間:** {task.created_at}")

                if task.tags:
                    st.markdown(f"**標籤:** {', '.join([f'`{tag}`' for tag in task.tags])}")

                # 評論
                st.subheader("💬 評論")
                for comment in task.comments:
                    st.text(f"{comment['author']} ({comment['timestamp']}):")
                    st.info(comment['content'])

                # 歷史
                st.subheader("📜 變更歷史")
                for entry in task.history:
                    st.caption(f"{entry['timestamp']}: {entry['field']} 從 '{entry['old_value']}' 變更為 '{entry['new_value']}'")

                if st.button("關閉", key="close_detail"):
                    st.session_state.detail_task = None
                    st.rerun()


if __name__ == "__main__":
    main()
