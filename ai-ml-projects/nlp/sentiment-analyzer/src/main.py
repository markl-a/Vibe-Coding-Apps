"""
情感分析器命令行介面
"""

import argparse
import json
import sys
from pathlib import Path
from sentiment_analyzer import SentimentAnalyzer


def read_texts_from_file(file_path: str) -> list:
    """從文件讀取文本"""
    with open(file_path, 'r', encoding='utf-8') as f:
        return [line.strip() for line in f if line.strip()]


def save_results(results: list, output_path: str):
    """保存結果到文件"""
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    print(f"\n結果已保存到: {output_path}")


def main():
    parser = argparse.ArgumentParser(
        description="情感分析工具 - 使用 Transformers 進行文本情感分析"
    )
    
    # 輸入選項
    input_group = parser.add_mutually_exclusive_group(required=True)
    input_group.add_argument(
        '--text', '-t',
        type=str,
        help='要分析的文本'
    )
    input_group.add_argument(
        '--file', '-f',
        type=str,
        help='包含文本的文件路徑（每行一個文本）'
    )
    
    # 模型選項
    parser.add_argument(
        '--model', '-m',
        type=str,
        default='distilbert-base-uncased-finetuned-sst-2-english',
        help='預訓練模型名稱或路徑'
    )
    
    # 輸出選項
    parser.add_argument(
        '--output', '-o',
        type=str,
        help='結果輸出文件路徑（JSON 格式）'
    )
    
    # 批次大小
    parser.add_argument(
        '--batch-size', '-b',
        type=int,
        default=8,
        help='批量處理的批次大小'
    )
    
    # 詳細模式
    parser.add_argument(
        '--verbose', '-v',
        action='store_true',
        help='顯示詳細信息'
    )
    
    args = parser.parse_args()
    
    # 初始化分析器
    try:
        analyzer = SentimentAnalyzer(model_name=args.model)
    except Exception as e:
        print(f"錯誤：無法初始化分析器 - {e}")
        sys.exit(1)
    
    # 處理輸入
    if args.text:
        # 單個文本
        print(f"\n分析文本: {args.text}")
        print("-" * 60)
        
        if args.verbose:
            result = analyzer.analyze_with_details(args.text)
        else:
            result = analyzer.analyze(args.text)
        
        print(f"情感: {result['label']}")
        print(f"信心分數: {result['score']:.4f}")
        
        if args.verbose:
            print(f"置信度: {result['confidence']}")
            print(f"文本長度: {result['text_length']}")
        
        if args.output:
            save_results([result], args.output)
    
    else:
        # 從文件讀取
        try:
            texts = read_texts_from_file(args.file)
            print(f"\n從文件讀取了 {len(texts)} 個文本")
            print("-" * 60)
        except Exception as e:
            print(f"錯誤：無法讀取文件 - {e}")
            sys.exit(1)
        
        # 批量分析
        results = analyzer.analyze_batch(texts, batch_size=args.batch_size)
        
        # 顯示結果
        for i, (text, result) in enumerate(zip(texts, results), 1):
            print(f"\n[{i}] {text[:80]}{'...' if len(text) > 80 else ''}")
            print(f"    情感: {result['label']} (信心: {result['score']:.2f})")
        
        # 顯示統計
        distribution = {}
        for result in results:
            label = result['label']
            distribution[label] = distribution.get(label, 0) + 1
        
        print("\n" + "=" * 60)
        print("情感分布統計:")
        for label, count in distribution.items():
            percentage = (count / len(results)) * 100
            print(f"  {label}: {count} ({percentage:.1f}%)")
        
        if args.output:
            save_results(results, args.output)


if __name__ == "__main__":
    main()
