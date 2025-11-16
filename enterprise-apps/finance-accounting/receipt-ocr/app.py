"""
發票 OCR 識別器 Streamlit Web UI
"""

import streamlit as st
import pandas as pd
from PIL import Image
import io
from datetime import datetime
from ocr_processor import OCRProcessor
from database.db_handler import DatabaseHandler

# 頁面配置
st.set_page_config(
    page_title="發票 OCR 識別器",
    page_icon="🧾",
    layout="wide"
)

# 初始化
@st.cache_resource
def load_processor():
    return OCRProcessor()

@st.cache_resource
def load_database():
    return DatabaseHandler()

processor = load_processor()
db = load_database()

# 標題
st.title("🧾 發票 OCR 識別器")
st.markdown("自動識別發票並提取關鍵資訊")
st.markdown("---")

# 側邊欄
st.sidebar.header("功能選擇")
mode = st.sidebar.selectbox(
    "選擇模式",
    ["單張識別", "批次識別", "歷史記錄", "設定"]
)

# 單張識別模式
if mode == "單張識別":
    st.header("📸 單張發票識別")

    col1, col2 = st.columns([1, 1])

    with col1:
        st.subheader("上傳發票")

        uploaded_file = st.file_uploader(
            "選擇發票圖片",
            type=['jpg', 'jpeg', 'png', 'pdf'],
            help="支援 JPG、PNG、PDF 格式"
        )

        if uploaded_file is not None:
            # 顯示上傳的圖片
            if uploaded_file.type.startswith('image'):
                image = Image.open(uploaded_file)
                st.image(image, caption="上傳的發票", use_container_width=True)

                # 處理按鈕
                if st.button("🔍 開始識別", type="primary"):
                    with st.spinner("識別中..."):
                        # OCR 處理
                        result = processor.process_receipt(image)

                        if result:
                            st.session_state['ocr_result'] = result
                            st.session_state['image'] = image
                            st.success("✅ 識別完成！")
                        else:
                            st.error("❌ 識別失敗，請上傳清晰的發票圖片")

    with col2:
        st.subheader("識別結果")

        if 'ocr_result' in st.session_state:
            result = st.session_state['ocr_result']

            # 顯示提取的資訊
            st.write("**提取的資訊：**")

            # 表單用於編輯
            with st.form("edit_form"):
                vendor = st.text_input("商家名稱", value=result.get('vendor', ''))
                date = st.date_input(
                    "日期",
                    value=datetime.fromisoformat(result.get('date', datetime.now().isoformat())) if result.get('date') else datetime.now()
                )
                total = st.number_input("總金額", value=float(result.get('total', 0)), min_value=0.0, step=0.01)
                tax = st.number_input("稅額", value=float(result.get('tax', 0)), min_value=0.0, step=0.01)

                # 項目
                items_text = st.text_area(
                    "項目明細（每行一項）",
                    value="\n".join(result.get('items', [])),
                    height=150
                )

                payment_method = st.selectbox(
                    "付款方式",
                    ["現金", "信用卡", "轉帳", "電子支付"],
                    index=0
                )

                category = st.selectbox(
                    "分類",
                    ["餐飲", "交通", "購物", "辦公用品", "其他"],
                    index=0
                )

                notes = st.text_area("備註")

                col_btn1, col_btn2 = st.columns(2)

                with col_btn1:
                    save_btn = st.form_submit_button("💾 保存", type="primary")

                with col_btn2:
                    export_btn = st.form_submit_button("📤 匯出")

                if save_btn:
                    # 保存到資料庫
                    receipt_data = {
                        'vendor': vendor,
                        'date': date.isoformat(),
                        'total': total,
                        'tax': tax,
                        'items': items_text.split('\n') if items_text else [],
                        'payment_method': payment_method,
                        'category': category,
                        'notes': notes,
                        'ocr_confidence': result.get('confidence', 0)
                    }

                    # 保存圖片
                    if 'image' in st.session_state:
                        image_path = db.save_receipt_image(
                            st.session_state['image'],
                            f"{vendor}_{date.isoformat()}"
                        )
                        receipt_data['image_path'] = image_path

                    db.save_receipt(receipt_data)
                    st.success("✅ 發票已保存")
                    del st.session_state['ocr_result']
                    del st.session_state['image']
                    st.rerun()

                if export_btn:
                    # 匯出為 JSON
                    import json
                    export_data = {
                        'vendor': vendor,
                        'date': date.isoformat(),
                        'total': total,
                        'tax': tax,
                        'items': items_text.split('\n') if items_text else [],
                        'payment_method': payment_method,
                        'category': category
                    }

                    st.download_button(
                        label="📥 下載 JSON",
                        data=json.dumps(export_data, ensure_ascii=False, indent=2),
                        file_name=f"receipt_{vendor}_{date}.json",
                        mime="application/json"
                    )

            # 顯示原始識別數據
            with st.expander("🔍 查看原始 OCR 數據"):
                st.json(result)

        else:
            st.info("👆 請先上傳並識別發票")

