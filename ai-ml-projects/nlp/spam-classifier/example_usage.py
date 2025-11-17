#!/usr/bin/env python3
"""
垃圾郵件分類器使用範例
展示如何訓練和使用垃圾郵件檢測模型
"""

import sys
from pathlib import Path

# 添加 src 到路徑
sys.path.insert(0, str(Path(__file__).parent / "src"))

from spam_classifier import SpamClassifier


def basic_classification_example():
    """基本分類範例"""
    print("=" * 70)
    print("垃圾郵件分類基本範例")
    print("=" * 70)
    print()

    # 初始化分類器
    print("正在載入模型...")
    classifier = SpamClassifier()
    print()

    # 測試郵件
    test_emails = [
        {
            "text": "Hi John, let's meet for coffee tomorrow at 3pm. Looking forward to catching up!",
            "expected": "正常郵件"
        },
        {
            "text": "CONGRATULATIONS!!! You've WON $1,000,000! Click here NOW to claim your prize!!!",
            "expected": "垃圾郵件"
        },
        {
            "text": "Your Amazon order #12345 has been shipped. Track your package here.",
            "expected": "正常郵件"
        },
        {
            "text": "URGENT: Your account will be closed! Click this link immediately to verify your information.",
            "expected": "垃圾郵件"
        },
        {
            "text": "Meeting reminder: Team standup at 10am in Conference Room B.",
            "expected": "正常郵件"
        },
        {
            "text": "Get rich quick! Work from home and earn $5000 per week! No experience needed!!!",
            "expected": "垃圾郵件"
        }
    ]

    print("測試郵件分類:\n")

    correct = 0
    for i, email in enumerate(test_emails, 1):
        result = classifier.predict(email['text'])

        is_spam = result['label'] == 'SPAM'
        predicted = "垃圾郵件" if is_spam else "正常郵件"
        is_correct = predicted == email['expected']

        if is_correct:
            correct += 1

        print(f"[郵件 {i}]")
        print(f"內容: {email['text'][:60]}...")
        print(f"預測: {predicted} (信心度: {result['confidence']:.2%})")
        print(f"預期: {email['expected']} {'✓' if is_correct else '✗'}")
        print("-" * 70)
        print()

    accuracy = correct / len(test_emails)
    print(f"準確率: {accuracy:.1%} ({correct}/{len(test_emails)})")
    print()


def batch_classification_example():
    """批量分類範例"""
    print("=" * 70)
    print("批量郵件分類範例")
    print("=" * 70)
    print()

    classifier = SpamClassifier()

    emails = [
        "Your package will arrive tomorrow between 2-4pm.",
        "FREE VIAGRA!!! Best prices online!!! Buy now!!!",
        "Please review the attached document for tomorrow's meeting.",
        "You have been selected for a special offer. Act now!",
        "Reminder: Your subscription expires in 3 days.",
        "Make money fast with this one weird trick!",
        "Your flight is confirmed for May 15th. Check-in opens 24h before.",
        "Nigerian prince needs your help transferring $10 million."
    ]

    print("正在批量分類郵件...\n")
    results = classifier.predict_batch(emails)

    spam_count = 0
    for email, result in zip(emails, results):
        is_spam = result['label'] == 'SPAM'
        if is_spam:
            spam_count += 1

        status = "🚫 垃圾郵件" if is_spam else "✅ 正常"
        print(f"{status} ({result['confidence']:.0%}): {email[:50]}...")

    print(f"\n統計: {spam_count} 封垃圾郵件, {len(emails) - spam_count} 封正常郵件")
    print()


def confidence_threshold_example():
    """信心度閾值範例"""
    print("=" * 70)
    print("信心度閾值調整範例")
    print("=" * 70)
    print()

    classifier = SpamClassifier()

    # 模糊的郵件（可能難以分類）
    ambiguous_emails = [
        "Limited time offer on premium software licenses.",
        "Your input is needed for the upcoming project.",
        "Exclusive deals just for you! Check them out.",
        "Please confirm your attendance for Friday's event."
    ]

    thresholds = [0.5, 0.7, 0.9]

    for email in ambiguous_emails:
        print(f"郵件: {email}")

        result = classifier.predict(email)
        confidence = result['confidence']

        print(f"原始信心度: {confidence:.2%}")
        print("不同閾值下的分類:")

        for threshold in thresholds:
            if result['label'] == 'SPAM':
                is_spam_at_threshold = confidence >= threshold
            else:
                is_spam_at_threshold = confidence < (1 - threshold)

            status = "垃圾郵件" if is_spam_at_threshold else "正常郵件"
            print(f"  閾值 {threshold:.0%}: {status}")

        print("-" * 70)
        print()


def training_example():
    """訓練模型範例"""
    print("=" * 70)
    print("模型訓練範例")
    print("=" * 70)
    print()

    print("注意: 這是一個簡化的訓練範例")
    print("實際應用中需要大量標註數據\n")

    # 訓練數據（實際應該有更多）
    train_data = {
        "texts": [
            "Meeting at 3pm in the conference room",
            "WIN FREE MONEY NOW!!!",
            "Your order has shipped",
            "CLICK HERE FOR AMAZING DEALS",
            "Please review the attached report",
            "Get rich quick with this method",
            "Lunch on Friday?",
            "URGENT: Verify your account NOW"
        ],
        "labels": [0, 1, 0, 1, 0, 1, 0, 1]  # 0=正常, 1=垃圾
    }

    print("訓練數據:")
    for text, label in zip(train_data["texts"], train_data["labels"]):
        label_str = "垃圾" if label == 1 else "正常"
        print(f"  [{label_str}] {text}")

    print("\n提示: 要訓練自定義模型，請參考 src/train.py")
    print()


def interactive_mode():
    """互動模式"""
    print("=" * 70)
    print("互動分類模式 - 輸入 'quit' 結束")
    print("=" * 70)
    print()

    print("正在載入模型...")
    classifier = SpamClassifier()
    print("分類器已就緒！\n")

    total = 0
    spam_count = 0

    while True:
        try:
            email = input("請輸入郵件內容: ").strip()

            if not email:
                continue

            if email.lower() in ['quit', 'exit', 'q']:
                if total > 0:
                    print(f"\n統計: 共分析 {total} 封郵件")
                    print(f"垃圾郵件: {spam_count} ({spam_count/total:.1%})")
                    print(f"正常郵件: {total - spam_count} ({(total-spam_count)/total:.1%})")
                print("再見！")
                break

            # 分類
            result = classifier.predict(email)
            is_spam = result['label'] == 'SPAM'

            total += 1
            if is_spam:
                spam_count += 1

            status = "🚫 垃圾郵件" if is_spam else "✅ 正常郵件"
            print(f"\n結果: {status}")
            print(f"信心度: {result['confidence']:.2%}")
            print()

        except KeyboardInterrupt:
            print("\n\n再見！")
            break
        except Exception as e:
            print(f"錯誤: {e}\n")


def main():
    """主函數"""
    print("\n垃圾郵件分類器範例程式\n")

    # 基本分類
    basic_classification_example()

    # 批量分類
    batch_classification_example()

    # 信心度閾值
    confidence_threshold_example()

    # 訓練說明
    training_example()

    # 互動模式（可選）
    choice = input("是否進入互動模式？(y/n): ").strip().lower()
    if choice == 'y':
        interactive_mode()


if __name__ == "__main__":
    main()
