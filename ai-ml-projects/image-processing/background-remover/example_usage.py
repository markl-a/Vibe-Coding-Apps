"""
背景移除 - 完整使用範例
演示如何使用 BackgroundRemover 類別進行各種背景移除操作
"""

import sys
from pathlib import Path
from bg_remover import BackgroundRemover


def example_1_basic_removal():
    """示例 1: 基本背景移除 - 透明背景"""
    print("\n" + "="*60)
    print("示例 1: 基本背景移除 (透明背景)")
    print("="*60)

    remover = BackgroundRemover(model_name='u2net')

    # 使用說明
    print("""
    功能: 移除圖片背景，保留前景主體
    用途: 證件照、商品圖、人物抠圖等
    """)

    # 實際應用 (需要真實圖片)
    input_image = "sample.jpg"
    output_image = "output/sample_transparent.png"

    print(f"輸入圖片: {input_image}")
    print(f"輸出圖片: {output_image}")
    print("\n實際使用代碼:")
    print(f"""
    remover = BackgroundRemover()
    remover.remove_background(
        input_path='{input_image}',
        output_path='{output_image}'
    )
    """)


def example_2_custom_background():
    """示例 2: 替換背景為純色"""
    print("\n" + "="*60)
    print("示例 2: 替換背景為純色")
    print("="*60)

    remover = BackgroundRemover()

    print("""
    功能: 移除背景並填充自訂顏色
    用途: 製作證件照、商品圖、社群媒體頭像

    RGB 顏色範例:
    - (255, 255, 255) = 白色
    - (0, 0, 0) = 黑色
    - (255, 0, 0) = 紅色
    - (0, 255, 0) = 綠色
    - (0, 0, 255) = 藍色
    """)

    print("\n實際使用代碼:")
    print("""
    # 白色背景
    remover.remove_background(
        input_path='person.jpg',
        output_path='person_white_bg.jpg',
        bg_color=(255, 255, 255)  # 白色
    )

    # 藍色背景
    remover.remove_background(
        input_path='person.jpg',
        output_path='person_blue_bg.jpg',
        bg_color=(0, 102, 204)  # 藍色
    )

    # 使用 Alpha Matting 優化邊緣
    remover.remove_background(
        input_path='person.jpg',
        output_path='person_optimized.jpg',
        bg_color=(255, 255, 255),
        alpha_matting=True,
        alpha_matting_foreground_threshold=240,
        alpha_matting_background_threshold=10,
        alpha_matting_erode_size=10
    )
    """)


def example_3_blur_background():
    """示例 3: 模糊背景 (保留前景)"""
    print("\n" + "="*60)
    print("示例 3: 模糊背景效果")
    print("="*60)

    remover = BackgroundRemover()

    print("""
    功能: 保留前景，模糊背景
    用途: 製造景深效果，突出主體

    模糊強度參考:
    - 5-15: 輕度模糊
    - 15-35: 中度模糊
    - 35-50+: 強烈模糊
    """)

    print("\n實際使用代碼:")
    print("""
    # 輕度模糊
    remover.blur_background(
        input_path='photo.jpg',
        output_path='photo_blur_light.jpg',
        blur_strength=15
    )

    # 強烈模糊 (景深效果)
    remover.blur_background(
        input_path='photo.jpg',
        output_path='photo_blur_strong.jpg',
        blur_strength=45
    )
    """)


def example_4_replace_background():
    """示例 4: 替換為另一張圖片"""
    print("\n" + "="*60)
    print("示例 4: 替換背景圖片")
    print("="*60)

    remover = BackgroundRemover()

    print("""
    功能: 使用另一張圖片作為背景
    用途: 合成創意照片、虛擬背景、產品渲染

    背景調整模式:
    - 'stretch': 拉伸填滿 (可能變形)
    - 'cover': 覆蓋 (保持比例，可能裁切)
    - 'contain': 包含 (保持比例，可能有邊)
    """)

    print("\n實際使用代碼:")
    print("""
    # 覆蓋模式 (推薦，保持比例)
    remover.replace_background(
        input_path='person.jpg',
        background_path='beach.jpg',
        output_path='person_at_beach.jpg',
        resize_mode='cover'
    )

    # 拉伸模式 (填滿整個背景)
    remover.replace_background(
        input_path='product.jpg',
        background_path='office.jpg',
        output_path='product_in_office.jpg',
        resize_mode='stretch'
    )
    """)


