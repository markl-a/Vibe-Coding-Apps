# 人臉識別 (Face Recognition) - 範例指南

## 快速開始

### 運行交互式範例

```bash
python example_usage.py
```

然後選擇要查看的範例 (1-10)。

### 人臉檢測 - 快速示例

```python
from face_detector import FaceDetector

# 初始化檢測器
detector = FaceDetector(model='hog')  # 'hog' 快速, 'cnn' 精確

# 檢測人臉
faces = detector.detect('photo.jpg')
print(f"檢測到 {len(faces)} 個人臉")

# 保存標記圖片
detector.save_annotated('photo.jpg', 'marked.jpg')

# 裁切人臉
saved_faces = detector.crop_faces('photo.jpg', 'faces/')
```

### 人臉識別 - 快速示例

```python
from face_recognizer import FaceRecognizer

# 初始化
recognizer = FaceRecognizer()

# 註冊人臉
recognizer.register_face('john.jpg', 'John')
recognizer.register_face('jane.jpg', 'Jane')

# 識別人臉
results = recognizer.recognize('photo.jpg')
for result in results:
    print(f"{result['name']}: {result['confidence']:.2%}")

# 驗證兩張圖片是否為同一人
is_same, confidence = recognizer.verify('photo1.jpg', 'photo2.jpg')
print(f"同一人: {is_same}, 信心度: {confidence:.2%}")
```

## 模塊說明

### FaceDetector (人臉檢測)

**功能:** 偵測圖片中的所有人臉位置

**初始化:**
```python
detector = FaceDetector(model='hog')
# model 選項: 'hog' (快速), 'cnn' (精確但較慢)
```

**主要方法:**
- `detect(image_path)` - 返回人臉位置列表
- `save_annotated(image_path, output_path)` - 標記並保存
- `crop_faces(image_path, output_dir)` - 裁切所有人臉
- `get_face_landmarks(image_path)` - 獲取特徵點

### FaceRecognizer (人臉識別)

**功能:** 識別人臉身份並管理人臉資料庫

**初始化:**
```python
recognizer = FaceRecognizer(
    database_path='database/faces.pkl',
    tolerance=0.6  # 識別容差 (越小越嚴格)
)
```

**主要方法:**
- `register_face(image_path, name)` - 註冊新人臉
- `recognize(image_path)` - 識別圖片中的人臉
- `verify(image1_path, image2_path)` - 驗證是否同一人
- `delete_face(name)` - 刪除已註冊人臉
- `clear_database()` - 清空資料庫

## 範例列表

### 1. 人臉檢測
檢測圖片中的人臉位置
- 模型選擇: HOG (快速) vs CNN (精確)
- 返回人臉坐標

### 2. 標記人臉
在圖片上繪製人臉邊界框
- 自訂顏色和粗細
- 視覺化檢測結果

### 3. 裁切人臉
從圖片中提取所有人臉
- 自訂邊距
- 保存為單獨文件

### 4. 特徵點
提取人臉的 68 個特徵點
- 眼睛、鼻子、嘴巴等
- 用於面部對齐、編輯

### 5. 資料庫設置
建立人臉資料庫
- 註冊多個人臉
- 多張照片增加準確度

### 6. 人臉識別
識別圖片中的人臉身份
- 返回名字和信心度
- 支持多人識別

### 7. 人臉驗證
驗證兩張圖片是否為同一人
- 1:1 比對
- 身份驗證應用

### 8. 批量識別
批量處理多張圖片
- 統計識別結果
- 自動簽到系統

### 9. 進階用法
NumPy 陣列處理
- 視頻實時處理
- 與其他框架整合

### 10. 完整工作流
員工打卡系統完整示例

## 參數說明

### FaceDetector 參數

```python
# 初始化
detector = FaceDetector(model='hog')  # 'hog' 或 'cnn'

# 保存標記圖片
detector.save_annotated(
    image_path='photo.jpg',
    output_path='marked.jpg',
    color=(0, 255, 0),      # 邊界框顏色 (BGR)
    thickness=2              # 線條粗細
)

# 裁切人臉
detector.crop_faces(
    image_path='photo.jpg',
    output_dir='faces/',
    padding=20               # 邊距 (像素)
)
```

### FaceRecognizer 參數

```python
# 初始化
recognizer = FaceRecognizer(
    database_path='database/faces.pkl',
    tolerance=0.6            # 識別容差 (0.0-1.0)
                             # 越小越嚴格
)

# 註冊人臉
recognizer.register_face(
    image_path='photo.jpg',
    name='John Doe',
    replace=False            # 是否替換已存在的
)

# 識別人臉
results = recognizer.recognize('photo.jpg')
# 返回: [{'name': str, 'confidence': float, 'location': tuple}, ...]

# 驗證
is_same, confidence = recognizer.verify(
    image1_path='photo1.jpg',
    image2_path='photo2.jpg'
)
```

