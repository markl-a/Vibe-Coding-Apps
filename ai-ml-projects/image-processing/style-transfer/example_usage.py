"""
圖像風格轉換 - 完整使用範例
演示如何使用 StyleTransfer 進行神經網路風格轉換
"""

from pathlib import Path
from style_transfer import StyleTransfer


def example_1_basic_style_transfer():
    """示例 1: 基本風格轉換"""
    print("\n" + "="*60)
    print("示例 1: 基本風格轉換")
    print("="*60)

    print("""
    功能: 將一張圖片的風格應用到另一張圖片
    用途: 藝術化處理、創意編輯、圖像風格化

    工作原理:
    1. 提取內容圖片的結構
    2. 提取風格圖片的紋理和色彩
    3. 通過神經網路優化，合併兩者

    時間預計:
    - 低解析度 (256x256): 2-5 分鐘
    - 中解析度 (512x512): 5-15 分鐘
    - 高解析度 (1024x1024): 15-30 分鐘
    """)

    print("\n實際使用代碼:")
    print("""
    from style_transfer import StyleTransfer

    # 初始化 (會載入 VGG19 模型，首次較慢)
    transfer = StyleTransfer()

    # 執行風格轉換
    transfer.transfer_style(
        content_image='photo.jpg',        # 內容圖片
        style_image='style.jpg',          # 風格圖片
        output_path='output.jpg',         # 輸出路徑
        num_steps=300,                    # 優化步數 (越多越好，但越慢)
        style_weight=1e6,                 # 風格權重 (越大越明顯)
        content_weight=1,                 # 內容權重
        learning_rate=0.01,               # 學習率
        max_size=512,                     # 最大圖像尺寸
        verbose=True                      # 顯示進度
    )

    print("風格轉換完成!")
    """)


def example_2_parameter_tuning():
    """示例 2: 參數調整"""
    print("\n" + "="*60)
    print("示例 2: 參數調整與效果控制")
    print("="*60)

    print("""
    關鍵參數說明:

    1. num_steps (優化步數)
       - 100-200: 快速預覽
       - 300-500: 平衡效果 (推薦)
       - 500+: 高質量結果 (耗時)

    2. style_weight (風格權重)
       - 1e4: 輕度風格化
       - 1e5: 中度風格化
       - 1e6: 強烈風格化 (推薦)
       - 1e7+: 非常強烈 (可能失去內容)

    3. content_weight (內容權重)
       - 預設 1.0 (保留原始內容)
       - 增大值: 更保留原始內容
       - 減小值: 更強調風格

    4. learning_rate (學習率)
       - 0.01: 保守 (安全，較慢)
       - 0.05: 平衡
       - 0.1+: 激進 (快速但可能不穩定)

    5. max_size (圖像尺寸)
       - 256: 快速預覽
       - 512: 默認平衡
       - 1024+: 高質量 (需要更多顯存)
    """)

    print("\n實際使用代碼:")
    print("""
    from style_transfer import StyleTransfer

    transfer = StyleTransfer()

    # 快速預覽 (低解析度，步數少)
    transfer.transfer_style(
        content_image='photo.jpg',
        style_image='style.jpg',
        output_path='preview.jpg',
        num_steps=100,              # 少步數
        style_weight=1e5,           # 中等風格
        max_size=256,               # 低解析度
        verbose=True
    )

    # 高質量結果 (高解析度，步數多)
    transfer.transfer_style(
        content_image='photo.jpg',
        style_image='style.jpg',
        output_path='high_quality.jpg',
        num_steps=500,              # 多步數
        style_weight=1e6,           # 強風格
        max_size=768,               # 高解析度
        verbose=True
    )

    # 保留更多原始內容
    transfer.transfer_style(
        content_image='photo.jpg',
        style_image='style.jpg',
        output_path='content_focused.jpg',
        num_steps=300,
        style_weight=1e5,           # 較低風格權重
        content_weight=5,           # 較高內容權重
        verbose=True
    )

    # 強烈藝術效果
    transfer.transfer_style(
        content_image='photo.jpg',
        style_image='style.jpg',
        output_path='artistic.jpg',
        num_steps=500,
        style_weight=1e7,           # 極高風格權重
        content_weight=0.5,         # 較低內容權重
        verbose=True
    )
    """)


