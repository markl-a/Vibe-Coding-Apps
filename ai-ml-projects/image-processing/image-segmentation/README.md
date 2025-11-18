# 圖像分割 Image Segmentation

🎨 智能分割圖像中的不同物體和區域

## 功能特點

- ✅ 語義分割 (Semantic Segmentation)
- ✅ 實例分割 (Instance Segmentation)
- ✅ 多種模型支持 (DeepLabV3, FCN, GrabCut)
- ✅ GPU 加速
- ✅ 高精度分割

## 快速開始

```python
from segmentation import ImageSegmentation

# 初始化分割器
segmenter = ImageSegmentation(model_type='deeplabv3')

# 執行分割
result = segmenter.segment('image.jpg', 'output.jpg')
```

## 支持的模型

- **DeepLabV3** - 最先進的語義分割
- **FCN** - 全卷積網絡
- **GrabCut** - 傳統交互式分割

## 應用場景

- 🚗 自動駕駛場景理解
- 📸 人像摳圖
- 🏥 醫學影像分析
- 🛰️ 衛星圖像分析

## 授權

MIT License
