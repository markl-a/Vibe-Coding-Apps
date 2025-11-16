"""
專案儀表板 - 主程序
提供全面的專案管理可視化界面
"""

import streamlit as st
import plotly.graph_objects as go
import plotly.express as px
import pandas as pd
from datetime import datetime, timedelta
import json


class ProjectDashboard:
    """專案儀表板類"""

    def __init__(self):
        self.projects = self.load_sample_data()

    def load_sample_data(self):
        """載入示例數據"""
        return [
            {
                "id": "proj_001",
                "name": "電商平台開發",
                "status": "進行中",
                "progress": 65,
                "budget": 1000000,
                "spent": 620000,
                "start_date": "2025-01-01",
                "end_date": "2025-06-30",
                "health": "綠色",
                "team_size": 8,
                "tasks_total": 150,
                "tasks_completed": 98
            },
            {
                "id": "proj_002",
                "name": "移動應用升級",
                "status": "進行中",
                "progress": 82,
                "budget": 500000,
                "spent": 450000,
                "start_date": "2024-11-01",
                "end_date": "2025-03-31",
                "health": "黃色",
                "team_size": 5,
                "tasks_total": 80,
                "tasks_completed": 66
            },
            {
                "id": "proj_003",
                "name": "數據分析平台",
                "status": "計劃中",
                "progress": 15,
                "budget": 800000,
                "spent": 80000,
                "start_date": "2025-02-01",
                "end_date": "2025-12-31",
                "health": "綠色",
                "team_size": 6,
                "tasks_total": 200,
                "tasks_completed": 30
            }
        ]

    def get_overview_metrics(self):
        """獲取概覽指標"""
        total_projects = len(self.projects)
        active_projects = len([p for p in self.projects if p["status"] == "進行中"])
        total_budget = sum(p["budget"] for p in self.projects)
        total_spent = sum(p["spent"] for p in self.projects)
        avg_progress = sum(p["progress"] for p in self.projects) / total_projects

        return {
            "total_projects": total_projects,
            "active_projects": active_projects,
            "total_budget": total_budget,
            "total_spent": total_spent,
            "budget_utilization": (total_spent / total_budget * 100) if total_budget > 0 else 0,
            "avg_progress": avg_progress
        }


def render_dashboard():
    """渲染儀表板"""
    st.set_page_config(page_title="專案管理儀表板", page_icon="📊", layout="wide")

    st.title("📊 專案管理儀表板")

    dashboard = ProjectDashboard()
    metrics = dashboard.get_overview_metrics()

    # 概覽指標
    col1, col2, col3, col4 = st.columns(4)

    with col1:
        st.metric("總專案數", metrics["total_projects"])
        st.metric("進行中專案", metrics["active_projects"])

    with col2:
        st.metric("總預算", f"${metrics['total_budget']:,}")
        st.metric("已使用", f"${metrics['total_spent']:,}")

    with col3:
        st.metric("預算使用率", f"{metrics['budget_utilization']:.1f}%")
        st.metric("平均進度", f"{metrics['avg_progress']:.1f}%")

    with col4:
        on_track = len([p for p in dashboard.projects if p["health"] == "綠色"])
        st.metric("健康專案", on_track)
        st.metric("需關注", len(dashboard.projects) - on_track)

    st.divider()

    # 專案列表
    st.subheader("📋 專案列表")

    df = pd.DataFrame(dashboard.projects)
    st.dataframe(
        df[["name", "status", "progress", "health", "team_size", "tasks_completed", "tasks_total"]],
        use_container_width=True,
        hide_index=True
    )

    st.divider()

    # 圖表區域
    col1, col2 = st.columns(2)

    with col1:
        st.subheader("專案進度")
        fig = px.bar(
            df,
            x="name",
            y="progress",
            color="health",
            color_discrete_map={"綠色": "green", "黃色": "yellow", "紅色": "red"}
        )
        st.plotly_chart(fig, use_container_width=True)

    with col2:
        st.subheader("預算使用情況")
        fig = go.Figure()
        fig.add_trace(go.Bar(name="預算", x=df["name"], y=df["budget"]))
        fig.add_trace(go.Bar(name="已用", x=df["name"], y=df["spent"]))
        fig.update_layout(barmode="group")
        st.plotly_chart(fig, use_container_width=True)

    # 詳細分析
    st.divider()
    st.subheader("🎯 詳細分析")

    selected_project = st.selectbox("選擇專案", [p["name"] for p in dashboard.projects])

    project = next(p for p in dashboard.projects if p["name"] == selected_project)

    col1, col2, col3 = st.columns(3)

    with col1:
        st.metric("專案狀態", project["status"])
        st.metric("團隊規模", f"{project['team_size']} 人")

    with col2:
        st.metric("進度", f"{project['progress']}%")
        st.metric("健康度", project["health"])

    with col3:
        completion_rate = project["tasks_completed"] / project["tasks_total"] * 100
        st.metric("任務完成率", f"{completion_rate:.1f}%")
        budget_used = project["spent"] / project["budget"] * 100
        st.metric("預算使用", f"{budget_used:.1f}%")


if __name__ == "__main__":
    render_dashboard()
