"""
Image Inpainting - 圖像修復與補全
使用深度學習和傳統方法修復圖像中的缺失或損壞區域
"""
import cv2
import numpy as np
from PIL import Image, ImageDraw
import torch
import torch.nn as nn
from typing import Optional, Union, Tuple, List
import os
from pathlib import Path


class ImageInpainting:
    """圖像修復處理器"""

    def __init__(
        self,
        method: str = 'telea',
        device: Optional[str] = None
    ):
        """
        初始化圖像修復處理器

        Args:
            method: 修復方法 ('telea', 'ns', 'lama', 'deep')
            device: 設備 (cuda/cpu)
        """
        self.method = method.lower()
        self.device = device or ('cuda' if torch.cuda.is_available() else 'cpu')

        if self.method not in ['telea', 'ns', 'lama', 'deep']:
            raise ValueError(f"Unsupported method: {method}")

    def inpaint(
        self,
        image_path: str,
        mask_path: str,
        output_path: Optional[str] = None,
        return_array: bool = False
    ) -> Union[str, np.ndarray]:
        """
        修復圖像

        Args:
            image_path: 輸入圖像路徑
            mask_path: 遮罩圖像路徑（白色區域將被修復）
            output_path: 輸出圖像路徑
            return_array: 是否返回 numpy 數組

        Returns:
            輸出路徑或圖像數組
        """
        # 讀取圖像和遮罩
        image = cv2.imread(image_path)
        mask = cv2.imread(mask_path, cv2.IMREAD_GRAYSCALE)

        if image is None:
            raise ValueError(f"Failed to read image: {image_path}")
        if mask is None:
            raise ValueError(f"Failed to read mask: {mask_path}")

        # 確保遮罩尺寸匹配
        if image.shape[:2] != mask.shape[:2]:
            mask = cv2.resize(mask, (image.shape[1], image.shape[0]))

        # 執行修復
        if self.method == 'telea':
            result = self._inpaint_telea(image, mask)
        elif self.method == 'ns':
            result = self._inpaint_ns(image, mask)
        elif self.method == 'lama':
            result = self._inpaint_lama(image, mask)
        elif self.method == 'deep':
            result = self._inpaint_deep(image, mask)
        else:
            raise ValueError(f"Unknown method: {self.method}")

        # 保存或返回結果
        if output_path:
            cv2.imwrite(output_path, result)
            print(f"Inpainted image saved to {output_path}")

        if return_array:
            return result
        return output_path if output_path else result

    def _inpaint_telea(
        self,
        image: np.ndarray,
        mask: np.ndarray,
        radius: int = 3
    ) -> np.ndarray:
        """
        使用 Telea 算法修復

        基於快速行進方法（Fast Marching Method）
        """
        result = cv2.inpaint(image, mask, radius, cv2.INPAINT_TELEA)
        return result

    def _inpaint_ns(
        self,
        image: np.ndarray,
        mask: np.ndarray,
        radius: int = 3
    ) -> np.ndarray:
        """
        使用 Navier-Stokes 算法修復

        基於流體動力學方程
        """
        result = cv2.inpaint(image, mask, radius, cv2.INPAINT_NS)
        return result

    def _inpaint_lama(
        self,
        image: np.ndarray,
        mask: np.ndarray
    ) -> np.ndarray:
        """
        使用 LaMa (Large Mask Inpainting) 深度學習方法

        目前使用 Telea 作為 fallback
        """
        print("Warning: LaMa model not available, using Telea as fallback")
        return self._inpaint_telea(image, mask, radius=5)

    def _inpaint_deep(
        self,
        image: np.ndarray,
        mask: np.ndarray
    ) -> np.ndarray:
        """
        使用深度學習方法修復

        目前使用改進的 NS 方法作為 fallback
        """
        print("Warning: Deep learning model not available, using NS as fallback")
        return self._inpaint_ns(image, mask, radius=5)

    def create_mask_from_color(
        self,
        image_path: str,
        color: Tuple[int, int, int],
        tolerance: int = 10,
        output_path: Optional[str] = None
    ) -> np.ndarray:
        """
        從特定顏色創建遮罩

        Args:
            image_path: 圖像路徑
            color: 要移除的顏色 (B, G, R)
            tolerance: 容差
            output_path: 輸出遮罩路徑

        Returns:
            遮罩數組
        """
        image = cv2.imread(image_path)

        # 創建顏色範圍
        lower = np.array([max(0, c - tolerance) for c in color])
        upper = np.array([min(255, c + tolerance) for c in color])

        # 創建遮罩
        mask = cv2.inRange(image, lower, upper)

        if output_path:
            cv2.imwrite(output_path, mask)

        return mask

    def create_mask_from_selection(
        self,
        image_path: str,
        regions: List[Tuple[int, int, int, int]],
        output_path: Optional[str] = None
    ) -> np.ndarray:
        """
        從選擇區域創建遮罩

        Args:
            image_path: 圖像路徑
            regions: 區域列表 [(x, y, width, height), ...]
            output_path: 輸出遮罩路徑

        Returns:
            遮罩數組
        """
        image = cv2.imread(image_path)
        h, w = image.shape[:2]

        # 創建空白遮罩
        mask = np.zeros((h, w), dtype=np.uint8)

        # 填充選擇區域
        for x, y, width, height in regions:
            mask[y:y+height, x:x+width] = 255

        if output_path:
            cv2.imwrite(output_path, mask)

        return mask

    def remove_object(
        self,
        image_path: str,
        mask_path: str,
        output_path: Optional[str] = None,
        method: Optional[str] = None
    ) -> str:
        """
        移除圖像中的物件

        Args:
            image_path: 圖像路徑
            mask_path: 遮罩路徑
            output_path: 輸出路徑
            method: 修復方法（如果為 None，使用初始化時的方法）

        Returns:
            輸出路徑
        """
        if method:
            old_method = self.method
            self.method = method

        if output_path is None:
            output_path = image_path.replace('.', '_inpainted.')

        result = self.inpaint(image_path, mask_path, output_path)

        if method:
            self.method = old_method

        return output_path

    def remove_watermark(
        self,
        image_path: str,
        watermark_region: Tuple[int, int, int, int],
        output_path: Optional[str] = None
    ) -> str:
        """
        移除浮水印

        Args:
            image_path: 圖像路徑
            watermark_region: 浮水印區域 (x, y, width, height)
            output_path: 輸出路徑

        Returns:
            輸出路徑
        """
        # 創建遮罩
        mask = self.create_mask_from_selection(
            image_path,
            [watermark_region],
            'temp_watermark_mask.png'
        )

        # 執行修復
        if output_path is None:
            output_path = image_path.replace('.', '_no_watermark.')

        self.inpaint(image_path, 'temp_watermark_mask.png', output_path)

        # 清理臨時文件
        if os.path.exists('temp_watermark_mask.png'):
            os.remove('temp_watermark_mask.png')

        return output_path

    def restore_old_photo(
        self,
        image_path: str,
        scratch_threshold: int = 200,
        output_path: Optional[str] = None
    ) -> str:
        """
        修復老照片（自動檢測劃痕）

        Args:
            image_path: 圖像路徑
            scratch_threshold: 劃痕檢測閾值
            output_path: 輸出路徑

        Returns:
            輸出路徑
        """
        # 讀取圖像
        image = cv2.imread(image_path)
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

        # 檢測劃痕（高對比度區域）
        _, mask = cv2.threshold(gray, scratch_threshold, 255, cv2.THRESH_BINARY)

        # 形態學操作去除噪點
        kernel = np.ones((3, 3), np.uint8)
        mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)
        mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)

        # 保存臨時遮罩
        cv2.imwrite('temp_scratch_mask.png', mask)

        # 執行修復
        if output_path is None:
            output_path = image_path.replace('.', '_restored.')

        self.inpaint(image_path, 'temp_scratch_mask.png', output_path)

        # 清理臨時文件
        if os.path.exists('temp_scratch_mask.png'):
            os.remove('temp_scratch_mask.png')

        return output_path

    def batch_inpaint(
        self,
        input_dir: str,
        mask_dir: str,
        output_dir: str,
        extensions: Optional[List[str]] = None
    ) -> List[str]:
        """
        批量修復圖像

        Args:
            input_dir: 輸入目錄
            mask_dir: 遮罩目錄
            output_dir: 輸出目錄
            extensions: 支持的文件擴展名

        Returns:
            處理後的文件列表
        """
        if extensions is None:
            extensions = ['.jpg', '.jpeg', '.png', '.bmp']

        os.makedirs(output_dir, exist_ok=True)

        input_path = Path(input_dir)
        mask_path = Path(mask_dir)
        output_files = []

        for file_path in input_path.iterdir():
            if file_path.suffix.lower() in extensions:
                # 查找對應的遮罩
                mask_file = mask_path / file_path.name
                if not mask_file.exists():
                    mask_file = mask_path / f"{file_path.stem}_mask{file_path.suffix}"

                if mask_file.exists():
                    output_file = Path(output_dir) / file_path.name

                    try:
                        self.inpaint(str(file_path), str(mask_file), str(output_file))
                        output_files.append(str(output_file))
                        print(f"Processed: {file_path.name}")
                    except Exception as e:
                        print(f"Error processing {file_path.name}: {e}")
                else:
                    print(f"Mask not found for {file_path.name}")

        print(f"\nProcessed {len(output_files)} images")
        return output_files

    def compare_methods(
        self,
        image_path: str,
        mask_path: str,
        output_dir: str = 'comparison'
    ) -> dict:
        """
        比較不同修復方法

        Args:
            image_path: 圖像路徑
            mask_path: 遮罩路徑
            output_dir: 輸出目錄

        Returns:
            結果字典
        """
        os.makedirs(output_dir, exist_ok=True)
        results = {}

        methods = ['telea', 'ns']

        for method in methods:
            try:
                inpainter = ImageInpainting(method=method)
                output_path = os.path.join(output_dir, f'{method}.png')
                result = inpainter.inpaint(
                    image_path,
                    mask_path,
                    output_path,
                    return_array=True
                )
                results[method] = result
                print(f"✓ {method.upper()} completed")
            except Exception as e:
                print(f"✗ {method.upper()} failed: {e}")

        print(f"Comparison results saved to {output_dir}")
        return results


