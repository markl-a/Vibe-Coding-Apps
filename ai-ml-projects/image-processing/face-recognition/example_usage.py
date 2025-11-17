"""
人臉識別 - 完整使用範例
演示如何使用 FaceDetector 和 FaceRecognizer 進行人臉檢測和識別
"""

from pathlib import Path
from face_detector import FaceDetector
from face_recognizer import FaceRecognizer


def example_1_face_detection():
    """示例 1: 基本人臉檢測"""
    print("\n" + "="*60)
    print("示例 1: 基本人臉檢測")
    print("="*60)

    print("""
    功能: 偵測圖片中的所有人臉位置
    用途: 自動合焦、人臉計數、安全監控

    模型選擇:
    - 'hog': 快速，適合 CPU，準確度較低
    - 'cnn': 準確但較慢，需要 GPU (推薦)
    """)

    print("\n實際使用代碼:")
    print("""
    from face_detector import FaceDetector

    # CPU 快速檢測
    detector = FaceDetector(model='hog')
    faces = detector.detect('photo.jpg')

    print(f"檢測到 {len(faces)} 個人臉")
    for i, (top, right, bottom, left) in enumerate(faces):
        print(f"人臉 {i+1}: 位置=({left}, {top}), 大小=({right-left}x{bottom-top})")

    # GPU 高精度檢測 (需要 CUDA)
    detector = FaceDetector(model='cnn')
    faces = detector.detect('photo.jpg')
    """)


def example_2_draw_faces():
    """示例 2: 畫出人臉位置"""
    print("\n" + "="*60)
    print("示例 2: 標記並保存人臉位置")
    print("="*60)

    print("""
    功能: 在圖片上繪製人臉邊界框
    用途: 驗證檢測結果、視覺化處理、調試

    可自訂選項:
    - color: 邊界框顏色 (BGR格式)
    - thickness: 線條粗細
    """)

    print("\n實際使用代碼:")
    print("""
    from face_detector import FaceDetector

    detector = FaceDetector(model='hog')

    # 保存標記的圖片
    num_faces = detector.save_annotated(
        image_path='photo.jpg',
        output_path='photo_marked.jpg',
        color=(0, 255, 0),  # 綠色
        thickness=2
    )

    print(f"檢測到 {num_faces} 個人臉")

    # 藍色邊界框，更粗
    detector.save_annotated(
        image_path='photo.jpg',
        output_path='photo_marked_blue.jpg',
        color=(255, 0, 0),  # 藍色
        thickness=3
    )
    """)


def example_3_crop_faces():
    """示例 3: 裁切人臉"""
    print("\n" + "="*60)
    print("示例 3: 裁切並保存人臉")
    print("="*60)

    print("""
    功能: 自動從圖片中裁切出每個人臉
    用途: 人臉數據集製作、頭像提取、面部識別訓練

    目錄結構:
    output/
    ├── face_1.jpg
    ├── face_2.jpg
    ├── face_3.jpg
    └── ...
    """)

    print("\n實際使用代碼:")
    print("""
    from face_detector import FaceDetector

    detector = FaceDetector(model='hog')

    # 裁切所有人臉
    saved_faces = detector.crop_faces(
        image_path='group_photo.jpg',
        output_dir='extracted_faces/',
        padding=20  # 邊距，單位像素
    )

    print(f"已裁切並保存 {len(saved_faces)} 個人臉圖片:")
    for path in saved_faces:
        print(f"  - {path}")

    # 增加邊距 (保留更多上下文)
    detector.crop_faces(
        image_path='group_photo.jpg',
        output_dir='faces_with_context/',
        padding=50
    )
    """)


