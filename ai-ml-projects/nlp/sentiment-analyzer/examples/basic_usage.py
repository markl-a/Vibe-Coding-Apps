"""
基本使用範例
"""

import sys
sys.path.insert(0, '../src')

from sentiment_analyzer import SentimentAnalyzer


def main():
    print("="*60)
    print("情感分析器 - 基本使用範例")
    print("="*60)
    
    # 初始化分析器
    analyzer = SentimentAnalyzer()
    
    # 範例 1: 分析單個文本
    print("\n範例 1: 單個文本分析")
    print("-"*60)
    
    text = "I absolutely love this product! It exceeded my expectations."
    result = analyzer.analyze(text)
    
    print(f"文本: {text}")
    print(f"情感: {result['label']}")
    print(f"信心分數: {result['score']:.4f}")
    
    # 範例 2: 分析多個文本
    print("\n範例 2: 多個文本分析")
    print("-"*60)
    
    texts = [
        "This movie was fantastic! I highly recommend it.",
        "Terrible service, very disappointed.",
        "It's okay, nothing special.",
        "Best purchase I've ever made!",
        "Don't waste your money on this."
    ]
    
    for text in texts:
        result = analyzer.analyze(text)
        print(f"\n{text}")
        print(f"  -> {result['label']} (信心: {result['score']:.2f})")
    
    # 範例 3: 詳細分析
    print("\n範例 3: 詳細分析")
    print("-"*60)
    
    text = "The customer support was amazing and solved my issue quickly!"
    result = analyzer.analyze_with_details(text)
    
    print(f"文本: {result['text']}")
    print(f"情感: {result['label']}")
    print(f"信心分數: {result['score']:.4f}")
    print(f"置信度: {result['confidence']}")
    print(f"使用模型: {result['model']}")


if __name__ == "__main__":
    main()
