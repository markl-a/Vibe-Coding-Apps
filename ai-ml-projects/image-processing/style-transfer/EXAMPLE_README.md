# 風格轉換 (Style Transfer) - 範例指南

## 快速開始

### 運行交互式範例

```bash
python example_usage.py
```

然後選擇要查看的範例 (1-9)。

### 快速示例

```python
from style_transfer import StyleTransfer

# 初始化
transfer = StyleTransfer()

# 執行風格轉換
transfer.transfer_style(
    content_image='photo.jpg',      # 內容圖片
    style_image='style.jpg',         # 風格圖片
    output_path='output.jpg',        # 輸出圖片
    num_steps=300,                   # 優化步數
    style_weight=1e6                 # 風格權重
)
```

## 工作原理

風格轉換將一張圖片的藝術風格應用到另一張圖片上：

1. **內容圖片**: 結構和主體 (例如: 人物照片)
2. **風格圖片**: 紋理和色彩 (例如: 油畫)
3. **輸出**: 結合兩者的新圖片

**處理時間:**
- 快速預覽 (256x256, 100步): 1-2 分鐘
- 標準 (512x512, 300步): 5-15 分鐘
- 高質量 (1024x1024, 500步): 15-30 分鐘

## 參數說明

### StyleTransfer 初始化

```python
transfer = StyleTransfer(device=None)
# device: 'cuda' (GPU), 'cpu' (CPU), None (自動)
```

### transfer_style() 主要參數

```python
transfer.transfer_style(
    content_image='photo.jpg',       # 內容圖片路徑
    style_image='style.jpg',         # 風格圖片路徑
    output_path='output.jpg',        # 輸出路徑
    num_steps=300,                   # 優化步數 (越多越好)
    style_weight=1e6,                # 風格權重 (越大越明顯)
    content_weight=1,                # 內容權重 (1 為推薦)
    learning_rate=0.01,              # 學習率 (優化速度)
    max_size=512,                    # 最大圖像尺寸
    verbose=True                     # 顯示進度
)
```

## 詳細參數指南

### num_steps (優化步數)

控制優化迭代次數

```python
# 快速預覽 (低質量，快速)
transfer.transfer_style(
    ...,
    num_steps=100,
    ...
)

# 平衡 (中等質量，合理時間) - 推薦
transfer.transfer_style(
    ...,
    num_steps=300,
    ...
)

# 高質量 (高質量，需時較長)
transfer.transfer_style(
    ...,
    num_steps=500,
    ...
)

# 超高質量 (最佳效果，耗時)
transfer.transfer_style(
    ...,
    num_steps=1000,
    ...
)
```

**建議:**
- 預覽: 100-150
- 默認: 300-400
- 高質量: 500-800
- 超高質量: 800+

### style_weight (風格權重)

控制風格的強度

```python
# 輕度風格 (保留更多原始內容)
transfer.transfer_style(
    ...,
    style_weight=1e4,
    ...
)

# 中等風格 (平衡)
transfer.transfer_style(
    ...,
    style_weight=1e5,
    ...
)

# 強烈風格 (明顯風格化) - 推薦
transfer.transfer_style(
    ...,
    style_weight=1e6,
    ...
)

# 非常強烈 (可能失去內容)
transfer.transfer_style(
    ...,
    style_weight=1e7,
    ...
)
```

**指數說明:**
- `1e4` = 10,000
- `1e5` = 100,000
- `1e6` = 1,000,000
- `1e7` = 10,000,000

### content_weight (內容權重)

控制原始內容的保留

```python
# 強調風格，保留較少內容
transfer.transfer_style(
    ...,
    content_weight=0.5,
    ...
)

# 標準 (推薦)
transfer.transfer_style(
    ...,
    content_weight=1,
    ...
)

# 強調內容，保留較多細節
transfer.transfer_style(
    ...,
    content_weight=5,
    ...
)
```

### max_size (圖像尺寸)

控制處理解析度

```python
# 快速預覽 (低質量，快速)
transfer.transfer_style(
    ...,
    max_size=256,
    ...
)

# 標準質量
transfer.transfer_style(
    ...,
    max_size=512,
    ...
)

# 高質量 (需要更多顯存)
transfer.transfer_style(
    ...,
    max_size=768,
    ...
)

# 超高質量 (GPU 推薦)
transfer.transfer_style(
    ...,
    max_size=1024,
    ...
)
```

**影響:**
- 256: 快速，質量低
- 512: 平衡 (推薦)
- 768+: 高質量，耗時

### learning_rate (學習率)

控制優化速度

```python
# 保守 (安全，進度慢)
transfer.transfer_style(
    ...,
    learning_rate=0.001,
    ...
)

# 標準 (推薦)
transfer.transfer_style(
    ...,
    learning_rate=0.01,
    ...
)

# 激進 (快速，可能不穩定)
transfer.transfer_style(
    ...,
    learning_rate=0.1,
    ...
)
```

## 範例列表

### 1. 基本風格轉換
簡單的風格轉換示例

### 2. 參數調整
展示各種參數組合的效果

### 3. 風格選擇
不同風格圖片的選擇建議

### 4. 不同內容
應用同一風格到多張圖片

### 5. 批量處理
批量轉換多張圖片

### 6. 優化技巧
加快速度或提高質量

### 7. 裝置選擇
GPU 和 CPU 的選擇

### 8. 創意應用
實際應用場景

### 9. 完整工作流
專業工作流程示例

## 預設配置

### 快速預覽

```python
transfer.transfer_style(
    content_image='photo.jpg',
    style_image='style.jpg',
    output_path='preview.jpg',
    num_steps=150,
    max_size=256,
    style_weight=1e5,
    verbose=False  # 不顯示進度
)
```

適用: 快速測試不同風格

