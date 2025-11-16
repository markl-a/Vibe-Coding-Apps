"""
OCR 處理核心功能模組
"""

import re
from datetime import datetime
from PIL import Image
import pytesseract


class OCRProcessor:
    """OCR 處理器類"""

    def __init__(self, language='chi_tra+eng'):
        """
        初始化 OCR 處理器

        Args:
            language: OCR 識別語言
        """
        self.language = language

    def process_receipt(self, image):
        """
        處理發票圖片

        Args:
            image: PIL Image 對象

        Returns:
            dict: 提取的資訊
        """
        try:
            # 預處理圖片
            processed_image = self._preprocess_image(image)

            # OCR 識別
            text = pytesseract.image_to_string(processed_image, lang=self.language)

            # 提取資訊
            result = self._extract_information(text)

            return result

        except Exception as e:
            print(f"OCR processing error: {e}")
            return None

    def _preprocess_image(self, image):
        """
        預處理圖片以提高 OCR 準確度

        Args:
            image: PIL Image 對象

        Returns:
            PIL Image: 處理後的圖片
        """
        # 轉換為灰度
        if image.mode != 'L':
            image = image.convert('L')

        # 調整大小（如果太小）
        width, height = image.size
        if width < 1000:
            scale = 1000 / width
            new_width = int(width * scale)
            new_height = int(height * scale)
            image = image.resize((new_width, new_height), Image.Resampling.LANCZOS)

        return image

    def _extract_information(self, text):
        """
        從 OCR 文字中提取發票資訊

        Args:
            text: OCR 識別的文字

        Returns:
            dict: 提取的資訊
        """
        result = {
            'vendor': self._extract_vendor(text),
            'date': self._extract_date(text),
            'total': self._extract_total(text),
            'tax': self._extract_tax(text),
            'items': self._extract_items(text),
            'raw_text': text,
            'confidence': 0.8  # 簡化版本使用固定信心度
        }

        return result

    def _extract_vendor(self, text):
        """提取商家名稱"""
        # 簡單邏輯：取第一行非空文字作為商家名
        lines = [line.strip() for line in text.split('\n') if line.strip()]

        if lines:
            # 過濾太短或包含數字的行
            for line in lines[:3]:
                if len(line) >= 2 and not re.search(r'\d{4,}', line):
                    return line

        return "Unknown"

    def _extract_date(self, text):
        """提取日期"""
        # 常見日期格式
        date_patterns = [
            r'(\d{4})[/-](\d{1,2})[/-](\d{1,2})',  # YYYY-MM-DD 或 YYYY/MM/DD
            r'(\d{1,2})[/-](\d{1,2})[/-](\d{4})',  # DD-MM-YYYY 或 DD/MM/YYYY
            r'(\d{4})(\d{2})(\d{2})',              # YYYYMMDD
        ]

        for pattern in date_patterns:
            match = re.search(pattern, text)
            if match:
                try:
                    groups = match.groups()
                    if len(groups[0]) == 4:  # YYYY-MM-DD
                        date_str = f"{groups[0]}-{groups[1].zfill(2)}-{groups[2].zfill(2)}"
                    else:  # DD-MM-YYYY
                        date_str = f"{groups[2]}-{groups[1].zfill(2)}-{groups[0].zfill(2)}"

                    # 驗證日期
                    datetime.fromisoformat(date_str)
                    return date_str
                except:
                    continue

        return datetime.now().isoformat()[:10]

    def _extract_total(self, text):
        """提取總金額"""
        # 尋找金額模式
        amount_patterns = [
            r'[總总][計计金額额][：:＄$\s]*([0-9,]+\.?\d*)',
            r'[Tt]otal[：:＄$\s]*([0-9,]+\.?\d*)',
            r'[應应][付收][：:＄$\s]*([0-9,]+\.?\d*)',
        ]

        amounts = []

        for pattern in amount_patterns:
            matches = re.findall(pattern, text)
            for match in matches:
                try:
                    # 移除逗號並轉換為浮點數
                    amount = float(match.replace(',', ''))
                    if amount > 0:
                        amounts.append(amount)
                except:
                    continue

        # 返回最大的金額（通常是總額）
        return max(amounts) if amounts else 0.0

    def _extract_tax(self, text):
        """提取稅額"""
        # 尋找稅額
        tax_patterns = [
            r'[稅税][額额金][：:＄$\s]*([0-9,]+\.?\d*)',
            r'[Tt]ax[：:＄$\s]*([0-9,]+\.?\d*)',
            r'[營营][業业][稅税][：:＄$\s]*([0-9,]+\.?\d*)',
        ]

        for pattern in tax_patterns:
            match = re.search(pattern, text)
            if match:
                try:
                    tax = float(match.group(1).replace(',', ''))
                    if tax > 0:
                        return tax
                except:
                    continue

        return 0.0

    def _extract_items(self, text):
        """提取項目列表"""
        items = []

        # 簡單邏輯：提取包含金額的行
        lines = text.split('\n')

        for line in lines:
            # 檢查是否包含金額模式
            if re.search(r'\d+\.?\d*', line) and len(line.strip()) > 3:
                # 排除總計、稅額等行
                if not re.search(r'[總总計计稅税額额Tt]otal', line):
                    items.append(line.strip())

        # 限制項目數量
        return items[:10]

    def get_ocr_data(self, image, output_type='dict'):
        """
        獲取 OCR 詳細數據

        Args:
            image: PIL Image 對象
            output_type: 輸出類型 ('dict', 'data', 'string')

        Returns:
            OCR 數據
        """
        try:
            processed_image = self._preprocess_image(image)

            if output_type == 'dict':
                data = pytesseract.image_to_data(processed_image, lang=self.language, output_type=pytesseract.Output.DICT)
                return data
            elif output_type == 'string':
                return pytesseract.image_to_string(processed_image, lang=self.language)
            else:
                return pytesseract.image_to_data(processed_image, lang=self.language)

        except Exception as e:
            print(f"Error getting OCR data: {e}")
            return None

    def validate_result(self, result):
        """
        驗證提取結果

        Args:
            result: 提取的結果字典

        Returns:
            tuple: (是否有效, 錯誤訊息列表)
        """
        errors = []

        if not result:
            return False, ["No result provided"]

        if result.get('total', 0) <= 0:
            errors.append("Total amount is missing or invalid")

        if result.get('vendor') == "Unknown":
            errors.append("Vendor name could not be extracted")

        try:
            datetime.fromisoformat(result.get('date', ''))
        except:
            errors.append("Date format is invalid")

        return len(errors) == 0, errors
