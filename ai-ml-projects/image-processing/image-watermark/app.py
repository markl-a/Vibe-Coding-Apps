"""
圖像浮水印 Streamlit Web UI
"""

import streamlit as st
from PIL import Image
import io
from watermark import WatermarkTool

# 頁面配置
st.set_page_config(
    page_title="圖像浮水印工具",
    page_icon="💧",
    layout="wide"
)

# 初始化
@st.cache_resource
def load_tool():
    return WatermarkTool()

tool = load_tool()

# 標題
st.title("💧 圖像浮水印工具")
st.markdown("專業的圖像浮水印添加工具，支援文字、圖片、平鋪等多種浮水印樣式")
st.markdown("---")

# 側邊欄
st.sidebar.header("🛠️ 功能選擇")

mode = st.sidebar.radio(
    "選擇浮水印類型",
    ["文字浮水印", "圖片浮水印", "平鋪浮水印", "邊框浮水印"]
)

# 文字浮水印模式
if mode == "文字浮水印":
    st.header("📝 文字浮水印")

    col1, col2 = st.columns(2)

    with col1:
        st.subheader("上傳圖片")
        uploaded_file = st.file_uploader("選擇圖片", type=['jpg', 'jpeg', 'png'])

        if uploaded_file:
            image = Image.open(uploaded_file)
            st.image(image, caption="原始圖片", use_container_width=True)

        st.subheader("浮水印設定")

        text = st.text_input("浮水印文字", "© 2024 Your Name")

        position = st.selectbox(
            "位置",
            ["bottom-right", "bottom-left", "top-right", "top-left", "center"]
        )

        col_a, col_b = st.columns(2)

        with col_a:
            font_size = st.slider("字體大小", 12, 120, 48)
            opacity = st.slider("透明度", 0.0, 1.0, 0.5, 0.05)

        with col_b:
            angle = st.slider("旋轉角度", -45, 45, 0)
            margin = st.slider("邊距", 0, 100, 20)

        font_color_hex = st.color_picker("字體顏色", "#FFFFFF")
        font_color = tuple(int(font_color_hex[i:i+2], 16) for i in (1, 3, 5))

    with col2:
        st.subheader("預覽")

        if uploaded_file and st.button("🎨 添加浮水印", type="primary", use_container_width=True):
            if text:
                with st.spinner("處理中..."):
                    temp_input = "temp_input.jpg"
                    temp_output = "temp_watermarked.png"

                    image.save(temp_input)

                    tool.add_text_watermark(
                        temp_input,
                        temp_output,
                        text=text,
                        position=position,
                        font_size=font_size,
                        font_color=font_color,
                        opacity=opacity,
                        angle=angle,
                        margin=margin
                    )

                    watermarked = Image.open(temp_output)
                    st.image(watermarked, caption="添加浮水印後", use_container_width=True)

                    # 下載
                    buf = io.BytesIO()
                    watermarked.save(buf, format='PNG')
                    byte_im = buf.getvalue()

                    st.download_button(
                        label="📥 下載圖片",
                        data=byte_im,
                        file_name="watermarked.png",
                        mime="image/png",
                        use_container_width=True
                    )

                    st.success("✅ 浮水印已添加!")
            else:
                st.error("請輸入浮水印文字")

# 圖片浮水印模式
elif mode == "圖片浮水印":
    st.header("🖼️ 圖片浮水印")

    col1, col2 = st.columns(2)

    with col1:
        st.subheader("上傳圖片")
        uploaded_file = st.file_uploader("選擇主圖片", type=['jpg', 'jpeg', 'png'])

        if uploaded_file:
            image = Image.open(uploaded_file)
            st.image(image, caption="原始圖片", use_container_width=True)

        st.subheader("浮水印圖片")
        watermark_file = st.file_uploader("選擇浮水印圖片 (Logo)", type=['png', 'jpg', 'jpeg'])

        if watermark_file:
            watermark_img = Image.open(watermark_file)
            st.image(watermark_img, caption="浮水印", width=200)

        st.subheader("設定")

        position = st.selectbox(
            "位置",
            ["bottom-right", "bottom-left", "top-right", "top-left", "center"]
        )

        col_a, col_b = st.columns(2)

        with col_a:
            scale = st.slider("大小比例", 0.05, 0.5, 0.2, 0.05)
            opacity = st.slider("透明度", 0.0, 1.0, 0.7, 0.05)

        with col_b:
            angle = st.slider("旋轉角度", -45, 45, 0)
            margin = st.slider("邊距", 0, 100, 20)

    with col2:
        st.subheader("預覽")

        if uploaded_file and watermark_file and st.button("🎨 添加浮水印", type="primary", use_container_width=True):
            with st.spinner("處理中..."):
                temp_input = "temp_input.jpg"
                temp_watermark = "temp_watermark.png"
                temp_output = "temp_watermarked.png"

                image.save(temp_input)
                watermark_img.save(temp_watermark)

                tool.add_image_watermark(
                    temp_input,
                    temp_output,
                    watermark_path=temp_watermark,
                    position=position,
                    scale=scale,
                    opacity=opacity,
                    angle=angle,
                    margin=margin
                )

                watermarked = Image.open(temp_output)
                st.image(watermarked, caption="添加浮水印後", use_container_width=True)

                # 下載
                buf = io.BytesIO()
                watermarked.save(buf, format='PNG')
                byte_im = buf.getvalue()

                st.download_button(
                    label="📥 下載圖片",
                    data=byte_im,
                    file_name="watermarked.png",
                    mime="image/png",
                    use_container_width=True
                )

                st.success("✅ 浮水印已添加!")

