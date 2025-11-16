"""
費用追蹤器 Streamlit Web UI
"""

import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from datetime import datetime, timedelta
from expense_manager import ExpenseManager
from database.db_handler import DatabaseHandler

# 頁面配置
st.set_page_config(
    page_title="費用追蹤器",
    page_icon="💰",
    layout="wide"
)

# 初始化
@st.cache_resource
def load_manager():
    return ExpenseManager()

@st.cache_resource
def load_database():
    return DatabaseHandler()

manager = load_manager()
db = load_database()

# 標題
st.title("💰 費用追蹤器")
st.markdown("---")

# 側邊欄
st.sidebar.header("功能選擇")
mode = st.sidebar.selectbox(
    "選擇模式",
    ["新增費用", "費用清單", "分類管理", "統計分析", "預算管理", "匯出報表"]
)

# 新增費用模式
if mode == "新增費用":
    st.header("➕ 新增費用記錄")

    col1, col2 = st.columns(2)

    with col1:
        # 基本資訊
        date = st.date_input("日期", value=datetime.now())
        amount = st.number_input("金額", min_value=0.0, value=0.0, step=1.0)

        # 獲取所有分類
        categories = db.get_all_categories()
        category_names = [c['name'] for c in categories] if categories else []

        if category_names:
            category = st.selectbox("分類", category_names)
        else:
            category = st.text_input("分類（請先在分類管理中創建）")

        description = st.text_input("描述")

    with col2:
        # 進階資訊
        payment_method = st.selectbox(
            "付款方式",
            ["現金", "信用卡", "轉帳", "電子支付", "其他"]
        )

        vendor = st.text_input("商家/供應商")

        tags_input = st.text_input("標籤（用逗號分隔）", placeholder="例：商務,交通,差旅")
        tags = [tag.strip() for tag in tags_input.split(",")] if tags_input else []

        receipt = st.file_uploader("上傳收據", type=['jpg', 'jpeg', 'png', 'pdf'])

    notes = st.text_area("備註")

    # 費用類型
    expense_type = st.radio(
        "費用性質",
        ["一般費用", "定期費用（每月）", "一次性大額支出"],
        horizontal=True
    )

    is_recurring = expense_type == "定期費用（每月）"
    is_major = expense_type == "一次性大額支出"

    if st.button("💾 保存費用", type="primary") and amount > 0:
        expense_data = {
            'date': date.isoformat(),
            'amount': amount,
            'category': category,
            'description': description,
            'payment_method': payment_method,
            'vendor': vendor,
            'tags': tags,
            'notes': notes,
            'is_recurring': is_recurring,
            'is_major': is_major,
            'has_receipt': receipt is not None
        }

        # 保存收據
        if receipt:
            receipt_path = db.save_receipt(receipt, f"{date.isoformat()}_{category}")
            expense_data['receipt_path'] = receipt_path

        success = db.save_expense(expense_data)

        if success:
            st.success(f"✅ 已保存費用記錄：{category} - ${amount:,.2f}")
            st.balloons()
        else:
            st.error("❌ 保存失敗")

# 費用清單模式
elif mode == "費用清單":
    st.header("📋 費用清單")

    # 篩選選項
    col_filter1, col_filter2, col_filter3, col_filter4 = st.columns(4)

    with col_filter1:
        start_date = st.date_input("開始日期", value=datetime.now() - timedelta(days=30))

    with col_filter2:
        end_date = st.date_input("結束日期", value=datetime.now())

    with col_filter3:
        categories = db.get_all_categories()
        category_names = ["全部"] + [c['name'] for c in categories] if categories else ["全部"]
        category_filter = st.selectbox("分類篩選", category_names)

    with col_filter4:
        min_amount = st.number_input("最小金額", min_value=0.0, value=0.0)

    # 獲取費用記錄
    expenses = db.get_expenses_by_date_range(start_date.isoformat(), end_date.isoformat())

    if expenses:
        # 應用篩選
        if category_filter != "全部":
            expenses = [e for e in expenses if e.get('category') == category_filter]

        if min_amount > 0:
            expenses = [e for e in expenses if e.get('amount', 0) >= min_amount]

        # 轉換為 DataFrame
        df = pd.DataFrame(expenses)

        # 重命名欄位
        display_columns = {
            'date': '日期',
            'category': '分類',
            'description': '描述',
            'amount': '金額',
            'payment_method': '付款方式',
            'vendor': '商家'
        }

        df_display = df[list(display_columns.keys())].rename(columns=display_columns)

        # 排序（最新的在前）
        df_display = df_display.sort_values('日期', ascending=False)

        st.dataframe(df_display, use_container_width=True)

        # 統計資訊
        st.markdown("---")
        col_stat1, col_stat2, col_stat3, col_stat4 = st.columns(4)

        with col_stat1:
            st.metric("記錄總數", len(df))

        with col_stat2:
            total_amount = df['amount'].sum()
            st.metric("總支出", f"${total_amount:,.2f}")

        with col_stat3:
            avg_amount = df['amount'].mean()
            st.metric("平均單筆", f"${avg_amount:,.2f}")

        with col_stat4:
            max_amount = df['amount'].max()
            st.metric("最高單筆", f"${max_amount:,.2f}")

        # 匯出選項
        st.markdown("---")
        csv = df_display.to_csv(index=False, encoding='utf-8-sig')
        st.download_button(
            label="📥 下載 CSV",
            data=csv,
            file_name=f"expenses_{start_date}_to_{end_date}.csv",
            mime="text/csv"
        )
    else:
        st.info("此期間無費用記錄")

