# 圖像風格轉換 Neural Style Transfer

🎨 使用深度學習將藝術風格應用到照片上

## 功能特點

- ✅ 神經網路風格轉換
- ✅ 預設多種藝術風格
- ✅ 自定義風格圖片
- ✅ 即時預覽
- ✅ 批次處理
- ✅ 風格強度調整
- ✅ Web UI 介面
- ✅ GPU 加速

## 安裝

```bash
pip install -r requirements.txt
```

## 使用方式

### 1. 基本風格轉換

```python
from style_transfer import StyleTransfer

# 初始化
transfer = StyleTransfer()

# 應用風格
output = transfer.transfer_style(
    content_image='photo.jpg',
    style_image='starry_night.jpg',
    output_path='stylized_photo.jpg'
)
```

### 2. 使用預設風格

```python
# 可用的預設風格
styles = transfer.list_available_styles()
print(styles)  # ['starry_night', 'mosaic', 'candy', 'udnie', ...]

# 使用預設風格
transfer.apply_preset_style('photo.jpg', 'starry_night', 'output.jpg')
```

### 3. 調整風格強度

```python
# 風格強度範圍: 0.0 (無風格) 到 1.0 (完全風格化)
transfer.transfer_style(
    content_image='photo.jpg',
    style_image='style.jpg',
    output_path='output.jpg',
    style_weight=0.7,
    content_weight=0.3
)
```

### 4. 批次處理

```python
# 批次應用相同風格
transfer.batch_transfer(
    content_dir='input_photos/',
    style_image='style.jpg',
    output_dir='stylized_photos/'
)
```

### 5. Web UI

```bash
streamlit run app.py
```

## 專案結構

```
style-transfer/
├── README.md
├── requirements.txt
├── style_transfer.py      # 核心風格轉換引擎
├── app.py                 # Streamlit UI
├── models/                # 預訓練模型
│   ├── vgg19.pth
│   └── style_models/
└── styles/                # 預設風格圖片
    ├── starry_night.jpg
    ├── mosaic.jpg
    ├── candy.jpg
    └── wave.jpg
```

## 預設風格

包含多種經典藝術風格：

1. **梵谷星夜** (Starry Night)
2. **馬賽克** (Mosaic)
3. **糖果** (Candy)
4. **浮世繪波浪** (Wave)
5. **抽象藝術** (Abstract)
6. **印象派** (Impressionism)

## 技術原理

使用 **Neural Style Transfer** 技術：

1. **內容表示**: 使用 VGG19 網路提取內容特徵
2. **風格表示**: 通過 Gram 矩陣捕捉風格
3. **優化**: 最小化內容損失和風格損失

## 參數說明

- `content_weight`: 內容權重 (推薦: 1.0)
- `style_weight`: 風格權重 (推薦: 100000.0)
- `num_steps`: 優化步數 (推薦: 300)
- `learning_rate`: 學習率 (推薦: 0.01)

## 技術棧

- **PyTorch** - 深度學習框架
- **torchvision** - 預訓練模型
- **Pillow** - 圖像處理
- **NumPy** - 數值計算
- **Streamlit** - Web UI
- **OpenCV** - 圖像操作

## 效能優化

- GPU 加速 (CUDA)
- 圖像大小自動調整
- 多解析度處理
- 批次優化

## 應用場景

1. **藝術創作** - 將照片藝術化
2. **設計** - 創建獨特視覺效果
3. **社交媒體** - 生成吸睛內容
4. **印刷品** - 藝術海報製作
5. **遊戲** - 遊戲場景風格化

## 範例效果

```
原始照片 + 梵谷星夜 = 星夜風格照片
原始照片 + 馬賽克 = 馬賽克風格照片
原始照片 + 浮世繪 = 日式風格照片
```

## 授權

MIT License
