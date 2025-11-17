"""
圖片浮水印 - 完整使用範例
演示如何使用 WatermarkTool 添加各種浮水印效果
"""

from pathlib import Path
from watermark import WatermarkTool


def example_1_text_watermark_basic():
    """示例 1: 基本文字浮水印"""
    print("\n" + "="*60)
    print("示例 1: 基本文字浮水印")
    print("="*60)

    print("""
    功能: 在圖片上添加文字
    用途: 版權標記、網站logo、品牌宣傳

    位置選項:
    - 'top-left': 左上角
    - 'top-right': 右上角
    - 'bottom-left': 左下角
    - 'bottom-right': 右下角 (推薦)
    - 'center': 中央
    - (x, y): 自訂座標
    """)

    print("\n實際使用代碼:")
    print("""
    from watermark import WatermarkTool

    tool = WatermarkTool()

    # 基本文字浮水印
    tool.add_text_watermark(
        input_path='photo.jpg',
        output_path='watermarked_basic.jpg',
        text='© 2024 Sample',
        position='bottom-right',
        font_size=48,
        font_color=(255, 255, 255),  # 白色
        opacity=0.7
    )

    # 紅色浮水印，左上角
    tool.add_text_watermark(
        input_path='photo.jpg',
        output_path='watermarked_red.jpg',
        text='© My Studio',
        position='top-left',
        font_size=36,
        font_color=(255, 0, 0),  # 紅色
        opacity=0.8
    )

    # 旋轉浮水印
    tool.add_text_watermark(
        input_path='photo.jpg',
        output_path='watermarked_rotated.jpg',
        text='DRAFT',
        position='center',
        font_size=60,
        font_color=(128, 128, 128),  # 灰色
        opacity=0.3,
        angle=-45  # 45 度旋轉
    )
    """)


def example_2_text_watermark_advanced():
    """示例 2: 進階文字浮水印"""
    print("\n" + "="*60)
    print("示例 2: 進階文字浮水印")
    print("="*60)

    print("""
    功能: 自訂字體、大小、透明度
    用途: 專業圖片編輯、高級品牌標記

    常用顏色 (RGB):
    - (255, 255, 255) = 白色
    - (0, 0, 0) = 黑色
    - (255, 0, 0) = 紅色
    - (0, 255, 0) = 綠色
    - (0, 0, 255) = 藍色
    - (255, 255, 0) = 黃色
    - (128, 128, 128) = 灰色
    - (255, 165, 0) = 橙色

    透明度:
    - 0.0 = 完全透明
    - 0.3-0.5 = 輕度可見
    - 0.7-0.9 = 明顯可見
    - 1.0 = 完全不透明
    """)

    print("\n實際使用代碼:")
    print("""
    # 自訂座標位置
    tool.add_text_watermark(
        input_path='photo.jpg',
        output_path='custom_pos.jpg',
        text='© Studio XYZ',
        position=(50, 100),  # x=50, y=100
        font_size=40,
        font_color=(200, 50, 50),  # 暗紅色
        opacity=0.6,
        margin=20
    )

    # 增加邊距
    tool.add_text_watermark(
        input_path='photo.jpg',
        output_path='with_margin.jpg',
        text='Watermark',
        position='bottom-right',
        font_size=36,
        font_color=(100, 100, 100),
        opacity=0.5,
        margin=50  # 增加距離邊界的距離
    )

    # 使用自訂字體
    tool.add_text_watermark(
        input_path='photo.jpg',
        output_path='custom_font.jpg',
        text='© 2024',
        position='bottom-left',
        font_size=48,
        font_color=(255, 255, 255),
        opacity=0.8,
        font_path='/path/to/custom-font.ttf'  # 自訂字型檔案
    )
    """)


