# QR 碼工具 (QR Code Tools) - 範例指南

## 快速開始

### 運行交互式範例

```bash
python example_usage.py
```

然後選擇要查看的範例 (1-12)。

### QR 碼生成 - 快速示例

```python
from qr_generator import QRCodeGenerator

generator = QRCodeGenerator()

# 基本 QR 碼
generator.generate(
    data='https://example.com',
    output_path='qr_basic.png'
)

# 自訂顏色
generator.generate(
    data='Hello World',
    output_path='qr_color.png',
    fill_color='blue',
    back_color='white'
)

# 帶 Logo
generator.generate_with_logo(
    data='https://company.com',
    output_path='qr_logo.png',
    logo_path='logo.png',
    logo_size_ratio=0.25
)
```

### QR 碼讀取 - 快速示例

```python
from qr_reader import QRCodeReader

reader = QRCodeReader()

# 讀取單個 QR 碼
data = reader.read('qr_code.png')
if data:
    print(f"QR 碼內容: {data}")

# 讀取多個 QR 碼
all_codes = reader.read_all('multiple_qr.png')
for code in all_codes:
    print(f"發現: {code['data']}")

# 實時掃描 (攝像頭)
reader.read_from_camera()
```

## 模塊說明

### QRCodeGenerator (QR 碼生成)

**功能:** 生成各種樣式的 QR 碼

**初始化:**
```python
from qr_generator import QRCodeGenerator, ErrorCorrectLevel

generator = QRCodeGenerator(
    version=1,                    # QR 碼版本 (1-40)
    box_size=10,                  # 每個方塊大小
    border=4,                     # 邊框寬度
    error_correction=ErrorCorrectLevel.M  # 錯誤修正等級
)
```

**主要方法:**
- `generate()` - 基本 QR 碼
- `generate_with_logo()` - 帶 Logo QR 碼
- `generate_rounded()` - 圓角 QR 碼
- `generate_circular()` - 圓點 QR 碼
- `generate_gradient()` - 漸變色 QR 碼
- `batch_generate()` - 批量生成
- `create_vcard()` - 生成名片格式
- `create_wifi()` - 生成 WiFi 連線格式

### QRCodeReader (QR 碼讀取)

**功能:** 讀取和解碼 QR 碼

**初始化:**
```python
from qr_reader import QRCodeReader

reader = QRCodeReader()
```

**主要方法:**
- `read()` - 讀取單個 QR 碼
- `read_all()` - 讀取所有 QR 碼
- `read_and_visualize()` - 讀取並標記
- `read_from_camera()` - 實時掃描
- `batch_read()` - 批量讀取
- `is_qrcode_valid()` - 驗證 QR 碼

## 範例列表

### 1. 基本 QR 碼生成
簡單的黑白 QR 碼，支持網址、文本等

### 2. 自訂顏色
改變 QR 碼和背景顏色

### 3. 風格化 QR 碼
圓角、圓點、漸變等樣式

### 4. 帶 Logo 的 QR 碼
中央疊加 Logo

### 5. 名片 vCard
編碼聯絡資訊

### 6. WiFi 連線
快速分享 WiFi

### 7. 批量生成
一次生成多個 QR 碼

### 8. QR 碼讀取
解碼 QR 碼內容

### 9. 實時掃描
使用攝像頭掃描

### 10. 批量讀取
批量處理多張圖片

### 11. QR 碼驗證
檢查有效性

### 12. 完整工作流
活動票券系統示例

## 參數說明

### generate() - 基本 QR 碼

```python
generator.generate(
    data='https://example.com',       # 編碼內容
    output_path='qr.png',             # 輸出路徑
    fill_color='black',               # 前景色 (名稱或 RGB)
    back_color='white'                # 背景色
)
```

**顏色選項:**
- 名稱: `'black'`, `'white'`, `'red'`, `'blue'` 等
- RGB: `(0, 0, 0)` 黑色, `(255, 0, 0)` 紅色

