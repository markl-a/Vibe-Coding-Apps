"""
QR 碼工具 - 完整使用範例
演示如何使用 QRCodeGenerator 和 QRCodeReader 進行 QR 碼生成與讀取
"""

from pathlib import Path
from qr_generator import QRCodeGenerator, ErrorCorrectLevel
from qr_reader import QRCodeReader


def example_1_basic_qr_generation():
    """示例 1: 基本 QR 碼生成"""
    print("\n" + "="*60)
    print("示例 1: 基本 QR 碼生成")
    print("="*60)

    print("""
    功能: 生成簡單的 QR 碼
    用途: 網址連結、文字編碼、數據共享

    支援編碼內容:
    - 網址 (URL)
    - 純文字
    - 電子郵件
    - 電話號碼
    - WiFi 連線資訊
    - 名片資訊 (vCard)
    """)

    print("\n實際使用代碼:")
    print("""
    from qr_generator import QRCodeGenerator

    generator = QRCodeGenerator()

    # 基本 QR 碼 - 網址
    generator.generate(
        data='https://www.example.com',
        output_path='qr_website.png'
    )

    # 基本 QR 碼 - 純文字
    generator.generate(
        data='Hello World',
        output_path='qr_text.png'
    )

    # 基本 QR 碼 - 聯絡電話
    generator.generate(
        data='+1-234-567-8900',
        output_path='qr_phone.png'
    )

    # 基本 QR 碼 - 電子郵件
    generator.generate(
        data='mailto:contact@example.com',
        output_path='qr_email.png'
    )
    """)


def example_2_custom_colors():
    """示例 2: 自訂顏色"""
    print("\n" + "="*60)
    print("示例 2: 自訂顏色 QR 碼")
    print("="*60)

    print("""
    功能: 使用自訂顏色生成 QR 碼
    用途: 品牌匹配、視覺設計、社群媒體整合

    顏色名稱範例:
    - 'black', 'white', 'red', 'green', 'blue'
    - 'yellow', 'cyan', 'magenta', 'orange', 'purple'

    RGB 值範例:
    - (0, 0, 0) = 黑色
    - (255, 255, 255) = 白色
    - (255, 0, 0) = 紅色
    - (0, 255, 0) = 綠色
    - (0, 0, 255) = 藍色
    """)

    print("\n實際使用代碼:")
    print("""
    from qr_generator import QRCodeGenerator

    generator = QRCodeGenerator()

    # 藍色 QR 碼
    generator.generate(
        data='https://example.com',
        output_path='qr_blue.png',
        fill_color='blue',
        back_color='white'
    )

    # 紅色和黃色
    generator.generate(
        data='Important Link',
        output_path='qr_red_yellow.png',
        fill_color='red',
        back_color='yellow'
    )

    # 品牌顏色 (自訂 RGB)
    generator.generate(
        data='https://my-brand.com',
        output_path='qr_brand.png',
        fill_color=(0, 102, 204),  # 品牌藍色
        back_color=(255, 255, 255)  # 白色
    )

    # 高對比 (深綠和淺綠)
    generator.generate(
        data='https://example.com',
        output_path='qr_green.png',
        fill_color='darkgreen',
        back_color='lightgreen'
    )
    """)


def example_3_styled_qr():
    """示例 3: 風格化 QR 碼"""
    print("\n" + "="*60)
    print("示例 3: 風格化 QR 碼 (圓角、圓點、漸變)")
    print("="*60)

    print("""
    功能: 生成各種風格的 QR 碼
    用途: 高級設計、品牌識別、美觀展示

    可用風格:
    - 標準 (方形模塊)
    - 圓角 (RoundedModuleDrawer)
    - 圓點 (CircleModuleDrawer)
    - 漸變色 (SquareGradiantColorMask)
    """)

    print("\n實際使用代碼:")
    print("""
    from qr_generator import QRCodeGenerator

    generator = QRCodeGenerator()

    # 圓角 QR 碼
    generator.generate_rounded(
        data='https://example.com',
        output_path='qr_rounded.png',
        radius=10,
        fill_color=(0, 0, 0),  # 黑色
        back_color=(255, 255, 255)  # 白色
    )

    # 圓點 QR 碼
    generator.generate_circular(
        data='https://example.com',
        output_path='qr_circular.png',
        fill_color=(0, 102, 204),  # 藍色
        back_color=(255, 255, 255)  # 白色
    )

    # 漸變色 QR 碼
    generator.generate_gradient(
        data='https://example.com',
        output_path='qr_gradient.png',
        start_color=(0, 0, 255),  # 藍色
        end_color=(255, 0, 0),  # 紅色
        back_color=(255, 255, 255)  # 白色
    )
    """)


