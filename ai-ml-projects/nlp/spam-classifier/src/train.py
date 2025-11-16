"""
模型訓練腳本
"""

import argparse
import pandas as pd
from spam_classifier import SpamClassifier


def load_data(filepath: str):
    """載入訓練數據"""
    df = pd.read_csv(filepath)
    texts = df['text'].tolist()
    labels = df['label'].tolist()
    return texts, labels


def main():
    parser = argparse.ArgumentParser(description="訓練垃圾郵件分類器")
    
    parser.add_argument(
        '--data', '-d',
        type=str,
        help='訓練數據 CSV 文件路徑'
    )
    
    parser.add_argument(
        '--model', '-m',
        type=str,
        default='nb',
        choices=['nb', 'lr', 'rf', 'svm'],
        help='模型類型'
    )
    
    parser.add_argument(
        '--output', '-o',
        type=str,
        default='models/spam_classifier.pkl',
        help='模型保存路徑'
    )
    
    parser.add_argument(
        '--test-size',
        type=float,
        default=0.2,
        help='測試集比例'
    )
    
    args = parser.parse_args()
    
    # 創建分類器
    classifier = SpamClassifier(model_type=args.model)
    
    # 載入數據
    if args.data:
        print(f"從 {args.data} 載入數據...")
        texts, labels = load_data(args.data)
    else:
        print("使用示例數據訓練...")
        # 使用示例數據
        spam = ["Win money now!", "FREE gift!", "Click here!"] * 10
        ham = ["Meeting at 3pm", "Project update", "Thanks!"] * 10
        texts = spam + ham
        labels = ['spam'] * len(spam) + ['ham'] * len(ham)
    
    print(f"數據集大小: {len(texts)}")
    print(f"模型類型: {args.model}")
    
    # 訓練
    results = classifier.train(texts, labels, test_size=args.test_size)
    
    # 保存模型
    classifier.save(args.output)
    
    print("\n訓練完成！")


if __name__ == "__main__":
    main()
