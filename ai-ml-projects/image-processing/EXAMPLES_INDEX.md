# AI/ML 圖像處理 - 完整範例索引

歡迎使用 AI/ML 圖像處理工具套件！本文件提供所有 5 個子專案的完整範例指南。

## 快速導覽

| 子專案 | 描述 | 主要功能 | 範例文件 |
|-------|------|--------|--------|
| **背景移除** | 使用 U2-Net 智能背景移除 | 移除/模糊/替換背景 | `background-remover/example_usage.py` |
| **人臉識別** | 人臉檢測、識別與驗證 | 檢測、識別、驗證人臉 | `face-recognition/example_usage.py` |
| **圖片浮水印** | 添加各種風格的浮水印 | 文字、圖片、平鋪、邊框 | `image-watermark/example_usage.py` |
| **QR 碼工具** | QR 碼生成與讀取 | 生成、掃描、驗證 QR 碼 | `qr-code-tools/example_usage.py` |
| **風格轉換** | 神經網路圖像風格轉換 | 將藝術風格應用到圖片 | `style-transfer/example_usage.py` |

## 各子專案詳細說明

### 1. 背景移除 (Background Remover)

**位置:** `background-remover/`

**快速開始:**
```bash
cd background-remover
python example_usage.py
```

**功能:**
- ✓ 移除背景 (透明)
- ✓ 替換為純色背景
- ✓ 模糊背景效果
- ✓ 替換為另一張圖片
- ✓ 提取遮罩
- ✓ 批量處理

**所需檔案:**
- `bg_remover.py` - 核心模塊
- `example_usage.py` - 範例代碼
- `EXAMPLE_README.md` - 詳細文檔

**推薦用例:**
- 📸 製作證件照
- 🛍️ 電商產品圖處理
- 👤 人物抠圖
- 📷 社群媒體圖片

**查看詳細文檔:**
```bash
cat background-remover/EXAMPLE_README.md
```

---

### 2. 人臉識別 (Face Recognition)

**位置:** `face-recognition/`

**快速開始:**
```bash
cd face-recognition
python example_usage.py
```

**功能:**

**人臉檢測 (FaceDetector):**
- ✓ 檢測人臉位置
- ✓ 標記人臉位置
- ✓ 裁切人臉
- ✓ 提取特徵點

**人臉識別 (FaceRecognizer):**
- ✓ 建立人臉資料庫
- ✓ 識別人臉身份
- ✓ 驗證是否同一人
- ✓ 批量識別

**所需檔案:**
- `face_detector.py` - 人臉檢測
- `face_recognizer.py` - 人臉識別
- `example_usage.py` - 範例代碼
- `EXAMPLE_README.md` - 詳細文檔

**推薦用例:**
- 🏢 員工簽到系統
- 🔐 安全驗證
- 📊 會議簽到
- 👥 人群統計

**查看詳細文檔:**
```bash
cat face-recognition/EXAMPLE_README.md
```

---

### 3. 圖片浮水印 (Image Watermark)

**位置:** `image-watermark/`

**快速開始:**
```bash
cd image-watermark
python example_usage.py
```

**功能:**
- ✓ 文字浮水印 (可旋轉、自訂位置)
- ✓ 圖片浮水印 (Logo)
- ✓ 平鋪浮水印 (防盜)
- ✓ 邊框浮水印 (字幕)
- ✓ 批量處理

**所需檔案:**
- `watermark.py` - 核心模塊
- `example_usage.py` - 範例代碼
- `EXAMPLE_README.md` - 詳細文檔

**推薦用例:**
- 📸 攝影作品簽名
- 📱 社群媒體圖片
- 🏪 電商商品圖
- 📄 文件保護

**查看詳細文檔:**
```bash
cat image-watermark/EXAMPLE_README.md
```

---

### 4. QR 碼工具 (QR Code Tools)

**位置:** `qr-code-tools/`

**快速開始:**
```bash
cd qr-code-tools
python example_usage.py
```

**功能:**

