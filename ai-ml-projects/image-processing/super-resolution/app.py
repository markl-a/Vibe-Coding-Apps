"""
Image Super Resolution - Streamlit Web Application
圖像超分辨率 - Web 應用程式
"""
import streamlit as st
from super_resolution import SuperResolution
from PIL import Image
import numpy as np
import io


def main():
    st.set_page_config(
        page_title="Image Super Resolution",
        page_icon="🔍",
        layout="wide"
    )

    st.title("🔍 圖像超分辨率")
    st.write("使用深度學習提升圖像分辨率，讓模糊圖像變清晰")

    # 側邊欄設置
    st.sidebar.header("⚙️ 設置")

    model_type = st.sidebar.selectbox(
        "選擇模型",
        ["bicubic", "espcn", "srcnn", "opencv"],
        help="不同模型有不同的效果和速度"
    )

    scale_factor = st.sidebar.selectbox(
        "放大倍數",
        [2, 3, 4],
        help="選擇放大倍數"
    )

    st.sidebar.markdown("---")
    st.sidebar.markdown("""
    ### 📚 模型說明

    - **Bicubic**: 傳統插值方法，速度快
    - **ESPCN**: 輕量級深度學習模型
    - **SRCNN**: 經典超分辨率CNN
    - **OpenCV**: OpenCV DNN 模型

    ### 💡 使用提示

    1. 上傳圖像（支持 JPG, PNG）
    2. 選擇模型和放大倍數
    3. 點擊「執行超分辨率」
    4. 比較原圖和結果
    5. 下載高分辨率圖像
    """)

    # 主要內容區域
    tab1, tab2, tab3 = st.tabs(["📤 單張圖像", "📁 批量處理", "ℹ️ 關於"])

    # Tab 1: 單張圖像處理
    with tab1:
        st.header("上傳圖像")

        uploaded_file = st.file_uploader(
            "選擇圖像文件",
            type=['jpg', 'jpeg', 'png'],
            help="支持 JPG 和 PNG 格式"
        )

        if uploaded_file is not None:
            # 讀取圖像
            image = Image.open(uploaded_file)

            # 顯示原圖信息
            col1, col2 = st.columns(2)

            with col1:
                st.subheader("原始圖像")
                st.image(image, use_container_width=True)
                st.info(f"尺寸: {image.size[0]} x {image.size[1]} 像素")

            # 執行超分辨率按鈕
            if st.button("🚀 執行超分辨率", type="primary"):
                with st.spinner("處理中..."):
                    try:
                        # 保存臨時文件
                        temp_input = "temp_input.jpg"
                        temp_output = "temp_output.jpg"
                        image.save(temp_input)

                        # 初始化處理器
                        sr = SuperResolution(
                            model_type=model_type,
                            scale_factor=scale_factor
                        )

                        # 執行超分辨率
                        sr.upscale(temp_input, temp_output)

                        # 讀取結果
                        result_image = Image.open(temp_output)

                        # 顯示結果
                        with col2:
                            st.subheader("超分辨率結果")
                            st.image(result_image, use_container_width=True)
                            st.success(f"新尺寸: {result_image.size[0]} x {result_image.size[1]} 像素")

                            # 提供下載
                            buf = io.BytesIO()
                            result_image.save(buf, format='PNG')
                            byte_im = buf.getvalue()

                            st.download_button(
                                label="📥 下載高分辨率圖像",
                                data=byte_im,
                                file_name="super_resolution_result.png",
                                mime="image/png"
                            )

                        # 顯示統計信息
                        st.subheader("📊 處理統計")
                        stats_col1, stats_col2, stats_col3 = st.columns(3)

                        with stats_col1:
                            st.metric(
                                "放大倍數",
                                f"{scale_factor}x",
                                delta=None
                            )

                        with stats_col2:
                            original_pixels = image.size[0] * image.size[1]
                            result_pixels = result_image.size[0] * result_image.size[1]
                            pixel_increase = ((result_pixels - original_pixels) / original_pixels) * 100
                            st.metric(
                                "像素增加",
                                f"{pixel_increase:.0f}%"
                            )

                        with stats_col3:
                            st.metric(
                                "使用模型",
                                model_type.upper()
                            )

                    except Exception as e:
                        st.error(f"處理失敗: {str(e)}")

    # Tab 2: 批量處理
    with tab2:
        st.header("批量處理多張圖像")
        st.info("💡 上傳多張圖像進行批量超分辨率處理")

        uploaded_files = st.file_uploader(
            "選擇多張圖像",
            type=['jpg', 'jpeg', 'png'],
            accept_multiple_files=True
        )

        if uploaded_files:
            st.write(f"已選擇 {len(uploaded_files)} 張圖像")

            if st.button("🚀 批量處理", type="primary"):
                progress_bar = st.progress(0)
                status_text = st.empty()

                results = []

                for idx, file in enumerate(uploaded_files):
                    status_text.text(f"處理中: {file.name} ({idx+1}/{len(uploaded_files)})")

                    try:
                        # 讀取並處理圖像
                        image = Image.open(file)
                        temp_input = f"temp_batch_{idx}.jpg"
                        temp_output = f"temp_batch_{idx}_sr.jpg"

                        image.save(temp_input)

                        sr = SuperResolution(
                            model_type=model_type,
                            scale_factor=scale_factor
                        )
                        sr.upscale(temp_input, temp_output)

                        result_image = Image.open(temp_output)
                        results.append((file.name, result_image))

                    except Exception as e:
                        st.error(f"處理 {file.name} 失敗: {e}")

                    progress_bar.progress((idx + 1) / len(uploaded_files))

                status_text.text("✓ 處理完成!")

                # 顯示結果
                st.subheader("處理結果")

                for name, result in results:
                    with st.expander(f"📷 {name}"):
                        st.image(result, use_container_width=True)

                        # 提供下載
                        buf = io.BytesIO()
                        result.save(buf, format='PNG')
                        byte_im = buf.getvalue()

                        st.download_button(
                            label=f"下載 {name}",
                            data=byte_im,
                            file_name=f"sr_{name}.png",
                            mime="image/png",
                            key=f"download_{name}"
                        )

    # Tab 3: 關於
    with tab3:
        st.header("關於圖像超分辨率")

        st.markdown("""
        ### 什麼是圖像超分辨率？

        圖像超分辨率 (Image Super Resolution) 是一種使用深度學習技術，
        將低分辨率圖像轉換為高分辨率圖像的技術。

        ### 支持的模型

        #### 1. Bicubic (雙三次插值)
        - ✅ 速度最快
        - ✅ 不需要訓練
        - ⚠️ 效果一般

        #### 2. ESPCN (高效子像素卷積網絡)
        - ✅ 速度快
        - ✅ 效果好
        - ✅ 輕量級模型

        #### 3. SRCNN (超分辨率卷積神經網絡)
        - ✅ 經典模型
        - ✅ 效果穩定
        - ⚠️ 速度較慢

        #### 4. OpenCV DNN
        - ✅ 基於 OpenCV
        - ✅ 易於部署
        - ⚠️ 需要預訓練模型

        ### 應用場景

        - 📸 **照片修復**: 提升老照片質量
        - 🎥 **視頻增強**: 提升視頻分辨率
        - 🔬 **醫學影像**: 增強醫學圖像細節
        - 🛰️ **衛星圖像**: 提升衛星圖像質量
        - 🎮 **遊戲紋理**: 提升遊戲紋理質量

        ### 技術原理

        深度學習超分辨率通過訓練神經網絡，學習從低分辨率到高分辨率的映射關係。
        主要技術包括：

        - **卷積神經網絡 (CNN)**: 提取圖像特徵
        - **子像素卷積**: 高效的上採樣
        - **殘差學習**: 學習細節差異
        - **生成對抗網絡 (GAN)**: 生成更真實的細節

        ### 限制

        - 無法無中生有創造細節
        - 處理時間取決於模型和硬件
        - 極度模糊的圖像效果有限

        ### 版本信息

        - **版本**: 1.0.0
        - **更新日期**: 2024
        - **授權**: MIT License
        """)

        st.markdown("---")
        st.info("💡 提示：使用 GPU 可以大幅提升處理速度")


if __name__ == "__main__":
    main()
