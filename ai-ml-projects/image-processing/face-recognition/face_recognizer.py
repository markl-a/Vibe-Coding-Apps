"""
人臉識別模組
使用 face_recognition 進行人臉識別和驗證
"""

import face_recognition
import numpy as np
import pickle
from typing import List, Dict, Optional, Tuple
from pathlib import Path
import cv2


class FaceRecognizer:
    """人臉識別器類別"""

    def __init__(self, database_path: str = 'database/embeddings.pkl',
                 tolerance: float = 0.6):
        """
        初始化人臉識別器

        Args:
            database_path: 人臉資料庫路徑
            tolerance: 識別容差 (越小越嚴格)
        """
        self.database_path = Path(database_path)
        self.tolerance = tolerance
        self.known_face_encodings = []
        self.known_face_names = []

        # 創建資料庫目錄
        self.database_path.parent.mkdir(parents=True, exist_ok=True)

        # 載入資料庫
        self.load_database()

    def load_database(self) -> None:
        """從檔案載入人臉資料庫"""
        if self.database_path.exists():
            with open(self.database_path, 'rb') as f:
                data = pickle.load(f)
                self.known_face_encodings = data.get('encodings', [])
                self.known_face_names = data.get('names', [])
            print(f"載入了 {len(self.known_face_names)} 個已知人臉")
        else:
            print("資料庫不存在，創建新資料庫")

    def save_database(self) -> None:
        """保存人臉資料庫到檔案"""
        data = {
            'encodings': self.known_face_encodings,
            'names': self.known_face_names
        }
        with open(self.database_path, 'wb') as f:
            pickle.dump(data, f)
        print(f"已保存 {len(self.known_face_names)} 個人臉到資料庫")

    def register_face(self, image_path: str, name: str,
                     replace: bool = False) -> bool:
        """
        註冊新人臉

        Args:
            image_path: 人臉圖片路徑
            name: 人名
            replace: 是否替換同名的現有記錄

        Returns:
            註冊是否成功
        """
        # 載入圖片
        image = face_recognition.load_image_file(image_path)

        # 檢測人臉
        face_locations = face_recognition.face_locations(image)

        if len(face_locations) == 0:
            print(f"錯誤: 在 {image_path} 中未檢測到人臉")
            return False

        if len(face_locations) > 1:
            print(f"警告: 檢測到多個人臉，使用第一個")

        # 提取人臉特徵
        face_encoding = face_recognition.face_encodings(image, face_locations)[0]

        # 檢查是否已存在
        if name in self.known_face_names:
            if replace:
                # 替換現有記錄
                idx = self.known_face_names.index(name)
                self.known_face_encodings[idx] = face_encoding
                print(f"已更新 {name} 的人臉資料")
            else:
                print(f"錯誤: {name} 已存在於資料庫中")
                return False
        else:
            # 添加新記錄
            self.known_face_encodings.append(face_encoding)
            self.known_face_names.append(name)
            print(f"已註冊 {name}")

        # 保存資料庫
        self.save_database()
        return True

    def register_face_from_array(self, image_array: np.ndarray, name: str,
                                replace: bool = False) -> bool:
        """
        從 NumPy 陣列註冊人臉

        Args:
            image_array: 圖片陣列 (RGB)
            name: 人名
            replace: 是否替換同名的現有記錄

        Returns:
            註冊是否成功
        """
        face_locations = face_recognition.face_locations(image_array)

        if len(face_locations) == 0:
            return False

        face_encoding = face_recognition.face_encodings(image_array, face_locations)[0]

        if name in self.known_face_names:
            if replace:
                idx = self.known_face_names.index(name)
                self.known_face_encodings[idx] = face_encoding
            else:
                return False
        else:
            self.known_face_encodings.append(face_encoding)
            self.known_face_names.append(name)

        self.save_database()
        return True

    def recognize(self, image_path: str) -> List[Dict]:
        """
        識別圖片中的人臉

        Args:
            image_path: 圖片路徑

        Returns:
            識別結果列表 [{'name': str, 'confidence': float, 'location': tuple}, ...]
        """
        # 載入圖片
        image = face_recognition.load_image_file(image_path)

        # 檢測人臉
        face_locations = face_recognition.face_locations(image)
        face_encodings = face_recognition.face_encodings(image, face_locations)

        results = []

        for face_encoding, face_location in zip(face_encodings, face_locations):
            # 比對人臉
            matches = face_recognition.compare_faces(
                self.known_face_encodings, face_encoding, tolerance=self.tolerance
            )

            name = "Unknown"
            confidence = 0.0

            # 計算距離
            if len(self.known_face_encodings) > 0:
                face_distances = face_recognition.face_distance(
                    self.known_face_encodings, face_encoding
                )

                best_match_index = np.argmin(face_distances)

                if matches[best_match_index]:
                    name = self.known_face_names[best_match_index]
                    # 將距離轉換為信心度 (0-1)
                    confidence = 1 - face_distances[best_match_index]

            results.append({
                'name': name,
                'confidence': float(confidence),
                'location': face_location
            })

        return results

    def verify(self, image1_path: str, image2_path: str) -> Tuple[bool, float]:
        """
        驗證兩張圖片是否為同一人

        Args:
            image1_path: 第一張圖片路徑
            image2_path: 第二張圖片路徑

        Returns:
            (是否為同一人, 信心度)
        """
        # 載入圖片
        image1 = face_recognition.load_image_file(image1_path)
        image2 = face_recognition.load_image_file(image2_path)

        # 提取特徵
        encoding1 = face_recognition.face_encodings(image1)
        encoding2 = face_recognition.face_encodings(image2)

        if len(encoding1) == 0 or len(encoding2) == 0:
            return False, 0.0

        # 比對
        distance = face_recognition.face_distance([encoding1[0]], encoding2[0])[0]
        is_match = distance <= self.tolerance
        confidence = 1 - distance

        return is_match, float(confidence)

    def delete_face(self, name: str) -> bool:
        """
        刪除已註冊的人臉

        Args:
            name: 人名

        Returns:
            刪除是否成功
        """
        if name in self.known_face_names:
            idx = self.known_face_names.index(name)
            del self.known_face_encodings[idx]
            del self.known_face_names[idx]
            self.save_database()
            print(f"已刪除 {name}")
            return True
        else:
            print(f"錯誤: {name} 不存在於資料庫中")
            return False

    def get_all_names(self) -> List[str]:
        """獲取所有已註冊的人名"""
        return self.known_face_names.copy()

    def clear_database(self) -> None:
        """清空資料庫"""
        self.known_face_encodings = []
        self.known_face_names = []
        self.save_database()
        print("資料庫已清空")


if __name__ == "__main__":
    # 測試範例
    recognizer = FaceRecognizer()

    # 註冊人臉
    print("註冊人臉...")
    recognizer.register_face('person1.jpg', 'John Doe')
    recognizer.register_face('person2.jpg', 'Jane Smith')

    # 識別人臉
    print("\n識別人臉...")
    results = recognizer.recognize('test_image.jpg')

    for result in results:
        print(f"識別: {result['name']}, 信心度: {result['confidence']:.2f}")

    # 驗證人臉
    print("\n驗證人臉...")
    is_match, confidence = recognizer.verify('person1.jpg', 'test_image.jpg')
    print(f"是否匹配: {is_match}, 信心度: {confidence:.2f}")
