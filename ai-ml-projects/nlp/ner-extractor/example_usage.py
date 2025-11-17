#!/usr/bin/env python3
"""
命名實體識別 (NER) 使用範例
展示如何從文本中提取人名、地點、組織等實體
"""

import sys
from pathlib import Path

# 添加 src 到路徑
sys.path.insert(0, str(Path(__file__).parent / "src"))

from ner_extractor import NERExtractor


def basic_example():
    """基本使用範例"""
    print("=" * 60)
    print("命名實體識別基本範例")
    print("=" * 60)
    print()

    # 初始化 NER 提取器
    ner = NERExtractor()

    # 測試文本
    test_texts = [
        "Apple Inc. is headquartered in Cupertino, California. Tim Cook is the CEO.",
        "Elon Musk founded SpaceX and Tesla. Both companies are based in the United States.",
        "The Eiffel Tower is located in Paris, France. It was designed by Gustave Eiffel.",
        "Google and Microsoft are competing in the cloud computing market.",
        "Barack Obama was the 44th President of the United States from 2009 to 2017."
    ]

    for i, text in enumerate(test_texts, 1):
        print(f"[範例 {i}]")
        print(f"文本: {text}")
        print()

        # 提取實體
        entities = ner.extract_entities(text)

        if entities:
            print("識別的實體:")
            for entity in entities:
                print(f"  • {entity['text']:<30} [{entity['label']}] (信心度: {entity['score']:.2f})")
        else:
            print("  未識別到實體")

        print("-" * 60)
        print()


def advanced_example():
    """進階範例 - 實體統計和篩選"""
    print("=" * 60)
    print("進階範例 - 實體統計")
    print("=" * 60)
    print()

    ner = NERExtractor()

    # 長文本範例
    article = """
    Microsoft Corporation announced today that Satya Nadella will continue as CEO.
    The company, based in Redmond, Washington, has seen significant growth in its
    cloud computing division, Azure. Microsoft competes with Amazon Web Services (AWS)
    and Google Cloud Platform in the cloud market.

    Meanwhile, in Europe, the European Union has been investigating big tech companies
    including Apple, Google, and Facebook for antitrust concerns. The investigations
    are led by Margrethe Vestager, the European Commission's competition chief.
    """

    print("文章:")
    print(article.strip())
    print("\n" + "-" * 60 + "\n")

    # 提取實體
    entities = ner.extract_entities(article)

    # 按類別分組
    entities_by_type = {}
    for entity in entities:
        label = entity['label']
        if label not in entities_by_type:
            entities_by_type[label] = []
        entities_by_type[label].append(entity['text'])

    # 顯示統計
    print("實體統計:")
    for entity_type, items in sorted(entities_by_type.items()):
        unique_items = list(set(items))
        print(f"\n{entity_type}:")
        for item in unique_items:
            count = items.count(item)
            print(f"  • {item} (出現 {count} 次)")

    print()


def filtering_example():
    """篩選特定類型實體的範例"""
    print("=" * 60)
    print("篩選特定類型實體範例")
    print("=" * 60)
    print()

    ner = NERExtractor()

    text = """
    The meeting between President Joe Biden and Prime Minister Boris Johnson took place
    in Washington D.C. last week. They discussed climate change policies and the partnership
    between the United States and the United Kingdom.
    """

    print(f"文本: {text.strip()}")
    print("\n" + "-" * 60 + "\n")

    # 提取所有實體
    all_entities = ner.extract_entities(text)

    # 只顯示人名 (PER)
    persons = [e for e in all_entities if e['label'] == 'PER']
    print("人名:")
    for person in persons:
        print(f"  • {person['text']}")

    # 只顯示地點 (LOC)
    locations = [e for e in all_entities if e['label'] == 'LOC']
    print("\n地點:")
    for loc in locations:
        print(f"  • {loc['text']}")

    # 只顯示組織 (ORG)
    organizations = [e for e in all_entities if e['label'] == 'ORG']
    print("\n組織:")
    for org in organizations:
        print(f"  • {org['text']}")

    print()


def chinese_example():
    """中文文本範例（如果模型支援）"""
    print("=" * 60)
    print("中文文本測試")
    print("=" * 60)
    print()

    # 使用支援中文的模型
    try:
        ner = NERExtractor(model_name="ckiplab/bert-base-chinese-ner")

        chinese_texts = [
            "台積電總部位於台灣新竹科學園區，張忠謀是創辦人。",
            "蘋果公司在中國上海開設了新的研發中心。"
        ]

        for text in chinese_texts:
            print(f"文本: {text}")
            entities = ner.extract_entities(text)

            if entities:
                for entity in entities:
                    print(f"  • {entity['text']} [{entity['label']}]")
            else:
                print("  未識別到實體")
            print()

    except Exception as e:
        print(f"中文模型載入失敗: {e}")
        print("跳過中文範例...")
        print()


def interactive_mode():
    """互動模式"""
    print("=" * 60)
    print("互動模式 - 輸入 'quit' 結束")
    print("=" * 60)
    print()

    ner = NERExtractor()
    print("NER 提取器已就緒！\n")

    while True:
        try:
            text = input("請輸入文本: ").strip()

            if not text:
                continue

            if text.lower() in ['quit', 'exit', 'q']:
                print("再見！")
                break

            # 提取實體
            entities = ner.extract_entities(text)

            if entities:
                print("\n識別的實體:")
                for entity in entities:
                    print(f"  • {entity['text']:<20} [{entity['label']}] "
                          f"(信心度: {entity['score']:.2%})")
            else:
                print("\n未識別到實體")

            print()

        except KeyboardInterrupt:
            print("\n\n再見！")
            break
        except Exception as e:
            print(f"錯誤: {e}\n")


def main():
    """主函數"""
    print("\n命名實體識別 (NER) 範例程式\n")

    # 基本範例
    basic_example()

    # 進階範例
    advanced_example()

    # 篩選範例
    filtering_example()

    # 中文範例（可選）
    # chinese_example()

    # 互動模式（可選）
    choice = input("是否進入互動模式？(y/n): ").strip().lower()
    if choice == 'y':
        interactive_mode()


if __name__ == "__main__":
    main()
