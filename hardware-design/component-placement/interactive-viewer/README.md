# 互動式元件佈局視覺化工具

提供豐富的互動式視覺化功能，用於分析和展示 PCB 元件擺放結果。

## 功能特點

- **2D 互動視圖**: 可縮放、平移的佈局視圖
- **3D 視圖**: 立體展示元件擺放
- **熱圖顯示**: 視覺化熱分佈、擁擠度等
- **動畫播放**: 播放優化過程動畫
- **即時編輯**: 手動調整元件位置
- **統計分析**: 連線長度分佈、元件密度等

## 安裝

```bash
pip install -r requirements.txt
```

## 快速開始

```python
from interactive_viewer import LayoutViewer

# 初始化視覺化器
viewer = LayoutViewer()

# 載入佈局數據
viewer.load_layout("layout_result.json")

# 顯示互動視圖
viewer.show_interactive()

# 生成 3D 視圖
viewer.show_3d()

# 播放優化動畫
viewer.create_animation(history, output="optimization.mp4")
```

## 視覺化類型

### 1. 基本佈局視圖
- 元件矩形顯示
- 連線顯示
- 標籤和註解

### 2. 熱圖視圖
- 溫度分佈
- 連線密度
- 元件密度

### 3. 3D 視圖
- 立體元件
- 高度表示重要性
- 旋轉和縮放

### 4. 統計視圖
- 連線長度分佈直方圖
- 元件大小分佈
- 成本演化曲線

## 支援格式

輸入：
- JSON (自訂格式)
- KiCAD PCB
- CSV

輸出：
- PNG/SVG (靜態圖)
- MP4/GIF (動畫)
- HTML (互動網頁)

## 範例

查看 `examples/` 目錄獲取更多使用範例。
