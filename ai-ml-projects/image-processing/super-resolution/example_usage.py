"""
Image Super Resolution - Example Usage
圖像超分辨率使用示例
"""
from super_resolution import SuperResolution
from PIL import Image
import numpy as np
import os


def example_1_basic_upscale():
    """示例1：基本圖像放大"""
    print("\n" + "="*60)
    print("示例1：基本圖像放大 (2x)")
    print("="*60)

    # 創建測試圖像
    test_img = np.random.randint(0, 255, (100, 100, 3), dtype=np.uint8)
    Image.fromarray(test_img).save('test_input.jpg')

    # 初始化超分辨率處理器
    sr = SuperResolution(model_type='bicubic', scale_factor=2)

    # 執行超分辨率
    sr.upscale('test_input.jpg', 'test_output_2x.jpg')

    print("✓ 圖像已放大2倍")
    print("  輸入: 100x100 -> 輸出: 200x200")
    print("  保存至: test_output_2x.jpg")


def example_2_different_scales():
    """示例2：不同放大倍數"""
    print("\n" + "="*60)
    print("示例2：不同放大倍數 (2x, 3x, 4x)")
    print("="*60)

    # 創建測試圖像
    test_img = np.random.randint(0, 255, (100, 100, 3), dtype=np.uint8)
    Image.fromarray(test_img).save('test_input.jpg')

    scales = [2, 3, 4]

    for scale in scales:
        sr = SuperResolution(model_type='bicubic', scale_factor=scale)
        output_file = f'test_output_{scale}x.jpg'
        sr.upscale('test_input.jpg', output_file)

        print(f"✓ {scale}x 放大完成")
        print(f"  輸入: 100x100 -> 輸出: {100*scale}x{100*scale}")
        print(f"  保存至: {output_file}")


def example_3_batch_processing():
    """示例3：批量處理"""
    print("\n" + "="*60)
    print("示例3：批量處理多張圖像")
    print("="*60)

    # 創建測試目錄和圖像
    os.makedirs('test_images', exist_ok=True)

    for i in range(3):
        test_img = np.random.randint(0, 255, (100, 100, 3), dtype=np.uint8)
        Image.fromarray(test_img).save(f'test_images/image_{i+1}.jpg')

    # 批量處理
    sr = SuperResolution(model_type='bicubic', scale_factor=2)
    output_files = sr.batch_upscale('test_images', 'test_images_sr')

    print(f"✓ 批量處理完成，處理了 {len(output_files)} 張圖像")
    for f in output_files:
        print(f"  - {f}")


def example_4_compare_before_after():
    """示例4：比較前後效果"""
    print("\n" + "="*60)
    print("示例4：比較原圖與超分辨率後的圖像")
    print("="*60)

    # 創建測試圖像
    test_img = np.random.randint(0, 255, (100, 100, 3), dtype=np.uint8)
    Image.fromarray(test_img).save('test_input.jpg')

    # 讀取原圖
    original = Image.open('test_input.jpg')
    print(f"原圖尺寸: {original.size}")

    # 執行超分辨率
    sr = SuperResolution(model_type='bicubic', scale_factor=2)
    sr.upscale('test_input.jpg', 'test_output.jpg')

    # 讀取結果
    result = Image.open('test_output.jpg')
    print(f"結果尺寸: {result.size}")
    print(f"放大倍數: {result.size[0] / original.size[0]:.1f}x")


def example_5_pil_image_processing():
    """示例5：使用 PIL Image 對象"""
    print("\n" + "="*60)
    print("示例5：直接處理 PIL Image 對象")
    print("="*60)

    # 創建 PIL Image
    test_img = np.random.randint(0, 255, (100, 100, 3), dtype=np.uint8)
    pil_img = Image.fromarray(test_img)
    print(f"原始圖像尺寸: {pil_img.size}")

    # 注意：這個功能需要完善
    print("提示：PIL Image 處理功能正在開發中")
    print("目前建議先保存為文件再處理")


