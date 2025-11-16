# 人臉識別系統 Face Recognition System

🔍 使用深度學習進行人臉檢測、識別和驗證

## 功能特點

- ✅ 人臉檢測
- ✅ 人臉識別
- ✅ 人臉驗證 (1:1 比對)
- ✅ 人臉搜索 (1:N 比對)
- ✅ 即時視訊處理
- ✅ 批次處理
- ✅ Web UI 介面
- ✅ REST API

## 安裝

```bash
pip install -r requirements.txt
```

## 使用方式

### 1. 人臉檢測

```python
from face_detector import FaceDetector

detector = FaceDetector()
faces = detector.detect('group_photo.jpg')

# 保存標記的圖片
detector.save_annotated('group_photo.jpg', 'output.jpg')
```

### 2. 人臉識別

```python
from face_recognizer import FaceRecognizer

# 初始化識別器
recognizer = FaceRecognizer()

# 註冊人臉
recognizer.register_face('john_doe.jpg', name='John Doe')
recognizer.register_face('jane_smith.jpg', name='Jane Smith')

# 識別人臉
results = recognizer.recognize('unknown_person.jpg')
print(f"識別結果: {results[0]['name']}, 信心度: {results[0]['confidence']:.2f}")
```

### 3. 即時視訊識別

```python
from video_processor import VideoFaceRecognizer

video_recognizer = VideoFaceRecognizer()
video_recognizer.process_webcam()
```

### 4. Web UI

```bash
streamlit run app.py
```

### 5. REST API

```bash
uvicorn api:app --host 0.0.0.0 --port 8000
```

API 端點：
- `POST /detect` - 檢測人臉
- `POST /register` - 註冊人臉
- `POST /recognize` - 識別人臉
- `POST /verify` - 驗證人臉
- `GET /database` - 獲取已註冊人臉

## 專案結構

```
face-recognition/
├── README.md
├── requirements.txt
├── face_detector.py        # 人臉檢測
├── face_recognizer.py      # 人臉識別
├── video_processor.py      # 視訊處理
├── app.py                  # Streamlit UI
├── api.py                  # FastAPI REST API
├── database/               # 人臉資料庫
│   └── embeddings.pkl
└── models/                 # 預訓練模型
    └── .gitkeep
```

## 技術棧

- **face_recognition** - 人臉識別庫
- **OpenCV** - 圖像處理和視訊處理
- **dlib** - 人臉特徵提取
- **Streamlit** - Web UI
- **FastAPI** - REST API
- **NumPy** - 數值計算

## 應用場景

1. **門禁系統** - 人臉識別門禁
2. **考勤系統** - 自動簽到/簽退
3. **安全監控** - 黑名單/白名單監控
4. **客戶識別** - VIP 客戶自動識別
5. **照片管理** - 自動照片分類和標記

## 性能指標

- 檢測速度: ~30 FPS (CPU)
- 識別準確率: >99%
- 支援多人臉同時識別
- 支援各種光線條件

## 授權

MIT License