def example_4_face_landmarks():
    """示例 4: 人臉特徵點"""
    print("\n" + "="*60)
    print("示例 4: 提取人臉特徵點 (進階)")
    print("="*60)

    print("""
    功能: 偵測人臉上的68個特徵點 (眼睛、鼻子、嘴巴等)
    用途: 臉部對齊、表情識別、人臉編輯、VR 應用

    特徵點包括:
    - 0-16: 臉部輪廓 (17個點)
    - 17-21: 左眉毛 (5個點)
    - 22-26: 右眉毛 (5個點)
    - 27-30: 鼻子 (4個點)
    - 31-35: 鼻孔 (5個點)
    - 36-41: 左眼 (6個點)
    - 42-47: 右眼 (6個點)
    - 48-60: 嘴巴外輪廓 (13個點)
    - 61-67: 嘴巴內輪廓 (7個點)
    """)

    print("\n實際使用代碼:")
    print("""
    from face_detector import FaceDetector

    detector = FaceDetector(model='hog')

    # 獲取特徵點
    landmarks = detector.get_face_landmarks('photo.jpg')

    for face_idx, face_landmarks in enumerate(landmarks):
        print(f"\\n人臉 {face_idx + 1}:")

        # 眉毛
        left_eyebrow = face_landmarks['chin'][:5]
        print(f"  左眉毛: {left_eyebrow}")

        # 眼睛
        left_eye = face_landmarks['left_eye']
        right_eye = face_landmarks['right_eye']
        print(f"  左眼中心: ({sum(x for x,y in left_eye)/6}, {sum(y for x,y in left_eye)/6})")

        # 嘴巴
        top_lip = face_landmarks['top_lip']
        bottom_lip = face_landmarks['bottom_lip']
        print(f"  嘴巴頂部: {top_lip}")
    """)


def example_5_face_recognition_setup():
    """示例 5: 人臉識別 - 初始設置"""
    print("\n" + "="*60)
    print("示例 5: 人臉識別 - 初始設置與註冊")
    print("="*60)

    print("""
    功能: 建立人臉資料庫並註冊新人臉
    用途: 訪問控制、員工打卡、安全驗證

    工作流程:
    1. 建立 FaceRecognizer 實例
    2. 為每個人註冊多張照片
    3. 系統自動提取人臉特徵並儲存
    """)

    print("\n實際使用代碼:")
    print("""
    from face_recognizer import FaceRecognizer

    # 初始化 (自動創建資料庫)
    recognizer = FaceRecognizer(
        database_path='database/faces.pkl',
        tolerance=0.6  # 識別容差 (越小越嚴格)
    )

    # 註冊新人臉
    print("註冊員工...")
    recognizer.register_face(
        image_path='employees/john_doe.jpg',
        name='John Doe'
    )

    recognizer.register_face(
        image_path='employees/jane_smith.jpg',
        name='Jane Smith'
    )

    # 為同一人註冊多張照片 (提高識別準確度)
    recognizer.register_face(
        image_path='employees/john_doe_2.jpg',
        name='John Doe',
        replace=True  # 用新照片更新
    )

    # 查看已註冊的人名
    all_names = recognizer.get_all_names()
    print(f"已註冊人臉: {all_names}")
    """)


def example_6_face_recognition_identify():
    """示例 6: 人臉識別 - 識別人臉"""
    print("\n" + "="*60)
    print("示例 6: 人臉識別 - 識別與認證")
    print("="*60)

    print("""
    功能: 識別圖片中的人臉並返回名字和信心度
    用途: 人臉打卡、訪問控制、安全驗證

    信心度 (Confidence):
    - 1.0 = 完全匹配
    - 0.8-1.0 = 非常相似
    - 0.6-0.8 = 較為相似
    - 0.0-0.6 = 不相似
    """)

    print("\n實際使用代碼:")
    print("""
    from face_recognizer import FaceRecognizer

    # 載入已有的資料庫
    recognizer = FaceRecognizer(database_path='database/faces.pkl')

    # 識別圖片中的人臉
    results = recognizer.recognize('visitor.jpg')

    print(f"檢測到 {len(results)} 個人臉:")
    for result in results:
        name = result['name']
        confidence = result['confidence']
        location = result['location']

        if confidence > 0.6:
            status = "✓ 已識別"
        else:
            status = "✗ 陌生人"

        print(f"  {status} - {name} (信心度: {confidence:.2%})")

    # 只接受信心度高的結果
    high_confidence = [r for r in results if r['confidence'] > 0.8]
    print(f"\\n高信心度識別結果: {len(high_confidence)} 個")
    """)