**QR 碼生成 (QRCodeGenerator):**
- ✓ 基本 QR 碼
- ✓ 自訂顏色
- ✓ 風格化 (圓角、圓點、漸變)
- ✓ 帶 Logo QR 碼
- ✓ 名片 (vCard)
- ✓ WiFi 連線
- ✓ 批量生成

**QR 碼讀取 (QRCodeReader):**
- ✓ 讀取單個 QR 碼
- ✓ 讀取多個 QR 碼
- ✓ 實時掃描 (攝像頭)
- ✓ 批量讀取
- ✓ 驗證有效性

**所需檔案:**
- `qr_generator.py` - QR 碼生成
- `qr_reader.py` - QR 碼讀取
- `example_usage.py` - 範例代碼
- `EXAMPLE_README.md` - 詳細文檔

**推薦用例:**
- 📱 網址分享
- 🎫 活動票券
- 💼 名片聯絡
- 📡 WiFi 快速連接
- 📦 產品追蹤

**查看詳細文檔:**
```bash
cat qr-code-tools/EXAMPLE_README.md
```

---

### 5. 風格轉換 (Style Transfer)

**位置:** `style-transfer/`

**快速開始:**
```bash
cd style-transfer
python example_usage.py
```

**功能:**
- ✓ 神經網路風格轉換
- ✓ 參數調整控制
- ✓ 不同風格應用
- ✓ 批量處理
- ✓ GPU 加速
- ✓ 創意應用

**所需檔案:**
- `style_transfer.py` - 核心模塊 (VGG19)
- `example_usage.py` - 範例代碼
- `EXAMPLE_README.md` - 詳細文檔

**推薦用例:**
- 🎨 照片藝術化
- 🖼️ 風格實驗
- 💭 創意編輯
- 👗 設計參考

**查看詳細文檔:**
```bash
cat style-transfer/EXAMPLE_README.md
```

---

## 使用流程

### 方式 1: 交互式範例 (推薦)

每個子專案都提供互動式範例程序：

```bash
# 進入子專案目錄
cd [子專案名稱]

# 運行範例
python example_usage.py

# 按提示選擇範例號碼
選擇範例 (1-X) 或 'all' 顯示全部，'q' 退出:
```

### 方式 2: 直接引用模塊

在你的程式中直接使用：

```python
# 背景移除
from background_remover.bg_remover import BackgroundRemover
remover = BackgroundRemover()
remover.remove_background('input.jpg', 'output.png')

# 人臉識別
from face_recognition.face_recognizer import FaceRecognizer
recognizer = FaceRecognizer()
recognizer.register_face('photo.jpg', 'John')

# 浮水印
from image_watermark.watermark import WatermarkTool
tool = WatermarkTool()
tool.add_text_watermark('photo.jpg', 'output.jpg', text='© 2024')

# QR 碼
from qr_code_tools.qr_generator import QRCodeGenerator
generator = QRCodeGenerator()
generator.generate('https://example.com', 'qr.png')

# 風格轉換
from style_transfer.style_transfer import StyleTransfer
transfer = StyleTransfer()
transfer.transfer_style('content.jpg', 'style.jpg', 'output.jpg')
```

### 方式 3: 查看詳細文檔

每個子專案都有完整的 README 文件：

```bash
# 查看特定子專案的詳細文檔
cat [子專案名稱]/EXAMPLE_README.md
```

---

## 完整文檔列表

### README 文件
- `background-remover/EXAMPLE_README.md` - 背景移除詳細指南
- `face-recognition/EXAMPLE_README.md` - 人臉識別詳細指南
- `image-watermark/EXAMPLE_README.md` - 浮水印詳細指南
- `qr-code-tools/EXAMPLE_README.md` - QR 碼詳細指南
- `style-transfer/EXAMPLE_README.md` - 風格轉換詳細指南

### 範例代碼
- `background-remover/example_usage.py` - 8 個完整範例
- `face-recognition/example_usage.py` - 10 個完整範例
- `image-watermark/example_usage.py` - 8 個完整範例
- `qr-code-tools/example_usage.py` - 12 個完整範例
- `style-transfer/example_usage.py` - 9 個完整範例

**總計: 47 個完整使用範例**

---

## 快速參考表