def example_4_logo_qr():
    """示例 4: 帶 Logo 的 QR 碼"""
    print("\n" + "="*60)
    print("示例 4: 帶 Logo 的 QR 碼")
    print("="*60)

    print("""
    功能: 在 QR 碼中央添加 Logo
    用途: 品牌 QR 碼、公司識別、專業展示

    建議做法:
    - 使用高錯誤修正等級 (ERROR_CORRECT_H)
    - Logo 大小應為 QR 碼的 20-30%
    - Logo 最好使用 PNG 格式 (支援透明)
    - 確保 QR 碼仍可被掃描
    """)

    print("\n實際使用代碼:")
    print("""
    from qr_generator import QRCodeGenerator

    generator = QRCodeGenerator()

    # 帶公司 Logo 的 QR 碼
    generator.generate_with_logo(
        data='https://company.com',
        output_path='qr_with_logo.png',
        logo_path='company_logo.png',
        logo_size_ratio=0.25,  # Logo 佔 25%
        fill_color='black',
        back_color='white'
    )

    # 帶品牌 Logo 的 QR 碼 (小 Logo)
    generator.generate_with_logo(
        data='https://shop.com/product/123',
        output_path='qr_product_qr.png',
        logo_path='shop_logo.png',
        logo_size_ratio=0.2,  # 較小的 Logo
        fill_color=(0, 102, 204),  # 品牌藍色
        back_color='white'
    )
    """)


def example_5_contact_info():
    """示例 5: 名片 QR 碼 (vCard)"""
    print("\n" + "="*60)
    print("示例 5: 名片 QR 碼 (vCard 格式)")
    print("="*60)

    print("""
    功能: 生成包含名片資訊的 QR 碼
    用途: 電子名片、聯絡資訊分享、專業交流

    vCard 資訊包括:
    - 姓名
    - 電話
    - 電子郵件
    - 公司/組織
    - 網址
    """)

    print("\n實際使用代碼:")
    print("""
    from qr_generator import QRCodeGenerator

    generator = QRCodeGenerator()

    # 創建 vCard (名片)
    vcard = generator.create_vcard(
        name='John Doe',
        phone='+1-234-567-8900',
        email='john@example.com',
        organization='ACME Corporation',
        url='https://example.com'
    )

    # 生成名片 QR 碼
    generator.generate(
        data=vcard,
        output_path='qr_business_card.png'
    )

    # 簡單版本 (只有名字和郵件)
    vcard_simple = generator.create_vcard(
        name='Jane Smith',
        email='jane@company.com'
    )

    generator.generate(
        data=vcard_simple,
        output_path='qr_jane.png'
    )
    """)


def example_6_wifi_qr():
    """示例 6: WiFi 連線 QR 碼"""
    print("\n" + "="*60)
    print("示例 6: WiFi 連線 QR 碼")
    print("="*60)

    print("""
    功能: 生成 WiFi 連線資訊的 QR 碼
    用途: 快速共享 WiFi、餐廳/旅館網路、企業來賓網路

    掃描 QR 碼後，手機會自動連接到 WiFi
    無需手動輸入 SSID 和密碼

    安全類型:
    - 'WPA': 最安全 (現代標準)
    - 'WEP': 較舊的安全協議
    - 'nopass': 開放網路
    """)

    print("\n實際使用代碼:")
    print("""
    from qr_generator import QRCodeGenerator

    generator = QRCodeGenerator()

    # 生成 WiFi QR 碼 (WPA 加密)
    wifi_string = generator.create_wifi(
        ssid='CoffeShop_WiFi',
        password='SecurePass123!',
        security='WPA'
    )

    generator.generate(
        data=wifi_string,
        output_path='qr_wifi.png'
    )

    # 開放式 WiFi (無密碼)
    wifi_open = generator.create_wifi(
        ssid='Public_Network',
        password='',
        security='nopass'
    )

    generator.generate(
        data=wifi_open,
        output_path='qr_open_wifi.png'
    )

    # WEP 加密的網路
    wifi_wep = generator.create_wifi(
        ssid='Guest_Network',
        password='GuestPass123',
        security='WEP'
    )

    generator.generate(
        data=wifi_wep,
        output_path='qr_wep_wifi.png'
    )
    """)


