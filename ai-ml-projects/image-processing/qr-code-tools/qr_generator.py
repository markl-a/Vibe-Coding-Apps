"""
QR 碼生成模組
使用 qrcode 庫生成各種樣式的 QR 碼
"""

import qrcode
from qrcode.image.styledpil import StyledPilImage
from qrcode.image.styles.moduledrawers import RoundedModuleDrawer, CircleModuleDrawer
from qrcode.image.styles.colormasks import SolidFillColorMask, SquareGradiantColorMask
from PIL import Image, ImageDraw
import numpy as np
from typing import Optional, Tuple, Union, List
from pathlib import Path


class ErrorCorrectLevel:
    """錯誤修正等級"""
    L = qrcode.constants.ERROR_CORRECT_L  # 7%
    M = qrcode.constants.ERROR_CORRECT_M  # 15%
    Q = qrcode.constants.ERROR_CORRECT_Q  # 25%
    H = qrcode.constants.ERROR_CORRECT_H  # 30%


class QRCodeGenerator:
    """QR 碼生成器類別"""

    def __init__(self,
                 version: int = 1,
                 box_size: int = 10,
                 border: int = 4,
                 error_correction: int = ErrorCorrectLevel.M):
        """
        初始化 QR 碼生成器

        Args:
            version: QR 碼版本 (1-40)，None 為自動
            box_size: 每個方塊的像素大小
            border: 邊框寬度 (方塊數量)
            error_correction: 錯誤修正等級
        """
        self.version = version
        self.box_size = box_size
        self.border = border
        self.error_correction = error_correction

    def generate(self,
                data: str,
                output_path: str,
                fill_color: Union[str, Tuple[int, int, int]] = 'black',
                back_color: Union[str, Tuple[int, int, int]] = 'white') -> str:
        """
        生成基本 QR 碼

        Args:
            data: 要編碼的資料
            output_path: 輸出檔案路徑
            fill_color: 前景色
            back_color: 背景色

        Returns:
            輸出路徑
        """
        qr = qrcode.QRCode(
            version=self.version,
            error_correction=self.error_correction,
            box_size=self.box_size,
            border=self.border,
        )

        qr.add_data(data)
        qr.make(fit=True)

        img = qr.make_image(fill_color=fill_color, back_color=back_color)
        img.save(output_path)

        print(f"已生成 QR 碼: {output_path}")
        return output_path

    def generate_with_logo(self,
                          data: str,
                          output_path: str,
                          logo_path: str,
                          logo_size_ratio: float = 0.3,
                          fill_color: str = 'black',
                          back_color: str = 'white') -> str:
        """
        生成帶 Logo 的 QR 碼

        Args:
            data: 要編碼的資料
            output_path: 輸出檔案路徑
            logo_path: Logo 圖片路徑
            logo_size_ratio: Logo 相對於 QR 碼的大小比例
            fill_color: 前景色
            back_color: 背景色

        Returns:
            輸出路徑
        """
        # 使用高錯誤修正等級
        qr = qrcode.QRCode(
            version=self.version,
            error_correction=ErrorCorrectLevel.H,
            box_size=self.box_size,
            border=self.border,
        )

        qr.add_data(data)
        qr.make(fit=True)

        img = qr.make_image(fill_color=fill_color, back_color=back_color).convert('RGB')

        # 載入 Logo
        logo = Image.open(logo_path)

        # 計算 Logo 大小
        qr_width, qr_height = img.size
        logo_size = int(min(qr_width, qr_height) * logo_size_ratio)

        # 調整 Logo 大小
        logo = logo.resize((logo_size, logo_size), Image.Resampling.LANCZOS)

        # 計算 Logo 位置 (中央)
        logo_pos = ((qr_width - logo_size) // 2, (qr_height - logo_size) // 2)

        # 貼上 Logo
        img.paste(logo, logo_pos, logo if logo.mode == 'RGBA' else None)

        img.save(output_path)
        print(f"已生成帶 Logo 的 QR 碼: {output_path}")
        return output_path

    def generate_rounded(self,
                        data: str,
                        output_path: str,
                        radius: int = 10,
                        fill_color: Tuple[int, int, int] = (0, 0, 0),
                        back_color: Tuple[int, int, int] = (255, 255, 255)) -> str:
        """
        生成圓角 QR 碼

        Args:
            data: 要編碼的資料
            output_path: 輸出檔案路徑
            radius: 圓角半徑
            fill_color: 前景色 (RGB)
            back_color: 背景色 (RGB)

        Returns:
            輸出路徑
        """
        qr = qrcode.QRCode(
            version=self.version,
            error_correction=self.error_correction,
            box_size=self.box_size,
            border=self.border,
        )

        qr.add_data(data)
        qr.make(fit=True)

        img = qr.make_image(
            image_factory=StyledPilImage,
            module_drawer=RoundedModuleDrawer(),
            color_mask=SolidFillColorMask(back_color=back_color, front_color=fill_color)
        )

        img.save(output_path)
        print(f"已生成圓角 QR 碼: {output_path}")
        return output_path

    def generate_circular(self,
                         data: str,
                         output_path: str,
                         fill_color: Tuple[int, int, int] = (0, 0, 0),
                         back_color: Tuple[int, int, int] = (255, 255, 255)) -> str:
        """
        生成圓點 QR 碼

        Args:
            data: 要編碼的資料
            output_path: 輸出檔案路徑
            fill_color: 前景色 (RGB)
            back_color: 背景色 (RGB)

        Returns:
            輸出路徑
        """
        qr = qrcode.QRCode(
            version=self.version,
            error_correction=self.error_correction,
            box_size=self.box_size,
            border=self.border,
        )

        qr.add_data(data)
        qr.make(fit=True)

        img = qr.make_image(
            image_factory=StyledPilImage,
            module_drawer=CircleModuleDrawer(),
            color_mask=SolidFillColorMask(back_color=back_color, front_color=fill_color)
        )

        img.save(output_path)
        print(f"已生成圓點 QR 碼: {output_path}")
        return output_path

    def generate_gradient(self,
                         data: str,
                         output_path: str,
                         start_color: Tuple[int, int, int] = (0, 0, 0),
                         end_color: Tuple[int, int, int] = (100, 100, 100),
                         back_color: Tuple[int, int, int] = (255, 255, 255)) -> str:
        """
        生成漸變色 QR 碼

        Args:
            data: 要編碼的資料
            output_path: 輸出檔案路徑
            start_color: 起始顏色 (RGB)
            end_color: 結束顏色 (RGB)
            back_color: 背景色 (RGB)

        Returns:
            輸出路徑
        """
        qr = qrcode.QRCode(
            version=self.version,
            error_correction=self.error_correction,
            box_size=self.box_size,
            border=self.border,
        )

        qr.add_data(data)
        qr.make(fit=True)

        img = qr.make_image(
            image_factory=StyledPilImage,
            color_mask=SquareGradiantColorMask(
                back_color=back_color,
                center_color=start_color,
                edge_color=end_color
            )
        )

        img.save(output_path)
        print(f"已生成漸變色 QR 碼: {output_path}")
        return output_path

    def batch_generate(self,
                      data_list: List[Tuple[str, str]],
                      **kwargs) -> List[str]:
        """
        批次生成 QR 碼

        Args:
            data_list: [(data, output_path), ...] 列表
            **kwargs: 其他參數

        Returns:
            輸出路徑列表
        """
        outputs = []

        for idx, (data, output_path) in enumerate(data_list):
            print(f"生成 {idx + 1}/{len(data_list)}: {output_path}")
            self.generate(data, output_path, **kwargs)
            outputs.append(output_path)

        print(f"\n完成! 生成了 {len(outputs)} 個 QR 碼")
        return outputs

    def create_vcard(self,
                    name: str,
                    phone: Optional[str] = None,
                    email: Optional[str] = None,
                    organization: Optional[str] = None,
                    url: Optional[str] = None) -> str:
        """
        創建 vCard 格式字串

        Args:
            name: 姓名
            phone: 電話
            email: 電子郵件
            organization: 組織/公司
            url: 網址

        Returns:
            vCard 格式字串
        """
        vcard = f"BEGIN:VCARD\nVERSION:3.0\nFN:{name}\n"

        if phone:
            vcard += f"TEL:{phone}\n"
        if email:
            vcard += f"EMAIL:{email}\n"
        if organization:
            vcard += f"ORG:{organization}\n"
        if url:
            vcard += f"URL:{url}\n"

        vcard += "END:VCARD"

        return vcard

    def create_wifi(self,
                   ssid: str,
                   password: str,
                   security: str = 'WPA') -> str:
        """
        創建 WiFi 連線字串

        Args:
            ssid: WiFi 名稱
            password: 密碼
            security: 安全類型 (WPA, WEP, nopass)

        Returns:
            WiFi 格式字串
        """
        return f"WIFI:T:{security};S:{ssid};P:{password};;"


if __name__ == "__main__":
    # 測試範例
    generator = QRCodeGenerator()

    # 基本 QR 碼
    generator.generate('https://example.com', 'qr_basic.png')

    # 自定義顏色
    generator.generate('Hello World', 'qr_color.png',
                      fill_color='blue', back_color='yellow')

    # vCard
    vcard = generator.create_vcard(
        name='John Doe',
        phone='+1234567890',
        email='john@example.com'
    )
    generator.generate(vcard, 'qr_contact.png')

    print("測試完成!")