### 背景移除 - 快速命令

```python
from background_remover.bg_remover import BackgroundRemover

remover = BackgroundRemover()

# 透明背景
remover.remove_background('input.jpg', 'output.png')

# 白色背景
remover.remove_background('input.jpg', 'output.jpg', bg_color=(255, 255, 255))

# 模糊背景
remover.blur_background('input.jpg', 'output.jpg', blur_strength=25)

# 替換背景
remover.replace_background('person.jpg', 'bg.jpg', 'output.jpg')

# 批量處理
remover.batch_remove('input/', 'output/')
```

### 人臉識別 - 快速命令

```python
from face_recognition.face_detector import FaceDetector
from face_recognition.face_recognizer import FaceRecognizer

# 檢測
detector = FaceDetector(model='hog')
faces = detector.detect('photo.jpg')
detector.save_annotated('photo.jpg', 'marked.jpg')

# 識別
recognizer = FaceRecognizer()
recognizer.register_face('john.jpg', 'John')
results = recognizer.recognize('photo.jpg')
is_same, conf = recognizer.verify('photo1.jpg', 'photo2.jpg')
```

### 浮水印 - 快速命令

```python
from image_watermark.watermark import WatermarkTool

tool = WatermarkTool()

# 文字浮水印
tool.add_text_watermark('photo.jpg', 'output.jpg', text='© Studio')

# Logo 浮水印
tool.add_image_watermark('photo.jpg', 'output.jpg', watermark_path='logo.png')

# 平鋪浮水印
tool.add_tiled_watermark('photo.jpg', 'output.jpg', text='CONFIDENTIAL')

# 邊框浮水印
tool.add_border_watermark('photo.jpg', 'output.jpg', text='© 2024')

# 批量
tool.batch_watermark('input/', 'output/', watermark_type='text', text='© Studio')
```

### QR 碼 - 快速命令

```python
from qr_code_tools.qr_generator import QRCodeGenerator
from qr_code_tools.qr_reader import QRCodeReader

generator = QRCodeGenerator()
reader = QRCodeReader()

# 生成
generator.generate('https://example.com', 'qr.png')
generator.generate_with_logo('https://example.com', 'qr_logo.png', 'logo.png')

# 讀取
data = reader.read('qr.png')
codes = reader.read_all('qr_multi.png')
reader.read_from_camera()  # 實時掃描
```

### 風格轉換 - 快速命令

```python
from style_transfer.style_transfer import StyleTransfer

transfer = StyleTransfer()

# 基本轉換
transfer.transfer_style('photo.jpg', 'style.jpg', 'output.jpg')

# 快速預覽
transfer.transfer_style('photo.jpg', 'style.jpg', 'output.jpg',
                       num_steps=100, max_size=256)

# 高質量
transfer.transfer_style('photo.jpg', 'style.jpg', 'output.jpg',
                       num_steps=500, max_size=768)

# 批量
transfer.batch_transfer('content/', 'style.jpg', 'output/')
```

---

## 常見使用場景

### 場景 1: 製作證件照

```python
from background_remover.bg_remover import BackgroundRemover

remover = BackgroundRemover()

# 移除背景並添加白色背景
remover.remove_background(
    'portrait.jpg',
    'id_photo.jpg',
    bg_color=(255, 255, 255),
    alpha_matting=True  # 優化邊緣
)
```

### 場景 2: 員工簽到系統

```python
from face_recognition.face_recognizer import FaceRecognizer

# 建立系統
recognizer = FaceRecognizer(database_path='employees.pkl')

# 註冊員工
for employee_photo, name in employee_list:
    recognizer.register_face(employee_photo, name)

# 簽到
def checkin(photo):
    results = recognizer.recognize(photo)
    for result in results:
        if result['confidence'] > 0.8:
            print(f"✓ {result['name']} 已簽到")
```

### 場景 3: 攝影作品簽名

```python
from image_watermark.watermark import WatermarkTool

tool = WatermarkTool()

# 為所有照片添加簽名
output_files = tool.batch_watermark(
    'raw_photos/',
    'signed_photos/',
    watermark_type='text',
    text='© John Photography',
    position='bottom-right',
    opacity=0.7
)
```