def create_interactive_mask(image_path: str, output_path: str = 'mask.png'):
    """
    創建互動式遮罩（使用 OpenCV GUI）

    Args:
        image_path: 圖像路徑
        output_path: 遮罩輸出路徑
    """
    image = cv2.imread(image_path)
    mask = np.zeros(image.shape[:2], dtype=np.uint8)

    drawing = False
    brush_size = 10

    def draw_mask(event, x, y, flags, param):
        nonlocal drawing

        if event == cv2.EVENT_LBUTTONDOWN:
            drawing = True
        elif event == cv2.EVENT_MOUSEMOVE and drawing:
            cv2.circle(mask, (x, y), brush_size, 255, -1)
            cv2.circle(image, (x, y), brush_size, (0, 0, 255), -1)
        elif event == cv2.EVENT_LBUTTONUP:
            drawing = False

    cv2.namedWindow('Draw Mask')
    cv2.setMouseCallback('Draw Mask', draw_mask)

    print("Instructions:")
    print("- Click and drag to draw mask")
    print("- Press '+' to increase brush size")
    print("- Press '-' to decrease brush size")
    print("- Press 'c' to clear mask")
    print("- Press 's' to save and exit")
    print("- Press 'q' to quit without saving")

    while True:
        cv2.imshow('Draw Mask', image)
        key = cv2.waitKey(1) & 0xFF

        if key == ord('s'):
            cv2.imwrite(output_path, mask)
            print(f"Mask saved to {output_path}")
            break
        elif key == ord('q'):
            print("Quit without saving")
            break
        elif key == ord('c'):
            mask = np.zeros(image.shape[:2], dtype=np.uint8)
            image = cv2.imread(image_path)
        elif key == ord('+'):
            brush_size = min(50, brush_size + 2)
            print(f"Brush size: {brush_size}")
        elif key == ord('-'):
            brush_size = max(2, brush_size - 2)
            print(f"Brush size: {brush_size}")

    cv2.destroyAllWindows()


def main():
    """示例用法"""
    import argparse

    parser = argparse.ArgumentParser(description='Image Inpainting')
    parser.add_argument('image', type=str, help='Input image path')
    parser.add_argument('--mask', type=str, default=None,
                        help='Mask image path')
    parser.add_argument('--output', type=str, default='inpainted.png',
                        help='Output image path')
    parser.add_argument('--method', type=str, default='telea',
                        choices=['telea', 'ns', 'lama', 'deep'],
                        help='Inpainting method')
    parser.add_argument('--create-mask', action='store_true',
                        help='Create mask interactively')
    parser.add_argument('--compare', action='store_true',
                        help='Compare different methods')

    args = parser.parse_args()

    if args.create_mask:
        create_interactive_mask(args.image, 'mask.png')
        args.mask = 'mask.png'

    if args.mask is None:
        print("Error: --mask is required (or use --create-mask)")
        return

    # 創建修復處理器
    inpainter = ImageInpainting(method=args.method)

    if args.compare:
        inpainter.compare_methods(args.image, args.mask, 'comparison')
    else:
        inpainter.inpaint(args.image, args.mask, args.output)
        print(f"Inpainted image saved to {args.output}")


if __name__ == "__main__":
    main()