def example_3_image_watermark():
    """示例 3: 圖片浮水印 (Logo)"""
    print("\n" + "="*60)
    print("示例 3: 圖片浮水印 (Logo)")
    print("="*60)

    print("""
    功能: 將圖片 (通常是 Logo) 疊加到照片上
    用途: Logo 標記、品牌宣傳、網站浮水印

    推薦做法:
    - Logo 建議使用 PNG 格式 (支援透明)
    - Logo 大小應為原圖的 10-30%
    - 使用 75-85% 透明度避免過度明顯
    """)

    print("\n實際使用代碼:")
    print("""
    from watermark import WatermarkTool

    tool = WatermarkTool()

    # 基本 Logo 水印
    tool.add_image_watermark(
        input_path='product.jpg',
        output_path='with_logo.jpg',
        watermark_path='logo.png',  # PNG logo
        position='bottom-right',
        scale=0.2,  # logo 佔原圖 20%
        opacity=0.8
    )

    # Logo 在右上角
    tool.add_image_watermark(
        input_path='photo.jpg',
        output_path='logo_top_right.jpg',
        watermark_path='company_logo.png',
        position='top-right',
        scale=0.15,  # 較小的 logo
        opacity=0.7
    )

    # Logo 旋轉
    tool.add_image_watermark(
        input_path='photo.jpg',
        output_path='logo_rotated.jpg',
        watermark_path='logo.png',
        position='center',
        scale=0.25,
        opacity=0.6,
        angle=45  # 45 度旋轉
    )

    # 不同背景調整模式
    tool.add_image_watermark(
        input_path='photo.jpg',
        output_path='logo_cover.jpg',
        watermark_path='logo.png',
        position='top-left',
        scale=0.2,
        opacity=0.8,
        angle=0
    )
    """)


def example_4_tiled_watermark():
    """示例 4: 平鋪浮水印 (防盜水印)"""
    print("\n" + "="*60)
    print("示例 4: 平鋪浮水印 (防盜水印)")
    print("="*60)

    print("""
    功能: 在整個圖片上重複添加文字
    用途: 防盜保護、版權聲明、內部文件標記

    特點:
    - 佈滿整個圖片，難以移除
    - 適合防止未授權使用
    - 透明度低，不影響圖片可視性
    """)

    print("\n實際使用代碼:")
    print("""
    from watermark import WatermarkTool

    tool = WatermarkTool()

    # 基本平鋪水印 (45度角)
    tool.add_tiled_watermark(
        input_path='photo.jpg',
        output_path='tiled_watermark.jpg',
        text='CONFIDENTIAL',
        spacing=200,  # 文字間距
        opacity=0.1,  # 低透明度
        angle=45,  # 45 度角
        font_size=48,
        font_color=(128, 128, 128)  # 灰色
    )

    # 密集平鋪
    tool.add_tiled_watermark(
        input_path='document.jpg',
        output_path='dense_watermark.jpg',
        text='DRAFT',
        spacing=100,  # 更小的間距
        opacity=0.15,
        angle=45,
        font_size=36,
        font_color=(255, 0, 0)  # 紅色
    )

    # 水平平鋪 (不旋轉)
    tool.add_tiled_watermark(
        input_path='photo.jpg',
        output_path='horizontal_tiled.jpg',
        text='© My Company',
        spacing=300,
        opacity=0.08,
        angle=0,  # 水平
        font_size=32,
        font_color=(200, 200, 200)
    )
    """)


