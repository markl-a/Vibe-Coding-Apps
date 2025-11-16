# 圖像浮水印工具 Image Watermark Tool

💧 專業的圖像浮水印添加和移除工具

## 功能特點

- ✅ 文字浮水印
- ✅ 圖片浮水印
- ✅ 批次添加浮水印
- ✅ 自定義位置
- ✅ 透明度調整
- ✅ 旋轉角度
- ✅ 平鋪浮水印
- ✅ 不可見浮水印 (隱寫術)
- ✅ 浮水印移除 (基於 AI)
- ✅ Web UI 介面
- ✅ REST API

## 安裝

```bash
pip install -r requirements.txt
```

## 使用方式

### 1. 文字浮水印

```python
from watermark import WatermarkTool

tool = WatermarkTool()

# 添加文字浮水印
tool.add_text_watermark(
    'photo.jpg',
    'output.jpg',
    text='© 2024 Your Name',
    position='bottom-right',
    opacity=0.5
)
```

### 2. 圖片浮水印

```python
# 添加 Logo 浮水印
tool.add_image_watermark(
    'photo.jpg',
    'output.jpg',
    watermark_path='logo.png',
    position='top-right',
    scale=0.2,
    opacity=0.7
)
```

### 3. 自定義位置

```python
# 位置選項: 'top-left', 'top-right', 'bottom-left', 'bottom-right', 'center'
# 或使用座標: (x, y)

tool.add_text_watermark(
    'photo.jpg',
    'output.jpg',
    text='Sample',
    position=(100, 100),  # 自定義座標
    font_size=60
)
```

### 4. 平鋪浮水印

```python
# 覆蓋整張圖片的平鋪浮水印
tool.add_tiled_watermark(
    'photo.jpg',
    'output.jpg',
    text='CONFIDENTIAL',
    opacity=0.1,
    angle=45
)
```

### 5. 批次添加浮水印

```python
# 批次處理目錄中的所有圖片
tool.batch_watermark(
    input_dir='photos/',
    output_dir='watermarked/',
    text='© 2024',
    position='bottom-right'
)
```

### 6. 浮水印移除

```python
# 使用 AI 移除浮水印 (實驗性功能)
from watermark_remover import WatermarkRemover

remover = WatermarkRemover()
remover.remove('watermarked.jpg', 'clean.jpg')
```

### 7. Web UI

```bash
streamlit run app.py
```

### 8. REST API

```bash
uvicorn api:app --host 0.0.0.0 --port 8000
```

API 端點：
- `POST /add-text` - 添加文字浮水印
- `POST /add-image` - 添加圖片浮水印
- `POST /remove` - 移除浮水印

## 專案結構

```
image-watermark/
├── README.md
├── requirements.txt
├── watermark.py           # 浮水印添加工具
├── watermark_remover.py   # 浮水印移除工具
├── app.py                 # Streamlit UI
├── api.py                 # FastAPI REST API
└── fonts/                 # 字型檔案
    └── .gitkeep
```

## 位置選項

### 預設位置
- `top-left`: 左上角
- `top-right`: 右上角
- `bottom-left`: 左下角
- `bottom-right`: 右下角
- `center`: 中央

### 自定義座標
```python
position=(x, y)  # 像素座標
```

## 樣式自定義

### 文字浮水印樣式

```python
tool.add_text_watermark(
    'photo.jpg',
    'output.jpg',
    text='Copyright',
    position='bottom-right',
    font_size=48,
    font_color=(255, 255, 255),  # 白色
    opacity=0.6,
    angle=0,  # 旋轉角度
    font_path='arial.ttf'  # 自定義字型
)
```

### 圖片浮水印樣式

```python
tool.add_image_watermark(
    'photo.jpg',
    'output.jpg',
    watermark_path='logo.png',
    position='top-right',
    scale=0.2,      # 縮放比例
    opacity=0.8,    # 透明度
    angle=0,        # 旋轉角度
    margin=20       # 邊距
)
```

## 進階功能

### 1. 對角線浮水印

```python
tool.add_diagonal_watermark(
    'photo.jpg',
    'output.jpg',
    text='DRAFT',
    opacity=0.2
)
```

### 2. 重複浮水印

```python
tool.add_repeated_watermark(
    'photo.jpg',
    'output.jpg',
    text='© 2024',
    spacing=200,    # 間距
    opacity=0.3
)
```

### 3. 邊框浮水印

```python
tool.add_border_watermark(
    'photo.jpg',
    'output.jpg',
    text='© Your Name | www.example.com',
    border_height=50,
    bg_color=(0, 0, 0),
    text_color=(255, 255, 255)
)
```

### 4. 不可見浮水印 (LSB 隱寫術)

```python
from invisible_watermark import InvisibleWatermark

invisible = InvisibleWatermark()

# 嵌入不可見浮水印
invisible.embed('photo.jpg', 'watermarked.jpg', 'Secret Message')

# 提取浮水印
message = invisible.extract('watermarked.jpg')
print(message)  # 'Secret Message'
```

## 應用場景

1. **版權保護** - 照片、設計作品保護
2. **品牌推廣** - 添加公司 Logo
3. **文件標記** - 草稿、機密文件標記
4. **社交媒體** - Instagram、Facebook 圖片
5. **電子商務** - 產品圖片保護
6. **攝影作品** - 攝影師簽名
7. **法律文件** - 文件真實性驗證

## 技術棧

- **Pillow** - 圖像處理
- **OpenCV** - 高級圖像操作
- **NumPy** - 數值計算
- **Streamlit** - Web UI
- **FastAPI** - REST API

## 浮水印移除技術

浮水印移除使用以下技術：
- **圖像修復 (Inpainting)**
- **深度學習 (GAN)**
- **頻域分析**

**注意**: 浮水印移除僅供合法用途使用。

## 最佳實踐

### 文字浮水印
- 使用半透明 (opacity: 0.3-0.7)
- 選擇對比色
- 適當的字體大小
- 放置在不影響主體的位置

### 圖片浮水印
- Logo 大小適中 (5-20%)
- 保持透明度
- 選擇合適位置
- 使用 PNG 格式的 Logo

### 批次處理
- 統一浮水印樣式
- 保留原始檔案
- 使用描述性的輸出檔名
- 測試後再批次處理

## 性能優化

- 支援多線程批次處理
- 圖像大小自動優化
- 記憶體高效處理
- 快取常用設定

## 授權

MIT License

**重要提醒**:
- 請尊重他人版權
- 僅在合法授權下移除浮水印
- 不要用於侵犯版權的用途