def example_7_batch_generation():
    """示例 7: 批量生成 QR 碼"""
    print("\n" + "="*60)
    print("示例 7: 批量生成 QR 碼")
    print("="*60)

    print("""
    功能: 一次生成多個 QR 碼
    用途: 製作 QR 碼表單、批量編碼、活動票務

    應用場景:
    - 產品追蹤系統
    - 活動票券
    - 批量產品 SKU 編碼
    """)

    print("\n實際使用代碼:")
    print("""
    from qr_generator import QRCodeGenerator

    generator = QRCodeGenerator()

    # 要編碼的資料列表 [(內容, 輸出路徑), ...]
    data_list = [
        ('https://product1.com', 'qr_product_1.png'),
        ('https://product2.com', 'qr_product_2.png'),
        ('https://product3.com', 'qr_product_3.png'),
        ('https://product4.com', 'qr_product_4.png'),
    ]

    # 批量生成
    outputs = generator.batch_generate(data_list)
    print(f"已生成 {len(outputs)} 個 QR 碼")

    # 批量生成訂票
    tickets = [
        (f'TICKET-001-{i}', f'tickets/ticket_{i}.png')
        for i in range(1, 101)  # 100 張票
    ]

    generator.batch_generate(tickets)
    print("票券 QR 碼生成完成")
    """)


def example_8_qr_reading():
    """示例 8: QR 碼讀取"""
    print("\n" + "="*60)
    print("示例 8: QR 碼讀取與解碼")
    print("="*60)

    print("""
    功能: 讀取並解碼 QR 碼
    用途: 資料提取、表單掃描、庫存追蹤

    支援讀取:
    - 標準 QR 碼
    - 多個 QR 碼 (單張圖片內)
    - 實時掃描 (攝像頭)
    """)

    print("\n實際使用代碼:")
    print("""
    from qr_reader import QRCodeReader

    reader = QRCodeReader()

    # 讀取單個 QR 碼
    data = reader.read('qr_code.png')
    if data:
        print(f"QR 碼內容: {data}")

    # 讀取所有 QR 碼 (可能有多個)
    all_codes = reader.read_all('qr_multiple.png')
    for code in all_codes:
        print(f"發現 QR 碼: {code['data']}")
        print(f"類型: {code['type']}")
        print(f"位置: {code['rect']}")

    # 讀取並視覺化 (標記 QR 碼位置)
    reader.read_and_visualize(
        image_path='qr_code.png',
        output_path='qr_marked.png'
    )
    """)


def example_9_real_time_scanning():
    """示例 9: 實時掃描 (攝像頭)"""
    print("\n" + "="*60)
    print("示例 9: 實時掃描 QR 碼 (攝像頭)")
    print("="*60)

    print("""
    功能: 使用攝像頭即時掃描 QR 碼
    用途: 移動應用、簽到系統、實時追蹤

    操作:
    - 按 'q' 鍵退出掃描
    - 掃描到的 QR 碼會在終端顯示
    """)

    print("\n實際使用代碼:")
    print("""
    from qr_reader import QRCodeReader

    reader = QRCodeReader()

    # 開始實時掃描
    reader.read_from_camera(
        camera_index=0,  # 預設攝像頭
        window_name="QR Code Scanner"
    )

    # 如果有多個攝像頭，可以選擇不同的索引
    # reader.read_from_camera(camera_index=1)
    """)