## 常見用例

### 人臉檢測與裁切

```python
detector = FaceDetector(model='hog')

# 檢測並裁切人臉
saved_faces = detector.crop_faces('group_photo.jpg', 'extracted_faces/')
print(f"提取了 {len(saved_faces)} 個人臉")

# 標記檢測結果
num_faces = detector.save_annotated('group_photo.jpg', 'marked_faces.jpg')
print(f"檢測到 {num_faces} 個人臉")
```

### 員工打卡系統

```python
from face_recognizer import FaceRecognizer

# 建立員工資料庫
recognizer = FaceRecognizer(database_path='employee_db/employees.pkl')

# 註冊員工
employees = [
    ('photo_john.jpg', 'John'),
    ('photo_jane.jpg', 'Jane'),
    ('photo_bob.jpg', 'Bob'),
]

for photo, name in employees:
    recognizer.register_face(photo, name)

# 打卡簽到
def checkin(checkin_photo):
    results = recognizer.recognize(checkin_photo)
    for result in results:
        if result['confidence'] > 0.7:
            print(f"✓ {result['name']} 已簽到")
            return result['name']
    print("✗ 無法識別")
    return None

# 使用
checkin('morning_photo.jpg')
```

### 視頻實時識別

```python
import cv2
from face_recognizer import FaceRecognizer

recognizer = FaceRecognizer(database_path='database/faces.pkl')
cap = cv2.VideoCapture('video.mp4')

while True:
    ret, frame = cap.read()
    if not ret:
        break

    # 轉為 RGB
    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

    # 識別
    results = recognizer.recognize_from_array(rgb_frame)

    # 繪製結果
    for result in results:
        if result['confidence'] > 0.7:
            top, right, bottom, left = result['location']
            cv2.rectangle(frame, (left, top), (right, bottom), (0, 255, 0), 2)
            cv2.putText(frame, result['name'], (left, top - 10),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)

    cv2.imshow('Face Recognition', frame)
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
```

## 模型選擇

### HOG (Histogram of Oriented Gradients)
- 速度: ★★★★★ (快速)
- 精度: ★★★☆☆ (中等)
- 要求: CPU 足夠
- 推薦: 實時應用、低端設備

### CNN (Convolutional Neural Network)
- 速度: ★★☆☆☆ (較慢)
- 精度: ★★★★★ (高精度)
- 要求: GPU 或高端 CPU
- 推薦: 高精度應用、離線處理

## 性能優化

### 加快速度
1. 使用 HOG 模型: `model='hog'`
2. 縮小圖片尺寸
3. 使用 GPU
4. 增加 tolerance 容差

### 提高精度
1. 使用 CNN 模型: `model='cnn'`
2. 為同一人註冊多張照片
3. 減小 tolerance 容差
4. 使用高質量照片

## 容差 (Tolerance) 說明

```python
# 嚴格匹配 (更少誤報，但可能漏掉)
recognizer = FaceRecognizer(tolerance=0.4)

# 平衡 (推薦)
recognizer = FaceRecognizer(tolerance=0.6)

# 寬鬆匹配 (更多誤報，但識別率高)
recognizer = FaceRecognizer(tolerance=0.8)
```

## 目錄結構建議

```
project/
├── example_usage.py           # 範例主文件
├── face_detector.py           # 人臉檢測模塊
├── face_recognizer.py         # 人臉識別模塊
├── EXAMPLE_README.md          # 本文件
├── database/
│   └── employees.pkl          # 人臉資料庫
├── sample_images/
│   ├── photo1.jpg
│   └── photo2.jpg
├── input/
│   ├── person.jpg
│   └── group.jpg
└── output/
    ├── marked/                # 標記的圖片
    ├── cropped_faces/         # 裁切的人臉
    └── results.txt            # 識別結果
```

## 常見問題

**Q: 識別準確度不高？**
- A: 為同一人註冊多張不同角度的照片
- A: 減小 tolerance 容差
- A: 使用 CNN 模型
- A: 使用更清晰的圖片

**Q: 速度太慢？**
- A: 使用 HOG 模型
- A: 縮小圖片尺寸
- A: 使用 GPU 加速

**Q: 如何處理視頻？**
- A: 逐幀讀取視頻，使用 recognize_from_array()
- A: 跳幀處理以提高速度

**Q: 如何刪除某個人的人臉？**
- A: 使用 `delete_face(name)` 方法

## 依賴要求

```
face_recognition
opencv-python
numpy
pillow
dlib
```

## 更多資訊

- face_recognition 官方文檔: https://github.com/ageitgey/face_recognition
- dlib 文檔: http://dlib.net/
