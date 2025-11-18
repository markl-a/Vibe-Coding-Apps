"""
Image Segmentation - 圖像分割
使用深度學習進行語義分割和實例分割
"""
import cv2
import numpy as np
from typing import Optional, List, Tuple
import torch
import torchvision.models as models
from torchvision import transforms


class ImageSegmentation:
    """圖像分割處理器"""

    def __init__(
        self,
        model_type: str = 'deeplabv3',
        device: Optional[str] = None
    ):
        """
        初始化分割處理器

        Args:
            model_type: 模型類型 ('deeplabv3', 'fcn', 'grabcut')
            device: 設備 (cuda/cpu)
        """
        self.model_type = model_type.lower()
        self.device = device or ('cuda' if torch.cuda.is_available() else 'cpu')
        self.model = None

        if self.model_type in ['deeplabv3', 'fcn']:
            self._init_deep_model()

    def _init_deep_model(self):
        """初始化深度學習模型"""
        if self.model_type == 'deeplabv3':
            self.model = models.segmentation.deeplabv3_resnet50(pretrained=True)
        elif self.model_type == 'fcn':
            self.model = models.segmentation.fcn_resnet50(pretrained=True)

        self.model.to(self.device)
        self.model.eval()

        self.transform = transforms.Compose([
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ])

    def segment(
        self,
        image_path: str,
        output_path: Optional[str] = None
    ) -> np.ndarray:
        """
        執行語義分割

        Args:
            image_path: 輸入圖像路徑
            output_path: 輸出路徑

        Returns:
            分割結果
        """
        image = cv2.imread(image_path)
        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

        if self.model_type in ['deeplabv3', 'fcn']:
            result = self._segment_deep(image_rgb)
        elif self.model_type == 'grabcut':
            result = self._segment_grabcut(image)
        else:
            raise ValueError(f"Unknown model type: {self.model_type}")

        if output_path:
            cv2.imwrite(output_path, result)

        return result

    def _segment_deep(self, image: np.ndarray) -> np.ndarray:
        """使用深度學習模型分割"""
        input_tensor = self.transform(image).unsqueeze(0).to(self.device)

        with torch.no_grad():
            output = self.model(input_tensor)['out'][0]

        output_predictions = output.argmax(0).byte().cpu().numpy()

        # 創建彩色分割圖
        palette = self._get_pascal_palette()
        color_seg = np.zeros((output_predictions.shape[0], output_predictions.shape[1], 3), dtype=np.uint8)

        for label, color in enumerate(palette):
            color_seg[output_predictions == label, :] = color

        return cv2.cvtColor(color_seg, cv2.COLOR_RGB2BGR)

    def _segment_grabcut(self, image: np.ndarray) -> np.ndarray:
        """使用 GrabCut 算法分割"""
        mask = np.zeros(image.shape[:2], np.uint8)
        bgd_model = np.zeros((1, 65), np.float64)
        fgd_model = np.zeros((1, 65), np.float64)

        # 定義矩形區域
        h, w = image.shape[:2]
        rect = (int(w*0.1), int(h*0.1), int(w*0.8), int(h*0.8))

        cv2.grabCut(image, mask, rect, bgd_model, fgd_model, 5, cv2.GC_INIT_WITH_RECT)

        mask2 = np.where((mask == 2) | (mask == 0), 0, 1).astype('uint8')
        result = image * mask2[:, :, np.newaxis]

        return result

    def _get_pascal_palette(self) -> List[List[int]]:
        """獲取 PASCAL VOC 調色板"""
        palette = [[0, 0, 0]]  # 背景
        for _ in range(20):
            palette.append([np.random.randint(0, 255) for _ in range(3)])
        return palette


def main():
    """示例用法"""
    import argparse

    parser = argparse.ArgumentParser(description='Image Segmentation')
    parser.add_argument('image', type=str, help='Input image path')
    parser.add_argument('--output', type=str, default='segmented.jpg',
                        help='Output image path')
    parser.add_argument('--model', type=str, default='deeplabv3',
                        choices=['deeplabv3', 'fcn', 'grabcut'],
                        help='Segmentation model')

    args = parser.parse_args()

    segmenter = ImageSegmentation(model_type=args.model)
    segmenter.segment(args.image, args.output)
    print(f"Segmentation result saved to {args.output}")


if __name__ == "__main__":
    main()
