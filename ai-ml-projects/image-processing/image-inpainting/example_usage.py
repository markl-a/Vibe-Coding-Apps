"""
Image Inpainting - Example Usage
圖像修復與補全使用示例
"""
from inpainting import ImageInpainting
from PIL import Image, ImageDraw
import numpy as np
import cv2
import os


def create_test_image_and_mask():
    """創建測試圖像和遮罩"""
    # 創建測試圖像（彩色漸變）
    width, height = 400, 300
    image = np.zeros((height, width, 3), dtype=np.uint8)

    for y in range(height):
        for x in range(width):
            image[y, x] = [
                int(255 * x / width),      # R
                int(255 * y / height),     # G
                128                          # B
            ]

    # 添加一些圖案
    cv2.circle(image, (100, 100), 50, (255, 255, 0), -1)
    cv2.rectangle(image, (250, 150), (350, 250), (0, 255, 255), -1)

    # 創建遮罩（中間有一個矩形區域需要修復）
    mask = np.zeros((height, width), dtype=np.uint8)
    cv2.rectangle(mask, (150, 100), (250, 200), 255, -1)

    # 保存
    cv2.imwrite('test_image.jpg', image)
    cv2.imwrite('test_mask.png', mask)

    return 'test_image.jpg', 'test_mask.png'


def example_1_basic_inpainting():
    """示例1：基本圖像修復"""
    print("\n" + "="*60)
    print("示例1：基本圖像修復 (Telea 算法)")
    print("="*60)

    # 創建測試圖像
    image_path, mask_path = create_test_image_and_mask()

    # 初始化修復處理器
    inpainter = ImageInpainting(method='telea')

    # 執行修復
    inpainter.inpaint(image_path, mask_path, 'result_telea.jpg')

    print("✓ 圖像修復完成")
    print(f"  輸入: {image_path}")
    print(f"  遮罩: {mask_path}")
    print(f"  輸出: result_telea.jpg")


def example_2_different_methods():
    """示例2：比較不同修復方法"""
    print("\n" + "="*60)
    print("示例2：比較不同修復方法 (Telea vs NS)")
    print("="*60)

    image_path, mask_path = create_test_image_and_mask()

    methods = ['telea', 'ns']

    for method in methods:
        inpainter = ImageInpainting(method=method)
        output_file = f'result_{method}.jpg'
        inpainter.inpaint(image_path, mask_path, output_file)

        print(f"✓ {method.upper()} 方法完成")
        print(f"  輸出: {output_file}")


def example_3_remove_object():
    """示例3：移除圖像中的物件"""
    print("\n" + "="*60)
    print("示例3：移除圖像中的物件")
    print("="*60)

    # 創建帶物件的測試圖像
    image = np.ones((300, 400, 3), dtype=np.uint8) * 200

    # 添加"物件"（紅色圓圈）
    cv2.circle(image, (200, 150), 50, (0, 0, 255), -1)

    cv2.imwrite('test_with_object.jpg', image)

    # 創建物件遮罩
    mask = np.zeros((300, 400), dtype=np.uint8)
    cv2.circle(mask, (200, 150), 52, 255, -1)  # 稍大一點確保覆蓋
    cv2.imwrite('object_mask.png', mask)

    # 移除物件
    inpainter = ImageInpainting(method='telea')
    output_path = inpainter.remove_object(
        'test_with_object.jpg',
        'object_mask.png',
        'result_removed.jpg'
    )

    print("✓ 物件已移除")
    print(f"  輸出: {output_path}")


def example_4_remove_watermark():
    """示例4：移除浮水印"""
    print("\n" + "="*60)
    print("示例4：移除浮水印")
    print("="*60)

    # 創建帶浮水印的圖像
    image = np.random.randint(100, 200, (300, 400, 3), dtype=np.uint8)

    # 添加"浮水印"
    cv2.putText(
        image,
        'WATERMARK',
        (120, 150),
        cv2.FONT_HERSHEY_SIMPLEX,
        1.5,
        (255, 255, 255),
        3
    )

    cv2.imwrite('test_watermarked.jpg', image)

    # 移除浮水印
    inpainter = ImageInpainting(method='ns')
    output_path = inpainter.remove_watermark(
        'test_watermarked.jpg',
        watermark_region=(110, 120, 280, 60),  # (x, y, width, height)
        output_path='result_no_watermark.jpg'
    )

    print("✓ 浮水印已移除")
    print(f"  浮水印區域: (110, 120, 280, 60)")
    print(f"  輸出: {output_path}")