def example_6_quality_comparison():
    """示例6：不同方法質量比較"""
    print("\n" + "="*60)
    print("示例6：比較不同超分辨率方法")
    print("="*60)

    # 創建測試圖像
    test_img = np.random.randint(0, 255, (100, 100, 3), dtype=np.uint8)
    Image.fromarray(test_img).save('test_input.jpg')

    methods = ['bicubic']  # 可擴展: 'espcn', 'srcnn', 'opencv'

    for method in methods:
        try:
            sr = SuperResolution(model_type=method, scale_factor=2)
            output_file = f'test_output_{method}.jpg'
            sr.upscale('test_input.jpg', output_file)
            print(f"✓ {method.upper()} 方法完成")
        except Exception as e:
            print(f"✗ {method.upper()} 方法失敗: {e}")


def example_7_high_resolution_output():
    """示例7：生成高分辨率輸出"""
    print("\n" + "="*60)
    print("示例7：從小圖生成高分辨率輸出")
    print("="*60)

    # 創建小尺寸測試圖像
    small_img = np.random.randint(0, 255, (50, 50, 3), dtype=np.uint8)
    Image.fromarray(small_img).save('test_small.jpg')

    # 多次放大
    sr_2x = SuperResolution(model_type='bicubic', scale_factor=2)
    sr_4x = SuperResolution(model_type='bicubic', scale_factor=4)

    sr_2x.upscale('test_small.jpg', 'test_medium.jpg')
    sr_4x.upscale('test_small.jpg', 'test_large.jpg')

    print("✓ 多分辨率輸出生成完成")
    print("  小圖: 50x50")
    print("  中圖 (2x): 100x100")
    print("  大圖 (4x): 200x200")


def example_8_preserve_details():
    """示例8：細節保留測試"""
    print("\n" + "="*60)
    print("示例8：測試細節保留能力")
    print("="*60)

    # 創建帶細節的測試圖像（棋盤格）
    size = 100
    detail_img = np.zeros((size, size, 3), dtype=np.uint8)

    # 創建棋盤格圖案
    square_size = 10
    for i in range(0, size, square_size):
        for j in range(0, size, square_size):
            if (i // square_size + j // square_size) % 2 == 0:
                detail_img[i:i+square_size, j:j+square_size] = [255, 255, 255]

    Image.fromarray(detail_img).save('test_checkerboard.jpg')

    # 執行超分辨率
    sr = SuperResolution(model_type='bicubic', scale_factor=2)
    sr.upscale('test_checkerboard.jpg', 'test_checkerboard_sr.jpg')

    print("✓ 棋盤格圖案超分辨率完成")
    print("  可以比較原圖和結果圖的邊緣銳度")


def cleanup_test_files():
    """清理測試文件"""
    import glob
    import shutil

    print("\n" + "="*60)
    print("清理測試文件")
    print("="*60)

    # 刪除測試文件
    patterns = ['test_*.jpg', 'test_*.png']
    for pattern in patterns:
        for f in glob.glob(pattern):
            try:
                os.remove(f)
                print(f"✓ 已刪除: {f}")
            except Exception as e:
                print(f"✗ 無法刪除 {f}: {e}")

    # 刪除測試目錄
    dirs = ['test_images', 'test_images_sr', 'comparison']
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
        '1': ('基本圖像放大', example_1_basic_upscale),
        '2': ('不同放大倍數', example_2_different_scales),
        '3': ('批量處理', example_3_batch_processing),
        '4': ('比較前後效果', example_4_compare_before_after),
        '5': ('PIL Image 處理', example_5_pil_image_processing),
        '6': ('質量比較', example_6_quality_comparison),
        '7': ('高分辨率輸出', example_7_high_resolution_output),
        '8': ('細節保留測試', example_8_preserve_details),
    }

    print("\n" + "="*60)
    print("圖像超分辨率 - 使用示例")
    print("="*60)
    print("\n可用示例:")
    for key, (desc, _) in examples.items():
        print(f"  {key}. {desc}")
    print("  all. 運行所有示例")
    print("  clean. 清理測試文件")
    print("  q. 退出")

    while True:
        choice = input("\n選擇示例 (1-8, all, clean, q): ").strip().lower()

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
