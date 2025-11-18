"""
Image Super Resolution using Deep Learning
使用深度學習進行圖像超分辨率處理
"""
import cv2
import numpy as np
from PIL import Image
import torch
import torch.nn as nn
from typing import Optional, Tuple, Union
import os
from pathlib import Path


class ESPCN(nn.Module):
    """
    Efficient Sub-Pixel Convolutional Network (ESPCN)
    輕量級超分辨率網絡
    """

    def __init__(self, scale_factor: int = 2, num_channels: int = 3):
        super(ESPCN, self).__init__()
        self.scale_factor = scale_factor

        self.conv1 = nn.Conv2d(num_channels, 64, kernel_size=5, padding=2)
        self.conv2 = nn.Conv2d(64, 32, kernel_size=3, padding=1)
        self.conv3 = nn.Conv2d(32, num_channels * (scale_factor ** 2), kernel_size=3, padding=1)
        self.pixel_shuffle = nn.PixelShuffle(scale_factor)
        self.relu = nn.ReLU(inplace=True)

    def forward(self, x):
        x = self.relu(self.conv1(x))
        x = self.relu(self.conv2(x))
        x = self.conv3(x)
        x = self.pixel_shuffle(x)
        return x


class SRCNN(nn.Module):
    """
    Super-Resolution Convolutional Neural Network (SRCNN)
    經典超分辨率網絡
    """

    def __init__(self, num_channels: int = 3):
        super(SRCNN, self).__init__()
        self.conv1 = nn.Conv2d(num_channels, 64, kernel_size=9, padding=4)
        self.conv2 = nn.Conv2d(64, 32, kernel_size=5, padding=2)
        self.conv3 = nn.Conv2d(32, num_channels, kernel_size=5, padding=2)
        self.relu = nn.ReLU(inplace=True)

    def forward(self, x):
        x = self.relu(self.conv1(x))
        x = self.relu(self.conv2(x))
        x = self.conv3(x)
        return x


