"""
Sentiment Analysis using Transformers
"""
from transformers import pipeline, AutoModelForSequenceClassification, AutoTokenizer
import torch
from typing import List, Dict, Union


class SentimentAnalyzer:
    """Sentiment analysis using pre-trained models"""

    def __init__(
        self,
        model_name: str = "distilbert-base-uncased-finetuned-sst-2-english",
        device: int = -1
    ):
        """
        Initialize sentiment analyzer

        Args:
            model_name: Pre-trained model name
            device: Device to use (-1 for CPU, 0+ for GPU)
        """
        self.model_name = model_name
        self.device = device

        print(f"Loading sentiment analysis model: {model_name}")

        # Load pipeline
        self.pipeline = pipeline(
            "sentiment-analysis",
            model=model_name,
            device=device
        )

    def analyze(self, text: str) -> Dict[str, Union[str, float]]:
        """
        Analyze sentiment of a single text

        Args:
            text: Input text

        Returns:
            Dictionary with label and score
        """
        result = self.pipeline(text)[0]

        return {
            'text': text,
            'label': result['label'],
            'score': result['score']
        }

    def analyze_batch(
        self,
        texts: List[str],
        batch_size: int = 8
    ) -> List[Dict[str, Union[str, float]]]:
        """
        Analyze sentiment of multiple texts

        Args:
            texts: List of input texts
            batch_size: Batch size for processing

        Returns:
            List of results
        """
        results = []

        for i in range(0, len(texts), batch_size):
            batch = texts[i:i + batch_size]
            batch_results = self.pipeline(batch)

            for text, result in zip(batch, batch_results):
                results.append({
                    'text': text,
                    'label': result['label'],
                    'score': result['score']
                })

        return results

    def get_sentiment_distribution(
        self,
        texts: List[str]
    ) -> Dict[str, int]:
        """
        Get distribution of sentiments in a list of texts

        Args:
            texts: List of texts

        Returns:
            Dictionary with sentiment counts
        """
        results = self.analyze_batch(texts)

        distribution = {}
        for result in results:
            label = result['label']
            distribution[label] = distribution.get(label, 0) + 1

        return distribution

    def filter_by_sentiment(
        self,
        texts: List[str],
        sentiment: str,
        threshold: float = 0.9
    ) -> List[Dict]:
        """
        Filter texts by sentiment

        Args:
            texts: List of texts
            sentiment: Target sentiment (POSITIVE, NEGATIVE)
            threshold: Minimum confidence score

        Returns:
            Filtered results
        """
        results = self.analyze_batch(texts)

        filtered = [
            r for r in results
            if r['label'] == sentiment and r['score'] >= threshold
        ]

        return filtered


class MultilingualSentimentAnalyzer:
    """Multilingual sentiment analysis"""

    def __init__(self, device: int = -1):
        """
        Initialize multilingual analyzer

        Args:
            device: Device to use (-1 for CPU, 0+ for GPU)
        """
        self.device = device

        print("Loading multilingual sentiment model...")
        self.pipeline = pipeline(
            "sentiment-analysis",
            model="nlptown/bert-base-multilingual-uncased-sentiment",
            device=device
        )

    def analyze(self, text: str) -> Dict[str, Union[str, float, int]]:
        """
        Analyze sentiment (1-5 stars)

        Args:
            text: Input text

        Returns:
            Dictionary with stars and score
        """
        result = self.pipeline(text)[0]

        # Extract star rating from label (e.g., "5 stars")
        stars = int(result['label'].split()[0])

        return {
            'text': text,
            'stars': stars,
            'score': result['score']
        }


def main():
    """Example usage"""
    import sys

    # Initialize analyzer
    print("Initializing sentiment analyzer...")
    analyzer = SentimentAnalyzer()

    # Example texts
    texts = [
        "I love this product! It's amazing!",
        "This is the worst experience ever.",
        "It's okay, nothing special.",
        "Absolutely fantastic! Highly recommend!",
        "Terrible quality, very disappointed."
    ]

    # Single analysis
    print("\n=== Single Text Analysis ===")
    result = analyzer.analyze(texts[0])
    print(f"Text: {result['text']}")
    print(f"Sentiment: {result['label']} ({result['score']:.2%})")

    # Batch analysis
    print("\n=== Batch Analysis ===")
    results = analyzer.analyze_batch(texts)

    for i, result in enumerate(results, 1):
        print(f"{i}. {result['label']:8} ({result['score']:.2%}): {result['text']}")

    # Distribution
    print("\n=== Sentiment Distribution ===")
    distribution = analyzer.get_sentiment_distribution(texts)
    for sentiment, count in distribution.items():
        print(f"{sentiment}: {count}")

    # Filter positive sentiments
    print("\n=== Highly Positive Texts ===")
    positive = analyzer.filter_by_sentiment(texts, "POSITIVE", threshold=0.95)
    for result in positive:
        print(f"- {result['text']} ({result['score']:.2%})")

    # Multilingual example
    print("\n=== Multilingual Sentiment Analysis ===")
    multi_analyzer = MultilingualSentimentAnalyzer()

    multilingual_texts = [
        "This is great!",
        "C'est fantastique!",
        "¡Esto es increíble!",
        "Das ist toll!"
    ]

    for text in multilingual_texts:
        result = multi_analyzer.analyze(text)
        print(f"{result['stars']} stars ({result['score']:.2%}): {result['text']}")


if __name__ == "__main__":
    main()
