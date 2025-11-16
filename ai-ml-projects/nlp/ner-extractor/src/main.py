"""
命名實體識別器命令行介面
"""

import argparse
import json
import sys
from pathlib import Path
from ner_extractor import NERExtractor


def read_text_from_file(file_path: str) -> str:
    """從文件讀取文本"""
    with open(file_path, 'r', encoding='utf-8') as f:
        return f.read()


def save_results(entities: list, output_path: str):
    """保存結果到 JSON 文件"""
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(entities, f, ensure_ascii=False, indent=2)
    print(f"\n結果已保存到: {output_path}")


def save_html(html: str, output_path: str):
    """保存 HTML 可視化"""
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(html)
    print(f"\n可視化已保存到: {output_path}")


def main():
    parser = argparse.ArgumentParser(
        description="命名實體識別工具 - 提取文本中的實體"
    )
    
    # 輸入選項
    input_group = parser.add_mutually_exclusive_group(required=True)
    input_group.add_argument(
        '--text', '-t',
        type=str,
        help='要處理的文本'
    )
    input_group.add_argument(
        '--file', '-f',
        type=str,
        help='包含文本的文件路徑'
    )
    
    # 模型選項
    parser.add_argument(
        '--model-type',
        type=str,
        default='spacy',
        choices=['spacy', 'transformers'],
        help='模型類型'
    )
    
    parser.add_argument(
        '--model-name',
        type=str,
        help='自定義模型名稱'
    )
    
    # 過濾選項
    parser.add_argument(
        '--entity-types',
        type=str,
        nargs='+',
        help='只提取指定類型的實體'
    )
    
    # 輸出選項
    parser.add_argument(
        '--output', '-o',
        type=str,
        help='結果輸出文件路徑（JSON）'
    )
    
    parser.add_argument(
        '--visualize', '-v',
        type=str,
        help='生成可視化 HTML 文件'
    )
    
    parser.add_argument(
        '--stats', '-s',
        action='store_true',
        help='顯示統計信息'
    )
    
    args = parser.parse_args()
    
    # 初始化提取器
    try:
        extractor = NERExtractor(
            model_type=args.model_type,
            model_name=args.model_name
        )
    except Exception as e:
        print(f"錯誤：無法初始化提取器 - {e}")
        sys.exit(1)
    
    # 讀取文本
    if args.text:
        text = args.text
    else:
        try:
            text = read_text_from_file(args.file)
        except Exception as e:
            print(f"錯誤：無法讀取文件 - {e}")
            sys.exit(1)
    
    print(f"\n處理文本長度: {len(text)} 字符")
    print("-" * 60)
    
    # 提取實體
    if args.entity_types:
        entities = extractor.filter_entities(text, args.entity_types)
        print(f"\n提取的實體 (僅 {', '.join(args.entity_types)}):")
    else:
        entities = extractor.extract(text)
        print("\n提取的實體:")
    
    print("-" * 60)
    for ent in entities:
        score_str = f" (信心: {ent['score']:.2f})" if 'score' in ent else ""
        print(f"  {ent['text']:30} -> {ent['label']}{score_str}")
    
    # 統計
    if args.stats:
        print("\n" + "-" * 60)
        print("實體類型統計:")
        print("-" * 60)
        stats = extractor.get_entity_stats(text)
        for label, count in stats.items():
            print(f"  {label}: {count}")
        print(f"\n總計: {sum(stats.values())} 個實體")
    
    # 保存結果
    if args.output:
        save_results(entities, args.output)
    
    # 可視化
    if args.visualize:
        html = extractor.visualize(text)
        save_html(html, args.visualize)


if __name__ == "__main__":
    main()
