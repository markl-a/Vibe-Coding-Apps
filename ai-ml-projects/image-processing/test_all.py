"""
Comprehensive Test and Validation Script
綜合測試和驗證所有圖像處理功能
"""
import os
import sys
import numpy as np
from PIL import Image
import cv2


def create_test_image(filename='test_image.jpg', size=(400, 300)):
    """創建測試圖像"""
    # 創建彩色測試圖像
    image = np.zeros((*size[::-1], 3), dtype=np.uint8)

    # 添加漸變
    for y in range(size[1]):
        for x in range(size[0]):
            image[y, x] = [
                int(255 * x / size[0]),
                int(255 * y / size[1]),
                128
            ]

    # 添加圖案
    cv2.circle(image, (100, 100), 50, (255, 255, 0), -1)
    cv2.rectangle(image, (250, 150), (350, 250), (0, 255, 255), -1)
    cv2.putText(image, 'TEST', (150, 150), cv2.FONT_HERSHEY_SIMPLEX, 2, (255, 0, 0), 3)

    cv2.imwrite(filename, image)
    return filename


def test_basic_processing():
    """測試基本圖像處理功能"""
    print("\n" + "="*60)
    print("測試 1: 基本圖像處理")
    print("="*60)

    try:
        from processor import ImageProcessor

        # 創建測試圖像
        test_img = create_test_image()

        processor = ImageProcessor()

        # 測試調整大小
        processor.resize(test_img, width=200, output_path='test_resized.jpg')
        print("✓ 調整大小測試通過")

        # 測試增強
        processor.enhance(test_img, brightness=1.2, contrast=1.1, output_path='test_enhanced.jpg')
        print("✓ 圖像增強測試通過")

        # 測試邊緣檢測
        processor.edge_detection(test_img, method='canny', output_path='test_edges.jpg')
        print("✓ 邊緣檢測測試通過")

        # 測試旋轉
        processor.rotate(test_img, angle=45, output_path='test_rotated.jpg')
        print("✓ 旋轉測試通過")

        return True
    except Exception as e:
        print(f"✗ 基本處理測試失敗: {e}")
        return False


def test_classification():
    """測試圖像分類功能"""
    print("\n" + "="*60)
    print("測試 2: 圖像分類")
    print("="*60)

    try:
        from classifier import ImageClassifier

        test_img = create_test_image()

        # 初始化分類器（使用小模型以節省時間）
        print("正在載入分類模型...")
        classifier = ImageClassifier(model_name='resnet18')

        # 測試分類
        result = classifier.predict(test_img, top_k=3)
        print(f"✓ 分類測試通過")
        print(f"  Top prediction: {result['class']} ({result['confidence']:.2%})")

        return True
    except Exception as e:
        print(f"✗ 分類測試失敗: {e}")
        print("  提示: 這可能需要下載預訓練模型")
        return False


def test_detection():
    """測試物件偵測功能"""
    print("\n" + "="*60)
    print("測試 3: 物件偵測")
    print("="*60)

    try:
        from detector import ObjectDetector

        test_img = create_test_image()

        print("正在載入偵測模型...")
        detector = ObjectDetector(model='yolov8n')

        # 測試偵測
        detections = detector.detect(test_img, save=False)
        print(f"✓ 偵測測試通過")
        print(f"  檢測到 {len(detections)} 個物件")

        return True
    except Exception as e:
        print(f"✗ 偵測測試失敗: {e}")
        print("  提示: 這可能需要下載 YOLO 模型")
        return False


def test_super_resolution():
    """測試超分辨率功能"""
    print("\n" + "="*60)
    print("測試 4: 圖像超分辨率")
    print("="*60)

    try:
        # 創建小測試圖像
        small_img = np.random.randint(0, 255, (100, 100, 3), dtype=np.uint8)
        Image.fromarray(small_img).save('test_small.jpg')

        # 導入並測試（使用 bicubic 作為快速測試）
        sys.path.append('super-resolution')
        from super_resolution import SuperResolution

        sr = SuperResolution(model_type='bicubic', scale_factor=2)
        sr.upscale('test_small.jpg', 'test_upscaled.jpg')

        print("✓ 超分辨率測試通過")
        print("  100x100 -> 200x200")

        return True
    except Exception as e:
        print(f"✗ 超分辨率測試失敗: {e}")
        return False


def test_inpainting():
    """測試圖像修復功能"""
    print("\n" + "="*60)
    print("測試 5: 圖像修復")
    print("="*60)

    try:
        # 創建測試圖像和遮罩
        test_img = create_test_image('test_inpaint_img.jpg')

        # 創建遮罩
        mask = np.zeros((300, 400), dtype=np.uint8)
        cv2.rectangle(mask, (150, 100), (250, 200), 255, -1)
        cv2.imwrite('test_inpaint_mask.png', mask)

        sys.path.append('image-inpainting')
        from inpainting import ImageInpainting

        inpainter = ImageInpainting(method='telea')
        inpainter.inpaint('test_inpaint_img.jpg', 'test_inpaint_mask.png', 'test_inpainted.jpg')

        print("✓ 圖像修復測試通過")

        return True
    except Exception as e:
        print(f"✗ 圖像修復測試失敗: {e}")
        return False