def example_5_border_watermark():
    """示例 5: 邊框浮水印 (字幕)"""
    print("\n" + "="*60)
    print("示例 5: 邊框浮水印 (添加字幕/標題)")
    print("="*60)

    print("""
    功能: 在圖片底部添加邊框並寫入文字
    用途: 添加標題、字幕、作者資訊、社群媒體標籤

    應用場景:
    - 社群媒體貼文 (Instagram, Facebook)
    - 教育內容 (文字標題)
    - 視頻截圖 (添加字幕)
    """)

    print("\n實際使用代碼:")
    print("""
    from watermark import WatermarkTool

    tool = WatermarkTool()

    # 基本邊框浮水印
    tool.add_border_watermark(
        input_path='photo.jpg',
        output_path='with_border.jpg',
        text='Photo by John Doe',
        border_height=50,
        bg_color=(0, 0, 0),  # 黑色背景
        text_color=(255, 255, 255),  # 白色文字
        font_size=24
    )

    # 白色邊框 + 黑色文字
    tool.add_border_watermark(
        input_path='photo.jpg',
        output_path='white_border.jpg',
        text='© 2024 Photography Studio',
        border_height=60,
        bg_color=(255, 255, 255),  # 白色
        text_color=(0, 0, 0),  # 黑色
        font_size=28
    )

    # 彩色邊框
    tool.add_border_watermark(
        input_path='photo.jpg',
        output_path='colored_border.jpg',
        text='Follow @mystudio on Instagram',
        border_height=80,
        bg_color=(0, 102, 204),  # 藍色
        text_color=(255, 255, 255),  # 白色
        font_size=32
    )
    """)


def example_6_batch_processing():
    """示例 6: 批量添加浮水印"""
    print("\n" + "="*60)
    print("示例 6: 批量添加浮水印")
    print("="*60)

    print("""
    功能: 一次為多張圖片添加相同浮水印
    用途: 批量修圖、攝影作品後處理、電商圖片準備

    目錄結構:
    input_images/
    ├── photo1.jpg
    ├── photo2.jpg
    ├── photo3.jpg
    └── ...

    output_watermarked/
    ├── wm_photo1.jpg
    ├── wm_photo2.jpg
    ├── wm_photo3.jpg
    └── ...
    """)

    print("\n實際使用代碼:")
    print("""
    from watermark import WatermarkTool

    tool = WatermarkTool()

    # 批量添加文字浮水印
    outputs = tool.batch_watermark(
        input_dir='raw_photos/',
        output_dir='watermarked_photos/',
        watermark_type='text',
        text='© 2024 Studio',
        position='bottom-right',
        font_size=48,
        font_color=(255, 255, 255),
        opacity=0.7
    )

    print(f"已處理 {len(outputs)} 張圖片")

    # 批量添加 Logo 浮水印
    outputs = tool.batch_watermark(
        input_dir='products/',
        output_dir='products_with_logo/',
        watermark_type='image',
        watermark_path='logo.png',
        position='bottom-right',
        scale=0.15,
        opacity=0.8
    )

    print(f"已處理 {len(outputs)} 張產品圖")
    """)


def example_7_professional_workflow():
    """示例 7: 專業攝影工作流程"""
    print("\n" + "="*60)
    print("示例 7: 專業攝影工作流程")
    print("="*60)

    print("""
    場景: 攝影師編輯多張婚禮照片

    步驟:
    1. 創建工作目錄
    2. 添加攝影師署名
    3. 生成不同格式供不同用途
    4. 備份原始圖片
    """)

    print("""
    from pathlib import Path
    from watermark import WatermarkTool

    # 初始化
    tool = WatermarkTool()
    base_dir = Path('wedding_photos')

    # 創建輸出目錄
    (base_dir / 'processed').mkdir(exist_ok=True)
    (base_dir / 'with_signature').mkdir(exist_ok=True)
    (base_dir / 'for_print').mkdir(exist_ok=True)
    (base_dir / 'for_social').mkdir(exist_ok=True)

    # 列表所有原始圖片
    raw_images = list(base_dir.glob('raw/*.jpg'))

    for img in raw_images:
        print(f"處理: {img.name}")

        # 1. 基本版本 (透明署名)
        tool.add_text_watermark(
            input_path=str(img),
            output_path=str(base_dir / 'with_signature' / img.name),
            text='© John Photography',
            position='bottom-right',
            font_size=36,
            font_color=(255, 255, 255),
            opacity=0.6
        )

        # 2. 打印版本 (明顯署名)
        tool.add_border_watermark(
            input_path=str(img),
            output_path=str(base_dir / 'for_print' / img.name),
            text='© John Photography - john@example.com',
            border_height=60,
            bg_color=(0, 0, 0),
            text_color=(255, 255, 255),
            font_size=24
        )

        # 3. 社群媒體版本 (平鋪防盜)
        tool.add_tiled_watermark(
            input_path=str(img),
            output_path=str(base_dir / 'for_social' / img.name),
            text='INSTAGRAM @john_photography',
            spacing=250,
            opacity=0.08,
            angle=45,
            font_size=32
        )

    print(f"\\n完成! 共處理 {len(raw_images)} 張照片")
    """)


