"""
發票生成核心功能模組
"""

from datetime import datetime
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_RIGHT, TA_CENTER
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import os


class InvoiceGenerator:
    """發票生成器類"""

    def __init__(self):
        self.output_dir = "generated_invoices"
        if not os.path.exists(self.output_dir):
            os.makedirs(self.output_dir)

        # 設定樣式
        self.styles = getSampleStyleSheet()

    def generate_invoice_number(self, prefix="INV"):
        """生成發票號碼"""
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        return f"{prefix}-{timestamp}"

    def generate_pdf(self, invoice_data):
        """
        生成 PDF 發票

        Args:
            invoice_data: 發票數據字典

        Returns:
            str: PDF 文件路徑
        """
        invoice_number = invoice_data['invoice_number']
        filename = f"{self.output_dir}/invoice_{invoice_number}.pdf"

        # 創建 PDF 文檔
        doc = SimpleDocTemplate(
            filename,
            pagesize=letter,
            rightMargin=72,
            leftMargin=72,
            topMargin=72,
            bottomMargin=18,
        )

        # 容器用於存放 PDF 元素
        story = []

        # 添加標題
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=self.styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#2C3E50'),
            spaceAfter=30,
            alignment=TA_CENTER,
        )

        title = Paragraph(f"<b>INVOICE</b>", title_style)
        story.append(title)
        story.append(Spacer(1, 12))

        # 發票資訊和客戶資訊
        info_data = [
            ['Invoice Number:', invoice_data['invoice_number']],
            ['Invoice Date:', invoice_data['invoice_date']],
            ['Due Date:', invoice_data['due_date']],
            ['Payment Terms:', invoice_data['payment_terms']],
            ['', ''],
            ['Bill To:', ''],
            [invoice_data['customer']['name'], ''],
            [invoice_data['customer']['email'], ''],
            [invoice_data['customer'].get('address', ''), ''],
        ]

        if invoice_data['customer'].get('tax_id'):
            info_data.insert(5, ['Tax ID:', invoice_data['customer']['tax_id']])

        info_table = Table(info_data, colWidths=[2*inch, 4*inch])
        info_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (0, 4), 'Helvetica-Bold'),
            ('FONTNAME', (0, 6), (0, 6), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('TEXTCOLOR', (0, 0), (0, 4), colors.HexColor('#2C3E50')),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ]))

        story.append(info_table)
        story.append(Spacer(1, 24))

        # 發票項目表頭
        items_data = [['Description', 'Quantity', 'Unit Price', 'Tax Rate', 'Amount']]

        # 添加項目
        subtotal = 0
        total_tax = 0

        for item in invoice_data['items']:
            quantity = item['quantity']
            unit_price = item['unit_price']
            tax_rate = item['tax_rate']

            line_subtotal = quantity * unit_price
            line_tax = line_subtotal * (tax_rate / 100)
            line_total = line_subtotal + line_tax

            subtotal += line_subtotal
            total_tax += line_tax

            items_data.append([
                item['description'],
                str(quantity),
                f"{invoice_data['currency']} {unit_price:,.2f}",
                f"{tax_rate}%",
                f"{invoice_data['currency']} {line_total:,.2f}"
            ])

        total = subtotal + total_tax

        # 項目表格
        items_table = Table(items_data, colWidths=[2.5*inch, 0.8*inch, 1.2*inch, 0.8*inch, 1.2*inch])
        items_table.setStyle(TableStyle([
            # 表頭樣式
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#34495E')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 11),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),

            # 數據樣式
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 10),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#ECF0F1')]),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('ALIGN', (1, 1), (-1, -1), 'RIGHT'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('LEFTPADDING', (0, 0), (-1, -1), 6),
            ('RIGHTPADDING', (0, 0), (-1, -1), 6),
            ('TOPPADDING', (0, 1), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 1), (-1, -1), 8),
        ]))

        story.append(items_table)
        story.append(Spacer(1, 12))

        # 總計
        total_data = [
            ['', '', '', 'Subtotal:', f"{invoice_data['currency']} {subtotal:,.2f}"],
            ['', '', '', 'Tax:', f"{invoice_data['currency']} {total_tax:,.2f}"],
            ['', '', '', 'TOTAL:', f"{invoice_data['currency']} {total:,.2f}"],
        ]

        total_table = Table(total_data, colWidths=[2.5*inch, 0.8*inch, 1.2*inch, 0.8*inch, 1.2*inch])
        total_table.setStyle(TableStyle([
            ('FONTNAME', (3, 0), (3, 1), 'Helvetica-Bold'),
            ('FONTNAME', (3, 2), (4, 2), 'Helvetica-Bold'),
            ('FONTSIZE', (3, 0), (-1, -1), 11),
            ('FONTSIZE', (3, 2), (-1, 2), 13),
            ('ALIGN', (3, 0), (-1, -1), 'RIGHT'),
            ('TEXTCOLOR', (3, 2), (4, 2), colors.HexColor('#27AE60')),
            ('LINEABOVE', (3, 2), (4, 2), 2, colors.HexColor('#27AE60')),
            ('TOPPADDING', (3, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (3, 0), (-1, -1), 6),
        ]))

        story.append(total_table)

        # 備註
        if invoice_data.get('notes'):
            story.append(Spacer(1, 24))
            notes_style = ParagraphStyle(
                'Notes',
                parent=self.styles['Normal'],
                fontSize=9,
                textColor=colors.HexColor('#7F8C8D'),
            )
            notes = Paragraph(f"<b>Notes:</b><br/>{invoice_data['notes']}", notes_style)
            story.append(notes)

        # 頁腳
        story.append(Spacer(1, 36))
        footer_style = ParagraphStyle(
            'Footer',
            parent=self.styles['Normal'],
            fontSize=8,
            textColor=colors.HexColor('#95A5A6'),
            alignment=TA_CENTER,
        )
        footer = Paragraph("Thank you for your business!", footer_style)
        story.append(footer)

        # 生成 PDF
        doc.build(story)

        return filename

    def calculate_total(self, items):
        """
        計算發票總額

        Args:
            items: 發票項目列表

        Returns:
            dict: 包含 subtotal, tax, total 的字典
        """
        subtotal = 0
        total_tax = 0

        for item in items:
            line_subtotal = item['quantity'] * item['unit_price']
            line_tax = line_subtotal * (item.get('tax_rate', 0) / 100)

            subtotal += line_subtotal
            total_tax += line_tax

        total = subtotal + total_tax

        return {
            'subtotal': round(subtotal, 2),
            'tax': round(total_tax, 2),
            'total': round(total, 2)
        }

    def validate_invoice(self, invoice_data):
        """
        驗證發票數據

        Args:
            invoice_data: 發票數據字典

        Returns:
            tuple: (是否有效, 錯誤訊息列表)
        """
        errors = []

        # 必填欄位檢查
        required_fields = ['invoice_number', 'customer', 'invoice_date', 'items']
        for field in required_fields:
            if field not in invoice_data or not invoice_data[field]:
                errors.append(f"Missing required field: {field}")

        # 客戶資訊檢查
        if 'customer' in invoice_data:
            customer = invoice_data['customer']
            if not customer.get('name'):
                errors.append("Customer name is required")
            if not customer.get('email'):
                errors.append("Customer email is required")

        # 項目檢查
        if 'items' in invoice_data:
            items = invoice_data['items']
            if len(items) == 0:
                errors.append("At least one item is required")

            for idx, item in enumerate(items):
                if not item.get('description'):
                    errors.append(f"Item {idx + 1}: description is required")
                if item.get('quantity', 0) <= 0:
                    errors.append(f"Item {idx + 1}: quantity must be greater than 0")
                if item.get('unit_price', 0) <= 0:
                    errors.append(f"Item {idx + 1}: unit price must be greater than 0")

        return len(errors) == 0, errors