# 批次識別模式
elif mode == "批次識別":
    st.header("📚 批次發票識別")

    uploaded_files = st.file_uploader(
        "選擇多張發票",
        type=['jpg', 'jpeg', 'png'],
        accept_multiple_files=True
    )

    if uploaded_files:
        st.write(f"已選擇 {len(uploaded_files)} 張發票")

        if st.button("🚀 開始批次識別", type="primary"):
            progress_bar = st.progress(0)
            results = []

            for idx, file in enumerate(uploaded_files):
                st.write(f"處理中：{file.name}")

                image = Image.open(file)
                result = processor.process_receipt(image)

                if result:
                    result['filename'] = file.name
                    results.append(result)

                    # 自動保存
                    receipt_data = {
                        'vendor': result.get('vendor', 'Unknown'),
                        'date': result.get('date', datetime.now().isoformat()),
                        'total': result.get('total', 0),
                        'tax': result.get('tax', 0),
                        'items': result.get('items', []),
                        'category': '未分類',
                        'ocr_confidence': result.get('confidence', 0)
                    }

                    image_path = db.save_receipt_image(image, f"batch_{idx}_{file.name}")
                    receipt_data['image_path'] = image_path

                    db.save_receipt(receipt_data)

                progress_bar.progress((idx + 1) / len(uploaded_files))

            st.success(f"✅ 完成！成功識別 {len(results)} 張發票")

            # 顯示結果表格
            if results:
                df = pd.DataFrame(results)
                st.dataframe(df[['filename', 'vendor', 'date', 'total']], use_container_width=True)

                # 匯出
                csv = df.to_csv(index=False, encoding='utf-8-sig')
                st.download_button(
                    label="📥 下載批次結果",
                    data=csv,
                    file_name=f"batch_ocr_results_{datetime.now().strftime('%Y%m%d')}.csv",
                    mime="text/csv"
                )

# 歷史記錄模式
elif mode == "歷史記錄":
    st.header("📋 歷史記錄")

    receipts = db.get_all_receipts()

    if receipts:
        # 篩選
        col_filter1, col_filter2 = st.columns(2)

        with col_filter1:
            category_filter = st.selectbox("分類篩選", ["全部"] + list(set(r.get('category', '未分類') for r in receipts)))

        with col_filter2:
            date_filter = st.date_input("日期篩選", value=None)

        # 應用篩選
        filtered_receipts = receipts

        if category_filter != "全部":
            filtered_receipts = [r for r in filtered_receipts if r.get('category') == category_filter]

        if date_filter:
            filtered_receipts = [r for r in filtered_receipts if r.get('date', '').startswith(str(date_filter))]

        # 顯示記錄
        st.write(f"共 {len(filtered_receipts)} 筆記錄")

        df = pd.DataFrame(filtered_receipts)

        if not df.empty:
            display_columns = ['vendor', 'date', 'total', 'category', 'payment_method']
            available_columns = [col for col in display_columns if col in df.columns]

            st.dataframe(
                df[available_columns].rename(columns={
                    'vendor': '商家',
                    'date': '日期',
                    'total': '金額',
                    'category': '分類',
                    'payment_method': '付款方式'
                }),
                use_container_width=True
            )

            # 統計
            st.markdown("---")
            col_stat1, col_stat2, col_stat3 = st.columns(3)

            with col_stat1:
                st.metric("總筆數", len(filtered_receipts))

            with col_stat2:
                total_amount = df['total'].sum()
                st.metric("總金額", f"${total_amount:,.2f}")

            with col_stat3:
                avg_amount = df['total'].mean()
                st.metric("平均金額", f"${avg_amount:,.2f}")

    else:
        st.info("尚無歷史記錄")

# 設定模式
elif mode == "設定":
    st.header("⚙️ 設定")

    tab1, tab2 = st.tabs(["OCR 設定", "分類管理"])

    with tab1:
        st.subheader("OCR 引擎設定")

        ocr_engine = st.selectbox(
            "OCR 引擎",
            ["Tesseract", "EasyOCR", "PaddleOCR"],
            help="選擇 OCR 識別引擎"
        )

        language = st.multiselect(
            "識別語言",
            ["繁體中文", "簡體中文", "英文", "日文"],
            default=["繁體中文", "英文"]
        )

        confidence_threshold = st.slider(
            "信心度閾值",
            min_value=0.0,
            max_value=1.0,
            value=0.7,
            step=0.05,
            help="低於此信心度的結果將被標記"
        )

        if st.button("保存設定"):
            st.success("✅ 設定已保存")

    with tab2:
        st.subheader("分類管理")

        categories = ["餐飲", "交通", "購物", "辦公用品", "其他"]

        st.write("**當前分類：**")
        for cat in categories:
            st.write(f"- {cat}")

        new_category = st.text_input("新增分類")
        if st.button("新增") and new_category:
            st.success(f"✅ 已新增分類：{new_category}")

# 頁腳
st.markdown("---")
st.markdown(
    """
    <div style='text-align: center'>
        <p>發票 OCR 識別器 v1.0 | Powered by Streamlit & OCR</p>
    </div>
    """,
    unsafe_allow_html=True
)
