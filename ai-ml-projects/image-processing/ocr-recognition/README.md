# OCR 文字識別 Optical Character Recognition

📖 從圖像中智能提取文字內容

## 功能特點

- ✅ 多種 OCR 引擎支持 (EasyOCR, Tesseract, PaddleOCR)
- ✅ 多語言支持 (中文、英文、日文等)
- ✅ 文字位置檢測
- ✅ 信心度評分
- ✅ 圖像預處理優化
- ✅ 批量處理
- ✅ 多種輸出格式 (TXT, JSON, CSV)
- ✅ 結果可視化

## 快速開始

```python
from ocr_engine import OCREngine

# 初始化 OCR 引擎
ocr = OCREngine(engine='easyocr', languages=['en'])

# 識別文字
text = ocr.recognize('image.jpg')
print(text)

# 獲取詳細結果（包含位置和信心度）
results = ocr.recognize('image.jpg', detail=True)
for result in results:
    print(f"Text: {result['text']}, Confidence: {result['confidence']}")

# 可視化結果
ocr.visualize('image.jpg', 'output.jpg')

# 提取到文件
ocr.extract_to_file('image.jpg', 'output.txt', format='txt')
```

## 支持的 OCR 引擎

### 1. EasyOCR (推薦)
```python
ocr = OCREngine(engine='easyocr', languages=['en', 'ch_sim'])
```

### 2. Tesseract
```python
ocr = OCREngine(engine='tesseract', languages=['eng', 'chi_sim'])
```

### 3. PaddleOCR
```python
ocr = OCREngine(engine='paddleocr', languages=['ch'])
```

## 圖像預處理

提高識別準確度：

```python
# 預處理圖像
preprocessed_image = ocr.preprocess_image(
    'image.jpg',
    operations=['grayscale', 'denoise', 'threshold', 'deskew']
)

# 識別預處理後的圖像
text = ocr.recognize(preprocessed_image)
```

## 批量處理

```python
image_paths = ['img1.jpg', 'img2.jpg', 'img3.jpg']
results = ocr.recognize_batch(image_paths, detail=True)
```

## 命令行使用

```bash
# 基本識別
python ocr_engine.py image.jpg

# 指定引擎和語言
python ocr_engine.py image.jpg --engine easyocr --lang en ch_sim

# 可視化結果
python ocr_engine.py image.jpg --visualize --output result.jpg

# 提取到 JSON
python ocr_engine.py image.jpg --format json --output result.json

# 預處理後識別
python ocr_engine.py image.jpg --preprocess --engine tesseract

# 使用 GPU
python ocr_engine.py image.jpg --engine easyocr --gpu
```

## 應用場景

- 📄 文檔數字化
- 🚗 車牌識別
- 📸 名片識別
- 📝 手寫文字識別
- 🌐 多語言翻譯
- 📊 表格數據提取

## 安裝

```bash
pip install -r requirements.txt
```

## 技術棧

- **EasyOCR** - 深度學習 OCR
- **Tesseract** - 傳統 OCR
- **PaddleOCR** - 百度 OCR
- **OpenCV** - 圖像預處理
- **Pillow** - 圖像操作

## 授權

MIT License
