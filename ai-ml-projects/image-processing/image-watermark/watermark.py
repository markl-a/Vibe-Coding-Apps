"""
圖像浮水印模組
使用 Pillow 和 OpenCV 添加各種浮水印
"""

from PIL import Image, ImageDraw, ImageFont, ImageEnhance
import cv2
import numpy as np
from typing import Tuple, Union, Optional
from pathlib import Path
import math


class WatermarkTool:
    """浮水印工具類別"""

    def __init__(self):
        """初始化浮水印工具"""
        self.default_font_size = 48
        self.default_opacity = 0.5

    def _get_position(self,
                     image_size: Tuple[int, int],
                     watermark_size: Tuple[int, int],
                     position: Union[str, Tuple[int, int]],
                     margin: int = 20) -> Tuple[int, int]:
        """
        計算浮水印位置

        Args:
            image_size: 圖片尺寸 (width, height)
            watermark_size: 浮水印尺寸 (width, height)
            position: 位置 (預設位置字串或座標)
            margin: 邊距

        Returns:
            座標 (x, y)
        """
        img_w, img_h = image_size
        wm_w, wm_h = watermark_size

        if isinstance(position, tuple):
            return position

        positions = {
            'top-left': (margin, margin),
            'top-right': (img_w - wm_w - margin, margin),
            'bottom-left': (margin, img_h - wm_h - margin),
            'bottom-right': (img_w - wm_w - margin, img_h - wm_h - margin),
            'center': ((img_w - wm_w) // 2, (img_h - wm_h) // 2)
        }

        return positions.get(position, positions['bottom-right'])

    def add_text_watermark(self,
                          input_path: str,
                          output_path: str,
                          text: str,
                          position: Union[str, Tuple[int, int]] = 'bottom-right',
                          font_size: int = 48,
                          font_color: Tuple[int, int, int] = (255, 255, 255),
                          opacity: float = 0.5,
                          angle: int = 0,
                          font_path: Optional[str] = None,
                          margin: int = 20) -> str:
        """
        添加文字浮水印

        Args:
            input_path: 輸入圖片路徑
            output_path: 輸出圖片路徑
            text: 浮水印文字
            position: 位置
            font_size: 字體大小
            font_color: 字體顏色 (R, G, B)
            opacity: 透明度 (0.0-1.0)
            angle: 旋轉角度
            font_path: 字型檔案路徑
            margin: 邊距

        Returns:
            輸出路徑
        """
        # 開啟圖片
        image = Image.open(input_path).convert('RGBA')

        # 創建浮水印層
        watermark_layer = Image.new('RGBA', image.size, (0, 0, 0, 0))
        draw = ImageDraw.Draw(watermark_layer)

        # 載入字型
        try:
            if font_path and Path(font_path).exists():
                font = ImageFont.truetype(font_path, font_size)
            else:
                font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', font_size)
        except:
            font = ImageFont.load_default()

        # 獲取文字尺寸
        bbox = draw.textbbox((0, 0), text, font=font)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]

        # 計算位置
        pos = self._get_position(image.size, (text_width, text_height), position, margin)

        # 繪製文字
        color_with_alpha = font_color + (int(255 * opacity),)
        draw.text(pos, text, font=font, fill=color_with_alpha)

        # 旋轉浮水印
        if angle != 0:
            watermark_layer = watermark_layer.rotate(angle, expand=True)

        # 合成
        watermarked = Image.alpha_composite(image, watermark_layer)

        # 轉換並保存
        if output_path.lower().endswith('.jpg') or output_path.lower().endswith('.jpeg'):
            watermarked = watermarked.convert('RGB')

        watermarked.save(output_path)
        print(f"已添加文字浮水印: {output_path}")

        return output_path

    def add_image_watermark(self,
                           input_path: str,
                           output_path: str,
                           watermark_path: str,
                           position: Union[str, Tuple[int, int]] = 'bottom-right',
                           scale: float = 0.2,
                           opacity: float = 0.7,
                           angle: int = 0,
                           margin: int = 20) -> str:
        """
        添加圖片浮水印

        Args:
            input_path: 輸入圖片路徑
            output_path: 輸出圖片路徑
            watermark_path: 浮水印圖片路徑
            position: 位置
            scale: 縮放比例 (相對於原圖)
            opacity: 透明度 (0.0-1.0)
            angle: 旋轉角度
            margin: 邊距

        Returns:
            輸出路徑
        """
        # 開啟圖片
        image = Image.open(input_path).convert('RGBA')
        watermark = Image.open(watermark_path).convert('RGBA')

        # 計算浮水印大小
        wm_width = int(min(image.size) * scale)
        wm_height = int(watermark.height * (wm_width / watermark.width))
        watermark = watermark.resize((wm_width, wm_height), Image.Resampling.LANCZOS)

        # 調整透明度
        alpha = watermark.split()[3]
        alpha = ImageEnhance.Brightness(alpha).enhance(opacity)
        watermark.putalpha(alpha)

        # 旋轉
        if angle != 0:
            watermark = watermark.rotate(angle, expand=True)

        # 計算位置
        pos = self._get_position(image.size, watermark.size, position, margin)

        # 創建浮水印層
        watermark_layer = Image.new('RGBA', image.size, (0, 0, 0, 0))
        watermark_layer.paste(watermark, pos, watermark)

        # 合成
        watermarked = Image.alpha_composite(image, watermark_layer)

        # 保存
        if output_path.lower().endswith('.jpg') or output_path.lower().endswith('.jpeg'):
            watermarked = watermarked.convert('RGB')

        watermarked.save(output_path)
        print(f"已添加圖片浮水印: {output_path}")

        return output_path

    def add_tiled_watermark(self,
                           input_path: str,
                           output_path: str,
                           text: str,
                           spacing: int = 200,
                           opacity: float = 0.1,
                           angle: int = 45,
                           font_size: int = 48,
                           font_color: Tuple[int, int, int] = (128, 128, 128)) -> str:
        """
        添加平鋪浮水印

        Args:
            input_path: 輸入圖片路徑
            output_path: 輸出圖片路徑
            text: 浮水印文字
            spacing: 間距
            opacity: 透明度
            angle: 旋轉角度
            font_size: 字體大小
            font_color: 字體顏色

        Returns:
            輸出路徑
        """
        image = Image.open(input_path).convert('RGBA')

        # 創建浮水印層
        watermark_layer = Image.new('RGBA', image.size, (0, 0, 0, 0))
        draw = ImageDraw.Draw(watermark_layer)

        # 載入字型
        try:
            font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', font_size)
        except:
            font = ImageFont.load_default()

        # 獲取文字尺寸
        bbox = draw.textbbox((0, 0), text, font=font)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]

        # 計算需要的行列數
        cols = math.ceil(image.width / spacing) + 1
        rows = math.ceil(image.height / spacing) + 1

        # 繪製平鋪文字
        color_with_alpha = font_color + (int(255 * opacity),)

        for row in range(rows):
            for col in range(cols):
                x = col * spacing
                y = row * spacing
                draw.text((x, y), text, font=font, fill=color_with_alpha)

        # 旋轉
        if angle != 0:
            watermark_layer = watermark_layer.rotate(angle, expand=False)

        # 合成
        watermarked = Image.alpha_composite(image, watermark_layer)

        # 保存
        if output_path.lower().endswith('.jpg') or output_path.lower().endswith('.jpeg'):
            watermarked = watermarked.convert('RGB')

        watermarked.save(output_path)
        print(f"已添加平鋪浮水印: {output_path}")

        return output_path

    def add_border_watermark(self,
                            input_path: str,
                            output_path: str,
                            text: str,
                            border_height: int = 50,
                            bg_color: Tuple[int, int, int] = (0, 0, 0),
                            text_color: Tuple[int, int, int] = (255, 255, 255),
                            font_size: int = 24) -> str:
        """
        添加邊框浮水印

        Args:
            input_path: 輸入圖片路徑
            output_path: 輸出圖片路徑
            text: 浮水印文字
            border_height: 邊框高度
            bg_color: 背景色
            text_color: 文字色
            font_size: 字體大小

        Returns:
            輸出路徑
        """
        image = Image.open(input_path).convert('RGB')

        # 創建新圖片 (加上邊框)
        new_height = image.height + border_height
        new_image = Image.new('RGB', (image.width, new_height), bg_color)

        # 貼上原圖
        new_image.paste(image, (0, 0))

        # 繪製文字
        draw = ImageDraw.Draw(new_image)

        try:
            font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', font_size)
        except:
            font = ImageFont.load_default()

        # 文字居中
        bbox = draw.textbbox((0, 0), text, font=font)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]

        x = (image.width - text_width) // 2
        y = image.height + (border_height - text_height) // 2

        draw.text((x, y), text, font=font, fill=text_color)

        # 保存
        new_image.save(output_path)
        print(f"已添加邊框浮水印: {output_path}")

        return output_path

    def batch_watermark(self,
                       input_dir: str,
                       output_dir: str,
                       watermark_type: str = 'text',
                       **kwargs) -> list:
        """
        批次添加浮水印

        Args:
            input_dir: 輸入目錄
            output_dir: 輸出目錄
            watermark_type: 浮水印類型 ('text' 或 'image')
            **kwargs: 其他參數

        Returns:
            輸出檔案列表
        """
        input_path = Path(input_dir)
        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)

        image_extensions = ['.jpg', '.jpeg', '.png', '.bmp']
        input_images = []

        for ext in image_extensions:
            input_images.extend(input_path.glob(f'*{ext}'))
            input_images.extend(input_path.glob(f'*{ext.upper()}'))

        outputs = []

        for idx, img_file in enumerate(input_images):
            print(f"\n處理 {idx + 1}/{len(input_images)}: {img_file.name}")

            output_file = output_path / f"wm_{img_file.name}"

            try:
                if watermark_type == 'text':
                    self.add_text_watermark(str(img_file), str(output_file), **kwargs)
                elif watermark_type == 'image':
                    self.add_image_watermark(str(img_file), str(output_file), **kwargs)

                outputs.append(str(output_file))
            except Exception as e:
                print(f"錯誤: {e}")

        print(f"\n完成! 處理了 {len(outputs)}/{len(input_images)} 張圖片")
        return outputs


if __name__ == "__main__":
    # 測試範例
    tool = WatermarkTool()

    # 文字浮水印
    # tool.add_text_watermark(
    #     'photo.jpg',
    #     'watermarked.jpg',
    #     text='© 2024 Sample',
    #     position='bottom-right'
    # )

    # 圖片浮水印
    # tool.add_image_watermark(
    #     'photo.jpg',
    #     'watermarked.jpg',
    #     watermark_path='logo.png',
    #     position='top-right'
    # )

    print("浮水印工具已就緒")
