"""
背景移除 Streamlit Web UI
"""

import streamlit as st
from PIL import Image
import io
from bg_remover import BackgroundRemover

# 頁面配置
st.set_page_config(
    page_title="背景移除工具",
    page_icon="✂️",
    layout="wide"
)

# 初始化
@st.cache_resource
def load_remover():
    return BackgroundRemover()

remover = load_remover()

# 標題
st.title("✂️ AI 背景移除工具")
st.markdown("使用 AI 自動移除圖片背景，支援透明背景、替換背景、模糊背景等功能")
st.markdown("---")

# 側邊欄
st.sidebar.header("⚙️ 功能選擇")

mode = st.sidebar.radio(
    "選擇模式",
    ["移除背景", "模糊背景", "替換背景"]
)

# 主要內容
if mode == "移除背景":
    st.header("✂️ 移除背景")

    col1, col2 = st.columns(2)

    with col1:
        st.subheader("上傳圖片")
        uploaded_file = st.file_uploader("選擇圖片", type=['jpg', 'jpeg', 'png', 'bmp', 'webp'])

        if uploaded_file:
            image = Image.open(uploaded_file)
            st.image(image, caption="原始圖片", use_container_width=True)

    with col2:
        st.subheader("背景設定")

        bg_option = st.radio(
            "背景類型",
            ["透明背景", "純色背景"]
        )

        if bg_option == "純色背景":
            color_preset = st.selectbox(
                "選擇顏色",
                ["白色", "黑色", "紅色", "藍色", "綠色", "自定義"]
            )

            if color_preset == "自定義":
                bg_color_hex = st.color_picker("選擇背景顏色", "#FFFFFF")
                # 轉換 HEX 到 RGB
                bg_color = tuple(int(bg_color_hex[i:i+2], 16) for i in (1, 3, 5))
            else:
                color_map = {
                    "白色": (255, 255, 255),
                    "黑色": (0, 0, 0),
                    "紅色": (255, 0, 0),
                    "藍色": (0, 0, 255),
                    "綠色": (0, 255, 0)
                }
                bg_color = color_map[color_preset]
        else:
            bg_color = None

        # 進階設定
        with st.expander("進階設定"):
            alpha_matting = st.checkbox("啟用 Alpha Matting (更精確的邊緣)", value=False)

            if alpha_matting:
                fg_threshold = st.slider("前景閾值", 100, 255, 240)
                bg_threshold = st.slider("背景閾值", 0, 50, 10)
            else:
                fg_threshold = 240
                bg_threshold = 10

    # 處理按鈕
    if uploaded_file and st.button("🚀 開始處理", type="primary", use_container_width=True):
        with st.spinner("處理中..."):
            # 保存臨時檔案
            temp_input = "temp_input.jpg"
            temp_output = "temp_output.png" if bg_color is None else "temp_output.jpg"

            image.save(temp_input)

            # 移除背景
            remover.remove_background(
                temp_input,
                temp_output,
                bg_color=bg_color,
                alpha_matting=alpha_matting,
                alpha_matting_foreground_threshold=fg_threshold,
                alpha_matting_background_threshold=bg_threshold
            )

            # 顯示結果
            st.markdown("---")
            st.subheader("✨ 處理結果")

            col1, col2 = st.columns(2)

            with col1:
                st.image(image, caption="原始圖片", use_container_width=True)

            with col2:
                output_image = Image.open(temp_output)
                st.image(output_image, caption="處理後", use_container_width=True)

            # 下載按鈕
            buf = io.BytesIO()
            if bg_color is None:
                output_image.save(buf, format='PNG')
                file_ext = "png"
                mime_type = "image/png"
            else:
                output_image.save(buf, format='JPEG')
                file_ext = "jpg"
                mime_type = "image/jpeg"

            byte_im = buf.getvalue()

            st.download_button(
                label=f"📥 下載結果 (.{file_ext})",
                data=byte_im,
                file_name=f"no_background.{file_ext}",
                mime=mime_type,
                use_container_width=True
            )

            st.balloons()