def example_7_face_verification():
    """示例 7: 人臉驗證 (1:1 比對)"""
    print("\n" + "="*60)
    print("示例 7: 人臉驗證 (驗證是否為同一人)")
    print("="*60)

    print("""
    功能: 比對兩張圖片是否為同一人
    用途: 身份驗證、打卡簽到、實名認證

    應用場景:
    - 考試防舞弊 (考試照與身份證對比)
    - 銀行人臉開戶 (實時拍照與身份證對比)
    - 支付驗證 (支付時人臉對比)
    """)

    print("\n實際使用代碼:")
    print("""
    from face_recognizer import FaceRecognizer

    recognizer = FaceRecognizer(tolerance=0.6)

    # 驗證兩張照片是否為同一人
    is_same, confidence = recognizer.verify(
        image1_path='id_card_photo.jpg',
        image2_path='realtime_photo.jpg'
    )

    if is_same:
        print(f"✓ 身份驗證成功 (信心度: {confidence:.2%})")
    else:
        print(f"✗ 身份驗證失敗 (信心度: {confidence:.2%})")

    # 嚴格驗證
    is_same, confidence = recognizer.verify(
        image1_path='passport_photo.jpg',
        image2_path='current_photo.jpg'
    )

    if confidence > 0.85 and is_same:
        print("✓ 高度相似，可接受")
    else:
        print("✗ 不符合要求，請重新拍照")
    """)


def example_8_batch_processing():
    """示例 8: 批量人臉識別"""
    print("\n" + "="*60)
    print("示例 8: 批量人臉識別與統計")
    print("="*60)

    print("""
    功能: 一次識別多張圖片中的人臉
    用途: 監控錄影分析、會議簽到、活動統計

    應用場景:
    - 分析監控視頻 (每幀識別)
    - 會議自動簽到 (識別出席者)
    - 活動人流統計
    """)

    print("\n實際使用代碼:")
    print("""
    from face_recognizer import FaceRecognizer
    from collections import Counter

    # 載入資料庫
    recognizer = FaceRecognizer(database_path='database/employees.pkl')

    # 批量識別會議圖片
    meeting_folder = 'meeting_photos/'
    image_files = list(Path(meeting_folder).glob('*.jpg'))

    all_results = []
    for image_file in image_files:
        results = recognizer.recognize(str(image_file))
        for result in results:
            if result['confidence'] > 0.7:  # 只保留高信心度
                all_results.append(result['name'])

    # 統計出席者
    attendance = Counter(all_results)
    print(f"\\n會議出席統計:")
    for name, count in attendance.most_common():
        print(f"  {name}: {count} 次出現")

    # 未出席的人
    expected_attendees = set(recognizer.get_all_names())
    present = set(attendance.keys())
    absent = expected_attendees - present
    print(f"\\n未出席: {', '.join(absent) if absent else '全員出席'}")
    """)


def example_9_advanced_usage():
    """示例 9: 進階用法"""
    print("\n" + "="*60)
    print("示例 9: 進階用法")
    print("="*60)

    print("""
    功能: NumPy 陣列處理、資料庫管理
    用途: 視頻實時處理、與其他框架整合

    優勢:
    - 直接處理視頻幀，無需保存到磁碟
    - 與 OpenCV、TensorFlow 等無縫整合
    - 提高實時處理效率
    """)

    print("\n實際使用代碼:")
    print("""
    import cv2
    from face_recognizer import FaceRecognizer
    import numpy as np

    recognizer = FaceRecognizer(database_path='database/faces.pkl')

    # 從視頻中識別人臉 (實時)
    cap = cv2.VideoCapture('meeting_video.mp4')

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        # 轉換到 RGB
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

        # 直接使用 NumPy 陣列
        results = recognizer.recognize_from_array(rgb_frame)

        # 繪製結果
        for result in results:
            if result['confidence'] > 0.7:
                top, right, bottom, left = result['location']
                name = result['name']
                confidence = result['confidence']

                # 繪製邊界框
                cv2.rectangle(frame, (left, top), (right, bottom), (0, 255, 0), 2)

                # 繪製名字
                label = f"{name} ({confidence:.0%})"
                cv2.putText(frame, label, (left, top - 10),
                          cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)

        cv2.imshow('Face Recognition', frame)
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()

    # 資料庫管理
    print("資料庫操作:")

    # 刪除人臉
    recognizer.delete_face('John Doe')

    # 更新某人的人臉
    recognizer.register_face(
        'new_photo.jpg',
        'Jane Smith',
        replace=True
    )

    # 清空資料庫
    # recognizer.clear_database()  # 危險操作!
    """)


