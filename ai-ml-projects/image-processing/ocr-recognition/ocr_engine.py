"""
OCR (Optical Character Recognition) Engine
光學字符識別引擎 - 從圖像中提取文字
"""
import cv2
import numpy as np
from PIL import Image
from typing import List, Dict, Optional, Tuple, Union
import os


class OCREngine:
    """OCR 文字識別引擎"""

    def __init__(
        self,
        engine: str = 'easyocr',
        languages: List[str] = None,
        gpu: bool = False
    ):
        """
        初始化 OCR 引擎

        Args:
            engine: OCR 引擎 ('easyocr', 'tesseract', 'paddleocr')
            languages: 語言列表，如 ['en', 'ch_sim']
            gpu: 是否使用 GPU
        """
        self.engine_name = engine.lower()
        self.languages = languages or ['en']
        self.gpu = gpu
        self.reader = None

        self._init_engine()

    def _init_engine(self):
        """初始化 OCR 引擎"""
        if self.engine_name == 'easyocr':
            self._init_easyocr()
        elif self.engine_name == 'tesseract':
            self._init_tesseract()
        elif self.engine_name == 'paddleocr':
            self._init_paddleocr()
        else:
            raise ValueError(f"Unsupported engine: {self.engine_name}")

    def _init_easyocr(self):
        """初始化 EasyOCR"""
        try:
            import easyocr
            self.reader = easyocr.Reader(
                self.languages,
                gpu=self.gpu
            )
            print(f"EasyOCR initialized with languages: {self.languages}")
        except ImportError:
            print("EasyOCR not installed. Install with: pip install easyocr")
            print("Falling back to simple text detection...")
            self.engine_name = 'simple'

    def _init_tesseract(self):
        """初始化 Tesseract"""
        try:
            import pytesseract
            self.reader = pytesseract
            print("Tesseract initialized")
        except ImportError:
            print("pytesseract not installed. Install with: pip install pytesseract")
            print("Falling back to simple text detection...")
            self.engine_name = 'simple'

    def _init_paddleocr(self):
        """初始化 PaddleOCR"""
        try:
            from paddleocr import PaddleOCR
            lang = 'ch' if 'ch_sim' in self.languages else 'en'
            self.reader = PaddleOCR(
                use_angle_cls=True,
                lang=lang,
                use_gpu=self.gpu
            )
            print(f"PaddleOCR initialized with lang: {lang}")
        except ImportError:
            print("PaddleOCR not installed. Install with: pip install paddleocr")
            print("Falling back to simple text detection...")
            self.engine_name = 'simple'

    def recognize(
        self,
        image_path: str,
        detail: bool = False
    ) -> Union[str, List[Dict]]:
        """
        識別圖像中的文字

        Args:
            image_path: 圖像路徑
            detail: 是否返回詳細信息（包含位置和信心度）

        Returns:
            文字內容或詳細結果列表
        """
        if self.engine_name == 'easyocr':
            return self._recognize_easyocr(image_path, detail)
        elif self.engine_name == 'tesseract':
            return self._recognize_tesseract(image_path, detail)
        elif self.engine_name == 'paddleocr':
            return self._recognize_paddleocr(image_path, detail)
        elif self.engine_name == 'simple':
            return self._recognize_simple(image_path, detail)
        else:
            raise ValueError(f"Unknown engine: {self.engine_name}")

    def _recognize_easyocr(
        self,
        image_path: str,
        detail: bool = False
    ) -> Union[str, List[Dict]]:
        """使用 EasyOCR 識別"""
        results = self.reader.readtext(image_path)

        if detail:
            return [
                {
                    'text': text,
                    'confidence': conf,
                    'bbox': bbox
                }
                for bbox, text, conf in results
            ]
        else:
            return ' '.join([text for _, text, _ in results])

    def _recognize_tesseract(
        self,
        image_path: str,
        detail: bool = False
    ) -> Union[str, List[Dict]]:
        """使用 Tesseract 識別"""
        image = Image.open(image_path)

        if detail:
            data = self.reader.image_to_data(
                image,
                output_type=self.reader.Output.DICT
            )

            results = []
            n_boxes = len(data['text'])

            for i in range(n_boxes):
                if int(data['conf'][i]) > 0:
                    x, y, w, h = data['left'][i], data['top'][i], data['width'][i], data['height'][i]
                    results.append({
                        'text': data['text'][i],
                        'confidence': int(data['conf'][i]) / 100.0,
                        'bbox': [[x, y], [x+w, y], [x+w, y+h], [x, y+h]]
                    })

            return results
        else:
            return self.reader.image_to_string(image)

    def _recognize_paddleocr(
        self,
        image_path: str,
        detail: bool = False
    ) -> Union[str, List[Dict]]:
        """使用 PaddleOCR 識別"""
        results = self.reader.ocr(image_path, cls=True)

        if results is None or len(results) == 0:
            return [] if detail else ""

        if detail:
            output = []
            for line in results[0]:
                bbox, (text, conf) = line
                output.append({
                    'text': text,
                    'confidence': conf,
                    'bbox': bbox
                })
            return output
        else:
            texts = [line[1][0] for line in results[0]]
            return ' '.join(texts)

    def _recognize_simple(
        self,
        image_path: str,
        detail: bool = False
    ) -> Union[str, List[Dict]]:
        """簡單的文字檢測（僅作為 fallback）"""
        return "OCR engine not available. Please install easyocr or tesseract." if not detail else []

    def recognize_batch(
        self,
        image_paths: List[str],
        detail: bool = False
    ) -> List[Union[str, List[Dict]]]:
        """
        批量識別多張圖像

        Args:
            image_paths: 圖像路徑列表
            detail: 是否返回詳細信息

        Returns:
            識別結果列表
        """
        results = []

        for image_path in image_paths:
            try:
                result = self.recognize(image_path, detail)
                results.append(result)
                print(f"✓ Processed: {image_path}")
            except Exception as e:
                print(f"✗ Error processing {image_path}: {e}")
                results.append("" if not detail else [])

        return results

    def visualize(
        self,
        image_path: str,
        output_path: Optional[str] = None,
        show_confidence: bool = True
    ) -> str:
        """
        可視化識別結果（在圖像上繪製邊界框和文字）

        Args:
            image_path: 圖像路徑
            output_path: 輸出路徑
            show_confidence: 是否顯示信心度

        Returns:
            輸出路徑
        """
        # 讀取圖像
        image = cv2.imread(image_path)

        # 獲取詳細結果
        results = self.recognize(image_path, detail=True)

        # 繪製結果
        for result in results:
            bbox = result['bbox']
            text = result['text']
            conf = result['confidence']

            # 轉換邊界框格式
            if len(bbox) == 4 and isinstance(bbox[0], list):
                # [[x1,y1], [x2,y2], [x3,y3], [x4,y4]] 格式
                points = np.array(bbox, dtype=np.int32)
                cv2.polylines(image, [points], True, (0, 255, 0), 2)

                x, y = int(bbox[0][0]), int(bbox[0][1])
            else:
                # 簡單矩形格式
                x, y = int(bbox[0]), int(bbox[1])
                cv2.rectangle(image, (x, y), (x+100, y+30), (0, 255, 0), 2)

            # 繪製文字
            label = f"{text}" + (f" ({conf:.2f})" if show_confidence else "")

            # 繪製背景
            (w, h), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1)
            cv2.rectangle(image, (x, y-h-5), (x+w, y), (0, 255, 0), -1)

            # 繪製文字
            cv2.putText(
                image,
                label,
                (x, y-5),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.5,
                (0, 0, 0),
                1
            )

        # 保存結果
        if output_path is None:
            output_path = image_path.replace('.', '_ocr.')

        cv2.imwrite(output_path, image)
        print(f"Visualization saved to {output_path}")

        return output_path

    def extract_to_file(
        self,
        image_path: str,
        output_path: Optional[str] = None,
        format: str = 'txt'
    ) -> str:
        """
        提取文字並保存到文件

        Args:
            image_path: 圖像路徑
            output_path: 輸出路徑
            format: 輸出格式 ('txt', 'json', 'csv')

        Returns:
            輸出路徑
        """
        import json
        import csv

        # 識別文字
        results = self.recognize(image_path, detail=True)

        # 生成輸出路徑
        if output_path is None:
            base = os.path.splitext(image_path)[0]
            output_path = f"{base}.{format}"

        # 保存結果
        if format == 'txt':
            with open(output_path, 'w', encoding='utf-8') as f:
                for result in results:
                    f.write(result['text'] + '\n')

        elif format == 'json':
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(results, f, ensure_ascii=False, indent=2)

        elif format == 'csv':
            with open(output_path, 'w', newline='', encoding='utf-8') as f:
                writer = csv.DictWriter(f, fieldnames=['text', 'confidence', 'bbox'])
                writer.writeheader()
                writer.writerows(results)

        print(f"Text extracted to {output_path}")
        return output_path

    def preprocess_image(
        self,
        image_path: str,
        output_path: Optional[str] = None,
        operations: List[str] = None
    ) -> str:
        """
        預處理圖像以提高 OCR 準確度

        Args:
            image_path: 圖像路徑
            output_path: 輸出路徑
            operations: 操作列表 ['grayscale', 'denoise', 'threshold', 'deskew']

        Returns:
            輸出路徑
        """
        if operations is None:
            operations = ['grayscale', 'denoise', 'threshold']

        # 讀取圖像
        image = cv2.imread(image_path)

        # 執行操作
        if 'grayscale' in operations:
            image = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

        if 'denoise' in operations:
            if len(image.shape) == 2:  # 灰度圖
                image = cv2.fastNlMeansDenoising(image)
            else:
                image = cv2.fastNlMeansDenoisingColored(image)

        if 'threshold' in operations:
            if len(image.shape) == 3:  # 彩色圖
                image = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            _, image = cv2.threshold(image, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

        if 'deskew' in operations:
            # 簡單的傾斜校正
            coords = np.column_stack(np.where(image > 0))
            if len(coords) > 0:
                angle = cv2.minAreaRect(coords)[-1]
                if angle < -45:
                    angle = -(90 + angle)
                else:
                    angle = -angle

                (h, w) = image.shape[:2]
                center = (w // 2, h // 2)
                M = cv2.getRotationMatrix2D(center, angle, 1.0)
                image = cv2.warpAffine(
                    image, M, (w, h),
                    flags=cv2.INTER_CUBIC,
                    borderMode=cv2.BORDER_REPLICATE
                )

        # 保存結果
        if output_path is None:
            output_path = image_path.replace('.', '_preprocessed.')

        cv2.imwrite(output_path, image)
        print(f"Preprocessed image saved to {output_path}")

        return output_path


def main():
    """示例用法"""
    import argparse

    parser = argparse.ArgumentParser(description='OCR - Optical Character Recognition')
    parser.add_argument('image', type=str, help='Input image path')
    parser.add_argument('--engine', type=str, default='easyocr',
                        choices=['easyocr', 'tesseract', 'paddleocr'],
                        help='OCR engine')
    parser.add_argument('--lang', type=str, nargs='+', default=['en'],
                        help='Languages (e.g., en ch_sim)')
    parser.add_argument('--output', type=str, default=None,
                        help='Output file path')
    parser.add_argument('--format', type=str, default='txt',
                        choices=['txt', 'json', 'csv'],
                        help='Output format')
    parser.add_argument('--visualize', action='store_true',
                        help='Visualize results')
    parser.add_argument('--preprocess', action='store_true',
                        help='Preprocess image before OCR')
    parser.add_argument('--gpu', action='store_true',
                        help='Use GPU')

    args = parser.parse_args()

    # 創建 OCR 引擎
    ocr = OCREngine(
        engine=args.engine,
        languages=args.lang,
        gpu=args.gpu
    )

    # 預處理（如果需要）
    image_path = args.image
    if args.preprocess:
        image_path = ocr.preprocess_image(image_path)

    # 執行 OCR
    if args.visualize:
        ocr.visualize(image_path, args.output or 'ocr_result.jpg')
    else:
        ocr.extract_to_file(image_path, args.output, args.format)

    # 顯示文字內容
    text = ocr.recognize(image_path)
    print("\n" + "="*60)
    print("Recognized Text:")
    print("="*60)
    print(text)


if __name__ == "__main__":
    main()