elif mode == "模糊背景":
    st.header("🌫️ 模糊背景")

    col1, col2 = st.columns(2)

    with col1:
        st.subheader("上傳圖片")
        uploaded_file = st.file_uploader("選擇圖片", type=['jpg', 'jpeg', 'png'])

        if uploaded_file:
            image = Image.open(uploaded_file)
            st.image(image, caption="原始圖片", use_container_width=True)

    with col2:
        st.subheader("模糊設定")
        blur_strength = st.slider(
            "模糊強度",
            1, 99, 25, 2,
            help="數值越大，背景越模糊"
        )

        # 確保是奇數
        if blur_strength % 2 == 0:
            blur_strength += 1

        st.info(f"當前模糊強度: {blur_strength}")

    # 處理按鈕
    if uploaded_file and st.button("🚀 開始處理", type="primary", use_container_width=True):
        with st.spinner("處理中..."):
            temp_input = "temp_input.jpg"
            temp_output = "temp_blur.jpg"

            image.save(temp_input)

            # 模糊背景
            remover.blur_background(temp_input, temp_output, blur_strength=blur_strength)

            # 顯示結果
            st.markdown("---")
            st.subheader("✨ 處理結果")

            col1, col2 = st.columns(2)

            with col1:
                st.image(image, caption="原始圖片", use_container_width=True)

            with col2:
                output_image = Image.open(temp_output)
                st.image(output_image, caption="模糊背景", use_container_width=True)

            # 下載
            buf = io.BytesIO()
            output_image.save(buf, format='JPEG')
            byte_im = buf.getvalue()

            st.download_button(
                label="📥 下載結果",
                data=byte_im,
                file_name="blurred_background.jpg",
                mime="image/jpeg",
                use_container_width=True
            )

            st.balloons()

elif mode == "替換背景":
    st.header("🖼️ 替換背景")

    col1, col2 = st.columns(2)

    with col1:
        st.subheader("主體圖片")
        subject_file = st.file_uploader("上傳主體圖片", type=['jpg', 'jpeg', 'png'])

        if subject_file:
            subject_image = Image.open(subject_file)
            st.image(subject_image, caption="主體", use_container_width=True)

    with col2:
        st.subheader("背景圖片")
        bg_file = st.file_uploader("上傳背景圖片", type=['jpg', 'jpeg', 'png'])

        if bg_file:
            bg_image = Image.open(bg_file)
            st.image(bg_image, caption="背景", use_container_width=True)

    # 設定
    st.subheader("合成設定")
    resize_mode = st.selectbox(
        "背景調整模式",
        ["cover", "contain", "stretch"],
        help="cover: 覆蓋 | contain: 包含 | stretch: 拉伸"
    )

    # 處理按鈕
    if subject_file and bg_file and st.button("🚀 開始合成", type="primary", use_container_width=True):
        with st.spinner("處理中..."):
            temp_subject = "temp_subject.jpg"
            temp_bg = "temp_bg.jpg"
            temp_output = "temp_replace.jpg"

            subject_image.save(temp_subject)
            bg_image.save(temp_bg)

            # 替換背景
            remover.replace_background(
                temp_subject,
                temp_bg,
                temp_output,
                resize_mode=resize_mode
            )

            # 顯示結果
            st.markdown("---")
            st.subheader("✨ 合成結果")

            col1, col2, col3 = st.columns(3)

            with col1:
                st.image(subject_image, caption="主體", use_container_width=True)

            with col2:
                st.image(bg_image, caption="背景", use_container_width=True)

            with col3:
                output_image = Image.open(temp_output)
                st.image(output_image, caption="合成結果", use_container_width=True)

            # 下載
            buf = io.BytesIO()
            output_image.save(buf, format='JPEG')
            byte_im = buf.getvalue()

            st.download_button(
                label="📥 下載結果",
                data=byte_im,
                file_name="replaced_background.jpg",
                mime="image/jpeg",
                use_container_width=True
            )

            st.balloons()

# 使用說明
with st.sidebar.expander("ℹ️ 使用說明"):
    st.markdown("""
    ### 功能說明

    **移除背景**
    - 自動識別主體並移除背景
    - 支援透明背景 (PNG)
    - 支援純色背景

    **模糊背景**
    - 保留主體清晰
    - 背景高斯模糊
    - 可調整模糊強度

    **替換背景**
    - 移除原背景
    - 合成新背景圖片
    - 多種調整模式

    ### 使用提示

    - 主體清晰的圖片效果最佳
    - 支援人物、產品、動物等
    - 建議使用高解析度圖片
    - 複雜邊緣 (如頭髮) 會自動優化
    """)

# 頁腳
st.markdown("---")
st.markdown(
    """
    <div style='text-align: center'>
        <p>背景移除工具 v1.0 | Powered by rembg & U2-Net</p>
    </div>
    """,
    unsafe_allow_html=True
)
