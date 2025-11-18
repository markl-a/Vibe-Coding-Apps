# 圖像超分辨率 Image Super Resolution

🔍 使用深度學習提升圖像分辨率，讓模糊圖像變清晰

## 功能特點

- ✅ 多種超分辨率模型支持
- ✅ 2x, 3x, 4x 放大倍數
- ✅ 批量處理支持
- ✅ GPU 加速
- ✅ Web UI 介面
- ✅ 命令行工具
- ✅ 易於集成

## 支持的模型

### 1. Bicubic (雙三次插值)
- ⚡ 速度最快
- 🎯 不需要訓練
- 📊 效果：基礎

### 2. ESPCN (高效子像素卷積網絡)
- ⚡ 速度快
- 🎯 輕量級模型
- 📊 效果：優秀

### 3. SRCNN (超分辨率卷積神經網絡)
- ⚡ 速度中等
- 🎯 經典模型
- 📊 效果：優秀

### 4. OpenCV DNN
- ⚡ 速度快
- 🎯 易於部署
- 📊 效果：良好

## 安裝

```bash
pip install -r requirements.txt
```

## 快速開始

### 基本使用

```python
from super_resolution import SuperResolution

# 初始化處理器
sr = SuperResolution(model_type='bicubic', scale_factor=2)

# 提升圖像分辨率
sr.upscale('input.jpg', 'output.jpg')
```

### 批量處理

```python
sr = SuperResolution(model_type='bicubic', scale_factor=2)
sr.batch_upscale('input_folder/', 'output_folder/')
```

### 使用深度學習模型

```python
# ESPCN 模型 (推薦)
sr = SuperResolution(model_type='espcn', scale_factor=2)
sr.upscale('low_res.jpg', 'high_res.jpg')

# SRCNN 模型
sr = SuperResolution(model_type='srcnn', scale_factor=2)
sr.upscale('low_res.jpg', 'high_res.jpg')
```

## 命令行使用

### 單張圖像

```bash
python super_resolution.py input.jpg --output output.jpg --model bicubic --scale 2
```

### 批量處理

```bash
python super_resolution.py input_folder/ --output output_folder/ --batch --scale 2
```

### 不同放大倍數

```bash
# 2倍放大
python super_resolution.py input.jpg --scale 2

# 3倍放大
python super_resolution.py input.jpg --scale 3

# 4倍放大
python super_resolution.py input.jpg --scale 4
```

## Web UI

啟動 Streamlit Web 應用：

```bash
streamlit run app.py
```

功能：
- 📤 上傳圖像
- 🎛️ 調整參數
- 👁️ 即時預覽
- 📥 下載結果
- 📊 質量對比

## 互動示例

運行互動示例程序：

```bash
python example_usage.py
```

包含 8 個完整示例：
1. 基本圖像放大
2. 不同放大倍數
3. 批量處理
4. 比較前後效果
5. PIL Image 處理
6. 質量比較
7. 高分辨率輸出
8. 細節保留測試

## API 參考

### SuperResolution 類

```python
class SuperResolution:
    def __init__(
        self,
        model_type: str = 'bicubic',
        scale_factor: int = 2,
        device: Optional[str] = None,
        model_path: Optional[str] = None
    )
```

#### 參數

- `model_type`: 模型類型 ('bicubic', 'espcn', 'srcnn', 'opencv')
- `scale_factor`: 放大倍數 (2, 3, 4)
- `device`: 設備 ('cuda', 'cpu')
- `model_path`: 預訓練模型路徑

#### 方法

##### upscale()

```python
def upscale(
    self,
    image_path: str,
    output_path: Optional[str] = None,
    return_array: bool = False
) -> Union[str, np.ndarray]
```

提升單張圖像分辨率。

##### batch_upscale()

```python
def batch_upscale(
    self,
    input_dir: str,
    output_dir: str,
    extensions: Optional[list] = None
) -> list
```

批量處理多張圖像。

## 應用場景

### 1. 照片修復
```python
# 提升老照片質量
sr = SuperResolution('bicubic', scale_factor=2)
sr.upscale('old_photo.jpg', 'restored_photo.jpg')
```

### 2. 截圖增強
```python
# 提升低分辨率截圖
sr = SuperResolution('espcn', scale_factor=4)
sr.upscale('screenshot.png', 'enhanced_screenshot.png')
```

### 3. 縮略圖放大
```python
# 將縮略圖轉為高清圖
sr = SuperResolution('bicubic', scale_factor=3)
sr.batch_upscale('thumbnails/', 'full_size/')
```

### 4. 打印準備
```python
# 為打印準備高分辨率圖像
sr = SuperResolution('srcnn', scale_factor=2)
sr.upscale('web_image.jpg', 'print_image.jpg')
```

## 性能比較

| 模型 | 速度 | 質量 | 模型大小 | GPU 需求 |
|------|------|------|----------|----------|
| Bicubic | ⭐⭐⭐⭐⭐ | ⭐⭐ | - | 否 |
| ESPCN | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | 小 | 可選 |
| SRCNN | ⭐⭐⭐ | ⭐⭐⭐⭐ | 中 | 建議 |
| OpenCV | ⭐⭐⭐⭐ | ⭐⭐⭐ | 中 | 否 |

## 技術細節

### ESPCN 架構

- 3 層卷積網絡
- 子像素卷積上採樣
- 參數量：~17K
- 訓練數據：DIV2K

### SRCNN 架構

- 3 層卷積網絡
- 雙三次預放大
- 參數量：~57K
- 訓練數據：ImageNet

## 常見問題

### Q: 哪個模型效果最好？

A: 對於大多數情況，ESPCN 提供最佳的速度和質量平衡。如果追求速度，使用 Bicubic。如果追求質量且有 GPU，使用 SRCNN。

### Q: 可以放大多少倍？

A: 目前支持 2x, 3x, 4x。不建議超過 4x，因為效果會變差。

### Q: 需要 GPU 嗎？

A: Bicubic 和 OpenCV 不需要 GPU。深度學習模型（ESPCN, SRCNN）在 CPU 上也能運行，但 GPU 會快很多。

### Q: 處理速度如何？

A:
- Bicubic: ~0.01秒/張 (1080p)
- ESPCN (GPU): ~0.05秒/張
- ESPCN (CPU): ~0.5秒/張
- SRCNN (GPU): ~0.1秒/張
- SRCNN (CPU): ~1秒/張

### Q: 支持哪些圖像格式？

A: JPG, JPEG, PNG, BMP, TIFF, WEBP

### Q: 可以處理視頻嗎？

A: 目前只支持圖像。視頻需要先提取幀，處理後再合成。

## 局限性

- ❌ 無法無中生有創造細節
- ❌ 極度模糊的圖像效果有限
- ❌ 處理大圖需要更多內存
- ❌ 深度學習模型需要訓練數據

## 未來改進

- [ ] 支持更多模型 (EDSR, RDN, ESRGAN)
- [ ] 視頻超分辨率
- [ ] 實時處理
- [ ] 模型量化加速
- [ ] Web 端部署
- [ ] 移動端支持

## 技術棧

- **PyTorch** - 深度學習框架
- **OpenCV** - 圖像處理
- **Pillow** - 圖像操作
- **NumPy** - 數值計算
- **Streamlit** - Web UI

## 授權

MIT License

## 參考文獻

- ESPCN: Shi et al. "Real-Time Single Image and Video Super-Resolution"
- SRCNN: Dong et al. "Image Super-Resolution Using Deep Convolutional Networks"