def example_10_complete_workflow():
    """示例 10: 完整工作流"""
    print("\n" + "="*60)
    print("示例 10: 公司員工打卡系統完整示例")
    print("="*60)

    print("""
    場景: 建立員工人臉識別打卡系統

    步驟:
    1. 新員工報到時註冊人臉
    2. 員工上班時通過人臉識別打卡
    3. 系統自動生成打卡記錄
    """)

    print("""
    from face_recognizer import FaceRecognizer
    import datetime
    from pathlib import Path

    # 初始化系統
    recognizer = FaceRecognizer(database_path='attendance_system/faces.pkl')

    # 模塊 1: 員工註冊
    def register_employee(photo_path: str, name: str):
        print(f"正在註冊 {name}...")
        if recognizer.register_face(photo_path, name):
            print(f"✓ {name} 註冊成功")
        else:
            print(f"✗ {name} 註冊失敗 (未檢測到人臉)")

    # 模塊 2: 打卡
    def clock_in(photo_path: str, output_csv: str):
        results = recognizer.recognize(photo_path)
        timestamp = datetime.datetime.now().isoformat()

        for result in results:
            if result['confidence'] > 0.8:
                name = result['name']
                print(f"✓ {name} 已打卡")

                # 記錄到 CSV
                with open(output_csv, 'a') as f:
                    f.write(f"{name},{timestamp},success\\n")

                return name

        print("✗ 無法識別，請重新拍照")
        with open(output_csv, 'a') as f:
            f.write(f"Unknown,{timestamp},failed\\n")

        return None

    # 使用示例
    if __name__ == "__main__":
        # 註冊員工
        register_employee('photos/john.jpg', 'John')
        register_employee('photos/jane.jpg', 'Jane')

        # 打卡
        clock_in('checkin/morning.jpg', 'attendance.csv')
    """)


def main():
    """執行所有示例"""
    print("\n" + "="*60)
    print("人臉識別 (Face Recognition) - 完整範例指南")
    print("="*60)

    examples = [
        ("1. 人臉檢測", example_1_face_detection),
        ("2. 標記人臉", example_2_draw_faces),
        ("3. 裁切人臉", example_3_crop_faces),
        ("4. 特徵點", example_4_face_landmarks),
        ("5. 資料庫設置", example_5_face_recognition_setup),
        ("6. 人臉識別", example_6_face_recognition_identify),
        ("7. 人臉驗證", example_7_face_verification),
        ("8. 批量識別", example_8_batch_processing),
        ("9. 進階用法", example_9_advanced_usage),
        ("10. 完整工作流", example_10_complete_workflow),
    ]

    print("\n可用範例:")
    for name, _ in examples:
        print(f"  {name}")

    while True:
        print("\n" + "-"*60)
        choice = input("選擇範例 (1-10) 或 'all' 顯示全部，'q' 退出: ").strip().lower()

        if choice == 'q':
            print("\n謝謝使用!")
            break
        elif choice == 'all':
            for _, func in examples:
                func()
            print("\n" + "="*60)
            print("所有範例已顯示完成")
            print("="*60)
            break
        elif choice.isdigit() and 1 <= int(choice) <= len(examples):
            examples[int(choice)-1][1]()
        else:
            print("無效輸入，請重試")


if __name__ == "__main__":
    main()