def example_5_create_mask_from_color():
    """示例5：從特定顏色創建遮罩"""
    print("\n" + "="*60)
    print("示例5：從特定顏色創建遮罩")
    print("="*60)

    # 創建帶特定顏色區域的圖像
    image = np.random.randint(0, 128, (300, 400, 3), dtype=np.uint8)

    # 添加綠色區域
    cv2.rectangle(image, (150, 100), (250, 200), (0, 255, 0), -1)

    cv2.imwrite('test_green_area.jpg', image)

    # 從綠色創建遮罩
    inpainter = ImageInpainting()
    mask = inpainter.create_mask_from_color(
        'test_green_area.jpg',
        color=(0, 255, 0),
        tolerance=20,
        output_path='green_mask.png'
    )

    print("✓ 從綠色區域創建遮罩")
    print(f"  檢測到 {np.sum(mask > 0)} 個像素")
    print(f"  遮罩保存至: green_mask.png")

    # 修復綠色區域
    inpainter.inpaint('test_green_area.jpg', 'green_mask.png', 'result_no_green.jpg')
    print("✓ 綠色區域已修復")


def example_6_create_mask_from_selection():
    """示例6：從選擇區域創建遮罩"""
    print("\n" + "="*60)
    print("示例6：從選擇區域創建遮罩")
    print("="*60)

    image_path, _ = create_test_image_and_mask()

    # 定義多個要修復的區域
    regions = [
        (50, 50, 100, 80),    # 區域1
        (250, 150, 100, 80),  # 區域2
    ]

    inpainter = ImageInpainting()
    mask = inpainter.create_mask_from_selection(
        image_path,
        regions,
        output_path='selection_mask.png'
    )

    print("✓ 從選擇區域創建遮罩")
    print(f"  區域數量: {len(regions)}")
    for i, (x, y, w, h) in enumerate(regions, 1):
        print(f"    區域{i}: ({x}, {y}, {w}, {h})")

    # 修復選擇區域
    inpainter.inpaint(image_path, 'selection_mask.png', 'result_selection.jpg')
    print("✓ 選擇區域已修復")


def example_7_batch_inpainting():
    """示例7：批量修復"""
    print("\n" + "="*60)
    print("示例7：批量修復多張圖像")
    print("="*60)

    # 創建測試目錄和圖像
    os.makedirs('test_batch_images', exist_ok=True)
    os.makedirs('test_batch_masks', exist_ok=True)

    for i in range(3):
        # 創建圖像
        image = np.random.randint(0, 255, (200, 200, 3), dtype=np.uint8)
        cv2.imwrite(f'test_batch_images/image_{i+1}.jpg', image)

        # 創建對應遮罩
        mask = np.zeros((200, 200), dtype=np.uint8)
        cv2.circle(mask, (100, 100), 30 + i*10, 255, -1)
        cv2.imwrite(f'test_batch_masks/image_{i+1}.jpg', mask)

    # 批量處理
    inpainter = ImageInpainting(method='telea')
    output_files = inpainter.batch_inpaint(
        'test_batch_images',
        'test_batch_masks',
        'test_batch_output'
    )

    print(f"✓ 批量處理完成，處理了 {len(output_files)} 張圖像")
    for f in output_files:
        print(f"  - {f}")


def example_8_restore_old_photo():
    """示例8：修復老照片（模擬劃痕）"""
    print("\n" + "="*60)
    print("示例8：修復老照片（自動檢測劃痕）")
    print("="*60)

    # 創建模擬老照片（帶劃痕）
    image = np.random.randint(100, 150, (300, 400, 3), dtype=np.uint8)

    # 添加"劃痕"（白線）
    for i in range(5):
        x = np.random.randint(0, 400)
        cv2.line(image, (x, 0), (x, 300), (255, 255, 255), 2)

    cv2.imwrite('old_photo.jpg', image)

    # 自動檢測和修復劃痕
    inpainter = ImageInpainting(method='ns')
    output_path = inpainter.restore_old_photo(
        'old_photo.jpg',
        scratch_threshold=200,
        output_path='restored_photo.jpg'
    )

    print("✓ 老照片修復完成")
    print(f"  輸入: old_photo.jpg")
    print(f"  輸出: {output_path}")


