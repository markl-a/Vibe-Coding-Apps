"""
QR 碼工具 Streamlit Web UI
"""

import streamlit as st
from PIL import Image
import io
from qr_generator import QRCodeGenerator, ErrorCorrectLevel
from qr_reader import QRCodeReader

# 頁面配置
st.set_page_config(
    page_title="QR 碼工具",
    page_icon="📱",
    layout="wide"
)

# 初始化
@st.cache_resource
def load_tools():
    return QRCodeGenerator(), QRCodeReader()

generator, reader = load_tools()

# 標題
st.title("📱 QR 碼生成與讀取工具")
st.markdown("強大的 QR 碼生成、讀取和美化工具")
st.markdown("---")

# 側邊欄
st.sidebar.header("🛠️ 功能選擇")

mode = st.sidebar.radio(
    "選擇功能",
    ["生成 QR 碼", "讀取 QR 碼", "添加 Logo", "藝術 QR 碼", "名片 vCard", "WiFi 分享"]
)

# 生成 QR 碼模式
if mode == "生成 QR 碼":
    st.header("📝 生成 QR 碼")

    col1, col2 = st.columns([1, 1])

    with col1:
        st.subheader("輸入內容")

        data_type = st.selectbox(
            "資料類型",
            ["文字/網址", "電子郵件", "電話", "SMS", "地理位置"]
        )

        if data_type == "文字/網址":
            data = st.text_area("輸入文字或網址", "https://example.com", height=100)

        elif data_type == "電子郵件":
            email = st.text_input("電子郵件地址", "example@email.com")
            subject = st.text_input("主旨 (可選)", "")
            body = st.text_area("內文 (可選)", "", height=100)

            data = f"mailto:{email}"
            if subject or body:
                data += f"?subject={subject}&body={body}"

        elif data_type == "電話":
            phone = st.text_input("電話號碼", "+886912345678")
            data = f"tel:{phone}"

        elif data_type == "SMS":
            phone = st.text_input("電話號碼", "+886912345678")
            message = st.text_area("簡訊內容", "", height=100)
            data = f"smsto:{phone}:{message}"

        elif data_type == "地理位置":
            lat = st.number_input("緯度", value=25.0330, format="%.6f")
            lon = st.number_input("經度", value=121.5654, format="%.6f")
            data = f"geo:{lat},{lon}"

        # 顏色設定
        st.subheader("顏色設定")

        col_a, col_b = st.columns(2)

        with col_a:
            fill_color = st.color_picker("前景色 (QR 碼)", "#000000")
            fill_rgb = tuple(int(fill_color[i:i+2], 16) for i in (1, 3, 5))

        with col_b:
            back_color = st.color_picker("背景色", "#FFFFFF")
            back_rgb = tuple(int(back_color[i:i+2], 16) for i in (1, 3, 5))

        # 進階設定
        with st.expander("進階設定"):
            box_size = st.slider("方塊大小", 5, 20, 10)
            border = st.slider("邊框寬度", 1, 10, 4)

            error_level = st.selectbox(
                "錯誤修正等級",
                ["L (7%)", "M (15%)", "Q (25%)", "H (30%)"]
            )

            error_map = {
                "L (7%)": ErrorCorrectLevel.L,
                "M (15%)": ErrorCorrectLevel.M,
                "Q (25%)": ErrorCorrectLevel.Q,
                "H (30%)": ErrorCorrectLevel.H
            }

    with col2:
        st.subheader("QR 碼預覽")

        if st.button("🎨 生成 QR 碼", type="primary", use_container_width=True):
            if data:
                with st.spinner("生成中..."):
                    temp_output = "temp_qr.png"

                    # 更新生成器設定
                    generator.box_size = box_size
                    generator.border = border
                    generator.error_correction = error_map[error_level]

                    # 生成 QR 碼
                    generator.generate(data, temp_output,
                                     fill_color=fill_rgb,
                                     back_color=back_rgb)

                    # 顯示
                    qr_image = Image.open(temp_output)
                    st.image(qr_image, use_container_width=True)

                    # 下載
                    buf = io.BytesIO()
                    qr_image.save(buf, format='PNG')
                    byte_im = buf.getvalue()

                    st.download_button(
                        label="📥 下載 QR 碼",
                        data=byte_im,
                        file_name="qrcode.png",
                        mime="image/png",
                        use_container_width=True
                    )

                    st.success("✅ 生成成功!")
            else:
                st.error("請輸入內容")