### 標準配置 (推薦)

```python
transfer.transfer_style(
    content_image='photo.jpg',
    style_image='style.jpg',
    output_path='standard.jpg',
    num_steps=300,
    max_size=512,
    style_weight=1e6,
    verbose=True
)
```

適用: 一般用途

### 高質量配置

```python
transfer.transfer_style(
    content_image='photo.jpg',
    style_image='style.jpg',
    output_path='high_quality.jpg',
    num_steps=500,
    max_size=768,
    style_weight=1e6,
    verbose=True
)
```

適用: 專業應用，可接受耗時

### 內容保留配置

```python
transfer.transfer_style(
    content_image='photo.jpg',
    style_image='style.jpg',
    output_path='content_focused.jpg',
    num_steps=300,
    style_weight=1e5,      # 較低風格權重
    content_weight=5,      # 較高內容權重
    verbose=True
)
```

適用: 需要保留原始內容結構

## 實際應用案例

### 照片藝術化

```python
# 將婚禮照轉換為油畫
transfer.transfer_style(
    'wedding_photo.jpg',
    'van_gogh_painting.jpg',
    'wedding_oil_paint.jpg',
    num_steps=400,
    style_weight=1e6
)
```

### 相冊統一風格

```python
from pathlib import Path

# 為整個相冊應用同一風格
transfer.transfer_style(
    content_dir='vacation_photos/',
    style_image='impressionist_style.jpg',
    output_dir='vacation_artistic/',
    num_steps=250,
    style_weight=1e5
)
```

### 風格實驗

```python
# 嘗試不同風格
styles = [
    'oil_painting.jpg',
    'watercolor.jpg',
    'impressionist.jpg',
    'abstract.jpg'
]

for style in styles:
    output = f'output_{Path(style).stem}.jpg'
    transfer.transfer_style(
        'photo.jpg',
        style,
        output,
        num_steps=300
    )
```

### 風格疊加

```python
# 先應用風格 A
transfer.transfer_style(
    'photo.jpg',
    'style_a.jpg',
    'intermediate.jpg',
    num_steps=200
)

# 再應用風格 B
transfer.transfer_style(
    'intermediate.jpg',
    'style_b.jpg',
    'final.jpg',
    num_steps=200
)
```

## GPU 加速

### 檢查 CUDA 可用性

```python
import torch

print(f"CUDA 可用: {torch.cuda.is_available()}")
if torch.cuda.is_available():
    print(f"GPU: {torch.cuda.get_device_name(0)}")
    print(f"顯存: {torch.cuda.get_device_properties(0).total_memory / 1e9:.2f} GB")
```

### 使用 GPU

```python
# 自動使用 GPU (如可用)
transfer = StyleTransfer()

# 強制使用 GPU
transfer_gpu = StyleTransfer(device='cuda')

# 強制使用 CPU
transfer_cpu = StyleTransfer(device='cpu')
```

**性能對比:**
- GPU: 3-5 分鐘 (300 步)
- CPU: 30-60 分鐘 (300 步)
- GPU 快 10-20 倍

## 最佳實踐

### 風格圖片選擇

1. **高質量**: 清晰的風格圖片
2. **豐富紋理**: 明顯的紋理和圖案
3. **適當大小**: 不要過小 (最少 200x200)
4. **相關性**: 選擇與內容相匹配的風格

**推薦風格圖片:**
- 油畫作品 (梵高、莫奈等)
- 攝影作品 (黑白、復古等)
- 紋理圖片 (布料、金屬等)

### 內容圖片準備

1. **清晰度**: 確保圖片清晰
2. **大小**: 不要太小 (最少 200x200)
3. **格式**: JPG 或 PNG
4. **光線**: 適當光線

### 參數調整

1. 先進行快速預覽 (100-150 步)
2. 根據預覽調整參數
3. 最終生成高質量版本

### 時間管理

1. CPU 可接受時間: 10-30 分鐘
2. GPU 處理: 3-10 分鐘
3. 可在後台運行進行批量處理

## 常見問題

**Q: 轉換很慢？**
- A: 使用 GPU (快 10-20 倍)
- A: 減少 num_steps
- A: 減小 max_size
- A: 提高 learning_rate

**Q: 效果不理想？**
- A: 增加 num_steps (300-500)
- A: 選擇更好的風格圖片
- A: 調整 style_weight
- A: 增加 max_size

**Q: GPU 顯存不足？**
- A: 減小 max_size (512 -> 256)
- A: 減少 num_steps
- A: 關閉其他應用

**Q: 內容丟失太多？**
- A: 增加 content_weight
- A: 減少 style_weight
- A: 增加 num_steps

**Q: 如何處理視頻？**
- A: 逐幀轉換 (耗時)
- A: 提取關鍵幀轉換
- A: 使用專門的視頻風格轉換工具

## 目錄結構建議

```
project/
├── example_usage.py           # 範例主文件
├── style_transfer.py          # 核心模塊
├── EXAMPLE_README.md          # 本文件
├── content_images/            # 內容圖片
│   ├── photo1.jpg
│   ├── photo2.jpg
│   └── ...
├── style_images/              # 風格圖片
│   ├── oil_painting.jpg
│   ├── impressionist.jpg
│   └── ...
└── output/
    ├── previews/              # 預覽版本
    └── final/                 # 最終版本
```

## 依賴要求

```
torch
torchvision
pillow
numpy
```

## 性能提示

- 首次運行會下載 VGG19 模型 (~500MB)
- 使用 GPU 可加快 10-20 倍
- 批量處理可在後台進行
- 合理安排參數組合平衡質量和時間

## 更多資訊

- PyTorch: https://pytorch.org/
- 風格轉換論文: https://arxiv.org/abs/1508.06576
- VGG19: https://arxiv.org/abs/1409.1556