def example_9_compare_all_methods():
    """示例9：比較所有可用方法"""
    print("\n" + "="*60)
    print("示例9：比較所有修復方法")
    print("="*60)

    image_path, mask_path = create_test_image_and_mask()

    inpainter = ImageInpainting()
    results = inpainter.compare_methods(
        image_path,
        mask_path,
        output_dir='method_comparison'
    )

    print(f"\n✓ 比較完成，生成了 {len(results)} 個結果")
    print("  結果保存在 method_comparison/ 目錄")


def example_10_large_area_inpainting():
    """示例10：大面積修復"""
    print("\n" + "="*60)
    print("示例10：大面積修復測試")
    print("="*60)

    # 創建圖像
    image = np.random.randint(50, 200, (400, 600, 3), dtype=np.uint8)

    # 添加大面積缺失（模擬撕裂）
    cv2.rectangle(image, (200, 100), (400, 300), (0, 0, 0), -1)

    cv2.imwrite('large_damage.jpg', image)

    # 創建遮罩
    mask = np.zeros((400, 600), dtype=np.uint8)
    cv2.rectangle(mask, (200, 100), (400, 300), 255, -1)
    cv2.imwrite('large_damage_mask.png', mask)

    # 修復
    inpainter = ImageInpainting(method='ns')
    inpainter.inpaint('large_damage.jpg', 'large_damage_mask.png', 'result_large_repair.jpg')

    print("✓ 大面積修復完成")
    print("  缺失區域大小: 200x200 像素")
    print("  輸出: result_large_repair.jpg")


def cleanup_test_files():
    """清理測試文件"""
    import glob
    import shutil

    print("\n" + "="*60)
    print("清理測試文件")
    print("="*60)

    # 刪除測試文件
    patterns = [
        'test_*.jpg', 'test_*.png',
        'result_*.jpg', 'result_*.png',
        'old_photo.jpg', 'restored_photo.jpg',
        '*_mask.png', 'large_damage*.jpg'
    ]

    for pattern in patterns:
        for f in glob.glob(pattern):
            try:
                os.remove(f)
                print(f"✓ 已刪除: {f}")
            except Exception as e:
                print(f"✗ 無法刪除 {f}: {e}")

    # 刪除測試目錄
    dirs = [
        'test_batch_images', 'test_batch_masks', 'test_batch_output',
        'method_comparison', 'comparison'
    ]

    for d in dirs:
        if os.path.exists(d):
            try:
                shutil.rmtree(d)
                print(f"✓ 已刪除目錄: {d}")
            except Exception as e:
                print(f"✗ 無法刪除目錄 {d}: {e}")


def main():
    """主函數"""
    examples = {
        '1': ('基本圖像修復', example_1_basic_inpainting),
        '2': ('比較不同方法', example_2_different_methods),
        '3': ('移除物件', example_3_remove_object),
        '4': ('移除浮水印', example_4_remove_watermark),
        '5': ('從顏色創建遮罩', example_5_create_mask_from_color),
        '6': ('從選擇區域創建遮罩', example_6_create_mask_from_selection),
        '7': ('批量修復', example_7_batch_inpainting),
        '8': ('修復老照片', example_8_restore_old_photo),
        '9': ('比較所有方法', example_9_compare_all_methods),
        '10': ('大面積修復', example_10_large_area_inpainting),
    }

    print("\n" + "="*60)
    print("圖像修復與補全 - 使用示例")
    print("="*60)
    print("\n可用示例:")
    for key, (desc, _) in examples.items():
        print(f"  {key}. {desc}")
    print("  all. 運行所有示例")
    print("  clean. 清理測試文件")
    print("  q. 退出")

    while True:
        choice = input("\n選擇示例 (1-10, all, clean, q): ").strip().lower()

        if choice == 'q':
            print("退出程序")
            break
        elif choice == 'all':
            for desc, func in examples.values():
                func()
        elif choice == 'clean':
            cleanup_test_files()
        elif choice in examples:
            desc, func = examples[choice]
            func()
        else:
            print("無效選擇，請重試")

    print("\n感謝使用！")


if __name__ == "__main__":
    main()
