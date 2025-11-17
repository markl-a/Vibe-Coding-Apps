# 圖片浮水印 (Image Watermark) - 範例指南

## 快速開始

### 運行交互式範例

```bash
python example_usage.py
```

然後選擇要查看的範例 (1-8)。

### 快速示例

```python
from watermark import WatermarkTool

tool = WatermarkTool()

# 文字浮水印
tool.add_text_watermark(
    'photo.jpg',
    'watermarked.jpg',
    text='© 2024 Studio',
    position='bottom-right'
)

# 圖片浮水印 (Logo)
tool.add_image_watermark(
    'photo.jpg',
    'with_logo.jpg',
    watermark_path='logo.png',
    position='bottom-right',
    scale=0.2
)

# 平鋪浮水印 (防盜)
tool.add_tiled_watermark(
    'photo.jpg',
    'tiled.jpg',
    text='CONFIDENTIAL',
    opacity=0.1
)

# 邊框浮水印 (字幕)
tool.add_border_watermark(
    'photo.jpg',
    'with_border.jpg',
    text='© 2024 Photography'
)
```

## 浮水印類型

### 1. 文字浮水印
簡單文本，可自訂位置、顏色、透明度、旋轉

**適用場景:**
- 版權標記
- 簽名
- 簡單品牌標籤

### 2. 圖片浮水印 (Logo)
在圖片上疊加 Logo 或圖標

**適用場景:**
- 品牌 Logo
- 公司標記
- 網站浮水印

### 3. 平鋪浮水印
在整個圖片上重複添加文字

**適用場景:**
- 防盜保護
- 版權聲明
- 機密文件標記

### 4. 邊框浮水印
在圖片底部添加邊框和文字

**適用場景:**
- 社群媒體標題
- 視頻截圖字幕
- 作者信息

## 參數說明

### 文字浮水印

```python
tool.add_text_watermark(
    input_path='photo.jpg',              # 輸入圖片
    output_path='watermarked.jpg',       # 輸出圖片
    text='© Studio',                     # 浮水印文字
    position='bottom-right',             # 位置
    font_size=48,                        # 字體大小
    font_color=(255, 255, 255),         # 文字顏色 (RGB)
    opacity=0.7,                         # 透明度 (0.0-1.0)
    angle=0,                             # 旋轉角度 (度)
    font_path=None,                      # 自訂字型檔案 (可選)
    margin=20                            # 邊距 (像素)
)
```

**位置選項:**
- `'top-left'` - 左上角
- `'top-right'` - 右上角
- `'bottom-left'` - 左下角
- `'bottom-right'` - 右下角 (推薦)
- `'center'` - 中央
- `(x, y)` - 自訂座標

**RGB 顏色範例:**
- `(255, 255, 255)` - 白色
- `(0, 0, 0)` - 黑色
- `(255, 0, 0)` - 紅色
- `(0, 255, 0)` - 綠色
- `(0, 0, 255)` - 藍色
- `(255, 255, 0)` - 黃色
- `(255, 165, 0)` - 橙色

**透明度指南:**
- `0.0` - 完全透明
- `0.3-0.5` - 輕度可見
- `0.7-0.9` - 明顯可見
- `1.0` - 完全不透明

### 圖片浮水印

```python
tool.add_image_watermark(
    input_path='photo.jpg',              # 輸入圖片
    output_path='with_logo.jpg',         # 輸出圖片
    watermark_path='logo.png',           # 浮水印圖片 (PNG)
    position='bottom-right',             # 位置
    scale=0.2,                           # 縮放比例 (相對於原圖)
    opacity=0.8,                         # 透明度
    angle=0,                             # 旋轉角度
    margin=20                            # 邊距
)
```

**scale 說明:**
- `0.1` - 很小 (10%)
- `0.2` - 中等 (20%, 推薦)
- `0.3` - 較大 (30%)
- `0.5` - 很大 (50%)

### 平鋪浮水印

```python
tool.add_tiled_watermark(
    input_path='photo.jpg',
    output_path='tiled.jpg',
    text='CONFIDENTIAL',                 # 浮水印文字
    spacing=200,                         # 文字間距 (像素)
    opacity=0.1,                         # 低透明度 (防盜)
    angle=45,                            # 45 度角
    font_size=48,
    font_color=(128, 128, 128)          # 灰色
)
```

**spacing 說明:**
- `100` - 密集
- `200-300` - 正常
- `500+` - 稀疏

### 邊框浮水印

```python
tool.add_border_watermark(
    input_path='photo.jpg',
    output_path='with_border.jpg',
    text='© 2024 Studio',                # 邊框文字
    border_height=50,                    # 邊框高度 (像素)
    bg_color=(0, 0, 0),                 # 背景色 (RGB)
    text_color=(255, 255, 255),         # 文字色
    font_size=24                         # 字體大小
)
```

### 批量處理

