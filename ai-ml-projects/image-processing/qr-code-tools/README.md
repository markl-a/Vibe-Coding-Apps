# QR 碼生成與讀取工具 QR Code Tools

📱 強大的 QR 碼生成、讀取和美化工具

## 功能特點

- ✅ QR 碼生成
- ✅ QR 碼讀取/解碼
- ✅ 批次生成
- ✅ 自定義顏色
- ✅ 添加 Logo
- ✅ 圓角設計
- ✅ 漸變色 QR 碼
- ✅ 藝術 QR 碼
- ✅ 批次讀取
- ✅ Web UI 介面
- ✅ REST API

## 安裝

```bash
pip install -r requirements.txt
```

## 使用方式

### 1. 基本 QR 碼生成

```python
from qr_generator import QRCodeGenerator

generator = QRCodeGenerator()

# 生成簡單 QR 碼
generator.generate('https://example.com', 'qrcode.png')
```

### 2. 自定義顏色

```python
# 黑底白色 QR 碼
generator.generate(
    'Hello World',
    'qr_custom.png',
    fill_color='white',
    back_color='black'
)

# RGB 顏色
generator.generate(
    'https://example.com',
    'qr_color.png',
    fill_color=(255, 0, 0),      # 紅色
    back_color=(255, 255, 0)     # 黃色
)
```

### 3. 添加 Logo

```python
# 在 QR 碼中央添加 Logo
generator.generate_with_logo(
    'https://example.com',
    'qr_logo.png',
    logo_path='logo.png',
    logo_size_ratio=0.3  # Logo 佔 QR 碼的比例
)
```

### 4. 藝術 QR 碼

```python
# 圓角 QR 碼
generator.generate_rounded(
    'https://example.com',
    'qr_rounded.png',
    radius=10
)

# 漸變色 QR 碼
generator.generate_gradient(
    'https://example.com',
    'qr_gradient.png',
    start_color=(255, 0, 0),
    end_color=(0, 0, 255)
)
```

### 5. QR 碼讀取

```python
from qr_reader import QRCodeReader

reader = QRCodeReader()

# 讀取 QR 碼
data = reader.read('qrcode.png')
print(f"QR 碼內容: {data}")

# 從相機讀取
reader.read_from_camera()
```

### 6. 批次處理

```python
# 批次生成
data_list = [
    ('https://example.com', 'qr1.png'),
    ('Hello World', 'qr2.png'),
    ('12345', 'qr3.png')
]

generator.batch_generate(data_list)

# 批次讀取
results = reader.batch_read('qr_codes/')
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
- `POST /generate` - 生成 QR 碼
- `POST /read` - 讀取 QR 碼
- `POST /generate-logo` - 生成帶 Logo 的 QR 碼

## 專案結構

```
qr-code-tools/
├── README.md
├── requirements.txt
├── qr_generator.py        # QR 碼生成器
├── qr_reader.py           # QR 碼讀取器
├── app.py                 # Streamlit UI
├── api.py                 # FastAPI REST API
└── examples/              # 範例 QR 碼
    └── .gitkeep
```

## 支援的資料類型

- **URL**: 網址連結
- **文字**: 純文字內容
- **vCard**: 聯絡人資訊
- **WiFi**: WiFi 連線資訊
- **電子郵件**: 郵件地址
- **電話**: 電話號碼
- **SMS**: 簡訊
- **地理位置**: GPS 座標

## QR 碼尺寸設定

```python
# 調整 QR 碼大小
generator.generate(
    'Hello',
    'qr_large.png',
    box_size=20,      # 每個方塊的像素大小
    border=4,         # 邊框寬度
    version=1         # QR 版本 (1-40)
)
```

## 錯誤修正等級

```python
from qr_generator import ErrorCorrectLevel

# L: 7% 錯誤修正
# M: 15% 錯誤修正 (預設)
# Q: 25% 錯誤修正
# H: 30% 錯誤修正 (適合添加 Logo)

generator.generate(
    'https://example.com',
    'qr_high.png',
    error_correction=ErrorCorrectLevel.H
)
```

## 應用場景

1. **行銷活動** - 產品連結、促銷活動
2. **名片** - 個人資訊、社交媒體
3. **活動票券** - 入場驗證、簽到
4. **產品包裝** - 產品資訊、防偽
5. **支付** - 行動支付、轉帳
6. **WiFi 分享** - 快速連線
7. **文件追蹤** - 文件管理、物流

## 進階功能

### vCard QR 碼

```python
vcard_data = """
BEGIN:VCARD
VERSION:3.0
FN:John Doe
TEL:+1234567890
EMAIL:john@example.com
END:VCARD
"""

generator.generate(vcard_data, 'contact.png')
```

### WiFi QR 碼

```python
wifi_data = "WIFI:T:WPA;S:MyNetwork;P:MyPassword;;"
generator.generate(wifi_data, 'wifi.png')
```

### 地理位置 QR 碼

```python
location = "geo:25.0330,121.5654"  # 台北101
generator.generate(location, 'location.png')
```

## 技術棧

- **qrcode** - QR 碼生成
- **pyzbar** - QR 碼讀取/解碼
- **Pillow** - 圖像處理
- **OpenCV** - 圖像操作和相機
- **NumPy** - 數值計算
- **Streamlit** - Web UI
- **FastAPI** - REST API

## 效能特點

- 高速生成 (毫秒級)
- 高容錯率
- 支援大容量資料
- 批次處理優化
- 即時相機掃描

## 使用提示

- 高錯誤修正等級適合添加 Logo
- Logo 不應超過 QR 碼的 30%
- 保持足夠的對比度確保掃描
- 建議最小尺寸: 2x2 cm
- 測試掃描效果再正式使用

## 授權

MIT License
