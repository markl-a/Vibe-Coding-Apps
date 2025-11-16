"""
人臉檢測模組
使用 face_recognition 和 OpenCV 進行人臉檢測
"""

import cv2
import face_recognition
import numpy as np
from typing import List, Tuple, Optional
from pathlib import Path


class FaceDetector:
    """人臉檢測器類別"""

    def __init__(self, model: str = 'hog'):
        """
        初始化人臉檢測器

        Args:
            model: 檢測模型 ('hog' 或 'cnn')
                  - 'hog': 快速但較不準確 (適合 CPU)
                  - 'cnn': 較慢但更準確 (需要 GPU)
        """
        self.model = model

    def detect(self, image_path: str) -> List[Tuple[int, int, int, int]]:
        """
        檢測圖片中的人臉

        Args:
            image_path: 圖片路徑

        Returns:
            人臉位置列表 [(top, right, bottom, left), ...]
        """
        # 載入圖片
        image = face_recognition.load_image_file(image_path)

        # 檢測人臉
        face_locations = face_recognition.face_locations(image, model=self.model)

        return face_locations

    def detect_from_array(self, image_array: np.ndarray) -> List[Tuple[int, int, int, int]]:
        """
        從 NumPy 陣列檢測人臉

        Args:
            image_array: 圖片陣列 (RGB)

        Returns:
            人臉位置列表
        """
        face_locations = face_recognition.face_locations(image_array, model=self.model)
        return face_locations

    def save_annotated(self, image_path: str, output_path: str,
                      color: Tuple[int, int, int] = (0, 255, 0),
                      thickness: int = 2) -> int:
        """
        保存標記人臉位置的圖片

        Args:
            image_path: 輸入圖片路徑
            output_path: 輸出圖片路徑
            color: 矩形框顏色 (BGR)
            thickness: 矩形框粗細

        Returns:
            檢測到的人臉數量
        """
        # 載入圖片
        image = cv2.imread(image_path)
        rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

        # 檢測人臉
        face_locations = face_recognition.face_locations(rgb_image, model=self.model)

        # 繪製矩形框
        for (top, right, bottom, left) in face_locations:
            cv2.rectangle(image, (left, top), (right, bottom), color, thickness)

            # 添加標籤
            label = "Face"
            cv2.putText(image, label, (left, top - 10),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, thickness)

        # 保存圖片
        cv2.imwrite(output_path, image)

        return len(face_locations)

    def crop_faces(self, image_path: str, output_dir: str,
                   padding: int = 20) -> List[str]:
        """
        裁切並保存所有檢測到的人臉

        Args:
            image_path: 輸入圖片路徑
            output_dir: 輸出目錄
            padding: 裁切時的邊距

        Returns:
            保存的人臉圖片路徑列表
        """
        # 創建輸出目錄
        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)

        # 載入圖片
        image = cv2.imread(image_path)
        rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

        # 檢測人臉
        face_locations = face_recognition.face_locations(rgb_image, model=self.model)

        # 裁切並保存每個人臉
        saved_paths = []
        for idx, (top, right, bottom, left) in enumerate(face_locations):
            # 加上邊距
            top = max(0, top - padding)
            left = max(0, left - padding)
            bottom = min(image.shape[0], bottom + padding)
            right = min(image.shape[1], right + padding)

            # 裁切人臉
            face_image = image[top:bottom, left:right]

            # 保存
            face_path = output_path / f"face_{idx + 1}.jpg"
            cv2.imwrite(str(face_path), face_image)
            saved_paths.append(str(face_path))

        return saved_paths

    def get_face_landmarks(self, image_path: str) -> List[dict]:
        """
        獲取人臉特徵點

        Args:
            image_path: 圖片路徑

        Returns:
            人臉特徵點列表
        """
        image = face_recognition.load_image_file(image_path)
        face_landmarks = face_recognition.face_landmarks(image)
        return face_landmarks


if __name__ == "__main__":
    # 測試範例
    detector = FaceDetector(model='hog')

    # 檢測人臉
    print("檢測人臉...")
    faces = detector.detect('test_image.jpg')
    print(f"檢測到 {len(faces)} 個人臉")

    # 保存標記的圖片
    if faces:
        print("保存標記的圖片...")
        detector.save_annotated('test_image.jpg', 'output_annotated.jpg')

        # 裁切人臉
        print("裁切人臉...")
        saved_faces = detector.crop_faces('test_image.jpg', 'cropped_faces/')
        print(f"保存了 {len(saved_faces)} 個人臉圖片")