# 讀取 QR 碼模式
elif mode == "讀取 QR 碼":
    st.header("🔍 讀取 QR 碼")

    col1, col2 = st.columns(2)

    with col1:
        st.subheader("上傳 QR 碼圖片")
        uploaded_file = st.file_uploader("選擇圖片", type=['jpg', 'jpeg', 'png'])

        if uploaded_file:
            image = Image.open(uploaded_file)
            st.image(image, caption="上傳的圖片", use_container_width=True)

    with col2:
        st.subheader("讀取結果")

        if uploaded_file and st.button("📖 讀取 QR 碼", type="primary", use_container_width=True):
            with st.spinner("讀取中..."):
                temp_input = "temp_read.png"
                temp_output = "temp_marked.png"

                image.save(temp_input)

                # 讀取並標記
                data_list = reader.read_and_visualize(temp_input, temp_output)

                if data_list:
                    st.success(f"✅ 讀取成功! 找到 {len(data_list)} 個 QR 碼")

                    # 顯示標記的圖片
                    marked_image = Image.open(temp_output)
                    st.image(marked_image, caption="標記後的圖片", use_container_width=True)

                    # 顯示內容
                    st.subheader("QR 碼內容")
                    for idx, data in enumerate(data_list):
                        st.text_area(f"QR 碼 {idx + 1}", data, height=100)
                else:
                    st.error("❌ 未檢測到 QR 碼")

# 添加 Logo 模式
elif mode == "添加 Logo":
    st.header("🎨 生成帶 Logo 的 QR 碼")

    col1, col2 = st.columns(2)

    with col1:
        st.subheader("設定")

        data = st.text_area("輸入內容", "https://example.com", height=100)

        logo_file = st.file_uploader("上傳 Logo", type=['jpg', 'jpeg', 'png'])

        if logo_file:
            logo_image = Image.open(logo_file)
            st.image(logo_image, caption="Logo 預覽", width=200)

        logo_size = st.slider("Logo 大小比例", 0.1, 0.4, 0.3, 0.05)

        col_a, col_b = st.columns(2)
        with col_a:
            fill_color = st.color_picker("QR 碼顏色", "#000000")
        with col_b:
            back_color = st.color_picker("背景色", "#FFFFFF")

    with col2:
        st.subheader("QR 碼預覽")

        if st.button("🎨 生成", type="primary", use_container_width=True):
            if data and logo_file:
                with st.spinner("生成中..."):
                    temp_logo = "temp_logo.png"
                    temp_output = "temp_qr_logo.png"

                    logo_image.save(temp_logo)

                    generator.generate_with_logo(
                        data, temp_output, temp_logo,
                        logo_size_ratio=logo_size,
                        fill_color=fill_color,
                        back_color=back_color
                    )

                    qr_image = Image.open(temp_output)
                    st.image(qr_image, use_container_width=True)

                    buf = io.BytesIO()
                    qr_image.save(buf, format='PNG')
                    byte_im = buf.getvalue()

                    st.download_button(
                        label="📥 下載",
                        data=byte_im,
                        file_name="qrcode_with_logo.png",
                        mime="image/png",
                        use_container_width=True
                    )

                    st.success("✅ 生成成功!")
            else:
                st.error("請輸入內容並上傳 Logo")