### generate_with_logo() - 帶 Logo

```python
generator.generate_with_logo(
    data='https://example.com',
    output_path='qr_logo.png',
    logo_path='logo.png',             # PNG 格式
    logo_size_ratio=0.25,             # Logo 佔 25%
    fill_color='black',
    back_color='white'
)
```

**logo_size_ratio:**
- `0.15-0.2` - 小 Logo
- `0.25-0.3` - 中等 Logo (推薦)
- `0.3+` - 大 Logo

### generate_rounded() - 圓角 QR 碼

```python
generator.generate_rounded(
    data='https://example.com',
    output_path='qr_rounded.png',
    radius=10,                        # 圓角半徑
    fill_color=(0, 0, 0),            # RGB 格式
    back_color=(255, 255, 255)
)
```

### generate_circular() - 圓點 QR 碼

```python
generator.generate_circular(
    data='https://example.com',
    output_path='qr_circular.png',
    fill_color=(0, 102, 204),        # 藍色
    back_color=(255, 255, 255)
)
```

### generate_gradient() - 漸變色 QR 碼

```python
generator.generate_gradient(
    data='https://example.com',
    output_path='qr_gradient.png',
    start_color=(0, 0, 255),         # 藍色
    end_color=(255, 0, 0),           # 紅色
    back_color=(255, 255, 255)
)
```

### create_vcard() - 名片

```python
vcard = generator.create_vcard(
    name='John Doe',
    phone='+1-234-567-8900',         # 可選
    email='john@example.com',         # 可選
    organization='ACME Corp',         # 可選
    url='https://example.com'         # 可選
)

# 生成名片 QR 碼
generator.generate(vcard, 'qr_vcard.png')
```

### create_wifi() - WiFi 連線

```python
wifi = generator.create_wifi(
    ssid='NetworkName',
    password='Password123!',
    security='WPA'                    # 'WPA', 'WEP', 'nopass'
)

generator.generate(wifi, 'qr_wifi.png')
```

### batch_generate() - 批量生成

```python
data_list = [
    ('https://site1.com', 'qr1.png'),
    ('https://site2.com', 'qr2.png'),
    ('https://site3.com', 'qr3.png'),
]

outputs = generator.batch_generate(data_list)
```

### read() - 讀取單個 QR 碼

```python
data = reader.read('qr_code.png')
if data:
    print(f"內容: {data}")
else:
    print("無法識別")
```

### read_all() - 讀取所有 QR 碼

```python
codes = reader.read_all('multiple_qr.png')
for code in codes:
    print(f"類型: {code['type']}")
    print(f"內容: {code['data']}")
    print(f"位置: {code['rect']}")
```

### read_and_visualize() - 讀取並標記

```python
data_list = reader.read_and_visualize(
    'qr_code.png',
    'qr_marked.png'  # 輸出標記後的圖片
)
```

### read_from_camera() - 實時掃描

```python
# 按 'q' 退出
reader.read_from_camera(
    camera_index=0,
    window_name="QR Code Scanner"
)
```

### batch_read() - 批量讀取

```python
results = reader.batch_read('qr_images/')
for result in results:
    print(f"{result['file']}: {result['data']}")
```

### is_qrcode_valid() - 驗證

```python
if reader.is_qrcode_valid('image.png'):
    print("✓ 有效的 QR 碼")
else:
    print("✗ 無效或不包含 QR 碼")
```

## 實際應用案例

### 網站推廣

```python
# 為官網創建 QR 碼
generator.generate(
    'https://mycompany.com',
    'qr_website.png'
)

# 帶公司 Logo
generator.generate_with_logo(
    'https://mycompany.com',
    'qr_branded.png',
    'company_logo.png',
    logo_size_ratio=0.25
)
```

### 名片分享

```python
# 創建名片 QR 碼
vcard = generator.create_vcard(
    name='Jane Smith',
    phone='+1-555-1234',
    email='jane@company.com',
    organization='Tech Corp',
    url='https://janesmith.com'
)

generator.generate(vcard, 'qr_business_card.png')
```