```python
tool.batch_watermark(
    input_dir='raw_photos/',             # 輸入目錄
    output_dir='watermarked/',           # 輸出目錄
    watermark_type='text',               # 'text' 或 'image'
    text='© Studio',                     # 其他參數
    position='bottom-right',
    font_size=48
)
```

## 範例列表

### 1. 基本文字浮水印
簡單版權標記，白色文字，右下角位置

### 2. 進階文字浮水印
自訂座標、邊距、字體、透明度

### 3. 圖片浮水印
將 Logo 疊加到圖片上

### 4. 平鋪浮水印
防盜保護效果

### 5. 邊框浮水印
添加標題邊框

### 6. 批量處理
一次處理多張圖片

### 7. 攝影工作流程
婚禮照片多版本處理

### 8. 電商工作流程
產品圖片製作

## 實際應用案例

### 攝影師簽名

```python
tool.add_text_watermark(
    'photo.jpg',
    'signed_photo.jpg',
    text='© John Photography',
    position='bottom-right',
    font_size=36,
    font_color=(255, 255, 255),
    opacity=0.7
)
```

### 社群媒體準備

```python
# 添加邊框標籤
tool.add_border_watermark(
    'photo.jpg',
    'instagram_ready.jpg',
    text='Follow @mystudio on Instagram',
    border_height=80,
    bg_color=(0, 102, 204),
    text_color=(255, 255, 255),
    font_size=32
)
```

### 防盜水印

```python
# 平鋪文字防盜
tool.add_tiled_watermark(
    'original.jpg',
    'protected.jpg',
    text='CONFIDENTIAL - NOT FOR DISTRIBUTION',
    spacing=200,
    opacity=0.08,
    angle=45,
    font_size=36,
    font_color=(255, 0, 0)
)
```

### 公司 Logo 標記

```python
# 右上角小 Logo
tool.add_image_watermark(
    'photo.jpg',
    'branded.jpg',
    watermark_path='company_logo.png',
    position='top-right',
    scale=0.12,
    opacity=0.85
)
```

### 批量商品圖處理

```python
# 批量添加品牌 Logo
outputs = tool.batch_watermark(
    'products/',
    'products_branded/',
    watermark_type='image',
    watermark_path='logo.png',
    position='bottom-right',
    scale=0.15,
    opacity=0.8
)

print(f"已處理 {len(outputs)} 張商品圖")
```

## 最佳實踐

### 文字浮水印
1. **字體大小:** 根據圖片尺寸調整 (16:9 圖片用 36-48)
2. **位置:** 右下角最常見，避免遮擋重要內容
3. **透明度:** 應該可見但不過度明顯 (0.6-0.8)
4. **顏色:** 與背景對比明顯 (深圖片用白色，淺圖片用黑色)

### Logo 浮水印
1. **Logo 大小:** 原圖的 15-25% 最佳
2. **位置:** 右下角或右上角
3. **透明度:** 75-85% (保留透明度)
4. **格式:** 使用 PNG 以支援透明

### 平鋪水印
1. **透明度:** 非常低 (5-15%) 以防止過度遮擋
2. **角度:** 45 度最常見
3. **間距:** 200-300 像素
4. **文字:** 簡潔有力 ("WATERMARK", "DRAFT" 等)

### 邊框水印
1. **高度:** 圖片高度的 5-10%
2. **文字:** 簡短 (署名或簡單標籤)
3. **顏色:** 高對比組合

## 目錄結構建議

```
project/
├── example_usage.py           # 範例主文件
├── watermark.py               # 浮水印模塊
├── EXAMPLE_README.md          # 本文件
├── logos/
│   └── company_logo.png       # Logo 檔案
├── input/
│   ├── photo1.jpg
│   ├── photo2.jpg
│   └── ...
└── output/
    ├── text_watermark/
    ├── with_logo/
    ├── tiled/
    └── with_border/
```

## 常見問題

**Q: 如何找到合適的字體？**
- A: Linux 系統常見路徑: `/usr/share/fonts/`
- A: 可使用 Google Fonts
- A: 避免使用過於華麗的字體

**Q: 如何改變文字顏色？**
- A: 修改 `font_color` 參數為 RGB 值
- A: 例如: `(255, 0, 0)` 為紅色

**Q: 浮水印太明顯或太淡？**
- A: 調整 `opacity` 參數 (0.0-1.0)
- A: 調整 `font_size` 改變大小

**Q: 如何批量處理？**
- A: 使用 `batch_watermark()` 方法
- A: 提供輸入和輸出目錄

**Q: PNG 和 JPG 的區別？**
- A: PNG: 保留透明背景 (推薦)
- A: JPG: 文件更小，不支援透明

## 依賴要求

```
Pillow
opencv-python
numpy
```

## 性能提示

- 批量處理大量圖片時，可循環調用方法
- 圖片越大，處理時間越長
- 使用 PIL 處理較快，OpenCV 用於複雜操作

## 更多資訊

- Pillow 文檔: https://pillow.readthedocs.io/
- OpenCV 文檔: https://docs.opencv.org/