# 分類管理模式
elif mode == "分類管理":
    st.header("🗂️ 分類管理")

    tab1, tab2 = st.tabs(["分類列表", "新增分類"])

    with tab1:
        categories = db.get_all_categories()

        if categories:
            # 計算每個分類的總支出
            all_expenses = db.get_all_expenses()

            for category in categories:
                category_expenses = [e for e in all_expenses if e.get('category') == category['name']]
                category['total_spent'] = sum(e.get('amount', 0) for e in category_expenses)
                category['count'] = len(category_expenses)

            df = pd.DataFrame(categories)

            # 顯示分類
            st.subheader("分類概覽")

            for idx, cat in enumerate(categories):
                col1, col2, col3, col4 = st.columns([2, 1, 1, 1])

                with col1:
                    icon = cat.get('icon', '📁')
                    st.write(f"{icon} **{cat['name']}**")
                    if cat.get('description'):
                        st.caption(cat['description'])

                with col2:
                    st.metric("支出", f"${cat['total_spent']:,.2f}")

                with col3:
                    st.metric("筆數", cat['count'])

                with col4:
                    if cat.get('budget'):
                        usage = (cat['total_spent'] / cat['budget']) * 100
                        st.metric("預算使用", f"{usage:.1f}%")

                st.markdown("---")

        else:
            st.info("尚無分類，請先新增分類")

    with tab2:
        st.subheader("新增分類")

        with st.form("add_category_form"):
            name = st.text_input("分類名稱*")

            # 常用圖示
            icon_options = {
                "🍔 餐飲": "🍔",
                "🚗 交通": "🚗",
                "🏠 住宿": "🏠",
                "🛍️ 購物": "🛍️",
                "💊 醫療": "💊",
                "🎓 教育": "🎓",
                "🎬 娛樂": "🎬",
                "📱 通訊": "📱",
                "💡 水電": "💡",
                "📁 其他": "📁"
            }

            icon_choice = st.selectbox("圖示", list(icon_options.keys()))
            icon = icon_options[icon_choice]

            description = st.text_area("描述")
            budget = st.number_input("月度預算（選填）", min_value=0.0, value=0.0)

            submitted = st.form_submit_button("新增分類")

            if submitted and name:
                category_data = {
                    'name': name,
                    'icon': icon,
                    'description': description,
                    'budget': budget if budget > 0 else None
                }

                db.add_category(category_data)
                st.success(f"✅ 分類 {icon} {name} 已新增")
                st.rerun()

# 統計分析模式
elif mode == "統計分析":
    st.header("📊 統計分析")

    # 時間範圍選擇
    col_time1, col_time2 = st.columns(2)

    with col_time1:
        start_date = st.date_input("開始日期", value=datetime.now() - timedelta(days=90))

    with col_time2:
        end_date = st.date_input("結束日期", value=datetime.now())

    expenses = db.get_expenses_by_date_range(start_date.isoformat(), end_date.isoformat())

    if expenses:
        df = pd.DataFrame(expenses)

        # 總覽
        st.subheader("📈 總覽")
        col1, col2, col3, col4 = st.columns(4)

        with col1:
            total_spent = df['amount'].sum()
            st.metric("總支出", f"${total_spent:,.2f}")

        with col2:
            avg_daily = total_spent / ((end_date - start_date).days + 1)
            st.metric("日均支出", f"${avg_daily:,.2f}")

        with col3:
            num_transactions = len(df)
            st.metric("交易筆數", num_transactions)

        with col4:
            avg_transaction = total_spent / num_transactions
            st.metric("平均交易", f"${avg_transaction:,.2f}")

        st.markdown("---")

        # 圖表
        col_chart1, col_chart2 = st.columns(2)

        with col_chart1:
            # 分類支出圓餅圖
            st.subheader("分類支出分布")
            category_spending = df.groupby('category')['amount'].sum().reset_index()
            category_spending = category_spending.sort_values('amount', ascending=False)

            fig_pie = px.pie(
                category_spending,
                values='amount',
                names='category',
                title='各分類支出佔比'
            )
            st.plotly_chart(fig_pie, use_container_width=True)

        with col_chart2:
            # 前 10 大支出
            st.subheader("前 10 大支出")
            top_expenses = df.nlargest(10, 'amount')[['date', 'category', 'description', 'amount']]

            fig_bar = px.bar(
                top_expenses,
                x='amount',
                y='description',
                orientation='h',
                title='單筆最高支出',
                color='category'
            )
            st.plotly_chart(fig_bar, use_container_width=True)

        # 時間趨勢
        st.subheader("支出趨勢")

        df['date'] = pd.to_datetime(df['date'])
        daily_spending = df.groupby('date')['amount'].sum().reset_index()

        fig_line = px.line(
            daily_spending,
            x='date',
            y='amount',
            title='每日支出趨勢',
            labels={'amount': '支出金額', 'date': '日期'}
        )
        st.plotly_chart(fig_line, use_container_width=True)

        # 付款方式分析
        st.markdown("---")
        st.subheader("付款方式分析")

        payment_analysis = df.groupby('payment_method')['amount'].agg(['sum', 'count']).reset_index()
        payment_analysis.columns = ['付款方式', '總金額', '交易次數']
        payment_analysis = payment_analysis.sort_values('總金額', ascending=False)

        col_payment1, col_payment2 = st.columns(2)

        with col_payment1:
            st.dataframe(payment_analysis, use_container_width=True)

        with col_payment2:
            fig_payment = px.bar(
                payment_analysis,
                x='付款方式',
                y='總金額',
                title='各付款方式使用情況'
            )
            st.plotly_chart(fig_payment, use_container_width=True)

    else:
        st.info("此期間無費用記錄")

