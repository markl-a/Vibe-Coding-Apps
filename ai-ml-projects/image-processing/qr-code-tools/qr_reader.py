"""
QR 碼讀取模組
使用 pyzbar 和 OpenCV 讀取和解碼 QR 碼
"""

from pyzbar import pyzbar
import cv2
import numpy as np
from PIL import Image
from typing import List, Dict, Optional
from pathlib import Path


class QRCodeReader:
    """QR 碼讀取器類別"""

    def __init__(self):
        """初始化 QR 碼讀取器"""
        pass

    def read(self, image_path: str) -> Optional[str]:
        """
        讀取圖片中的 QR 碼

        Args:
            image_path: 圖片路徑

        Returns:
            QR 碼內容，若無則返回 None
        """
        # 讀取圖片
        image = cv2.imread(image_path)

        if image is None:
            print(f"無法讀取圖片: {image_path}")
            return None

        # 解碼 QR 碼
        decoded_objects = pyzbar.decode(image)

        if not decoded_objects:
            print("未檢測到 QR 碼")
            return None

        # 返回第一個 QR 碼的內容
        data = decoded_objects[0].data.decode('utf-8')
        print(f"讀取到 QR 碼: {data}")

        return data

    def read_all(self, image_path: str) -> List[Dict]:
        """
        讀取圖片中的所有 QR 碼

        Args:
            image_path: 圖片路徑

        Returns:
            QR 碼資訊列表 [{'data': str, 'type': str, 'rect': tuple}, ...]
        """
        image = cv2.imread(image_path)

        if image is None:
            print(f"無法讀取圖片: {image_path}")
            return []

        decoded_objects = pyzbar.decode(image)

        results = []

        for obj in decoded_objects:
            result = {
                'data': obj.data.decode('utf-8'),
                'type': obj.type,
                'rect': (obj.rect.left, obj.rect.top, obj.rect.width, obj.rect.height),
                'polygon': [(point.x, point.y) for point in obj.polygon]
            }
            results.append(result)

        print(f"檢測到 {len(results)} 個 QR 碼")
        return results

    def read_and_visualize(self, image_path: str, output_path: str) -> List[str]:
        """
        讀取 QR 碼並在圖片上標記

        Args:
            image_path: 輸入圖片路徑
            output_path: 輸出圖片路徑

        Returns:
            QR 碼內容列表
        """
        image = cv2.imread(image_path)

        if image is None:
            print(f"無法讀取圖片: {image_path}")
            return []

        decoded_objects = pyzbar.decode(image)
        data_list = []

        for obj in decoded_objects:
            data = obj.data.decode('utf-8')
            data_list.append(data)

            # 繪製邊界框
            points = obj.polygon
            if len(points) > 4:
                # 如果點數超過4個，使用矩形
                x, y, w, h = obj.rect
                cv2.rectangle(image, (x, y), (x + w, y + h), (0, 255, 0), 3)
            else:
                # 繪製多邊形
                pts = np.array([[point.x, point.y] for point in points], np.int32)
                pts = pts.reshape((-1, 1, 2))
                cv2.polylines(image, [pts], True, (0, 255, 0), 3)

            # 顯示資料
            x = obj.rect.left
            y = obj.rect.top - 10

            # 如果資料太長，截斷顯示
            display_text = data if len(data) <= 30 else data[:27] + "..."

            cv2.putText(image, display_text, (x, y),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)

        # 保存圖片
        cv2.imwrite(output_path, image)
        print(f"已保存標記圖片: {output_path}")

        return data_list

    def read_from_camera(self, camera_index: int = 0, window_name: str = "QR Code Scanner"):
        """
        從相機即時讀取 QR 碼

        Args:
            camera_index: 相機索引
            window_name: 視窗名稱
        """
        # 開啟相機
        cap = cv2.VideoCapture(camera_index)

        if not cap.isOpened():
            print("無法開啟相機")
            return

        print("按 'q' 退出掃描")

        while True:
            ret, frame = cap.read()

            if not ret:
                break

            # 解碼 QR 碼
            decoded_objects = pyzbar.decode(frame)

            for obj in decoded_objects:
                data = obj.data.decode('utf-8')

                # 繪製邊界框
                points = obj.polygon
                if len(points) == 4:
                    pts = np.array([[point.x, point.y] for point in points], np.int32)
                    pts = pts.reshape((-1, 1, 2))
                    cv2.polylines(frame, [pts], True, (0, 255, 0), 3)

                # 顯示資料
                x = obj.rect.left
                y = obj.rect.top - 10
                cv2.putText(frame, data, (x, y),
                           cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)

                # 在終端顯示
                print(f"掃描到: {data}")

            # 顯示畫面
            cv2.imshow(window_name, frame)

            # 按 'q' 退出
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break

        cap.release()
        cv2.destroyAllWindows()

    def batch_read(self, input_dir: str) -> List[Dict[str, str]]:
        """
        批次讀取目錄中的 QR 碼圖片

        Args:
            input_dir: 輸入目錄

        Returns:
            結果列表 [{'file': str, 'data': str}, ...]
        """
        input_path = Path(input_dir)
        image_extensions = ['.jpg', '.jpeg', '.png', '.bmp']

        image_files = []
        for ext in image_extensions:
            image_files.extend(input_path.glob(f'*{ext}'))
            image_files.extend(input_path.glob(f'*{ext.upper()}'))

        results = []

        for idx, img_file in enumerate(image_files):
            print(f"\n讀取 {idx + 1}/{len(image_files)}: {img_file.name}")

            data = self.read(str(img_file))

            results.append({
                'file': img_file.name,
                'data': data if data else "無法讀取"
            })

        print(f"\n完成! 處理了 {len(results)} 個檔案")
        return results

    def is_qrcode_valid(self, image_path: str) -> bool:
        """
        檢查圖片是否包含有效的 QR 碼

        Args:
            image_path: 圖片路徑

        Returns:
            是否有效
        """
        data = self.read(image_path)
        return data is not None


if __name__ == "__main__":
    # 測試範例
    reader = QRCodeReader()

    # 讀取 QR 碼
    # data = reader.read('qrcode.png')
    # if data:
    #     print(f"QR 碼內容: {data}")

    # 讀取並標記
    # reader.read_and_visualize('qrcode.png', 'qr_marked.png')

    # 從相機讀取
    # reader.read_from_camera()

    print("QR 碼讀取器已就緒")
