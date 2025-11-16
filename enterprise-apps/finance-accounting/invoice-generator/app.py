"""
發票生成器 Streamlit Web UI
"""

import streamlit as st
import pandas as pd
from datetime import datetime, timedelta
import json
from invoice_generator import InvoiceGenerator
from database.db_handler import DatabaseHandler

# 頁面配置
st.set_page_config(
    page_title="發票生成器",
    page_icon="📄",
    layout="wide"
)

# 初始化
@st.cache_resource
def load_generator():
    return InvoiceGenerator()

@st.cache_resource
def load_database():
    return DatabaseHandler()

generator = load_generator()
db = load_database()

# 標題
st.title("📄 發票生成器")
st.markdown("---")

# 側邊欄
st.sidebar.header("功能選擇")
mode = st.sidebar.selectbox(
    "選擇模式",
    ["創建發票", "查看發票", "客戶管理", "產品管理", "統計報表"]
)

# 創建發票模式
if mode == "創建發票":
    st.header("📝 創建新發票")

    col1, col2 = st.columns(2)

    with col1:
        st.subheader("客戶資訊")

        # 獲取所有客戶
        customers = db.get_all_customers()
        customer_names = [c['name'] for c in customers]

        use_existing = st.checkbox("選擇現有客戶")

        if use_existing and customers:
            selected_customer = st.selectbox("選擇客戶", customer_names)
            customer_data = next(c for c in customers if c['name'] == selected_customer)
            customer_name = customer_data['name']
            customer_email = st.text_input("客戶電子郵件", value=customer_data['email'])
            customer_address = st.text_area("客戶地址", value=customer_data['address'])
            customer_tax_id = st.text_input("客戶統一編號", value=customer_data.get('tax_id', ''))
        else:
            customer_name = st.text_input("客戶名稱")
            customer_email = st.text_input("客戶電子郵件")
            customer_address = st.text_area("客戶地址")
            customer_tax_id = st.text_input("客戶統一編號")

            if st.button("保存為新客戶") and customer_name:
                db.add_customer({
                    'name': customer_name,
                    'email': customer_email,
                    'address': customer_address,
                    'tax_id': customer_tax_id
                })
                st.success("客戶已保存")

    with col2:
        st.subheader("發票資訊")
        invoice_number = st.text_input("發票號碼", value=generator.generate_invoice_number())
        invoice_date = st.date_input("發票日期", value=datetime.now())
        due_date = st.date_input("到期日期", value=datetime.now() + timedelta(days=30))
        payment_terms = st.selectbox("付款條件", ["Net 30", "Net 15", "Net 7", "即期", "貨到付款"])
        currency = st.selectbox("幣別", ["TWD", "USD", "EUR", "JPY", "CNY"])

    st.markdown("---")
    st.subheader("📦 發票項目")

    # 獲取所有產品
    products = db.get_all_products()

    # 初始化 session state
    if 'invoice_items' not in st.session_state:
        st.session_state.invoice_items = []

    # 添加項目表單
    with st.expander("➕ 添加項目", expanded=True):
        col_a, col_b, col_c, col_d = st.columns(4)

        with col_a:
            if products:
                product_names = [p['name'] for p in products]
                selected_product = st.selectbox("選擇產品", ["自訂項目"] + product_names)
                if selected_product != "自訂項目":
                    product_data = next(p for p in products if p['name'] == selected_product)
                    item_description = product_data['name']
                    item_price = product_data['price']
                else:
                    item_description = st.text_input("項目描述", key="item_desc")
                    item_price = st.number_input("單價", min_value=0.0, value=0.0, key="item_price")
            else:
                item_description = st.text_input("項目描述")
                item_price = st.number_input("單價", min_value=0.0, value=0.0)

        with col_b:
            item_quantity = st.number_input("數量", min_value=1, value=1)

        with col_c:
            item_tax_rate = st.number_input("稅率 (%)", min_value=0.0, max_value=100.0, value=5.0)

        with col_d:
            st.write("")  # 空白用於對齊
            st.write("")
            if st.button("加入項目"):
                if item_description and item_price > 0:
                    st.session_state.invoice_items.append({
                        'description': item_description,
                        'quantity': item_quantity,
                        'unit_price': item_price,
                        'tax_rate': item_tax_rate
                    })
                    st.success("項目已加入")
                    st.rerun()

    # 顯示項目列表
    if st.session_state.invoice_items:
        st.subheader("發票項目列表")

        items_df = pd.DataFrame(st.session_state.invoice_items)
        items_df['小計'] = items_df['quantity'] * items_df['unit_price']
        items_df['稅額'] = items_df['小計'] * items_df['tax_rate'] / 100
        items_df['總計'] = items_df['小計'] + items_df['稅額']

        # 重命名欄位
        display_df = items_df.rename(columns={
            'description': '項目',
            'quantity': '數量',
            'unit_price': '單價',
            'tax_rate': '稅率(%)'
        })

        st.dataframe(display_df, use_container_width=True)

        # 計算總計
        subtotal = items_df['小計'].sum()
        total_tax = items_df['稅額'].sum()
        total = items_df['總計'].sum()

        col_total1, col_total2 = st.columns([3, 1])
        with col_total2:
            st.metric("小計", f"{currency} {subtotal:,.2f}")
            st.metric("稅額", f"{currency} {total_tax:,.2f}")
            st.metric("總計", f"{currency} {total:,.2f}", delta=None)

        # 清空項目按鈕
        if st.button("清空所有項目"):
            st.session_state.invoice_items = []
            st.rerun()

    st.markdown("---")

    # 備註
    notes = st.text_area("備註", placeholder="付款說明、感謝語等...")

    # 生成發票按鈕
    col_btn1, col_btn2, col_btn3 = st.columns(3)

    with col_btn1:
        if st.button("💾 保存發票", type="primary") and customer_name and st.session_state.invoice_items:
            invoice_data = {
                'invoice_number': invoice_number,
                'customer': {
                    'name': customer_name,
                    'email': customer_email,
                    'address': customer_address,
                    'tax_id': customer_tax_id
                },
                'invoice_date': invoice_date.isoformat(),
                'due_date': due_date.isoformat(),
                'payment_terms': payment_terms,
                'currency': currency,
                'items': st.session_state.invoice_items,
                'notes': notes,
                'status': 'draft'
            }

            db.save_invoice(invoice_data)
            st.success(f"✅ 發票 {invoice_number} 已保存")

    with col_btn2:
        if st.button("📄 生成 PDF") and customer_name and st.session_state.invoice_items:
            invoice_data = {
                'invoice_number': invoice_number,
                'customer': {
                    'name': customer_name,
                    'email': customer_email,
                    'address': customer_address,
                    'tax_id': customer_tax_id
                },
                'invoice_date': invoice_date.isoformat(),
                'due_date': due_date.isoformat(),
                'payment_terms': payment_terms,
                'currency': currency,
                'items': st.session_state.invoice_items,
                'notes': notes
            }

            pdf_path = generator.generate_pdf(invoice_data)

            with open(pdf_path, 'rb') as f:
                st.download_button(
                    label="⬇️ 下載 PDF",
                    data=f,
                    file_name=f"invoice_{invoice_number}.pdf",
                    mime="application/pdf"
                )

    with col_btn3:
        if st.button("🔄 重置表單"):
            st.session_state.invoice_items = []
            st.rerun()