# 預算管理模式
elif mode == "預算管理":
    st.header("💼 預算管理")

    # 獲取當月數據
    current_month = datetime.now().strftime("%Y-%m")
    month_start = datetime.now().replace(day=1)
    month_expenses = db.get_expenses_by_date_range(month_start.isoformat(), datetime.now().isoformat())

    categories = db.get_all_categories()

    if categories:
        st.subheader(f"📅 {current_month} 預算執行情況")

        # 計算每個分類的支出
        category_spending = {}
        for expense in month_expenses:
            cat = expense.get('category', '未分類')
            category_spending[cat] = category_spending.get(cat, 0) + expense.get('amount', 0)

        # 顯示預算執行
        for category in categories:
            cat_name = category['name']
            budget = category.get('budget', 0)
            spent = category_spending.get(cat_name, 0)

            if budget > 0:
                col1, col2 = st.columns([3, 1])

                with col1:
                    icon = category.get('icon', '📁')
                    st.write(f"{icon} **{cat_name}**")

                    # 進度條
                    percentage = min((spent / budget) * 100, 100)
                    color = "normal"
                    if percentage >= 90:
                        color = "red"
                    elif percentage >= 75:
                        color = "orange"

                    st.progress(percentage / 100)

                    col_budget1, col_budget2, col_budget3 = st.columns(3)
                    with col_budget1:
                        st.metric("預算", f"${budget:,.2f}")
                    with col_budget2:
                        st.metric("已用", f"${spent:,.2f}")
                    with col_budget3:
                        remaining = budget - spent
                        st.metric("剩餘", f"${remaining:,.2f}", delta=f"{percentage:.1f}%")

                st.markdown("---")

        # 總預算統計
        total_budget = sum(c.get('budget', 0) for c in categories)
        total_spent = sum(category_spending.values())

        st.subheader("總預算概覽")
        col_total1, col_total2, col_total3 = st.columns(3)

        with col_total1:
            st.metric("總預算", f"${total_budget:,.2f}")
        with col_total2:
            st.metric("總支出", f"${total_spent:,.2f}")
        with col_total3:
            if total_budget > 0:
                usage_pct = (total_spent / total_budget) * 100
                st.metric("預算使用率", f"{usage_pct:.1f}%")

    else:
        st.info("請先在分類管理中設定預算")

# 匯出報表模式
elif mode == "匯出報表":
    st.header("📤 匯出報表")

    report_type = st.selectbox(
        "報表類型",
        ["月度費用報表", "分類彙總報表", "年度費用報表", "自訂期間報表"]
    )

    if report_type == "月度費用報表":
        month = st.date_input("選擇月份", value=datetime.now())
        month_start = month.replace(day=1)

        # 計算月底
        if month.month == 12:
            month_end = month.replace(year=month.year + 1, month=1, day=1) - timedelta(days=1)
        else:
            month_end = month.replace(month=month.month + 1, day=1) - timedelta(days=1)

        expenses = db.get_expenses_by_date_range(month_start.isoformat(), month_end.isoformat())

        if expenses and st.button("生成報表"):
            df = pd.DataFrame(expenses)

            # 生成報表
            report = manager.generate_monthly_report(df, month_start)

            st.success("✅ 報表已生成")
            st.json(report)

            # 下載
            csv = df.to_csv(index=False, encoding='utf-8-sig')
            st.download_button(
                label="📥 下載完整數據",
                data=csv,
                file_name=f"monthly_report_{month_start.strftime('%Y-%m')}.csv",
                mime="text/csv"
            )

# 頁腳
st.markdown("---")
st.markdown(
    """
    <div style='text-align: center'>
        <p>費用追蹤器 v1.0 | Powered by Streamlit & Plotly</p>
    </div>
    """,
    unsafe_allow_html=True
)