def example_8_ecommerce_workflow():
    """示例 8: 電商產品圖工作流程"""
    print("\n" + "="*60)
    print("示例 8: 電商產品圖工作流程")
    print("="*60)

    print("""
    場景: 準備線上店鋪的產品圖片

    需求:
    1. 添加店鋪 Logo
    2. 添加品牌標籤
    3. 標記限時優惠
    """)

    print("""
    from pathlib import Path
    from watermark import WatermarkTool

    tool = WatermarkTool()

    # 產品圖片目錄
    products_dir = Path('products/raw')
    output_dir = Path('products/final')
    output_dir.mkdir(exist_ok=True)

    # 遍歷所有產品圖片
    for product_img in products_dir.glob('*.jpg'):
        output_path = output_dir / product_img.name

        # Step 1: 添加 Logo (右下角)
        tool.add_image_watermark(
            input_path=str(product_img),
            output_path=str(output_path),
            watermark_path='logo.png',
            position='bottom-right',
            scale=0.12,
            opacity=0.85
        )

        # Step 2: 添加品牌標籤 (左上角)
        tool.add_text_watermark(
            input_path=str(output_path),
            output_path=str(output_path),
            text='Official Store',
            position='top-left',
            font_size=24,
            font_color=(255, 215, 0),  # 金色
            opacity=0.8
        )

        # Step 3: 對於特價商品，添加紅色標記
        if 'sale' in product_img.name.lower():
            output_sale = output_dir / f'sale_{product_img.name}'
            tool.add_border_watermark(
                input_path=str(output_path),
                output_path=str(output_sale),
                text='LIMITED TIME OFFER - 50% OFF',
                border_height=50,
                bg_color=(255, 0, 0),  # 紅色
                text_color=(255, 255, 255),  # 白色
                font_size=28
            )

    print("\\n電商產品圖片準備完成!")
    """)


def main():
    """執行所有示例"""
    print("\n" + "="*60)
    print("圖片浮水印 (Image Watermark) - 完整範例指南")
    print("="*60)

    examples = [
        ("1. 基本文字浮水印", example_1_text_watermark_basic),
        ("2. 進階文字浮水印", example_2_text_watermark_advanced),
        ("3. 圖片浮水印 (Logo)", example_3_image_watermark),
        ("4. 平鋪浮水印", example_4_tiled_watermark),
        ("5. 邊框浮水印", example_5_border_watermark),
        ("6. 批量處理", example_6_batch_processing),
        ("7. 攝影工作流程", example_7_professional_workflow),
        ("8. 電商工作流程", example_8_ecommerce_workflow),
    ]

    print("\n可用範例:")
    for name, _ in examples:
        print(f"  {name}")

    while True:
        print("\n" + "-"*60)
        choice = input("選擇範例 (1-8) 或 'all' 顯示全部，'q' 退出: ").strip().lower()

        if choice == 'q':
            print("\n謝謝使用!")
            break
        elif choice == 'all':
            for _, func in examples:
                func()
            print("\n" + "="*60)
            print("所有範例已顯示完成")
            print("="*60)
            break
        elif choice.isdigit() and 1 <= int(choice) <= len(examples):
            examples[int(choice)-1][1]()
        else:
            print("無效輸入，請重試")


if __name__ == "__main__":
    main()
