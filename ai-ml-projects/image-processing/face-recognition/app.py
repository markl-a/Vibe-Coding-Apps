"""
人臉識別 Streamlit Web UI
"""

import streamlit as st
import cv2
import numpy as np
from PIL import Image
import io
from face_detector import FaceDetector
from face_recognizer import FaceRecognizer

# 頁面配置
st.set_page_config(
    page_title="人臉識別系統",
    page_icon="🔍",
    layout="wide"
)

# 初始化
@st.cache_resource
def load_detector():
    return FaceDetector(model='hog')

@st.cache_resource
def load_recognizer():
    return FaceRecognizer()

detector = load_detector()
recognizer = load_recognizer()

# 標題
st.title("🔍 人臉識別系統")
st.markdown("---")

# 側邊欄
st.sidebar.header("功能選擇")
mode = st.sidebar.selectbox(
    "選擇模式",
    ["人臉檢測", "人臉識別", "註冊人臉", "人臉驗證", "資料庫管理"]
)

# 人臉檢測模式
if mode == "人臉檢測":
    st.header("👤 人臉檢測")

    uploaded_file = st.file_uploader("上傳圖片", type=['jpg', 'jpeg', 'png'])

    if uploaded_file is not None:
        # 讀取圖片
        image = Image.open(uploaded_file)
        image_array = np.array(image)

        col1, col2 = st.columns(2)

        with col1:
            st.subheader("原始圖片")
            st.image(image, use_container_width=True)

        # 檢測人臉
        with st.spinner("檢測中..."):
            if image.mode == 'RGB':
                rgb_image = image_array
            else:
                rgb_image = cv2.cvtColor(image_array, cv2.COLOR_BGR2RGB)

            face_locations = detector.detect_from_array(rgb_image)

        with col2:
            st.subheader(f"檢測結果 (找到 {len(face_locations)} 個人臉)")

            # 繪製矩形框
            output_image = image_array.copy()
            for (top, right, bottom, left) in face_locations:
                cv2.rectangle(output_image, (left, top), (right, bottom), (0, 255, 0), 2)
                cv2.putText(output_image, "Face", (left, top - 10),
                          cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)

            st.image(output_image, use_container_width=True)

# 人臉識別模式
elif mode == "人臉識別":
    st.header("🎯 人臉識別")

    uploaded_file = st.file_uploader("上傳圖片", type=['jpg', 'jpeg', 'png'])

    if uploaded_file is not None:
        # 保存臨時檔案
        temp_path = "temp_recognize.jpg"
        with open(temp_path, "wb") as f:
            f.write(uploaded_file.getbuffer())

        # 讀取圖片
        image = Image.open(uploaded_file)
        image_array = np.array(image)

        col1, col2 = st.columns(2)

        with col1:
            st.subheader("原始圖片")
            st.image(image, use_container_width=True)

        # 識別人臉
        with st.spinner("識別中..."):
            results = recognizer.recognize(temp_path)

        with col2:
            st.subheader(f"識別結果 (找到 {len(results)} 個人臉)")

            # 繪製結果
            output_image = image_array.copy()
            for result in results:
                top, right, bottom, left = result['location']
                name = result['name']
                confidence = result['confidence']

                # 顏色: 已知人臉用綠色，未知用紅色
                color = (0, 255, 0) if name != "Unknown" else (255, 0, 0)

                cv2.rectangle(output_image, (left, top), (right, bottom), color, 2)
                label = f"{name} ({confidence:.2f})"
                cv2.putText(output_image, label, (left, top - 10),
                          cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)

            st.image(output_image, use_container_width=True)

            # 顯示詳細結果
            st.subheader("詳細結果")
            for idx, result in enumerate(results):
                st.write(f"**人臉 {idx + 1}:**")
                st.write(f"- 姓名: {result['name']}")
                st.write(f"- 信心度: {result['confidence']:.2%}")

# 註冊人臉模式
elif mode == "註冊人臉":
    st.header("➕ 註冊人臉")

    name = st.text_input("輸入姓名")
    uploaded_file = st.file_uploader("上傳人臉圖片", type=['jpg', 'jpeg', 'png'])
    replace = st.checkbox("替換已存在的記錄")

    if st.button("註冊") and name and uploaded_file:
        # 保存臨時檔案
        temp_path = "temp_register.jpg"
        with open(temp_path, "wb") as f:
            f.write(uploaded_file.getbuffer())

        # 顯示圖片
        image = Image.open(uploaded_file)
        st.image(image, caption=f"註冊: {name}", width=300)

        # 註冊人臉
        with st.spinner("註冊中..."):
            success = recognizer.register_face(temp_path, name, replace=replace)

        if success:
            st.success(f"✅ 成功註冊 {name}!")
            st.balloons()
        else:
            st.error("❌ 註冊失敗，請檢查圖片或姓名")

# 人臉驗證模式
elif mode == "人臉驗證":
    st.header("✅ 人臉驗證 (1:1 比對)")

    col1, col2 = st.columns(2)

    with col1:
        st.subheader("圖片 1")
        image1 = st.file_uploader("上傳第一張圖片", type=['jpg', 'jpeg', 'png'], key="img1")
        if image1:
            st.image(image1, use_container_width=True)

    with col2:
        st.subheader("圖片 2")
        image2 = st.file_uploader("上傳第二張圖片", type=['jpg', 'jpeg', 'png'], key="img2")
        if image2:
            st.image(image2, use_container_width=True)

    if st.button("驗證") and image1 and image2:
        # 保存臨時檔案
        temp_path1 = "temp_verify1.jpg"
        temp_path2 = "temp_verify2.jpg"

        with open(temp_path1, "wb") as f:
            f.write(image1.getbuffer())
        with open(temp_path2, "wb") as f:
            f.write(image2.getbuffer())

        # 驗證
        with st.spinner("驗證中..."):
            is_match, confidence = recognizer.verify(temp_path1, temp_path2)

        st.markdown("---")
        st.subheader("驗證結果")

        if is_match:
            st.success(f"✅ 匹配! 信心度: {confidence:.2%}")
        else:
            st.error(f"❌ 不匹配! 信心度: {confidence:.2%}")

        # 顯示信心度進度條
        st.progress(confidence)

# 資料庫管理模式
elif mode == "資料庫管理":
    st.header("🗄️ 資料庫管理")

    # 顯示所有已註冊的人臉
    all_names = recognizer.get_all_names()

    st.subheader(f"已註冊人臉數量: {len(all_names)}")

    if all_names:
        # 顯示列表
        for idx, name in enumerate(all_names):
            col1, col2 = st.columns([3, 1])
            with col1:
                st.write(f"{idx + 1}. {name}")
            with col2:
                if st.button("刪除", key=f"delete_{idx}"):
                    recognizer.delete_face(name)
                    st.rerun()

        # 清空資料庫按鈕
        st.markdown("---")
        if st.button("⚠️ 清空整個資料庫", type="primary"):
            if st.checkbox("確認清空資料庫"):
                recognizer.clear_database()
                st.success("資料庫已清空")
                st.rerun()
    else:
        st.info("資料庫為空，請先註冊人臉")

# 頁腳
st.markdown("---")
st.markdown(
    """
    <div style='text-align: center'>
        <p>人臉識別系統 v1.0 | Powered by face_recognition & Streamlit</p>
    </div>
    """,
    unsafe_allow_html=True
)
