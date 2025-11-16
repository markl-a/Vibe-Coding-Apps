"""
文本摘要器命令行介面
"""

import argparse
import sys
from pathlib import Path
from text_summarizer import TextSummarizer


def read_text_from_file(file_path: str) -> str:
    """從文件讀取文本"""
    with open(file_path, 'r', encoding='utf-8') as f:
        return f.read()


def save_summary(summary: str, output_path: str):
    """保存摘要到文件"""
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(summary)
    print(f"\n摘要已保存到: {output_path}")


def main():
    parser = argparse.ArgumentParser(
        description="文本摘要工具 - 使用 Transformers 生成文本摘要"
    )
    
    # 輸入選項
    input_group = parser.add_mutually_exclusive_group(required=True)
    input_group.add_argument(
        '--text', '-t',
        type=str,
        help='要摘要的文本'
    )
    input_group.add_argument(
        '--file', '-f',
        type=str,
        help='包含文本的文件路徑'
    )
    
    # 模型選項
    parser.add_argument(
        '--model', '-m',
        type=str,
        default='facebook/bart-large-cnn',
        help='預訓練模型名稱或路徑'
    )
    
    # 摘要參數
    parser.add_argument(
        '--max-length',
        type=int,
        default=130,
        help='摘要最大長度（token 數）'
    )
    
    parser.add_argument(
        '--min-length',
        type=int,
        default=30,
        help='摘要最小長度（token 數）'
    )
    
    parser.add_argument(
        '--ratio',
        type=float,
        help='摘要長度比例 (0-1)，覆蓋 max/min-length'
    )
    
    # 輸出選項
    parser.add_argument(
        '--output', '-o',
        type=str,
        help='摘要輸出文件路徑'
    )
    
    # 統計信息
    parser.add_argument(
        '--stats', '-s',
        action='store_true',
        help='顯示統計信息'
    )
    
    args = parser.parse_args()
    
    # 初始化摘要器
    try:
        summarizer = TextSummarizer(model_name=args.model)
    except Exception as e:
        print(f"錯誤：無法初始化摘要器 - {e}")
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
    
    print(f"\n原文長度: {len(text)} 字符, {len(text.split())} 詞")
    print("-" * 60)
    
    # 生成摘要
    if args.ratio:
        summary = summarizer.summarize_with_ratio(text, ratio=args.ratio)
    else:
        summary = summarizer.summarize(
            text,
            max_length=args.max_length,
            min_length=args.min_length
        )
    
    print("\n摘要:")
    print(summary)
    print("-" * 60)
    
    # 顯示統計
    if args.stats:
        stats = summarizer.get_summary_stats(text, summary)
        print("\n統計信息:")
        print(f"  原文字符數: {stats['original_length']}")
        print(f"  原文詞數: {stats['original_words']}")
        print(f"  摘要字符數: {stats['summary_length']}")
        print(f"  摘要詞數: {stats['summary_words']}")
        print(f"  壓縮比例: {stats['compression_ratio']:.2%}")
    
    # 保存結果
    if args.output:
        save_summary(summary, args.output)


if __name__ == "__main__":
    main()