# 查看發票模式
elif mode == "查看發票":
    st.header("📋 查看發票")

    invoices = db.get_all_invoices()

    if invoices:
        # 篩選選項
        col_filter1, col_filter2, col_filter3 = st.columns(3)

        with col_filter1:
            status_filter = st.selectbox("狀態", ["全部", "draft", "sent", "paid", "overdue"])

        with col_filter2:
            customer_filter = st.text_input("客戶名稱搜尋")

        with col_filter3:
            sort_by = st.selectbox("排序", ["日期 (新到舊)", "日期 (舊到新)", "金額 (高到低)", "金額 (低到高)"])

        # 處理發票數據
        invoices_list = []
        for inv in invoices:
            total = sum(item['quantity'] * item['unit_price'] * (1 + item['tax_rate']/100)
                       for item in inv.get('items', []))
            invoices_list.append({
                '發票號碼': inv['invoice_number'],
                '客戶': inv['customer']['name'],
                '日期': inv['invoice_date'],
                '到期日': inv['due_date'],
                '金額': total,
                '狀態': inv.get('status', 'draft'),
                '幣別': inv['currency']
            })

        df = pd.DataFrame(invoices_list)

        # 應用篩選
        if status_filter != "全部":
            df = df[df['狀態'] == status_filter]

        if customer_filter:
            df = df[df['客戶'].str.contains(customer_filter, case=False, na=False)]

        # 應用排序
        if sort_by == "日期 (新到舊)":
            df = df.sort_values('日期', ascending=False)
        elif sort_by == "日期 (舊到新)":
            df = df.sort_values('日期', ascending=True)
        elif sort_by == "金額 (高到低)":
            df = df.sort_values('金額', ascending=False)
        elif sort_by == "金額 (低到高)":
            df = df.sort_values('金額', ascending=True)

        st.dataframe(df, use_container_width=True)

        # 統計資訊
        st.markdown("---")
        col_stat1, col_stat2, col_stat3, col_stat4 = st.columns(4)

        with col_stat1:
            st.metric("發票總數", len(df))
        with col_stat2:
            st.metric("總金額", f"{df['金額'].sum():,.2f}")
        with col_stat3:
            paid_count = len(df[df['狀態'] == 'paid'])
            st.metric("已付款", paid_count)
        with col_stat4:
            overdue_count = len(df[df['狀態'] == 'overdue'])
            st.metric("逾期", overdue_count)
    else:
        st.info("尚無發票記錄")

