"""
圖像風格轉換 Streamlit Web UI
"""

import streamlit as st
from PIL import Image
import io
from pathlib import Path
from style_transfer import StyleTransfer

# 頁面配置
st.set_page_config(
    page_title="圖像風格轉換",
    page_icon="🎨",
    layout="wide"
)

# 初始化
@st.cache_resource
def load_transfer():
    return StyleTransfer()

transfer = load_transfer()

# 標題
st.title("🎨 圖像風格轉換")
st.markdown("使用神經網路將藝術風格應用到您的照片上")
st.markdown("---")

# 側邊欄設定
st.sidebar.header("⚙️ 設定")

# 模式選擇
mode = st.sidebar.radio(
    "選擇模式",
    ["使用預設風格", "上傳自定義風格"]
)

# 進階設定
with st.sidebar.expander("進階設定"):
    num_steps = st.slider("優化步數", 100, 1000, 300, 50,
                         help="步數越多，效果越好但耗時越長")
    style_weight = st.number_input("風格權重", 1e5, 1e7, 1e6, 1e5,
                                   format="%.0e",
                                   help="風格權重越高，風格效果越明顯")
    content_weight = st.number_input("內容權重", 0.1, 10.0, 1.0, 0.1,
                                    help="內容權重越高，越保留原始內容")
    max_size = st.slider("最大圖像尺寸", 256, 1024, 512, 64,
                        help="較大的尺寸需要更多記憶體和時間")

# 主要內容
col1, col2 = st.columns(2)

with col1:
    st.subheader("📷 內容圖片")
    content_file = st.file_uploader("上傳內容圖片", type=['jpg', 'jpeg', 'png'])

    if content_file:
        content_image = Image.open(content_file)
        st.image(content_image, caption="內容圖片", use_container_width=True)

with col2:
    st.subheader("🎨 風格圖片")

    if mode == "使用預設風格":
        # 列出可用的預設風格
        available_styles = transfer.list_available_styles()

        if available_styles:
            style_name = st.selectbox("選擇風格", available_styles)

            # 顯示風格預覽
            styles_dir = Path(__file__).parent / 'styles'
            style_path = styles_dir / f'{style_name}.jpg'

            if style_path.exists():
                style_image = Image.open(style_path)
                st.image(style_image, caption=f"風格: {style_name}",
                        use_container_width=True)
        else:
            st.warning("沒有可用的預設風格，請上傳自定義風格圖片")
            style_name = None

    else:  # 上傳自定義風格
        style_file = st.file_uploader("上傳風格圖片", type=['jpg', 'jpeg', 'png'])

        if style_file:
            style_image = Image.open(style_file)
            st.image(style_image, caption="風格圖片", use_container_width=True)
        else:
            style_file = None

# 轉換按鈕
st.markdown("---")

if st.button("🎨 開始轉換", type="primary", use_container_width=True):
    if not content_file:
        st.error("❌ 請上傳內容圖片")
    elif mode == "使用預設風格" and not available_styles:
        st.error("❌ 沒有可用的預設風格")
    elif mode == "上傳自定義風格" and not style_file:
        st.error("❌ 請上傳風格圖片")
    else:
        # 保存臨時檔案
        temp_content = "temp_content.jpg"
        temp_style = "temp_style.jpg"
        temp_output = "temp_output.jpg"

        # 保存內容圖片
        content_image.save(temp_content)

        # 保存或使用風格圖片
        if mode == "上傳自定義風格":
            style_image.save(temp_style)
            style_path = temp_style
        else:
            style_path = str(styles_dir / f'{style_name}.jpg')

        # 顯示進度
        progress_bar = st.progress(0)
        status_text = st.empty()

        try:
            status_text.text("正在轉換風格...")

            # 執行風格轉換
            transfer.transfer_style(
                content_image=temp_content,
                style_image=style_path,
                output_path=temp_output,
                num_steps=num_steps,
                style_weight=style_weight,
                content_weight=content_weight,
                max_size=max_size,
                verbose=False
            )

            progress_bar.progress(100)
            status_text.text("✅ 轉換完成!")

            # 顯示結果
            st.markdown("---")
            st.subheader("🖼️ 轉換結果")

            col1, col2, col3 = st.columns(3)

            with col1:
                st.image(content_image, caption="原始圖片", use_container_width=True)

            with col2:
                if mode == "使用預設風格":
                    st.image(style_image, caption=f"風格: {style_name}",
                           use_container_width=True)
                else:
                    st.image(style_image, caption="風格圖片", use_container_width=True)

            with col3:
                output_image = Image.open(temp_output)
                st.image(output_image, caption="轉換結果", use_container_width=True)

            # 下載按鈕
            buf = io.BytesIO()
            output_image.save(buf, format='JPEG')
            byte_im = buf.getvalue()

            st.download_button(
                label="📥 下載結果",
                data=byte_im,
                file_name="stylized_image.jpg",
                mime="image/jpeg",
                use_container_width=True
            )

            st.balloons()

        except Exception as e:
            status_text.text("")
            progress_bar.empty()
            st.error(f"❌ 轉換失敗: {str(e)}")

# 說明
with st.expander("ℹ️ 使用說明"):
    st.markdown("""
    ### 如何使用

    1. **上傳內容圖片**: 選擇您要轉換風格的照片
    2. **選擇風格**: 使用預設風格或上傳自定義風格圖片
    3. **調整參數** (可選):
       - **優化步數**: 越多越好，但耗時越長 (推薦: 300)
       - **風格權重**: 控制風格效果強度 (推薦: 1e6)
       - **內容權重**: 保留原始內容的程度 (推薦: 1)
    4. **開始轉換**: 點擊按鈕開始處理
    5. **下載結果**: 轉換完成後可下載圖片

    ### 技術說明

    本工具使用 **神經網路風格轉換 (Neural Style Transfer)** 技術:
    - 使用 VGG19 深度學習模型
    - 通過優化過程將風格應用到內容圖片
    - 平衡內容保留和風格效果

    ### 提示

    - GPU 會大幅加速處理速度
    - 較小的圖像尺寸處理更快
    - 風格權重越高，風格效果越明顯
    - 建議先使用預設參數，再根據需要調整
    """)

# 頁腳
st.markdown("---")
st.markdown(
    """
    <div style='text-align: center'>
        <p>圖像風格轉換 v1.0 | Powered by PyTorch & Streamlit</p>
    </div>
    """,
    unsafe_allow_html=True
)
