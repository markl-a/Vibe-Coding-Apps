#!/usr/bin/env python3
"""
文本摘要器使用範例
展示如何自動生成文章摘要
"""

import sys
from pathlib import Path

# 添加 src 到路徑
sys.path.insert(0, str(Path(__file__).parent / "src"))

from text_summarizer import TextSummarizer


def basic_example():
    """基本摘要範例"""
    print("=" * 70)
    print("基本文本摘要範例")
    print("=" * 70)
    print()

    # 初始化摘要器
    print("正在載入模型...")
    summarizer = TextSummarizer()
    print()

    # 新聞文章範例
    article = """
    Climate change is one of the most pressing challenges of our time. Rising global
    temperatures are causing ice caps to melt, sea levels to rise, and weather patterns
    to become more extreme. Scientists warn that without immediate action, the consequences
    could be catastrophic for future generations.

    The Paris Agreement, signed in 2015, represents a landmark international effort to
    combat climate change. Nearly 200 countries committed to limiting global temperature
    rise to well below 2 degrees Celsius above pre-industrial levels. However, progress
    has been slow, and many nations are falling short of their commitments.

    Renewable energy technologies like solar and wind power have become more affordable
    and efficient in recent years. Electric vehicles are also gaining popularity as an
    alternative to traditional gasoline-powered cars. These developments offer hope that
    the transition to a low-carbon economy is possible.

    Individual actions also matter in the fight against climate change. Reducing energy
    consumption, using public transportation, and supporting sustainable products can all
    make a difference. Education and awareness are key to mobilizing global action on
    this critical issue.
    """

    print("原文:")
    print(article.strip())
    print(f"\n原文字數: {len(article.split())} 詞")
    print("\n" + "-" * 70 + "\n")

    # 生成摘要
    print("正在生成摘要...")
    summary = summarizer.summarize(article, max_length=100, min_length=30)

    print("摘要:")
    print(summary)
    print(f"\n摘要字數: {len(summary.split())} 詞")

    # 顯示統計
    stats = summarizer.get_summary_stats(article, summary)
    print(f"壓縮比例: {stats['compression_ratio']:.1%}")
    print()


def different_lengths_example():
    """不同長度摘要範例"""
    print("=" * 70)
    print("不同長度摘要範例")
    print("=" * 70)
    print()

    summarizer = TextSummarizer()

    article = """
    Artificial intelligence has transformed numerous industries in recent years. From
    healthcare to finance, AI systems are being deployed to automate tasks, analyze data,
    and make predictions. Machine learning algorithms can now diagnose diseases, trade
    stocks, and even drive cars with minimal human intervention.

    However, the rise of AI also raises important ethical questions. Concerns about job
    displacement, algorithmic bias, and privacy have led to calls for stronger regulation.
    Experts emphasize the need for responsible AI development that prioritizes human
    welfare and societal benefit.
    """

    print("原文:")
    print(article.strip())
    print("\n" + "-" * 70 + "\n")

    # 不同長度的摘要
    lengths = [
        {"max": 50, "min": 20, "desc": "短摘要"},
        {"max": 80, "min": 40, "desc": "中等摘要"},
        {"max": 120, "min": 60, "desc": "長摘要"}
    ]

    for config in lengths:
        summary = summarizer.summarize(
            article,
            max_length=config['max'],
            min_length=config['min']
        )
        print(f"{config['desc']} (最多 {config['max']} 詞):")
        print(summary)
        print(f"實際字數: {len(summary.split())} 詞")
        print()


def batch_summarization_example():
    """批量摘要範例"""
    print("=" * 70)
    print("批量文本摘要範例")
    print("=" * 70)
    print()

    summarizer = TextSummarizer()

    articles = [
        """
        The global economy is showing signs of recovery after the pandemic. Stock markets
        have reached record highs, and unemployment rates are declining in many countries.
        However, inflation remains a concern as central banks consider raising interest rates.
        """,
        """
        Space exploration has entered a new era with private companies like SpaceX and
        Blue Origin leading the charge. Reusable rockets have made space travel more
        affordable, and plans for Mars colonization are becoming more concrete.
        """,
        """
        Cybersecurity threats continue to evolve as hackers develop more sophisticated
        methods. Ransomware attacks have targeted hospitals, schools, and critical
        infrastructure. Organizations must invest in robust security measures to protect
        sensitive data.
        """
    ]

    print("正在批量生成摘要...\n")
    summaries = summarizer.summarize_batch(articles, max_length=60, min_length=20)

    for i, (article, summary) in enumerate(zip(articles, summaries), 1):
        print(f"[文章 {i}]")
        print(f"原文: {article.strip()[:100]}...")
        print(f"摘要: {summary}")
        print("-" * 70)
        print()


