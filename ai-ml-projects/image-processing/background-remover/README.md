# 背景移除工具 Background Remover

✂️ 使用 AI 自動移除圖片背景

## 功能特點

- ✅ 自動背景移除
- ✅ 人物摳圖
- ✅ 產品圖去背
- ✅ 批次處理
- ✅ 自定義背景顏色
- ✅ 透明背景 (PNG)
- ✅ 模糊背景
- ✅ 替換背景
- ✅ Web UI 介面
- ✅ REST API

## 安裝

```bash
pip install -r requirements.txt
```

## 使用方式

### 1. 基本背景移除

```python
from bg_remover import BackgroundRemover

remover = BackgroundRemover()

# 移除背景 (透明)
remover.remove_background('input.jpg', 'output.png')
```

### 2. 替換背景顏色

```python
# 白色背景
remover.remove_background('input.jpg', 'output.jpg', bg_color=(255, 255, 255))

# 綠色背景
remover.remove_background('input.jpg', 'output.jpg', bg_color=(0, 255, 0))
```

### 3. 模糊背景

```python
# 保留主體，模糊背景
remover.blur_background('input.jpg', 'output.jpg', blur_strength=25)
```

### 4. 自定義背景圖片

```python
# 替換為新背景
remover.replace_background(
    'person.jpg',
    'new_background.jpg',
    'output.jpg'
)
```

### 5. 批次處理

```python
# 批次移除背景
remover.batch_remove(
    input_dir='input_images/',
    output_dir='output_images/',
    bg_color=(255, 255, 255)  # 可選
)
```

### 6. Web UI

```bash
streamlit run app.py
```

### 7. REST API

```bash
uvicorn api:app --host 0.0.0.0 --port 8000
```

API 端點：
- `POST /remove-bg` - 移除背景
- `POST /replace-bg` - 替換背景
- `POST /blur-bg` - 模糊背景

## 專案結構

```
background-remover/
├── README.md
├── requirements.txt
├── bg_remover.py          # 核心背景移除引擎
├── app.py                 # Streamlit UI
├── api.py                 # FastAPI REST API
└── models/                # 預訓練模型
    └── .gitkeep
```

## 技術原理

使用 **U2-Net** 深度學習模型進行語義分割：

1. **顯著性檢測**: 識別圖像中的主體
2. **精確分割**: 生成高品質遮罩
3. **邊緣優化**: 保留細節如頭髮邊緣
4. **背景處理**: 移除、替換或模糊背景

## 應用場景

1. **電商產品圖** - 統一白色背景
2. **證件照** - 更換背景顏色
3. **社交媒體** - 創意背景合成
4. **設計素材** - 提取主體元素
5. **視訊會議** - 虛擬背景
6. **印刷品** - 去背素材

## 支援格式

### 輸入
- JPEG, PNG, BMP, WEBP

### 輸出
- PNG (透明背景)
- JPEG (純色背景)

## 技術棧

- **rembg** - AI 背景移除
- **U2-Net** - 深度學習模型
- **Pillow** - 圖像處理
- **OpenCV** - 圖像操作
- **NumPy** - 數值計算
- **Streamlit** - Web UI
- **FastAPI** - REST API

## 效能優化

- GPU 加速
- 模型快取
- 批次處理優化
- 圖像尺寸自動調整

## 進階功能

### 1. 保留透明度

```python
# 輸出 PNG 保留透明度
remover.remove_background('input.jpg', 'output.png', alpha_matting=True)
```

### 2. 調整遮罩品質

```python
# 更精確的邊緣
remover.remove_background(
    'input.jpg',
    'output.png',
    alpha_matting=True,
    alpha_matting_foreground_threshold=240,
    alpha_matting_background_threshold=10
)
```

### 3. 獲取遮罩

```python
# 只獲取遮罩
mask = remover.get_mask('input.jpg')
```

## 使用提示

- 主體清晰的圖片效果最好
- 複雜背景也能處理
- 支援人物、產品、動物等
- 建議使用高解析度圖片
- 頭髮、毛髮邊緣會自動優化

## 範例效果

```
人物照片 → 透明背景
產品圖片 → 白色背景
寵物照片 → 自定義背景
證件照 → 藍色/紅色背景
```

## 授權

MIT License

## 致謝

基於 [rembg](https://github.com/danielgatis/rembg) 和 [U2-Net](https://github.com/xuebinqin/U-2-Net)