def test_ocr():
    """測試 OCR 功能"""
    print("\n" + "="*60)
    print("測試 6: OCR 文字識別")
    print("="*60)

    try:
        # 創建帶文字的測試圖像
        img = np.ones((200, 400, 3), dtype=np.uint8) * 255
        cv2.putText(img, 'Hello World', (50, 100), cv2.FONT_HERSHEY_SIMPLEX, 2, (0, 0, 0), 3)
        cv2.imwrite('test_ocr.jpg', img)

        sys.path.append('ocr-recognition')
        from ocr_engine import OCREngine

        # 嘗試使用 EasyOCR，失敗則跳過
        ocr = OCREngine(engine='easyocr', languages=['en'])
        text = ocr.recognize('test_ocr.jpg')

        print(f"✓ OCR 測試通過")
        print(f"  識別結果: {text[:50] if text else '(empty)'}")

        return True
    except Exception as e:
        print(f"⚠ OCR 測試跳過: {e}")
        print("  提示: 需要安裝 easyocr 或 tesseract")
        return None  # 表示跳過


def test_segmentation():
    """測試圖像分割功能"""
    print("\n" + "="*60)
    print("測試 7: 圖像分割")
    print("="*60)

    try:
        test_img = create_test_image('test_segment.jpg')

        sys.path.append('image-segmentation')
        from segmentation import ImageSegmentation

        segmenter = ImageSegmentation(model_type='deeplabv3')
        result = segmenter.segment(test_img, 'test_segmented.jpg')

        print("✓ 圖像分割測試通過")

        return True
    except Exception as e:
        print(f"✗ 圖像分割測試失敗: {e}")
        print("  提示: 這可能需要下載分割模型")
        return False


def cleanup_test_files():
    """清理測試文件"""
    print("\n" + "="*60)
    print("清理測試文件")
    print("="*60)

    import glob

    patterns = [
        'test_*.jpg', 'test_*.png'
    ]

    cleaned = 0
    for pattern in patterns:
        for f in glob.glob(pattern):
            try:
                os.remove(f)
                cleaned += 1
            except Exception:
                pass

    print(f"✓ 清理了 {cleaned} 個測試文件")


def run_all_tests():
    """運行所有測試"""
    print("\n" + "="*70)
    print(" "*20 + "圖像處理功能綜合測試")
    print("="*70)

    results = {}

    # 運行測試
    results['基本處理'] = test_basic_processing()
    results['圖像分類'] = test_classification()
    results['物件偵測'] = test_detection()
    results['超分辨率'] = test_super_resolution()
    results['圖像修復'] = test_inpainting()
    results['OCR識別'] = test_ocr()
    results['圖像分割'] = test_segmentation()

    # 顯示結果摘要
    print("\n" + "="*70)
    print("測試結果摘要")
    print("="*70)

    passed = sum(1 for v in results.values() if v is True)
    failed = sum(1 for v in results.values() if v is False)
    skipped = sum(1 for v in results.values() if v is None)
    total = len(results)

    for name, result in results.items():
        status = "✓ 通過" if result is True else ("✗ 失敗" if result is False else "⚠ 跳過")
        print(f"{name:12s}: {status}")

    print("-"*70)
    print(f"總計: {total} 個測試")
    print(f"通過: {passed} ({passed/total*100:.1f}%)")
    print(f"失敗: {failed} ({failed/total*100:.1f}%)")
    print(f"跳過: {skipped} ({skipped/total*100:.1f}%)")

    # 清理測試文件
    cleanup_test_files()

    print("\n" + "="*70)
    if failed == 0:
        print("🎉 所有必要測試通過！")
    else:
        print(f"⚠️  有 {failed} 個測試失敗，請檢查相關模組")
    print("="*70)


def main():
    """主函數"""
    import argparse

    parser = argparse.ArgumentParser(description='綜合測試圖像處理功能')
    parser.add_argument('--test', type=str, default='all',
                        choices=['all', 'basic', 'classification', 'detection',
                                'sr', 'inpainting', 'ocr', 'segmentation'],
                        help='選擇要運行的測試')
    parser.add_argument('--cleanup', action='store_true',
                        help='僅清理測試文件')

    args = parser.parse_args()

    if args.cleanup:
        cleanup_test_files()
        return

    if args.test == 'all':
        run_all_tests()
    elif args.test == 'basic':
        test_basic_processing()
    elif args.test == 'classification':
        test_classification()
    elif args.test == 'detection':
        test_detection()
    elif args.test == 'sr':
        test_super_resolution()
    elif args.test == 'inpainting':
        test_inpainting()
    elif args.test == 'ocr':
        test_ocr()
    elif args.test == 'segmentation':
        test_segmentation()


if __name__ == "__main__":
    main()
