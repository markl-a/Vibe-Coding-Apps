"""
Keyword Extraction
"""
import re
from collections import Counter
from typing import List, Tuple
import numpy as np


class KeywordExtractor:
    """Extract keywords from text"""

    def __init__(self):
        """Initialize keyword extractor"""
        # Common English stop words
        self.stop_words = set([
            'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
            'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the',
            'to', 'was', 'will', 'with', 'this', 'but', 'they', 'have', 'had',
            'what', 'when', 'where', 'who', 'which', 'why', 'how'
        ])

    def preprocess_text(self, text: str) -> List[str]:
        """
        Preprocess text for keyword extraction

        Args:
            text: Input text

        Returns:
            List of processed tokens
        """
        # Convert to lowercase
        text = text.lower()

        # Remove special characters and digits
        text = re.sub(r'[^a-z\s]', '', text)

        # Tokenize
        tokens = text.split()

        # Remove stop words and short words
        tokens = [
            word for word in tokens
            if word not in self.stop_words and len(word) > 2
        ]

        return tokens

    def extract(
        self,
        text: str,
        top_n: int = 10,
        method: str = 'frequency'
    ) -> List[Tuple[str, float]]:
        """
        Extract keywords from text

        Args:
            text: Input text
            top_n: Number of keywords to extract
            method: Extraction method ('frequency', 'tfidf')

        Returns:
            List of (keyword, score) tuples
        """
        tokens = self.preprocess_text(text)

        if method == 'frequency':
            return self._frequency_based(tokens, top_n)
        elif method == 'tfidf':
            return self._tfidf_based(text, top_n)
        else:
            raise ValueError(f"Unknown method: {method}")

    def _frequency_based(
        self,
        tokens: List[str],
        top_n: int
    ) -> List[Tuple[str, float]]:
        """
        Frequency-based keyword extraction

        Args:
            tokens: List of tokens
            top_n: Number of keywords

        Returns:
            List of (keyword, frequency) tuples
        """
        # Count frequencies
        counter = Counter(tokens)

        # Get total count
        total = sum(counter.values())

        # Calculate normalized scores
        keywords = [
            (word, count / total)
            for word, count in counter.most_common(top_n)
        ]

        return keywords

    def _tfidf_based(
        self,
        text: str,
        top_n: int
    ) -> List[Tuple[str, float]]:
        """
        TF-IDF based keyword extraction (simplified)

        Args:
            text: Input text
            top_n: Number of keywords

        Returns:
            List of (keyword, tfidf_score) tuples
        """
        from sklearn.feature_extraction.text import TfidfVectorizer

        # Create TF-IDF vectorizer
        vectorizer = TfidfVectorizer(
            stop_words='english',
            max_features=top_n,
            lowercase=True
        )

        # Fit and transform
        tfidf_matrix = vectorizer.fit_transform([text])

        # Get feature names and scores
        feature_names = vectorizer.get_feature_names_out()
        scores = tfidf_matrix.toarray()[0]

        # Sort by score
        keywords = sorted(
            zip(feature_names, scores),
            key=lambda x: x[1],
            reverse=True
        )

        return keywords[:top_n]

    def extract_phrases(
        self,
        text: str,
        n_gram: int = 2,
        top_n: int = 10
    ) -> List[Tuple[str, int]]:
        """
        Extract keyword phrases (n-grams)

        Args:
            text: Input text
            n_gram: N-gram size (2 for bigrams, 3 for trigrams)
            top_n: Number of phrases

        Returns:
            List of (phrase, frequency) tuples
        """
        tokens = self.preprocess_text(text)

        # Generate n-grams
        n_grams = []
        for i in range(len(tokens) - n_gram + 1):
            phrase = ' '.join(tokens[i:i + n_gram])
            n_grams.append(phrase)

        # Count frequencies
        counter = Counter(n_grams)

        return counter.most_common(top_n)


def main():
    """Example usage"""
    text = """
    Machine learning is a subset of artificial intelligence that focuses on
    the development of algorithms and statistical models. These machine learning
    models enable computer systems to improve their performance on tasks through
    experience. Deep learning, a subset of machine learning, uses neural networks
    with multiple layers. Natural language processing is another important area
    of artificial intelligence that deals with text and language understanding.
    """

    extractor = KeywordExtractor()

    # Frequency-based extraction
    print("=== Frequency-based Keywords ===")
    keywords = extractor.extract(text, top_n=10, method='frequency')
    for word, score in keywords:
        print(f"{word}: {score:.3f}")

    # TF-IDF based extraction
    print("\n=== TF-IDF Keywords ===")
    keywords = extractor.extract(text, top_n=10, method='tfidf')
    for word, score in keywords:
        print(f"{word}: {score:.3f}")

    # Phrase extraction
    print("\n=== Bigram Phrases ===")
    phrases = extractor.extract_phrases(text, n_gram=2, top_n=5)
    for phrase, freq in phrases:
        print(f"{phrase}: {freq}")


if __name__ == "__main__":
    main()