### WiFi 快速連接

```python
# 餐廳 WiFi
wifi = generator.create_wifi(
    ssid='CoffeeShop_WiFi',
    password='Welcome123!',
    security='WPA'
)
generator.generate(wifi, 'qr_shop_wifi.png')

# 開放網路
wifi_open = generator.create_wifi(
    ssid='Public_Network',
    password='',
    security='nopass'
)
generator.generate(wifi_open, 'qr_public.png')
```

### 產品追蹤

```python
# 為每個產品生成唯一 QR 碼
products = [
    (f'PROD-001-{i}', f'product_{i}.png')
    for i in range(1, 101)
]

outputs = generator.batch_generate(products)
```

### 活動票券

```python
# 生成 100 張票券
tickets = [
    (f'EVENT-2024-{i:04d}', f'ticket_{i}.png')
    for i in range(1, 101)
]

generator.batch_generate(tickets)

# 現場掃描驗票
for ticket_file in Path('tickets').glob('*.png'):
    data = reader.read(str(ticket_file))
    if data:
        print(f"✓ {data} - 票券有效")
```

## 錯誤修正等級

```python
from qr_generator import ErrorCorrectLevel

# L: 7% 損傷可恢復 (最小)
# M: 15% 損傷可恢復 (推薦)
# Q: 25% 損傷可恢復
# H: 30% 損傷可恢復 (最高，帶 Logo 用)
```

**選擇建議:**
- 帶 Logo: 使用 H (容納 Logo 的損失)
- 基本: 使用 M (平衡)
- 防損傷: 使用 Q 或 H

## 目錄結構建議

```
project/
├── example_usage.py           # 範例主文件
├── qr_generator.py            # QR 碼生成
├── qr_reader.py               # QR 碼讀取
├── EXAMPLE_README.md          # 本文件
├── logos/
│   └── company_logo.png
├── input/
│   └── qr_images/
├── output/
│   ├── generated/
│   ├── marked/
│   └── results.csv
```

## 最佳實踐

### 生成 QR 碼
1. **大小:** 確保至少 100x100 像素便於掃描
2. **顏色:** 黑底白字最容易掃描
3. **Logo:** 高錯誤修正等級 (H)
4. **邊框:** 不要移除邊框

### 讀取 QR 碼
1. **光線:** 適當光線下效果最好
2. **角度:** 垂直於攝像頭
3. **距離:** 適當距離 (10-30cm)
4. **清晰度:** 確保圖片清晰

## 常見問題

**Q: 掃描不了 QR 碼？**
- A: 確保尺寸足夠大 (>100x100)
- A: 黑白對比明顯
- A: 不要修改邊框
- A: 檢查圖片清晰度

**Q: 帶 Logo 的 QR 碼無法掃描？**
- A: 使用高錯誤修正等級 (H)
- A: 減小 Logo 大小 (15-25%)
- A: 確保 Logo 清晰

**Q: 如何在名片上使用 QR 碼？**
- A: 生成合適尺寸 (2x2 英吋)
- A: 放在名片角落
- A: 確保清晰度

**Q: 如何批量生成？**
- A: 使用 batch_generate() 方法
- A: 提供數據和路徑列表

**Q: 支持多少字符？**
- A: 最多約 2,000 字符
- A: URL 通常 100-200 字符
- A: 版本 1-40 可自動選擇

## 依賴要求

```
qrcode[pil]
pyzbar
opencv-python
pillow
numpy
```

## 性能提示

- 生成 QR 碼很快 (毫秒級)
- 讀取取決於圖片質量和環境
- 實時掃描建議每秒 30 幀

## 更多資訊

- qrcode 官方: https://github.com/lincolnloop/python-qrcode
- pyzbar 官方: https://github.com/NaturalHistoryMuseum/pyzbar
- QR 碼標準: https://www.qr-code.com/