def example_5_get_mask():
    """示例 5: 提取遮罩 (進階用法)"""
    print("\n" + "="*60)
    print("示例 5: 提取遮罩 (進階用法)")
    print("="*60)

    remover = BackgroundRemover()

    print("""
    功能: 獲取二進制遮罩，用於其他處理
    用途: 自訂合成、機器學習訓練、進階圖像處理

    遮罩說明:
    - 白色像素 (255): 前景主體
    - 黑色像素 (0): 背景
    """)

    print("\n實際使用代碼:")
    print("""
    import numpy as np

    # 提取遮罩
    mask = remover.get_mask(
        input_path='person.jpg',
        output_path='mask.png'  # 可選，保存遮罩
    )

    # 使用遮罩進行自訂處理
    print(f"遮罩尺寸: {mask.shape}")
    print(f"前景像素數量: {np.count_nonzero(mask)}")
    """)


def example_6_batch_processing():
    """示例 6: 批量處理"""
    print("\n" + "="*60)
    print("示例 6: 批量處理多張圖片")
    print("="*60)

    remover = BackgroundRemover()

    print("""
    功能: 一次處理多張圖片
    用途: 批量修圖、商品拍攝後處理、證件照製作

    目錄結構:
    input_images/
    ├── photo1.jpg
    ├── photo2.jpg
    ├── photo3.jpg
    └── ...
    """)

    print("\n實際使用代碼:")
    print("""
    # 批量移除背景 (透明)
    remover.batch_remove(
        input_dir='input_images/',
        output_dir='output_transparent/',
        bg_color=None  # None = 透明背景
    )

    # 批量替換為白色背景
    remover.batch_remove(
        input_dir='input_images/',
        output_dir='output_white/',
        bg_color=(255, 255, 255)
    )

    # 批量模糊背景
    remover.batch_remove(
        input_dir='input_images/',
        output_dir='output_blur/',
        blur=True,
        blur_strength=25
    )
    """)


def example_7_model_selection():
    """示例 7: 模型選擇"""
    print("\n" + "="*60)
    print("示例 7: 不同模型的選擇")
    print("="*60)

    print("""
    可用模型比較:

    1. 'u2net' (推薦)
       - 精度: ★★★★★ (最高)
       - 速度: ★★★☆☆
       - 用途: 通用場景，最佳效果

    2. 'u2netp' (輕量級)
       - 精度: ★★★★☆
       - 速度: ★★★★★ (最快)
       - 用途: 快速處理，低硬體要求

    3. 'u2net_human_seg' (人物分割)
       - 精度: ★★★★★ (人物)
       - 速度: ★★★☆☆
       - 用途: 專門分割人物

    4. 'u2net_cloth_seg' (衣物分割)
       - 精度: ★★★★☆ (衣物)
       - 速度: ★★★☆☆
       - 用途: 衣物分割、時尚應用
    """)

    print("\n實際使用代碼:")
    print("""
    # 快速處理 (輕量級模型)
    remover = BackgroundRemover(model_name='u2netp')
    remover.remove_background('photo.jpg', 'output_fast.png')

    # 高精度人物分割
    remover = BackgroundRemover(model_name='u2net_human_seg')
    remover.remove_background('person.jpg', 'person_clean.png')

    # 衣物分割
    remover = BackgroundRemover(model_name='u2net_cloth_seg')
    remover.remove_background('clothing.jpg', 'cloth_segmented.png')
    """)


def example_8_complete_workflow():
    """示例 8: 完整工作流程"""
    print("\n" + "="*60)
    print("示例 8: 完整工作流程")
    print("="*60)

    print("""
    完整電商場景範例:
    """)

    print("""
    from bg_remover import BackgroundRemover
    from pathlib import Path

    # 初始化
    remover = BackgroundRemover(model_name='u2net')

    # 創建輸出目錄
    Path('products/processed').mkdir(parents=True, exist_ok=True)

    # 1. 基本處理 (透明背景)
    print("步驟 1: 移除背景...")
    remover.remove_background(
        'products/raw/item.jpg',
        'products/processed/item_transparent.png'
    )

    # 2. 製作電商圖 (白色背景)
    print("步驟 2: 製作電商圖...")
    remover.remove_background(
        'products/raw/item.jpg',
        'products/processed/item_white.jpg',
        bg_color=(255, 255, 255),
        alpha_matting=True
    )

    # 3. 製作社群媒體圖片 (模糊背景)
    print("步驟 3: 製作社群媒體圖...")
    remover.blur_background(
        'products/raw/item.jpg',
        'products/processed/item_blur.jpg',
        blur_strength=35
    )

    print("\\n完成! 所有圖片已處理。")
    """)


def main():
    """執行所有示例"""
    print("\n" + "="*60)
    print("背景移除 (Background Remover) - 完整範例指南")
    print("="*60)

    examples = [
        ("1. 基本背景移除", example_1_basic_removal),
        ("2. 純色背景", example_2_custom_background),
        ("3. 模糊背景", example_3_blur_background),
        ("4. 替換背景", example_4_replace_background),
        ("5. 提取遮罩", example_5_get_mask),
        ("6. 批量處理", example_6_batch_processing),
        ("7. 模型選擇", example_7_model_selection),
        ("8. 完整工作流", example_8_complete_workflow),
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
