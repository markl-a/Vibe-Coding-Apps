# 圖像處理與分類 Image Processing

🖼️ 完整的 AI 圖像處理工具集 - 分類、偵測、增強、修復、識別

## 功能特點

### 核心功能
- ✅ 圖像分類 (ResNet, VGG, EfficientNet)
- ✅ 物件偵測 (YOLOv8)
- ✅ 圖像增強與處理
- ✅ 自定義模型訓練
- ✅ Web UI 介面 (Streamlit)
- ✅ REST API (FastAPI)
- ✅ 批次處理

### AI 增強功能
- ✅ 圖像超分辨率 (Super Resolution)
- ✅ 圖像修復與補全 (Inpainting)
- ✅ OCR 文字識別
- ✅ 圖像分割 (Segmentation)
- ✅ 背景移除
- ✅ 人臉識別
- ✅ 圖像風格轉換
- ✅ QR 碼工具
- ✅ 圖像浮水印

## 專案結構

```
image-processing/
├── README.md              # 專案說明
├── EXAMPLES_INDEX.md      # 完整範例索引
├── requirements.txt       # 依賴套件
├── classifier.py          # 圖像分類器
├── detector.py            # 物件偵測器
├── processor.py           # 圖像處理工具
├── train.py              # 模型訓練腳本 ✨ NEW
├── app.py                # Streamlit UI
├── api.py                # FastAPI REST API ✨ NEW
├── utils/                # 工具函數
├── models/               # 模型儲存
├── data/                 # 資料集
│
├── super-resolution/     # 圖像超分辨率 ✨ NEW
│   ├── super_resolution.py
│   ├── app.py
│   ├── example_usage.py
│   └── README.md
│
├── image-inpainting/     # 圖像修復與補全 ✨ NEW
│   ├── inpainting.py
│   ├── example_usage.py
│   └── README.md
│
├── ocr-recognition/      # OCR 文字識別 ✨ NEW
│   ├── ocr_engine.py
│   └── README.md
│
├── image-segmentation/   # 圖像分割 ✨ NEW
│   ├── segmentation.py
│   └── README.md
│
├── background-remover/   # 背景移除
│   ├── bg_remover.py
│   ├── app.py
│   └── example_usage.py
│
├── face-recognition/     # 人臉識別
│   ├── face_detector.py
│   ├── face_recognizer.py
│   └── app.py
│
├── style-transfer/       # 風格轉換
│   ├── style_transfer.py
│   └── app.py
│
├── qr-code-tools/        # QR 碼工具
│   ├── qr_generator.py
│   ├── qr_reader.py
│   └── app.py
│
└── image-watermark/      # 圖像浮水印
    ├── watermark.py
    └── app.py
```

## 安裝

```bash
pip install -r requirements.txt
```

## 使用方式

### 1. 圖像分類

```python
from classifier import ImageClassifier

# 初始化分類器
classifier = ImageClassifier(model_name='resnet50')

# 分類單張圖片
result = classifier.predict('path/to/image.jpg')
print(f"類別: {result['class']}, 信心度: {result['confidence']:.2f}")

# 批次處理
results = classifier.predict_batch(['img1.jpg', 'img2.jpg', 'img3.jpg'])
```

### 2. 物件偵測

```python
from detector import ObjectDetector

# 初始化偵測器
detector = ObjectDetector(model='yolov8')

# 偵測物件
detections = detector.detect('path/to/image.jpg')

# 視覺化結果
detector.visualize(detections, save_path='output.jpg')
```

### 3. 圖像處理

```python
from processor import ImageProcessor

processor = ImageProcessor()

# 圖像增強
enhanced = processor.enhance('dark_image.jpg')

# 調整大小
resized = processor.resize('image.jpg', width=800, height=600)

# 批次轉換
processor.batch_convert('input_folder/', 'output_folder/', format='png')
```

### 4. 自定義模型訓練

```bash
python train.py --dataset data/train --epochs 50 --model resnet18
```

### 5. Web UI

```bash
streamlit run app.py
```

### 6. REST API

```bash
uvicorn api:app --reload
```

API 端點：
- `POST /classify` - 圖像分類
- `POST /detect` - 物件偵測
- `POST /process` - 圖像處理

## 支援的模型

### 分類模型
- ResNet (18, 34, 50, 101)
- VGG (16, 19)
- EfficientNet (B0-B7)
- MobileNet
- Inception V3

### 偵測模型
- YOLOv8 (n, s, m, l, x)
- YOLOv5
- Faster R-CNN
- SSD

## 資料集格式

### 分類資料集
```
data/
├── train/
│   ├── class1/
│   │   ├── img1.jpg
│   │   └── img2.jpg
│   └── class2/
│       ├── img1.jpg
│       └── img2.jpg
└── test/
    └── ...
```

### 偵測資料集 (YOLO format)
```
data/
├── images/
│   ├── train/
│   └── val/
└── labels/
    ├── train/
    └── val/
```

## 範例應用

### 1. 醫療影像分類
```python
classifier = ImageClassifier(
    model_name='resnet50',
    num_classes=2,
    class_names=['Normal', 'Abnormal']
)
result = classifier.predict('xray.jpg')
```

### 2. 人臉偵測
```python
detector = ObjectDetector(
    model='yolov8',
    classes=['face']
)
faces = detector.detect('group_photo.jpg')
```

### 3. 圖像風格轉換
```python
processor = ImageProcessor()
stylized = processor.style_transfer(
    content='photo.jpg',
    style='painting.jpg'
)
```

## 技術棧

- **PyTorch** / **TensorFlow** - 深度學習框架
- **OpenCV** - 圖像處理
- **Pillow** - 圖像操作
- **Ultralytics** - YOLO 實作
- **Streamlit** - Web UI
- **FastAPI** - REST API
- **NumPy** - 數值計算
- **Matplotlib** - 視覺化

## 效能優化

- GPU 加速 (CUDA)
- 批次處理
- 圖像預處理快取
- 模型量化
- TensorRT 優化

## 常見應用場景

1. **安全監控** - 人臉識別、異常偵測
2. **醫療診斷** - X光分析、病變檢測
3. **零售** - 產品識別、貨架分析
4. **製造業** - 瑕疵檢測、品質控制
5. **農業** - 作物疾病檢測
6. **自動駕駛** - 物件偵測、場景理解

## 授權

MIT License