### 場景 4: 活動票券生成與驗票

```python
from qr_code_tools.qr_generator import QRCodeGenerator
from qr_code_tools.qr_reader import QRCodeReader

generator = QRCodeGenerator()
reader = QRCodeReader()

# 生成 100 張票
for i in range(1, 101):
    ticket_id = f'TICKET-{i:04d}'
    generator.generate(ticket_id, f'tickets/ticket_{i}.png')

# 驗票
data = reader.read('ticket_from_camera.png')
if data:
    print(f"✓ {data} 票券有效")
```

### 場景 5: 創意照片集

```python
from style_transfer.style_transfer import StyleTransfer

transfer = StyleTransfer()

# 將旅遊照片轉換為不同藝術風格
styles = {
    'oil_painting.jpg': 'oil_paint',
    'watercolor.jpg': 'watercolor',
    'impressionist.jpg': 'impressionist'
}

for style_img, style_name in styles.items():
    transfer.transfer_style(
        'vacation_photo.jpg',
        style_img,
        f'vacation_{style_name}.jpg',
        num_steps=300
    )
```

---

## 目錄結構

```
image-processing/
├── EXAMPLES_INDEX.md              # 本文件
├── README.md                       # 主要項目 README
├── requirements.txt                # 依賴列表
├── utils/                         # 工具函數
│   ├── __init__.py
│   ├── image_utils.py
│   └── model_utils.py
│
├── background-remover/
│   ├── bg_remover.py
│   ├── app.py
│   ├── example_usage.py           # 8 個範例
│   └── EXAMPLE_README.md          # 詳細文檔
│
├── face-recognition/
│   ├── face_detector.py
│   ├── face_recognizer.py
│   ├── app.py
│   ├── example_usage.py           # 10 個範例
│   └── EXAMPLE_README.md          # 詳細文檔
│
├── image-watermark/
│   ├── watermark.py
│   ├── app.py
│   ├── example_usage.py           # 8 個範例
│   └── EXAMPLE_README.md          # 詳細文檔
│
├── qr-code-tools/
│   ├── qr_generator.py
│   ├── qr_reader.py
│   ├── app.py
│   ├── example_usage.py           # 12 個範例
│   └── EXAMPLE_README.md          # 詳細文檔
│
└── style-transfer/
    ├── style_transfer.py
    ├── app.py
    ├── example_usage.py           # 9 個範例
    └── EXAMPLE_README.md          # 詳細文檔
```

---

## 技術要求

### 系統要求
- Python 3.7+
- 4GB RAM 最低
- 8GB+ 推薦 (特別是 GPU 使用)

### GPU 加速 (可選)
- NVIDIA GPU + CUDA 10.1+
- cuDNN 7.6+
- 提高風格轉換和人臉識別速度 10-50 倍

### 依賴庫
詳見 `requirements.txt`

---

## 故障排除

### 常見問題

**Q: ImportError: No module named ...**
- A: 安裝依賴: `pip install -r requirements.txt`

**Q: 處理速度很慢**
- A: 使用 GPU 加速
- A: 減少輸入圖片尺寸
- A: 減少處理步數

**Q: GPU 不被識別**
- A: 檢查 CUDA 安裝: `python -c "import torch; print(torch.cuda.is_available())"`
- A: 更新 NVIDIA 驅動

**Q: 內存不足**
- A: 減小圖片尺寸
- A: 關閉其他應用
- A: 使用 CPU 而不是 GPU

---

## 聯絡與支援

- 查看各子專案的 EXAMPLE_README.md 文件
- 查看原始模塊中的函數文檔字符串
- 檢查官方項目文檔

---

## 授權與致謝

此項目使用以下開源库:
- rembg: 背景移除
- face_recognition: 人臉識別
- Pillow + OpenCV: 圖像處理
- qrcode + pyzbar: QR 碼
- PyTorch: 風格轉換

感謝所有貢獻者和開源社群！

---

**開始你的圖像處理之旅吧！選擇感興趣的子專案，運行 `example_usage.py`！**
