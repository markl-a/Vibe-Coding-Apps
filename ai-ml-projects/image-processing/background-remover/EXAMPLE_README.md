# 背景移除 (Background Remover) - 範例指南

## 快速開始

### 運行交互式範例

```bash
python example_usage.py
```

然後選擇要查看的範例 (1-8)。

### 直接運行範例代碼

```python
from bg_remover import BackgroundRemover

# 初始化
remover = BackgroundRemover(model_name='u2net')

# 移除背景 (透明)
remover.remove_background('input.jpg', 'output.png')

# 替換為白色背景
remover.remove_background('input.jpg', 'output_white.jpg', bg_color=(255, 255, 255))

# 模糊背景
remover.blur_background('input.jpg', 'output_blur.jpg', blur_strength=25)

# 替換為另一張圖片
remover.replace_background('person.jpg', 'beach.jpg', 'result.jpg')
```

## 範例列表

### 1. 基本背景移除
- 移除圖片背景，保留前景主體
- 輸出透明背景 (PNG)
- 用途: 證件照、商品圖、人物抠圖

### 2. 純色背景替換
- 將背景替換為指定顏色
- 支持 Alpha Matting 優化邊緣
- 用途: 製作證件照、商品圖

### 3. 模糊背景
- 保留前景，模糊背景
- 製造景深效果
- 用途: 突出主體、肖像攝影

### 4. 背景圖片替換
- 使用另一張圖片作為背景
- 支持多種調整模式 (stretch, cover, contain)
- 用途: 合成照片、虛擬背景

### 5. 遮罩提取
- 獲取二進制遮罩
- 用於進階圖像處理
- 用途: 自訂合成、ML 訓練

### 6. 批量處理
- 同時處理多張圖片
- 支持透明或純色背景
- 用途: 批量修圖、商品拍攝

### 7. 模型選擇
- u2net: 通用，最高精度 (推薦)
- u2netp: 輕量級，最快速度
- u2net_human_seg: 專門人物分割
- u2net_cloth_seg: 專門衣物分割

### 8. 完整工作流
- 電商場景示例
- 多步驟處理流程

## 參數說明

### BackgroundRemover 初始化
```python
remover = BackgroundRemover(model_name='u2net')
```

**model_name 選項:**
- `'u2net'`: 通用模型 (推薦，最高精度)
- `'u2netp'`: 輕量級模型 (快速)
- `'u2net_human_seg'`: 人物分割專用
- `'u2net_cloth_seg'`: 衣物分割

### remove_background() 參數
```python
remover.remove_background(
    input_path='input.jpg',           # 輸入圖片
    output_path='output.png',         # 輸出圖片
    bg_color=None,                    # 背景色 (RGB), None=透明
    alpha_matting=False,              # 使用 Alpha Matting
    alpha_matting_foreground_threshold=240,
    alpha_matting_background_threshold=10,
    alpha_matting_erode_size=10
)
```

### blur_background() 參數
```python
remover.blur_background(
    input_path='input.jpg',
    output_path='output.jpg',
    blur_strength=25                  # 模糊強度 (必須是奇數)
)
```

**blur_strength 參考:**
- 5-15: 輕度模糊
- 15-35: 中度模糊
- 35-50+: 強烈模糊

### replace_background() 參數
```python
remover.replace_background(
    input_path='person.jpg',
    background_path='bg.jpg',
    output_path='result.jpg',
    resize_mode='cover'               # 'stretch', 'cover', 'contain'
)
```

### batch_remove() 參數
```python
remover.batch_remove(
    input_dir='raw/',                 # 輸入目錄
    output_dir='processed/',          # 輸出目錄
    bg_color=(255, 255, 255)          # 背景色
)
```

## 常見用例

### 製作證件照
```python
remover = BackgroundRemover()
remover.remove_background(
    'photo.jpg',
    'id_photo_white.jpg',
    bg_color=(255, 255, 255),         # 白色背景
    alpha_matting=True                # 優化邊緣
)
```

### 製作電商圖片
```python
# 批量處理商品圖
outputs = remover.batch_remove(
    'products_raw/',
    'products_final/',
    bg_color=(255, 255, 255)
)
```

### 製作社群媒體圖片
```python
# 模糊背景突出主體
remover.blur_background(
    'portrait.jpg',
    'social_media.jpg',
    blur_strength=35
)
```

## 目錄結構建議

```
project/
├── example_usage.py           # 範例主文件
├── bg_remover.py              # 核心模組
├── EXAMPLE_README.md          # 本文件
├── sample_images/             # 示例圖片目錄
│   ├── person.jpg
│   ├── product.jpg
│   └── background.jpg
├── input/                     # 輸入圖片目錄
│   ├── photo1.jpg
│   ├── photo2.jpg
│   └── ...
└── output/                    # 輸出圖片目錄
    ├── transparent/           # 透明背景結果
    ├── white_bg/              # 白色背景結果
    └── blur/                  # 模糊背景結果
```

## 性能提示

### 加快速度
1. 使用輕量級模型: `model_name='u2netp'`
2. 縮小圖片尺寸
3. 批量使用 GPU

### 提高質量
1. 使用高精度模型: `model_name='u2net'`
2. 啟用 Alpha Matting
3. 使用人物專用模型: `u2net_human_seg`

## 常見問題

**Q: 效果不好？**
- A: 嘗試啟用 Alpha Matting
- A: 檢查圖片清晰度
- A: 嘗試不同的模型

**Q: 處理速度慢？**
- A: 使用 u2netp 輕量級模型
- A: 縮小圖片尺寸
- A: 使用 GPU 加速

**Q: 邊緣不整齐？**
- A: 啟用 Alpha Matting 並調整參數
- A: 增加 alpha_matting_erode_size
- A: 選擇人物專用模型

## 依賴要求

```
rembg
pillow
opencv-python
numpy
torch
```

## 更多資訊

- rembg 官方文檔: https://github.com/danielgatis/rembg
- U2-Net 論文: https://arxiv.org/abs/2005.09007