def example_3_style_selection():
    """示例 3: 不同風格選擇"""
    print("\n" + "="*60)
    print("示例 3: 不同風格圖片的選擇")
    print("="*60)

    print("""
    風格圖片的特點:

    1. 繪畫風格
       - 梵高《星夜》: 漩渦狀筆觸，藍黃配色
       - 莫內風格: 印象派，柔和光線
       - 立體主義: 碎片化，多角度視角

    2. 照片風格
       - 黑白照片: 沈穩感
       - 復古照片: 褪色色調
       - 高對比照片: 戲劇效果

    3. 紋理風格
       - 磨石紋理: 粗糙感
       - 布料紋理: 柔和感
       - 金屬紋理: 冷硬感

    建議:
    - 選擇色彩豐富的風格圖片
    - 選擇紋理明顯的圖片
    - 風格圖片的尺寸要合適 (不要過小)
    """)

    print("\n實際使用代碼:")
    print("""
    from style_transfer import StyleTransfer

    transfer = StyleTransfer()

    # 油畫風格
    transfer.transfer_style(
        content_image='photo.jpg',
        style_image='oil_painting.jpg',
        output_path='oil_style.jpg',
        num_steps=300
    )

    # 印象派風格
    transfer.transfer_style(
        content_image='photo.jpg',
        style_image='impressionist.jpg',
        output_path='impressionist_style.jpg',
        num_steps=350
    )

    # 水彩風格
    transfer.transfer_style(
        content_image='photo.jpg',
        style_image='watercolor.jpg',
        output_path='watercolor_style.jpg',
        num_steps=300
    )

    # 現代藝術風格
    transfer.transfer_style(
        content_image='photo.jpg',
        style_image='abstract.jpg',
        output_path='abstract_style.jpg',
        num_steps=400
    )

    # 復古風格
    transfer.transfer_style(
        content_image='photo.jpg',
        style_image='vintage_photo.jpg',
        output_path='vintage_style.jpg',
        num_steps=300
    )
    """)


def example_4_different_content():
    """示例 4: 不同內容圖片"""
    print("\n" + "="*60)
    print("示例 4: 應用同一風格到不同內容")
    print("="*60)

    print("""
    用途: 批量風格化、創意對比、藝術創作

    說明:
    1. 選定一個風格圖片
    2. 將其應用到多個內容圖片
    3. 產生系列作品

    應用場景:
    - 將多張人物照轉換為油畫
    - 將風景照轉換為特定藝術風格
    - 為相冊添加統一藝術風格
    """)

    print("\n實際使用代碼:")
    print("""
    from style_transfer import StyleTransfer
    from pathlib import Path

    transfer = StyleTransfer()

    # 選定風格
    style_image = 'van_gogh_starry_night.jpg'

    # 內容圖片列表
    content_images = [
        'photo1.jpg',
        'photo2.jpg',
        'photo3.jpg',
        'portrait.jpg',
        'landscape.jpg'
    ]

    # 為每個內容圖片應用風格
    for content_img in content_images:
        output_name = f'stylized_{Path(content_img).stem}.jpg'

        print(f"處理: {content_img} -> {output_name}")

        transfer.transfer_style(
            content_image=content_img,
            style_image=style_image,
            output_path=output_name,
            num_steps=300,
            style_weight=1e6,
            verbose=False  # 不顯示每個步驟
        )

    print("\\n所有圖片已風格化完成!")
    """)


def example_5_batch_processing():
    """示例 5: 批量風格轉換"""
    print("\n" + "="*60)
    print("示例 5: 批量風格轉換")
    print("="*60)

    print("""
    功能: 使用預設風格或批量處理
    用途: 批量編輯、快速製作

    目錄結構:
    content_images/
    ├── photo1.jpg
    ├── photo2.jpg
    └── ...

    output_images/
    ├── stylized_photo1.jpg
    ├── stylized_photo2.jpg
    └── ...
    """)

    print("\n實際使用代碼:")
    print("""
    from style_transfer import StyleTransfer
    from pathlib import Path

    transfer = StyleTransfer()

    # 批量轉換
    outputs = transfer.batch_transfer(
        content_dir='content_images/',
        style_image='style.jpg',
        output_dir='stylized_output/',
        num_steps=200,              # 較少步數以節省時間
        style_weight=1e6,
        max_size=512
    )

    print(f"已處理 {len(outputs)} 個圖片")
    for output in outputs:
        print(f"  - {output}")
    """)