def example_10_batch_reading():
    """示例 10: 批量讀取 QR 碼"""
    print("\n" + "="*60)
    print("示例 10: 批量讀取 QR 碼")
    print("="*60)

    print("""
    功能: 一次讀取多張圖片中的 QR 碼
    用途: 批量掃描、庫存盤點、表單處理

    應用場景:
    - 快遞單據掃描
    - 庫存盤點
    - 自動化表單提交
    """)

    print("\n實際使用代碼:")
    print("""
    from qr_reader import QRCodeReader

    reader = QRCodeReader()

    # 批量讀取目錄中的 QR 碼
    results = reader.batch_read('qr_images/')

    # 輸出結果
    print("\\n讀取結果:")
    for result in results:
        print(f"{result['file']}: {result['data']}")

    # 保存到 CSV 用於進一步處理
    import csv

    with open('qr_results.csv', 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(['檔案名', 'QR 碼內容'])
        for result in results:
            writer.writerow([result['file'], result['data']])
    """)


def example_11_qr_validation():
    """示例 11: QR 碼驗證"""
    print("\n" + "="*60)
    print("示例 11: QR 碼驗證")
    print("="*60)

    print("""
    功能: 檢查圖片是否包含有效 QR 碼
    用途: 資料驗證、品質檢查
    """)

    print("\n實際使用代碼:")
    print("""
    from qr_reader import QRCodeReader

    reader = QRCodeReader()

    # 檢查圖片是否為有效 QR 碼
    if reader.is_qrcode_valid('image.png'):
        print("✓ 有效的 QR 碼")
        data = reader.read('image.png')
        print(f"內容: {data}")
    else:
        print("✗ 無效的 QR 碼或不包含 QR 碼")
    """)


def example_12_complete_workflow():
    """示例 12: 完整工作流程"""
    print("\n" + "="*60)
    print("示例 12: 活動票券系統完整示例")
    print("="*60)

    print("""
    場景: 生成活動票券並驗證

    步驟:
    1. 為每張票券生成獨特 QR 碼
    2. 在票券上列印 QR 碼
    3. 活動現場掃描 QR 碼驗證入場
    """)

    print("""
    from qr_generator import QRCodeGenerator
    from qr_reader import QRCodeReader
    from pathlib import Path
    import datetime

    # 初始化
    generator = QRCodeGenerator()
    reader = QRCodeReader()
    event_dir = Path('event_tickets')
    event_dir.mkdir(exist_ok=True)

    # Step 1: 生成票券 QR 碼
    print("Step 1: 生成票券 QR 碼...")
    for ticket_num in range(1, 101):  # 100 張票
        ticket_id = f"EVENT-2024-{ticket_num:04d}"
        qr_path = event_dir / f'ticket_{ticket_num}.png'

        generator.generate(
            data=ticket_id,
            output_path=str(qr_path)
        )

    print(f"已生成 100 張票券")

    # Step 2: 驗證票券 (模擬現場掃描)
    print("\\nStep 2: 驗證進入的票券...")
    entrance_log = event_dir / 'entrance_log.txt'

    # 模擬掃描幾張票
    for ticket_num in [1, 5, 10, 50]:
        qr_path = event_dir / f'ticket_{ticket_num}.png'
        data = reader.read(str(qr_path))

        timestamp = datetime.datetime.now().isoformat()
        with open(entrance_log, 'a') as f:
            f.write(f"{timestamp} | {data}\\n")

        print(f"✓ {data} 已進場")

    print(f"\\n進場記錄已保存至 {entrance_log}")
    """)


def main():
    """執行所有示例"""
    print("\n" + "="*60)
    print("QR 碼工具 (QR Code Tools) - 完整範例指南")
    print("="*60)

    examples = [
        ("1. 基本 QR 碼", example_1_basic_qr_generation),
        ("2. 自訂顏色", example_2_custom_colors),
        ("3. 風格化 QR 碼", example_3_styled_qr),
        ("4. 帶 Logo QR", example_4_logo_qr),
        ("5. 名片 vCard", example_5_contact_info),
        ("6. WiFi QR 碼", example_6_wifi_qr),
        ("7. 批量生成", example_7_batch_generation),
        ("8. QR 碼讀取", example_8_qr_reading),
        ("9. 實時掃描", example_9_real_time_scanning),
        ("10. 批量讀取", example_10_batch_reading),
        ("11. QR 驗證", example_11_qr_validation),
        ("12. 完整工作流", example_12_complete_workflow),
    ]

    print("\n可用範例:")
    for name, _ in examples:
        print(f"  {name}")

    while True:
        print("\n" + "-"*60)
        choice = input("選擇範例 (1-12) 或 'all' 顯示全部，'q' 退出: ").strip().lower()

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
