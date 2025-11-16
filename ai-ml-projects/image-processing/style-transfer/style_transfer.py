"""
神經網路風格轉換模組
使用 PyTorch 和 VGG19 進行圖像風格轉換
"""

import torch
import torch.nn as nn
import torch.optim as optim
from torchvision import transforms, models
from PIL import Image
import numpy as np
from pathlib import Path
from typing import Optional, Tuple


class StyleTransfer:
    """圖像風格轉換類別"""

    def __init__(self, device: Optional[str] = None):
        """
        初始化風格轉換器

        Args:
            device: 計算裝置 ('cuda' 或 'cpu')
        """
        if device is None:
            self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        else:
            self.device = torch.device(device)

        print(f"使用裝置: {self.device}")

        # 載入 VGG19 模型
        self.model = models.vgg19(pretrained=True).features.to(self.device).eval()

        # 凍結模型參數
        for param in self.model.parameters():
            param.requires_grad_(False)

        # 圖像轉換
        self.transform = transforms.Compose([
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406],
                               std=[0.229, 0.224, 0.225])
        ])

        self.denormalize = transforms.Normalize(
            mean=[-0.485/0.229, -0.456/0.224, -0.406/0.225],
            std=[1/0.229, 1/0.224, 1/0.225]
        )

    def load_image(self, image_path: str, max_size: int = 512) -> torch.Tensor:
        """
        載入並預處理圖像

        Args:
            image_path: 圖片路徑
            max_size: 最大尺寸

        Returns:
            處理後的圖像張量
        """
        image = Image.open(image_path).convert('RGB')

        # 調整大小
        size = min(max_size, max(image.size))
        ratio = size / max(image.size)
        new_size = tuple(int(dim * ratio) for dim in image.size)
        image = image.resize(new_size, Image.Resampling.LANCZOS)

        # 轉換為張量
        image = self.transform(image).unsqueeze(0)
        return image.to(self.device)

    def save_image(self, tensor: torch.Tensor, output_path: str) -> None:
        """
        保存圖像張量

        Args:
            tensor: 圖像張量
            output_path: 輸出路徑
        """
        # 反正規化
        image = self.denormalize(tensor.clone().squeeze(0)).clamp(0, 1)

        # 轉換為 PIL 圖像
        image = transforms.ToPILImage()(image.cpu())
        image.save(output_path)

    def get_features(self, image: torch.Tensor, layers: dict) -> dict:
        """
        提取圖像特徵

        Args:
            image: 圖像張量
            layers: 要提取的層

        Returns:
            特徵字典
        """
        features = {}
        x = image

        for name, layer in self.model._modules.items():
            x = layer(x)
            if name in layers:
                features[layers[name]] = x

        return features

    def gram_matrix(self, tensor: torch.Tensor) -> torch.Tensor:
        """
        計算 Gram 矩陣 (用於風格表示)

        Args:
            tensor: 特徵張量

        Returns:
            Gram 矩陣
        """
        b, c, h, w = tensor.size()
        tensor = tensor.view(c, h * w)
        gram = torch.mm(tensor, tensor.t())
        return gram

    def transfer_style(self,
                      content_image: str,
                      style_image: str,
                      output_path: str,
                      num_steps: int = 300,
                      style_weight: float = 1e6,
                      content_weight: float = 1,
                      learning_rate: float = 0.01,
                      max_size: int = 512,
                      verbose: bool = True) -> str:
        """
        執行風格轉換

        Args:
            content_image: 內容圖片路徑
            style_image: 風格圖片路徑
            output_path: 輸出路徑
            num_steps: 優化步數
            style_weight: 風格權重
            content_weight: 內容權重
            learning_rate: 學習率
            max_size: 最大圖像尺寸
            verbose: 是否顯示進度

        Returns:
            輸出路徑
        """
        # 載入圖像
        content = self.load_image(content_image, max_size)
        style = self.load_image(style_image, max_size)

        # 初始化目標圖像 (從內容圖像開始)
        target = content.clone().requires_grad_(True).to(self.device)

        # 定義要使用的層
        content_layers = {'21': 'conv4_2'}
        style_layers = {
            '0': 'conv1_1',
            '5': 'conv2_1',
            '10': 'conv3_1',
            '19': 'conv4_1',
            '28': 'conv5_1'
        }

        # 提取特徵
        content_features = self.get_features(content, content_layers)
        style_features = self.get_features(style, style_layers)

        # 計算風格的 Gram 矩陣
        style_grams = {layer: self.gram_matrix(style_features[layer])
                      for layer in style_features}

        # 優化器
        optimizer = optim.Adam([target], lr=learning_rate)

        # 優化循環
        for step in range(1, num_steps + 1):
            target_features = self.get_features(target, {**content_layers, **style_layers})

            # 內容損失
            content_loss = torch.mean(
                (target_features['conv4_2'] - content_features['conv4_2']) ** 2
            )

            # 風格損失
            style_loss = 0
            for layer in style_layers.values():
                target_feature = target_features[layer]
                target_gram = self.gram_matrix(target_feature)
                style_gram = style_grams[layer]

                b, c, h, w = target_feature.shape
                layer_style_loss = torch.mean((target_gram - style_gram) ** 2)
                style_loss += layer_style_loss / (c * h * w)

            # 總損失
            total_loss = content_weight * content_loss + style_weight * style_loss

            # 優化
            optimizer.zero_grad()
            total_loss.backward()
            optimizer.step()

            # 顯示進度
            if verbose and step % 50 == 0:
                print(f"步驟 {step}/{num_steps}")
                print(f"  總損失: {total_loss.item():.4f}")
                print(f"  內容損失: {content_loss.item():.4f}")
                print(f"  風格損失: {style_loss.item():.4f}")

        # 保存結果
        self.save_image(target, output_path)

        if verbose:
            print(f"\n完成! 輸出保存至: {output_path}")

        return output_path

    def apply_preset_style(self,
                          content_image: str,
                          style_name: str,
                          output_path: str,
                          **kwargs) -> str:
        """
        使用預設風格

        Args:
            content_image: 內容圖片路徑
            style_name: 預設風格名稱
            output_path: 輸出路徑
            **kwargs: 其他參數傳遞給 transfer_style

        Returns:
            輸出路徑
        """
        styles_dir = Path(__file__).parent / 'styles'
        style_path = styles_dir / f'{style_name}.jpg'

        if not style_path.exists():
            raise ValueError(f"風格 '{style_name}' 不存在")

        return self.transfer_style(content_image, str(style_path), output_path, **kwargs)

    def list_available_styles(self) -> list:
        """
        列出所有可用的預設風格

        Returns:
            風格名稱列表
        """
        styles_dir = Path(__file__).parent / 'styles'

        if not styles_dir.exists():
            return []

        styles = [f.stem for f in styles_dir.glob('*.jpg')]
        return sorted(styles)

    def batch_transfer(self,
                      content_dir: str,
                      style_image: str,
                      output_dir: str,
                      **kwargs) -> list:
        """
        批次風格轉換

        Args:
            content_dir: 內容圖片目錄
            style_image: 風格圖片路徑
            output_dir: 輸出目錄
            **kwargs: 其他參數

        Returns:
            輸出檔案路徑列表
        """
        content_path = Path(content_dir)
        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)

        image_extensions = ['.jpg', '.jpeg', '.png']
        content_images = []

        for ext in image_extensions:
            content_images.extend(content_path.glob(f'*{ext}'))

        outputs = []

        for idx, content_img in enumerate(content_images):
            print(f"\n處理 {idx + 1}/{len(content_images)}: {content_img.name}")

            output_file = output_path / f"stylized_{content_img.name}"
            self.transfer_style(
                str(content_img),
                style_image,
                str(output_file),
                **kwargs
            )
            outputs.append(str(output_file))

        return outputs


if __name__ == "__main__":
    # 測試範例
    transfer = StyleTransfer()

    print("可用的預設風格:", transfer.list_available_styles())

    # 風格轉換範例
    # transfer.transfer_style(
    #     content_image='photo.jpg',
    #     style_image='style.jpg',
    #     output_path='output.jpg',
    #     num_steps=300
    # )