def example_6_optimization_tips():
    """示例 6: 優化技巧"""
    print("\n" + "="*60)
    print("示例 6: 性能優化技巧")
    print("="*60)

    print("""
    加快速度的方法:

    1. 減小圖像尺寸
       - 從 512 減至 256
       - 可將時間減半

    2. 減少優化步數
       - 從 300 減至 100-150
       - 快速預覽足夠

    3. 調整權重
       - 降低 style_weight
       - 提高 learning_rate

    4. 使用 GPU
       - 檢查 CUDA 可用性
       - GPU 可快 10-50 倍

    5. 分批處理
       - 多個圖片分批進行
       - 避免內存溢出

    提高質量的方法:

    1. 增加步數
       - 從 300 增至 500-1000
       - 效果更細緻

    2. 提高解析度
       - 從 512 增至 1024
       - 細節更豐富

    3. 調整參數
       - 微調 style_weight
       - 平衡內容和風格

    4. 選擇好的風格圖
       - 高質量的風格圖片
       - 明顯的紋理特徵

    5. 多次疊加
       - 先轉換後再轉換
       - 疊加多種風格
    """)

    print("\n實際使用代碼:")
    print("""
    from style_transfer import StyleTransfer

    transfer = StyleTransfer()

    # 快速預覽模式
    transfer.transfer_style(
        content_image='photo.jpg',
        style_image='style.jpg',
        output_path='quick_preview.jpg',
        num_steps=100,
        max_size=256,
        verbose=False
    )

    # 高質量模式 (需時較長)
    transfer.transfer_style(
        content_image='photo.jpg',
        style_image='style.jpg',
        output_path='high_quality.jpg',
        num_steps=800,
        max_size=1024,
        style_weight=1e6,
        verbose=True
    )

    # 風格疊加 (先轉 A，再轉 B)
    # 第一次轉換
    transfer.transfer_style(
        content_image='photo.jpg',
        style_image='style1.jpg',
        output_path='intermediate.jpg',
        num_steps=200
    )

    # 第二次轉換
    transfer.transfer_style(
        content_image='intermediate.jpg',
        style_image='style2.jpg',
        output_path='double_style.jpg',
        num_steps=200
    )
    """)


def example_7_device_selection():
    """示例 7: 裝置選擇 (GPU/CPU)"""
    print("\n" + "="*60)
    print("示例 7: 裝置選擇與性能")
    print("="*60)

    print("""
    裝置選擇:

    1. GPU (CUDA)
       - 速度: 10-50 倍快
       - 要求: NVIDIA GPU + CUDA
       - 推薦用於生產

    2. CPU
       - 速度: 較慢 (1-5 分鐘)
       - 優勢: 兼容性好
       - 推薦用於小規模

    檢查裝置:
    """)

    print("\n實際使用代碼:")
    print("""
    import torch
    from style_transfer import StyleTransfer

    # 檢查 GPU 可用性
    print(f"CUDA 可用: {torch.cuda.is_available()}")
    if torch.cuda.is_available():
        print(f"GPU 名稱: {torch.cuda.get_device_name(0)}")
        print(f"GPU 顯存: {torch.cuda.get_device_properties(0).total_memory / 1e9:.2f} GB")

    # 使用 GPU (自動檢測)
    transfer_gpu = StyleTransfer(device='cuda')

    # 強制使用 CPU
    transfer_cpu = StyleTransfer(device='cpu')

    # 執行轉換
    transfer_gpu.transfer_style(
        content_image='photo.jpg',
        style_image='style.jpg',
        output_path='gpu_output.jpg',
        num_steps=300
    )
    """)