class SuperResolution:
    """圖像超分辨率處理器"""

    def __init__(
        self,
        model_type: str = 'espcn',
        scale_factor: int = 2,
        device: Optional[str] = None,
        model_path: Optional[str] = None
    ):
        """
        初始化超分辨率處理器

        Args:
            model_type: 模型類型 ('espcn', 'srcnn', 'opencv')
            scale_factor: 放大倍數 (2, 3, 4)
            device: 設備 (cuda/cpu)
            model_path: 預訓練模型路徑
        """
        self.model_type = model_type.lower()
        self.scale_factor = scale_factor
        self.device = device or ('cuda' if torch.cuda.is_available() else 'cpu')
        self.model = None

        if self.model_type in ['espcn', 'srcnn']:
            self._init_deep_learning_model(model_path)
        elif self.model_type == 'opencv':
            self._init_opencv_model()
        else:
            raise ValueError(f"Unsupported model type: {model_type}")

    def _init_deep_learning_model(self, model_path: Optional[str] = None):
        """初始化深度學習模型"""
        if self.model_type == 'espcn':
            self.model = ESPCN(scale_factor=self.scale_factor)
        elif self.model_type == 'srcnn':
            self.model = SRCNN()

        self.model.to(self.device)
        self.model.eval()

        # 載入預訓練權重（如果提供）
        if model_path and os.path.exists(model_path):
            self.model.load_state_dict(torch.load(model_path, map_location=self.device))
            print(f"Loaded model from {model_path}")

    def _init_opencv_model(self):
        """初始化 OpenCV DNN 超分辨率模型"""
        # OpenCV DNN 超分辨率需要下載預訓練模型
        # 這裡使用 EDSR 或 ESPCN 模型
        model_dir = Path(__file__).parent / 'models'
        model_dir.mkdir(exist_ok=True)

        model_name = f'ESPCN_x{self.scale_factor}.pb'
        model_path = model_dir / model_name

        if not model_path.exists():
            print(f"Warning: OpenCV model not found at {model_path}")
            print("Using bicubic interpolation as fallback")
            self.model_type = 'bicubic'
        else:
            self.sr_model = cv2.dnn_superres.DnnSuperResImpl_create()
            self.sr_model.readModel(str(model_path))
            self.sr_model.setModel('espcn', self.scale_factor)

    def upscale(
        self,
        image_path: str,
        output_path: Optional[str] = None,
        return_array: bool = False
    ) -> Union[str, np.ndarray]:
        """
        提升圖像分辨率

        Args:
            image_path: 輸入圖像路徑
            output_path: 輸出圖像路徑
            return_array: 是否返回 numpy 數組

        Returns:
            輸出路徑或圖像數組
        """
        # 讀取圖像
        image = cv2.imread(image_path)
        if image is None:
            raise ValueError(f"Failed to read image: {image_path}")

        # 執行超分辨率
        if self.model_type in ['espcn', 'srcnn']:
            result = self._upscale_with_torch(image)
        elif self.model_type == 'opencv':
            result = self._upscale_with_opencv(image)
        elif self.model_type == 'bicubic':
            result = self._upscale_bicubic(image)
        else:
            raise ValueError(f"Unknown model type: {self.model_type}")

        # 保存或返回結果
        if output_path:
            cv2.imwrite(output_path, result)
            print(f"Saved super-resolution image to {output_path}")

        if return_array:
            return result
        return output_path if output_path else result

    def _upscale_with_torch(self, image: np.ndarray) -> np.ndarray:
        """使用 PyTorch 模型進行超分辨率"""
        # 轉換為 tensor
        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        image_tensor = torch.from_numpy(image_rgb).float().permute(2, 0, 1).unsqueeze(0) / 255.0
        image_tensor = image_tensor.to(self.device)

        # 如果是 SRCNN，需要先進行雙三次插值
        if self.model_type == 'srcnn':
            h, w = image.shape[:2]
            new_h, new_w = h * self.scale_factor, w * self.scale_factor
            image_tensor = torch.nn.functional.interpolate(
                image_tensor,
                size=(new_h, new_w),
                mode='bicubic',
                align_corners=False
            )

        # 執行推理
        with torch.no_grad():
            output_tensor = self.model(image_tensor)

        # 轉換回 numpy
        output = output_tensor.squeeze(0).permute(1, 2, 0).cpu().numpy()
        output = np.clip(output * 255.0, 0, 255).astype(np.uint8)
        output = cv2.cvtColor(output, cv2.COLOR_RGB2BGR)

        return output

    def _upscale_with_opencv(self, image: np.ndarray) -> np.ndarray:
        """使用 OpenCV DNN 進行超分辨率"""
        result = self.sr_model.upsample(image)
        return result

    def _upscale_bicubic(self, image: np.ndarray) -> np.ndarray:
        """使用雙三次插值進行超分辨率（fallback）"""
        h, w = image.shape[:2]
        new_h, new_w = h * self.scale_factor, w * self.scale_factor
        result = cv2.resize(image, (new_w, new_h), interpolation=cv2.INTER_CUBIC)
        return result

    def upscale_pil(
        self,
        image: Image.Image,
        return_pil: bool = True
    ) -> Union[Image.Image, np.ndarray]:
        """
        使用 PIL Image 進行超分辨率

        Args:
            image: PIL Image 對象
            return_pil: 是否返回 PIL Image

        Returns:
            處理後的圖像
        """
        # 轉換為 numpy 數組
        image_array = np.array(image)
        if len(image_array.shape) == 2:  # 灰度圖
            image_array = cv2.cvtColor(image_array, cv2.COLOR_GRAY2BGR)
        else:
            image_array = cv2.cvtColor(image_array, cv2.COLOR_RGB2BGR)

        # 執行超分辨率
        result = self.upscale('', return_array=True) if hasattr(self, 'temp_path') else self._upscale_bicubic(image_array)

        # 轉換回 PIL
        if return_pil:
            result = cv2.cvtColor(result, cv2.COLOR_BGR2RGB)
            return Image.fromarray(result)
        return result

    def batch_upscale(
        self,
        input_dir: str,
        output_dir: str,
        extensions: Optional[list] = None
    ) -> list:
        """
        批量處理圖像

        Args:
            input_dir: 輸入目錄
            output_dir: 輸出目錄
            extensions: 支持的文件擴展名

        Returns:
            處理後的文件列表
        """
        if extensions is None:
            extensions = ['.jpg', '.jpeg', '.png', '.bmp', '.tiff']

        # 創建輸出目錄
        os.makedirs(output_dir, exist_ok=True)

        input_path = Path(input_dir)
        output_files = []

        # 遍歷所有圖像
        for file_path in input_path.iterdir():
            if file_path.suffix.lower() in extensions:
                output_file = Path(output_dir) / f"{file_path.stem}_sr{file_path.suffix}"

                try:
                    self.upscale(str(file_path), str(output_file))
                    output_files.append(str(output_file))
                    print(f"Processed: {file_path.name}")
                except Exception as e:
                    print(f"Error processing {file_path.name}: {e}")

        print(f"\nProcessed {len(output_files)} images")
        return output_files

    def compare_methods(
        self,
        image_path: str,
        output_dir: str = 'comparison'
    ) -> dict:
        """
        比較不同超分辨率方法

        Args:
            image_path: 輸入圖像路徑
            output_dir: 輸出目錄

        Returns:
            結果字典
        """
        os.makedirs(output_dir, exist_ok=True)
        results = {}

        # 原始圖像
        original = cv2.imread(image_path)

        # 雙三次插值
        bicubic_sr = SuperResolution('bicubic', self.scale_factor)
        results['bicubic'] = bicubic_sr.upscale(
            image_path,
            os.path.join(output_dir, 'bicubic.png'),
            return_array=True
        )

        # 其他方法（如果可用）
        # ...

        print(f"Comparison results saved to {output_dir}")
        return results


def main():
    """示例用法"""
    import argparse

    parser = argparse.ArgumentParser(description='Image Super Resolution')
    parser.add_argument('input', type=str, help='Input image path or directory')
    parser.add_argument('--output', type=str, default='output_sr.png',
                        help='Output image path')
    parser.add_argument('--model', type=str, default='bicubic',
                        choices=['espcn', 'srcnn', 'opencv', 'bicubic'],
                        help='Super resolution model')
    parser.add_argument('--scale', type=int, default=2,
                        choices=[2, 3, 4],
                        help='Scale factor')
    parser.add_argument('--batch', action='store_true',
                        help='Process directory in batch mode')

    args = parser.parse_args()

    # 創建超分辨率處理器
    sr = SuperResolution(
        model_type=args.model,
        scale_factor=args.scale
    )

    # 處理圖像
    if args.batch:
        sr.batch_upscale(args.input, args.output)
    else:
        sr.upscale(args.input, args.output)
        print(f"Super-resolution image saved to {args.output}")


if __name__ == "__main__":
    main()
