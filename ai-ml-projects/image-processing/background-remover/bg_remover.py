"""
背景移除模組
使用 rembg 和 U2-Net 進行智能背景移除
"""

from rembg import remove, new_session
from PIL import Image
import numpy as np
import cv2
from pathlib import Path
from typing import Optional, Tuple, Union


class BackgroundRemover:
    """背景移除器類別"""

    def __init__(self, model_name: str = 'u2net'):
        """
        初始化背景移除器

        Args:
            model_name: 模型名稱
                - 'u2net': 通用模型 (推薦)
                - 'u2netp': 輕量級模型
                - 'u2net_human_seg': 人物分割專用
                - 'u2net_cloth_seg': 衣物分割
        """
        self.model_name = model_name
        self.session = new_session(model_name)
        print(f"載入模型: {model_name}")

    def remove_background(self,
                         input_path: str,
                         output_path: str,
                         bg_color: Optional[Tuple[int, int, int]] = None,
                         alpha_matting: bool = False,
                         alpha_matting_foreground_threshold: int = 240,
                         alpha_matting_background_threshold: int = 10,
                         alpha_matting_erode_size: int = 10) -> str:
        """
        移除圖片背景

        Args:
            input_path: 輸入圖片路徑
            output_path: 輸出圖片路徑
            bg_color: 背景顏色 (R, G, B)，None 為透明
            alpha_matting: 是否使用 alpha matting 優化邊緣
            alpha_matting_foreground_threshold: 前景閾值
            alpha_matting_background_threshold: 背景閾值
            alpha_matting_erode_size: 侵蝕大小

        Returns:
            輸出路徑
        """
        # 讀取圖片
        input_image = Image.open(input_path)

        # 移除背景
        output_image = remove(
            input_image,
            session=self.session,
            alpha_matting=alpha_matting,
            alpha_matting_foreground_threshold=alpha_matting_foreground_threshold,
            alpha_matting_background_threshold=alpha_matting_background_threshold,
            alpha_matting_erode_size=alpha_matting_erode_size
        )

        # 如果指定了背景顏色，替換透明背景
        if bg_color is not None:
            # 創建純色背景
            background = Image.new('RGB', output_image.size, bg_color)

            # 合成圖片
            if output_image.mode == 'RGBA':
                background.paste(output_image, mask=output_image.split()[3])
                output_image = background

        # 保存
        output_image.save(output_path)
        print(f"已保存: {output_path}")

        return output_path

    def blur_background(self,
                       input_path: str,
                       output_path: str,
                       blur_strength: int = 25) -> str:
        """
        模糊背景，保留主體

        Args:
            input_path: 輸入圖片路徑
            output_path: 輸出圖片路徑
            blur_strength: 模糊強度 (必須是奇數)

        Returns:
            輸出路徑
        """
        # 確保是奇數
        if blur_strength % 2 == 0:
            blur_strength += 1

        # 讀取原圖
        original = Image.open(input_path)
        original_array = np.array(original)

        # 獲取遮罩
        output = remove(original, session=self.session)

        if output.mode == 'RGBA':
            mask = np.array(output.split()[3])
        else:
            # 如果沒有 alpha 通道，創建遮罩
            gray = cv2.cvtColor(np.array(output), cv2.COLOR_RGB2GRAY)
            _, mask = cv2.threshold(gray, 1, 255, cv2.THRESH_BINARY)

        # 轉換為 0-1 範圍
        mask_normalized = mask.astype(float) / 255.0
        mask_3channel = np.stack([mask_normalized] * 3, axis=-1)

        # 模糊背景
        blurred = cv2.GaussianBlur(original_array, (blur_strength, blur_strength), 0)

        # 合成: 主體 + 模糊背景
        result = (original_array * mask_3channel +
                 blurred * (1 - mask_3channel)).astype(np.uint8)

        # 保存
        output_image = Image.fromarray(result)
        output_image.save(output_path)
        print(f"已保存: {output_path}")

        return output_path

    def replace_background(self,
                          input_path: str,
                          background_path: str,
                          output_path: str,
                          resize_mode: str = 'cover') -> str:
        """
        替換背景圖片

        Args:
            input_path: 輸入圖片路徑
            background_path: 背景圖片路徑
            output_path: 輸出圖片路徑
            resize_mode: 背景調整模式
                - 'cover': 覆蓋 (保持比例，可能裁切)
                - 'contain': 包含 (保持比例，可能有邊)
                - 'stretch': 拉伸 (填滿，可能變形)

        Returns:
            輸出路徑
        """
        # 讀取主體圖片並移除背景
        subject = Image.open(input_path)
        subject_no_bg = remove(subject, session=self.session)

        # 讀取背景
        background = Image.open(background_path).convert('RGB')

        # 調整背景大小以匹配主體
        if resize_mode == 'stretch':
            background = background.resize(subject.size, Image.Resampling.LANCZOS)
        elif resize_mode == 'cover':
            # 保持比例，覆蓋整個區域
            bg_ratio = background.width / background.height
            subject_ratio = subject.width / subject.height

            if bg_ratio > subject_ratio:
                # 背景較寬
                new_height = subject.height
                new_width = int(new_height * bg_ratio)
            else:
                # 背景較高
                new_width = subject.width
                new_height = int(new_width / bg_ratio)

            background = background.resize((new_width, new_height), Image.Resampling.LANCZOS)

            # 裁切到目標大小
            left = (new_width - subject.width) // 2
            top = (new_height - subject.height) // 2
            background = background.crop((left, top, left + subject.width, top + subject.height))
        else:  # contain
            background = background.resize(subject.size, Image.Resampling.LANCZOS)

        # 合成
        if subject_no_bg.mode == 'RGBA':
            background.paste(subject_no_bg, (0, 0), subject_no_bg)
        else:
            background = subject_no_bg

        # 保存
        background.save(output_path)
        print(f"已保存: {output_path}")

        return output_path

    def get_mask(self, input_path: str, output_path: Optional[str] = None) -> np.ndarray:
        """
        獲取遮罩

        Args:
            input_path: 輸入圖片路徑
            output_path: 輸出遮罩路徑 (可選)

        Returns:
            遮罩陣列
        """
        image = Image.open(input_path)
        output = remove(image, session=self.session)

        if output.mode == 'RGBA':
            mask = np.array(output.split()[3])
        else:
            gray = cv2.cvtColor(np.array(output), cv2.COLOR_RGB2GRAY)
            _, mask = cv2.threshold(gray, 1, 255, cv2.THRESH_BINARY)

        if output_path:
            mask_image = Image.fromarray(mask)
            mask_image.save(output_path)
            print(f"已保存遮罩: {output_path}")

        return mask

    def batch_remove(self,
                    input_dir: str,
                    output_dir: str,
                    bg_color: Optional[Tuple[int, int, int]] = None,
                    **kwargs) -> list:
        """
        批次移除背景

        Args:
            input_dir: 輸入目錄
            output_dir: 輸出目錄
            bg_color: 背景顏色
            **kwargs: 其他參數

        Returns:
            輸出檔案列表
        """
        input_path = Path(input_dir)
        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)

        # 支援的圖片格式
        image_extensions = ['.jpg', '.jpeg', '.png', '.bmp', '.webp']
        input_images = []

        for ext in image_extensions:
            input_images.extend(input_path.glob(f'*{ext}'))
            input_images.extend(input_path.glob(f'*{ext.upper()}'))

        outputs = []

        for idx, img_file in enumerate(input_images):
            print(f"\n處理 {idx + 1}/{len(input_images)}: {img_file.name}")

            # 決定輸出格式
            if bg_color is None:
                # 透明背景用 PNG
                output_file = output_path / f"{img_file.stem}_no_bg.png"
            else:
                # 純色背景用原格式
                output_file = output_path / f"{img_file.stem}_no_bg{img_file.suffix}"

            try:
                self.remove_background(
                    str(img_file),
                    str(output_file),
                    bg_color=bg_color,
                    **kwargs
                )
                outputs.append(str(output_file))
            except Exception as e:
                print(f"錯誤: {e}")

        print(f"\n完成! 處理了 {len(outputs)}/{len(input_images)} 張圖片")
        return outputs


if __name__ == "__main__":
    # 測試範例
    remover = BackgroundRemover()

    # 移除背景
    # remover.remove_background('input.jpg', 'output.png')

    # 白色背景
    # remover.remove_background('input.jpg', 'output_white.jpg', bg_color=(255, 255, 255))

    # 模糊背景
    # remover.blur_background('input.jpg', 'output_blur.jpg', blur_strength=25)

    # 替換背景
    # remover.replace_background('person.jpg', 'beach.jpg', 'output_beach.jpg')

    print("背景移除器已就緒")