def example_8_creative_applications():
    """示例 8: 創意應用"""
    print("\n" + "="*60)
    print("示例 8: 創意應用案例")
    print("="*60)

    print("""
    應用場景:

    1. 照片藝術化
       - 旅遊照片轉換為油畫
       - 人物照片轉換為水彩畫
       - 風景照轉換為印象派風格

    2. 內容創作
       - YouTube 視頻缩圖
       - 社群媒體內容
       - 廣告素材

    3. 遊戲開發
       - 遊戲美術風格轉換
       - 紋理生成
       - 環境設計參考

    4. 電影製作
       - 視覺效果參考
       - 色彩分級靈感
       - 藝術方向

    5. 時尚設計
       - 服裝圖案設計
       - 色彩搭配參考
       - 面料紋理

    6. 藝術教育
       - 大師畫風學習
       - 創意啟蒙
       - 藝術風格演示
    """)

    print("\n實際使用代碼:")
    print("""
    from style_transfer import StyleTransfer
    from pathlib import Path

    transfer = StyleTransfer()

    # 應用 1: 婚禮相冊藝術化
    wedding_photos = Path('wedding_photos')
    output_dir = Path('wedding_artistic')
    output_dir.mkdir(exist_ok=True)

    for photo in wedding_photos.glob('*.jpg'):
        transfer.transfer_style(
            content_image=str(photo),
            style_image='romantic_painting.jpg',
            output_path=str(output_dir / f'art_{photo.name}'),
            num_steps=250
        )

    # 應用 2: 旅遊照片合集
    trip_photos = [
        ('beach.jpg', 'impressionist.jpg', 'beach_impressionist.jpg'),
        ('mountain.jpg', 'oil_painting.jpg', 'mountain_oil.jpg'),
        ('sunset.jpg', 'watercolor.jpg', 'sunset_watercolor.jpg'),
    ]

    for content, style, output in trip_photos:
        transfer.transfer_style(
            content_image=content,
            style_image=style,
            output_path=output,
            num_steps=300
        )

    print("創意作品生成完成!")
    """)


def example_9_complete_workflow():
    """示例 9: 完整工作流程"""
    print("\n" + "="*60)
    print("示例 9: 完整風格轉換工作流程")
    print("="*60)

    print("""
    專業工作流程:
    1. 準備素材 (內容圖+風格圖)
    2. 快速預覽 (低解析度)
    3. 調整參數
    4. 生成最終版本
    5. 版本控制和導出
    """)

    print("""
    from style_transfer import StyleTransfer
    from pathlib import Path
    import json

    transfer = StyleTransfer()

    # 設置工作目錄
    project_dir = Path('art_project')
    project_dir.mkdir(exist_ok=True)

    (project_dir / 'previews').mkdir(exist_ok=True)
    (project_dir / 'final').mkdir(exist_ok=True)
    (project_dir / 'configs').mkdir(exist_ok=True)

    # 配置
    configs = {
        'preview': {
            'num_steps': 150,
            'max_size': 256,
            'style_weight': 1e5
        },
        'final': {
            'num_steps': 400,
            'max_size': 768,
            'style_weight': 1e6
        }
    }

    # 保存配置
    with open(project_dir / 'configs/settings.json', 'w') as f:
        json.dump(configs, f, indent=2)

    # Step 1: 快速預覽
    print("Step 1: 生成預覽...")
    transfer.transfer_style(
        content_image='photo.jpg',
        style_image='style.jpg',
        output_path=str(project_dir / 'previews/preview_v1.jpg'),
        **configs['preview'],
        verbose=False
    )

    # Step 2: 調整後的預覽
    print("Step 2: 調整預覽...")
    transfer.transfer_style(
        content_image='photo.jpg',
        style_image='style.jpg',
        output_path=str(project_dir / 'previews/preview_v2.jpg'),
        num_steps=200,
        max_size=256,
        style_weight=1e5,
        verbose=False
    )

    # Step 3: 最終版本
    print("Step 3: 生成最終版本...")
    transfer.transfer_style(
        content_image='photo.jpg',
        style_image='style.jpg',
        output_path=str(project_dir / 'final/final_v1.jpg'),
        **configs['final'],
        verbose=True
    )

    print("\\n工作流程完成!")
    print(f"預覽版: {project_dir}/previews/")
    print(f"最終版: {project_dir}/final/")
    """)


def main():
    """執行所有示例"""
    print("\n" + "="*60)
    print("風格轉換 (Style Transfer) - 完整範例指南")
    print("="*60)

    examples = [
        ("1. 基本風格轉換", example_1_basic_style_transfer),
        ("2. 參數調整", example_2_parameter_tuning),
        ("3. 風格選擇", example_3_style_selection),
        ("4. 不同內容", example_4_different_content),
        ("5. 批量處理", example_5_batch_processing),
        ("6. 優化技巧", example_6_optimization_tips),
        ("7. 裝置選擇", example_7_device_selection),
        ("8. 創意應用", example_8_creative_applications),
        ("9. 完整工作流", example_9_complete_workflow),
    ]

    print("\n可用範例:")
    for name, _ in examples:
        print(f"  {name}")

    while True:
        print("\n" + "-"*60)
        choice = input("選擇範例 (1-9) 或 'all' 顯示全部，'q' 退出: ").strip().lower()

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
