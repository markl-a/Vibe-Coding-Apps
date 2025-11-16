"""
Streamlit UI for Image Processing
"""
import streamlit as st
from PIL import Image
import io
import base64

# Import processors
try:
    from classifier import ImageClassifier
    from detector import ObjectDetector
    from processor import ImageProcessor
except ImportError:
    st.error("Please install required packages: pip install -r requirements.txt")
    st.stop()


def init_session_state():
    """Initialize session state"""
    if 'classifier' not in st.session_state:
        st.session_state.classifier = None
    if 'detector' not in st.session_state:
        st.session_state.detector = None
    if 'processor' not in st.session_state:
        st.session_state.processor = ImageProcessor()


def get_image_download_link(img, filename, text):
    """Generate download link for image"""
    buffered = io.BytesIO()
    img.save(buffered, format="PNG")
    img_str = base64.b64encode(buffered.getvalue()).decode()
    href = f'<a href="data:file/png;base64,{img_str}" download="{filename}">{text}</a>'
    return href


def main():
    """Main Streamlit app"""
    st.set_page_config(
        page_title="Image Processing & AI",
        page_icon="🖼️",
        layout="wide"
    )

    init_session_state()

    st.title("🖼️ Image Processing & AI")
    st.markdown("Upload an image and choose an operation")

    # Sidebar
    with st.sidebar:
        st.header("Operations")
        operation = st.selectbox(
            "Choose operation",
            ["Classification", "Object Detection", "Image Enhancement", "Format Conversion"]
        )

    # File uploader
    uploaded_file = st.file_uploader(
        "Upload an image",
        type=['png', 'jpg', 'jpeg', 'bmp', 'webp']
    )

    if uploaded_file is not None:
        # Display original image
        image = Image.open(uploaded_file)

        col1, col2 = st.columns(2)

        with col1:
            st.subheader("Original Image")
            st.image(image, use_column_width=True)

        # Save temporary file
        temp_path = "temp_image.jpg"
        image.save(temp_path)

        # Process based on operation
        with col2:
            st.subheader("Result")

            if operation == "Classification":
                classify_image(temp_path)

            elif operation == "Object Detection":
                detect_objects(temp_path)

            elif operation == "Image Enhancement":
                enhance_image(temp_path, image)

            elif operation == "Format Conversion":
                convert_format(temp_path, image)


def classify_image(image_path):
    """Image classification"""
    with st.spinner("Loading model..."):
        if st.session_state.classifier is None:
            try:
                st.session_state.classifier = ImageClassifier(model_name='resnet50')
            except Exception as e:
                st.error(f"Error loading model: {e}")
                return

    with st.spinner("Classifying..."):
        try:
            result = st.session_state.classifier.predict(image_path, top_k=5)

            st.success(f"**Top Prediction:** {result['class']}")
            st.metric("Confidence", f"{result['confidence']:.2%}")

            st.subheader("Top 5 Predictions")
            for i, pred in enumerate(result['top_k'], 1):
                st.write(f"{i}. **{pred['class']}** - {pred['confidence']:.2%}")

        except Exception as e:
            st.error(f"Error: {e}")


def detect_objects(image_path):
    """Object detection"""
    with st.spinner("Loading detector..."):
        if st.session_state.detector is None:
            try:
                st.session_state.detector = ObjectDetector(model='yolov8n')
            except Exception as e:
                st.error(f"Error loading detector: {e}")
                return

    with st.spinner("Detecting objects..."):
        try:
            detections = st.session_state.detector.detect(
                image_path,
                save=True,
                save_path="detected.jpg"
            )

            # Display detected image
            detected_img = Image.open("detected.jpg")
            st.image(detected_img, use_column_width=True)

            # Show detection statistics
            st.subheader(f"Found {len(detections)} objects")

            counts = st.session_state.detector.count_objects(detections)
            for class_name, count in counts.items():
                st.write(f"**{class_name}:** {count}")

            # Show detailed detections
            with st.expander("Detailed Detections"):
                for i, det in enumerate(detections, 1):
                    st.write(
                        f"{i}. {det['class']} - "
                        f"Confidence: {det['confidence']:.2%}"
                    )

        except Exception as e:
            st.error(f"Error: {e}")


def enhance_image(image_path, original_image):
    """Image enhancement"""
    st.subheader("Enhancement Controls")

    brightness = st.slider("Brightness", 0.5, 2.0, 1.0, 0.1)
    contrast = st.slider("Contrast", 0.5, 2.0, 1.0, 0.1)
    saturation = st.slider("Saturation", 0.0, 2.0, 1.0, 0.1)
    sharpness = st.slider("Sharpness", 0.0, 2.0, 1.0, 0.1)

    if st.button("Apply Enhancement"):
        with st.spinner("Enhancing..."):
            try:
                enhanced = st.session_state.processor.enhance(
                    image_path,
                    brightness=brightness,
                    contrast=contrast,
                    saturation=saturation,
                    sharpness=sharpness,
                    output_path="enhanced.jpg"
                )

                st.image(enhanced, use_column_width=True)
                st.success("Enhancement applied!")

                # Download button
                st.markdown(
                    get_image_download_link(
                        enhanced,
                        "enhanced.jpg",
                        "Download Enhanced Image"
                    ),
                    unsafe_allow_html=True
                )

            except Exception as e:
                st.error(f"Error: {e}")


def convert_format(image_path, original_image):
    """Format conversion"""
    target_format = st.selectbox(
        "Target Format",
        ["PNG", "JPEG", "WEBP", "BMP"]
    )

    col1, col2 = st.columns(2)

    with col1:
        if target_format == "JPEG":
            quality = st.slider("Quality", 1, 100, 95)

    with col2:
        if st.button("Convert"):
            with st.spinner("Converting..."):
                try:
                    output_path = f"converted.{target_format.lower()}"

                    if target_format == "JPEG":
                        original_image.save(output_path, quality=quality)
                    else:
                        original_image.save(output_path)

                    converted = Image.open(output_path)
                    st.image(converted, use_column_width=True)
                    st.success(f"Converted to {target_format}!")

                    # Show file size
                    import os
                    size = os.path.getsize(output_path)
                    st.info(f"File size: {size / 1024:.2f} KB")

                except Exception as e:
                    st.error(f"Error: {e}")


if __name__ == "__main__":
    main()