# 平鋪浮水印模式
elif mode == "平鋪浮水印":
    st.header("🔲 平鋪浮水印")

    col1, col2 = st.columns(2)

    with col1:
        st.subheader("上傳圖片")
        uploaded_file = st.file_uploader("選擇圖片", type=['jpg', 'jpeg', 'png'])

        if uploaded_file:
            image = Image.open(uploaded_file)
            st.image(image, caption="原始圖片", use_container_width=True)

        st.subheader("浮水印設定")

        text = st.text_input("浮水印文字", "CONFIDENTIAL")

        col_a, col_b = st.columns(2)

        with col_a:
            spacing = st.slider("間距", 50, 500, 200)
            opacity = st.slider("透明度", 0.0, 0.5, 0.1, 0.05)

        with col_b:
            angle = st.slider("旋轉角度", -90, 90, 45)
            font_size = st.slider("字體大小", 12, 100, 48)

        font_color_hex = st.color_picker("字體顏色", "#808080")
        font_color = tuple(int(font_color_hex[i:i+2], 16) for i in (1, 3, 5))

    with col2:
        st.subheader("預覽")

        if uploaded_file and st.button("🎨 添加浮水印", type="primary", use_container_width=True):
            if text:
                with st.spinner("處理中..."):
                    temp_input = "temp_input.jpg"
                    temp_output = "temp_tiled.png"

                    image.save(temp_input)

                    tool.add_tiled_watermark(
                        temp_input,
                        temp_output,
                        text=text,
                        spacing=spacing,
                        opacity=opacity,
                        angle=angle,
                        font_size=font_size,
                        font_color=font_color
                    )

                    watermarked = Image.open(temp_output)
                    st.image(watermarked, caption="添加浮水印後", use_container_width=True)

                    # 下載
                    buf = io.BytesIO()
                    watermarked.save(buf, format='PNG')
                    byte_im = buf.getvalue()

                    st.download_button(
                        label="📥 下載圖片",
                        data=byte_im,
                        file_name="tiled_watermark.png",
                        mime="image/png",
                        use_container_width=True
                    )

                    st.success("✅ 浮水印已添加!")
            else:
                st.error("請輸入浮水印文字")

# 邊框浮水印模式
elif mode == "邊框浮水印":
    st.header("📏 邊框浮水印")

    col1, col2 = st.columns(2)

    with col1:
        st.subheader("上傳圖片")
        uploaded_file = st.file_uploader("選擇圖片", type=['jpg', 'jpeg', 'png'])

        if uploaded_file:
            image = Image.open(uploaded_file)
            st.image(image, caption="原始圖片", use_container_width=True)

        st.subheader("邊框設定")

        text = st.text_input("浮水印文字", "© 2024 Your Name | www.example.com")

        col_a, col_b = st.columns(2)

        with col_a:
            border_height = st.slider("邊框高度", 30, 150, 50)
            font_size = st.slider("字體大小", 12, 48, 24)

        with col_b:
            bg_color_hex = st.color_picker("背景色", "#000000")
            bg_color = tuple(int(bg_color_hex[i:i+2], 16) for i in (1, 3, 5))

            text_color_hex = st.color_picker("文字色", "#FFFFFF")
            text_color = tuple(int(text_color_hex[i:i+2], 16) for i in (1, 3, 5))

    with col2:
        st.subheader("預覽")

        if uploaded_file and st.button("🎨 添加浮水印", type="primary", use_container_width=True):
            if text:
                with st.spinner("處理中..."):
                    temp_input = "temp_input.jpg"
                    temp_output = "temp_border.jpg"

                    image.save(temp_input)

                    tool.add_border_watermark(
                        temp_input,
                        temp_output,
                        text=text,
                        border_height=border_height,
                        bg_color=bg_color,
                        text_color=text_color,
                        font_size=font_size
                    )

                    watermarked = Image.open(temp_output)
                    st.image(watermarked, caption="添加邊框後", use_container_width=True)

                    # 下載
                    buf = io.BytesIO()
                    watermarked.save(buf, format='JPEG')
                    byte_im = buf.getvalue()

                    st.download_button(
                        label="📥 下載圖片",
                        data=byte_im,
                        file_name="border_watermark.jpg",
                        mime="image/jpeg",
                        use_container_width=True
                    )

                    st.success("✅ 浮水印已添加!")
            else:
                st.error("請輸入浮水印文字")

# 使用說明
with st.sidebar.expander("ℹ️ 使用說明"):
    st.markdown("""
    ### 浮水印類型

    **文字浮水印**
    - 添加文字版權資訊
    - 可自定義位置、顏色、透明度
    - 支援旋轉角度

    **圖片浮水印**
    - 添加 Logo 或圖片
    - 自動調整大小
    - 支援透明 PNG

    **平鋪浮水印**
    - 覆蓋整張圖片
    - 適合防盜用
    - 可調整間距和角度

    **邊框浮水印**
    - 在圖片底部添加邊框
    - 適合版權聲明
    - 不遮擋圖片內容

    ### 使用提示

    - 建議透明度設為 0.3-0.7
    - 選擇對比色以確保可見
    - Logo 大小建議 10-30%
    - 保留原始檔案備份
    """)

# 頁腳
st.markdown("---")
st.markdown(
    """
    <div style='text-align: center'>
        <p>圖像浮水印工具 v1.0 | Powered by Pillow & OpenCV</p>
        <p style='font-size: 12px; color: #888;'>請尊重版權，合法使用浮水印工具</p>
    </div>
    """,
    unsafe_allow_html=True
)