# 客戶管理模式
elif mode == "客戶管理":
    st.header("👥 客戶管理")

    tab1, tab2 = st.tabs(["客戶列表", "新增客戶"])

    with tab1:
        customers = db.get_all_customers()

        if customers:
            df = pd.DataFrame(customers)
            st.dataframe(df, use_container_width=True)
            st.metric("客戶總數", len(customers))
        else:
            st.info("尚無客戶記錄")

    with tab2:
        with st.form("add_customer_form"):
            name = st.text_input("客戶名稱*")
            email = st.text_input("電子郵件*")
            phone = st.text_input("電話")
            address = st.text_area("地址")
            tax_id = st.text_input("統一編號")

            submitted = st.form_submit_button("新增客戶")

            if submitted and name and email:
                db.add_customer({
                    'name': name,
                    'email': email,
                    'phone': phone,
                    'address': address,
                    'tax_id': tax_id
                })
                st.success(f"✅ 客戶 {name} 已新增")
                st.rerun()

# 產品管理模式
elif mode == "產品管理":
    st.header("📦 產品管理")

    tab1, tab2 = st.tabs(["產品列表", "新增產品"])

    with tab1:
        products = db.get_all_products()

        if products:
            df = pd.DataFrame(products)
            st.dataframe(df, use_container_width=True)
            st.metric("產品總數", len(products))
        else:
            st.info("尚無產品記錄")

    with tab2:
        with st.form("add_product_form"):
            name = st.text_input("產品名稱*")
            description = st.text_area("產品描述")
            price = st.number_input("價格*", min_value=0.0, value=0.0)
            category = st.text_input("類別")
            sku = st.text_input("SKU/產品編號")

            submitted = st.form_submit_button("新增產品")

            if submitted and name and price > 0:
                db.add_product({
                    'name': name,
                    'description': description,
                    'price': price,
                    'category': category,
                    'sku': sku
                })
                st.success(f"✅ 產品 {name} 已新增")
                st.rerun()

# 統計報表模式
elif mode == "統計報表":
    st.header("📊 統計報表")

    invoices = db.get_all_invoices()

    if invoices:
        # 計算統計數據
        total_amount = 0
        status_counts = {'draft': 0, 'sent': 0, 'paid': 0, 'overdue': 0}
        monthly_revenue = {}

        for inv in invoices:
            amount = sum(item['quantity'] * item['unit_price'] * (1 + item['tax_rate']/100)
                        for item in inv.get('items', []))
            total_amount += amount

            status = inv.get('status', 'draft')
            status_counts[status] = status_counts.get(status, 0) + 1

            # 按月統計
            month = inv['invoice_date'][:7]  # YYYY-MM
            monthly_revenue[month] = monthly_revenue.get(month, 0) + amount

        # 顯示統計
        col1, col2, col3, col4 = st.columns(4)

        with col1:
            st.metric("總營收", f"${total_amount:,.2f}")
        with col2:
            st.metric("發票總數", len(invoices))
        with col3:
            st.metric("已付款", status_counts.get('paid', 0))
        with col4:
            st.metric("逾期", status_counts.get('overdue', 0))

        st.markdown("---")

        # 狀態分布
        col_chart1, col_chart2 = st.columns(2)

        with col_chart1:
            st.subheader("發票狀態分布")
            status_df = pd.DataFrame(list(status_counts.items()), columns=['狀態', '數量'])
            st.bar_chart(status_df.set_index('狀態'))

        with col_chart2:
            st.subheader("月度營收趨勢")
            if monthly_revenue:
                revenue_df = pd.DataFrame(list(monthly_revenue.items()), columns=['月份', '營收'])
                revenue_df = revenue_df.sort_values('月份')
                st.line_chart(revenue_df.set_index('月份'))
    else:
        st.info("尚無數據可供分析")

# 頁腳
st.markdown("---")
st.markdown(
    """
    <div style='text-align: center'>
        <p>發票生成器 v1.0 | Powered by Streamlit</p>
    </div>
    """,
    unsafe_allow_html=True
)