# 藝術 QR 碼模式
elif mode == "藝術 QR 碼":
    st.header("🎭 藝術 QR 碼")

    col1, col2 = st.columns(2)

    with col1:
        st.subheader("設定")

        data = st.text_area("輸入內容", "https://example.com", height=100)

        style = st.selectbox(
            "選擇樣式",
            ["圓角", "圓點", "漸變色"]
        )

        if style in ["圓角", "圓點"]:
            col_a, col_b = st.columns(2)
            with col_a:
                fill_color = st.color_picker("前景色", "#000000")
                fill_rgb = tuple(int(fill_color[i:i+2], 16) for i in (1, 3, 5))
            with col_b:
                back_color = st.color_picker("背景色", "#FFFFFF")
                back_rgb = tuple(int(back_color[i:i+2], 16) for i in (1, 3, 5))

        elif style == "漸變色":
            col_a, col_b, col_c = st.columns(3)
            with col_a:
                start_color = st.color_picker("起始色", "#FF0000")
                start_rgb = tuple(int(start_color[i:i+2], 16) for i in (1, 3, 5))
            with col_b:
                end_color = st.color_picker("結束色", "#0000FF")
                end_rgb = tuple(int(end_color[i:i+2], 16) for i in (1, 3, 5))
            with col_c:
                back_color = st.color_picker("背景色", "#FFFFFF")
                back_rgb = tuple(int(back_color[i:i+2], 16) for i in (1, 3, 5))

    with col2:
        st.subheader("QR 碼預覽")

        if st.button("🎨 生成", type="primary", use_container_width=True):
            if data:
                with st.spinner("生成中..."):
                    temp_output = "temp_qr_art.png"

                    if style == "圓角":
                        generator.generate_rounded(data, temp_output,
                                                 fill_color=fill_rgb,
                                                 back_color=back_rgb)
                    elif style == "圓點":
                        generator.generate_circular(data, temp_output,
                                                  fill_color=fill_rgb,
                                                  back_color=back_rgb)
                    elif style == "漸變色":
                        generator.generate_gradient(data, temp_output,
                                                  start_color=start_rgb,
                                                  end_color=end_rgb,
                                                  back_color=back_rgb)

                    qr_image = Image.open(temp_output)
                    st.image(qr_image, use_container_width=True)

                    buf = io.BytesIO()
                    qr_image.save(buf, format='PNG')
                    byte_im = buf.getvalue()

                    st.download_button(
                        label="📥 下載",
                        data=byte_im,
                        file_name=f"qrcode_{style}.png",
                        mime="image/png",
                        use_container_width=True
                    )

                    st.success("✅ 生成成功!")

# 名片 vCard 模式
elif mode == "名片 vCard":
    st.header("👤 名片 QR 碼 (vCard)")

    col1, col2 = st.columns(2)

    with col1:
        st.subheader("輸入資訊")

        name = st.text_input("姓名 *", "張三")
        phone = st.text_input("電話", "+886912345678")
        email = st.text_input("電子郵件", "example@email.com")
        organization = st.text_input("公司/組織", "某某公司")
        url = st.text_input("網址", "https://example.com")

    with col2:
        st.subheader("QR 碼預覽")

        if st.button("🎨 生成名片 QR 碼", type="primary", use_container_width=True):
            if name:
                with st.spinner("生成中..."):
                    vcard = generator.create_vcard(name, phone, email, organization, url)

                    temp_output = "temp_vcard.png"
                    generator.generate(vcard, temp_output)

                    qr_image = Image.open(temp_output)
                    st.image(qr_image, use_container_width=True)

                    # 顯示 vCard 內容
                    with st.expander("查看 vCard 內容"):
                        st.code(vcard)

                    buf = io.BytesIO()
                    qr_image.save(buf, format='PNG')
                    byte_im = buf.getvalue()

                    st.download_button(
                        label="📥 下載名片 QR 碼",
                        data=byte_im,
                        file_name="vcard_qrcode.png",
                        mime="image/png",
                        use_container_width=True
                    )

                    st.success("✅ 生成成功!")
            else:
                st.error("請輸入姓名")

# WiFi 分享模式
elif mode == "WiFi 分享":
    st.header("📶 WiFi 連線 QR 碼")

    col1, col2 = st.columns(2)

    with col1:
        st.subheader("WiFi 設定")

        ssid = st.text_input("WiFi 名稱 (SSID) *", "MyWiFi")
        password = st.text_input("密碼 *", type="password")
        security = st.selectbox("安全類型", ["WPA", "WEP", "nopass"])

        st.info("💡 其他裝置掃描此 QR 碼即可自動連線到 WiFi")

    with col2:
        st.subheader("QR 碼預覽")

        if st.button("🎨 生成 WiFi QR 碼", type="primary", use_container_width=True):
            if ssid and (password or security == "nopass"):
                with st.spinner("生成中..."):
                    wifi_data = generator.create_wifi(ssid, password, security)

                    temp_output = "temp_wifi.png"
                    generator.generate(wifi_data, temp_output)

                    qr_image = Image.open(temp_output)
                    st.image(qr_image, use_container_width=True)

                    buf = io.BytesIO()
                    qr_image.save(buf, format='PNG')
                    byte_im = buf.getvalue()

                    st.download_button(
                        label="📥 下載 WiFi QR 碼",
                        data=byte_im,
                        file_name="wifi_qrcode.png",
                        mime="image/png",
                        use_container_width=True
                    )

                    st.success("✅ 生成成功!")
            else:
                st.error("請填寫必要資訊")

# 頁腳
st.markdown("---")
st.markdown(
    """
    <div style='text-align: center'>
        <p>QR 碼工具 v1.0 | Powered by qrcode & pyzbar</p>
    </div>
    """,
    unsafe_allow_html=True
)