def long_text_example():
    """長文本摘要範例"""
    print("=" * 70)
    print("長文本摘要範例")
    print("=" * 70)
    print()

    summarizer = TextSummarizer()

    # 模擬長文章
    long_article = """
    Introduction to Machine Learning

    Machine learning is a subset of artificial intelligence that focuses on building
    systems that can learn from data. Instead of being explicitly programmed to perform
    a task, machine learning algorithms use statistical techniques to identify patterns
    and make predictions based on input data.

    Types of Machine Learning

    There are three main types of machine learning: supervised learning, unsupervised
    learning, and reinforcement learning. Supervised learning involves training a model
    on labeled data, where the correct outputs are known. Common applications include
    image classification and spam detection.

    Unsupervised learning deals with unlabeled data and aims to discover hidden patterns
    or structures. Clustering algorithms and dimensionality reduction techniques fall
    into this category. These methods are useful for exploratory data analysis and
    feature learning.

    Reinforcement learning is inspired by behavioral psychology. An agent learns to make
    decisions by interacting with an environment and receiving rewards or penalties. This
    approach has been successful in game playing, robotics, and autonomous systems.

    Applications and Future Directions

    Machine learning has revolutionized many fields including healthcare, finance,
    transportation, and entertainment. Medical diagnosis systems can analyze patient data
    to detect diseases early. Financial institutions use ML for fraud detection and
    algorithmic trading. Self-driving cars rely on computer vision and deep learning
    to navigate roads safely.

    Looking ahead, researchers are working on making machine learning more interpretable,
    efficient, and fair. Explainable AI aims to make model decisions more transparent.
    Edge computing enables ML on mobile devices. Fairness-aware algorithms address bias
    in automated decision-making.

    Conclusion

    As machine learning continues to advance, it will play an increasingly important role
    in shaping our future. Understanding its principles and applications is becoming
    essential for professionals across many industries.
    """ * 2  # 重複以創建更長的文本

    print(f"原文長度: {len(long_article.split())} 詞\n")

    print("正在處理長文本...\n")
    summary = summarizer.summarize_long_text(
        long_article,
        chunk_size=1500,
        max_length=100,
        min_length=40
    )

    print("長文本摘要:")
    print(summary)
    print(f"\n摘要長度: {len(summary.split())} 詞")
    print()


def interactive_mode():
    """互動模式"""
    print("=" * 70)
    print("互動摘要模式 - 輸入 'quit' 結束")
    print("=" * 70)
    print()

    print("正在載入模型...")
    summarizer = TextSummarizer()
    print("摘要器已就緒！\n")

    while True:
        try:
            print("請輸入要摘要的文本 (可多行，輸入空行結束):")
            lines = []
            while True:
                line = input()
                if not line:
                    break
                if line.lower() in ['quit', 'exit', 'q']:
                    print("再見！")
                    return
                lines.append(line)

            text = " ".join(lines)

            if not text:
                continue

            print("\n正在生成摘要...")
            summary = summarizer.summarize(text, max_length=100, min_length=30)

            print("\n摘要:")
            print(summary)

            stats = summarizer.get_summary_stats(text, summary)
            print(f"\n原文: {stats['original_words']} 詞 | "
                  f"摘要: {stats['summary_words']} 詞 | "
                  f"壓縮: {stats['compression_ratio']:.1%}")
            print("\n" + "-" * 70 + "\n")

        except KeyboardInterrupt:
            print("\n\n再見！")
            break
        except Exception as e:
            print(f"錯誤: {e}\n")


def main():
    """主函數"""
    print("\n文本摘要器範例程式\n")

    # 基本範例
    basic_example()

    # 不同長度摘要
    different_lengths_example()

    # 批量摘要
    batch_summarization_example()

    # 長文本摘要
    long_text_example()

    # 互動模式（可選）
    choice = input("是否進入互動模式？(y/n): ").strip().lower()
    if choice == 'y':
        interactive_mode()


if __name__ == "__main__":
    main()
