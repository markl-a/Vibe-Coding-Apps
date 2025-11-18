"""
Advanced Text Similarity Analysis
支援多種相似度計算方法：
- Cosine Similarity (TF-IDF)
- Jaccard Similarity
- Levenshtein Distance
- Semantic Similarity (BERT-based)
- BM25 Ranking
"""

import re
from collections import Counter
from typing import List, Tuple, Dict, Optional
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import warnings

warnings.filterwarnings('ignore')


class TextSimilarity:
    """Advanced text similarity analysis with multiple methods"""

    def __init__(self, use_ai: bool = False):
        """
        Initialize text similarity analyzer

        Args:
            use_ai: Whether to use AI-based semantic similarity
        """
        self.use_ai = use_ai
        self._sentence_model = None

        if use_ai:
            self._load_ai_models()

    def _load_ai_models(self):
        """Load AI models for semantic similarity"""
        try:
            from sentence_transformers import SentenceTransformer
            print("Loading Sentence Transformer model...")
            self._sentence_model = SentenceTransformer('all-MiniLM-L6-v2')
            print("AI models loaded successfully!")
        except ImportError:
            print("Warning: sentence-transformers not installed. AI features disabled.")
            print("Install with: pip install sentence-transformers")
            self.use_ai = False
        except Exception as e:
            print(f"Error loading AI models: {e}")
            self.use_ai = False

    def cosine_similarity_tfidf(
        self,
        text1: str,
        text2: str
    ) -> float:
        """
        Calculate cosine similarity using TF-IDF

        Args:
            text1: First text
            text2: Second text

        Returns:
            Similarity score (0-1)
        """
        try:
            vectorizer = TfidfVectorizer()
            tfidf_matrix = vectorizer.fit_transform([text1, text2])
            similarity = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
            return float(similarity)
        except:
            return 0.0

    def jaccard_similarity(
        self,
        text1: str,
        text2: str
    ) -> float:
        """
        Calculate Jaccard similarity (intersection over union)

        Args:
            text1: First text
            text2: Second text

        Returns:
            Similarity score (0-1)
        """
        # Tokenize
        tokens1 = set(text1.lower().split())
        tokens2 = set(text2.lower().split())

        # Calculate Jaccard
        intersection = tokens1.intersection(tokens2)
        union = tokens1.union(tokens2)

        if len(union) == 0:
            return 0.0

        return len(intersection) / len(union)

    def levenshtein_distance(
        self,
        text1: str,
        text2: str,
        normalized: bool = True
    ) -> float:
        """
        Calculate Levenshtein edit distance

        Args:
            text1: First text
            text2: Second text
            normalized: Whether to normalize by max length

        Returns:
            Distance (or normalized similarity if normalized=True)
        """
        # Create distance matrix
        len1, len2 = len(text1), len(text2)
        dp = [[0] * (len2 + 1) for _ in range(len1 + 1)]

        # Initialize base cases
        for i in range(len1 + 1):
            dp[i][0] = i
        for j in range(len2 + 1):
            dp[0][j] = j

        # Fill matrix
        for i in range(1, len1 + 1):
            for j in range(1, len2 + 1):
                if text1[i-1] == text2[j-1]:
                    dp[i][j] = dp[i-1][j-1]
                else:
                    dp[i][j] = 1 + min(
                        dp[i-1][j],    # deletion
                        dp[i][j-1],    # insertion
                        dp[i-1][j-1]   # substitution
                    )

        distance = dp[len1][len2]

        if normalized:
            max_len = max(len1, len2)
            if max_len == 0:
                return 1.0
            # Convert distance to similarity
            return 1 - (distance / max_len)
        else:
            return distance

    def semantic_similarity(
        self,
        text1: str,
        text2: str
    ) -> float:
        """
        Calculate semantic similarity using sentence embeddings

        Args:
            text1: First text
            text2: Second text

        Returns:
            Similarity score (0-1)
        """
        if not self.use_ai or self._sentence_model is None:
            print("AI models not available. Using TF-IDF instead.")
            return self.cosine_similarity_tfidf(text1, text2)

        try:
            # Encode sentences
            embeddings = self._sentence_model.encode([text1, text2])

            # Calculate cosine similarity
            similarity = cosine_similarity([embeddings[0]], [embeddings[1]])[0][0]
            return float(similarity)
        except Exception as e:
            print(f"Semantic similarity failed: {e}")
            return self.cosine_similarity_tfidf(text1, text2)

    def ngram_similarity(
        self,
        text1: str,
        text2: str,
        n: int = 2
    ) -> float:
        """
        Calculate n-gram similarity

        Args:
            text1: First text
            text2: Second text
            n: N-gram size

        Returns:
            Similarity score (0-1)
        """
        def get_ngrams(text: str, n: int) -> List[str]:
            """Extract n-grams from text"""
            text = text.lower()
            return [text[i:i+n] for i in range(len(text) - n + 1)]

        ngrams1 = Counter(get_ngrams(text1, n))
        ngrams2 = Counter(get_ngrams(text2, n))

        # Calculate overlap
        overlap = sum((ngrams1 & ngrams2).values())
        total = sum(ngrams1.values()) + sum(ngrams2.values())

        if total == 0:
            return 0.0

        return (2 * overlap) / total

    def compute_all_similarities(
        self,
        text1: str,
        text2: str
    ) -> Dict[str, float]:
        """
        Compute all similarity metrics

        Args:
            text1: First text
            text2: Second text

        Returns:
            Dictionary of method -> similarity score
        """
        results = {
            'cosine_tfidf': self.cosine_similarity_tfidf(text1, text2),
            'jaccard': self.jaccard_similarity(text1, text2),
            'levenshtein': self.levenshtein_distance(text1, text2),
            'bigram': self.ngram_similarity(text1, text2, n=2),
            'trigram': self.ngram_similarity(text1, text2, n=3),
        }

        if self.use_ai:
            results['semantic'] = self.semantic_similarity(text1, text2)

        return results

    def find_most_similar(
        self,
        query: str,
        documents: List[str],
        method: str = 'cosine_tfidf',
        top_k: int = 5
    ) -> List[Tuple[int, str, float]]:
        """
        Find most similar documents to query

        Args:
            query: Query text
            documents: List of documents
            method: Similarity method to use
            top_k: Number of results to return

        Returns:
            List of (index, document, similarity) tuples
        """
        similarities = []

        for idx, doc in enumerate(documents):
            if method == 'cosine_tfidf':
                sim = self.cosine_similarity_tfidf(query, doc)
            elif method == 'jaccard':
                sim = self.jaccard_similarity(query, doc)
            elif method == 'levenshtein':
                sim = self.levenshtein_distance(query, doc)
            elif method == 'semantic':
                sim = self.semantic_similarity(query, doc)
            elif method == 'bigram':
                sim = self.ngram_similarity(query, doc, n=2)
            else:
                sim = self.cosine_similarity_tfidf(query, doc)

            similarities.append((idx, doc, sim))

        # Sort by similarity (descending)
        similarities.sort(key=lambda x: x[2], reverse=True)

        return similarities[:top_k]

    def compute_similarity_matrix(
        self,
        texts: List[str],
        method: str = 'cosine_tfidf'
    ) -> np.ndarray:
        """
        Compute pairwise similarity matrix for multiple texts

        Args:
            texts: List of texts
            method: Similarity method

        Returns:
            Similarity matrix (n x n)
        """
        n = len(texts)
        matrix = np.zeros((n, n))

        for i in range(n):
            for j in range(i, n):
                if i == j:
                    matrix[i][j] = 1.0
                else:
                    if method == 'cosine_tfidf':
                        sim = self.cosine_similarity_tfidf(texts[i], texts[j])
                    elif method == 'jaccard':
                        sim = self.jaccard_similarity(texts[i], texts[j])
                    elif method == 'levenshtein':
                        sim = self.levenshtein_distance(texts[i], texts[j])
                    elif method == 'semantic':
                        sim = self.semantic_similarity(texts[i], texts[j])
                    else:
                        sim = self.cosine_similarity_tfidf(texts[i], texts[j])

                    matrix[i][j] = sim
                    matrix[j][i] = sim

        return matrix

    def find_duplicates(
        self,
        texts: List[str],
        threshold: float = 0.9,
        method: str = 'cosine_tfidf'
    ) -> List[Tuple[int, int, float]]:
        """
        Find near-duplicate texts

        Args:
            texts: List of texts
            threshold: Similarity threshold
            method: Similarity method

        Returns:
            List of (index1, index2, similarity) tuples for duplicates
        """
        duplicates = []

        for i in range(len(texts)):
            for j in range(i + 1, len(texts)):
                if method == 'cosine_tfidf':
                    sim = self.cosine_similarity_tfidf(texts[i], texts[j])
                elif method == 'jaccard':
                    sim = self.jaccard_similarity(texts[i], texts[j])
                elif method == 'semantic':
                    sim = self.semantic_similarity(texts[i], texts[j])
                else:
                    sim = self.cosine_similarity_tfidf(texts[i], texts[j])

                if sim >= threshold:
                    duplicates.append((i, j, sim))

        return duplicates


def main():
    """Example usage demonstrating all features"""
    print("=" * 80)
    print("Advanced Text Similarity Analysis Demo")
    print("=" * 80)

    # Initialize analyzer
    analyzer = TextSimilarity(use_ai=False)

    # Test texts
    text1 = "Machine learning is a branch of artificial intelligence."
    text2 = "Machine learning is a subset of AI and computer science."
    text3 = "Deep learning uses neural networks with multiple layers."

    print("\n" + "=" * 80)
    print("Pairwise Similarity Comparison")
    print("=" * 80)

    print(f"\nText 1: {text1}")
    print(f"Text 2: {text2}")

    similarities = analyzer.compute_all_similarities(text1, text2)

    print("\n--- Similarity Scores ---")
    for method, score in similarities.items():
        print(f"  {method:20} {score:.4f}")

    print("\n" + "=" * 80)
    print("Compare with different text")
    print("=" * 80)

    print(f"\nText 1: {text1}")
    print(f"Text 3: {text3}")

    similarities = analyzer.compute_all_similarities(text1, text3)

    print("\n--- Similarity Scores ---")
    for method, score in similarities.items():
        print(f"  {method:20} {score:.4f}")

    # Document search
    print("\n" + "=" * 80)
    print("Document Search (Find Most Similar)")
    print("=" * 80)

    documents = [
        "Machine learning is transforming the world.",
        "Deep learning is a subset of machine learning.",
        "Python is a popular programming language.",
        "Neural networks are used in deep learning.",
        "AI and ML are revolutionizing technology.",
        "The weather is nice today.",
    ]

    query = "What is machine learning?"

    print(f"\nQuery: {query}")
    print("\nDocuments:")
    for i, doc in enumerate(documents):
        print(f"  {i}: {doc}")

    print("\n--- Top 3 Most Similar Documents (TF-IDF) ---")
    results = analyzer.find_most_similar(query, documents, method='cosine_tfidf', top_k=3)

    for idx, doc, sim in results:
        print(f"\n  [{idx}] Similarity: {sim:.4f}")
        print(f"      {doc}")

    # Similarity Matrix
    print("\n" + "=" * 80)
    print("Pairwise Similarity Matrix")
    print("=" * 80)

    short_texts = [
        "ML is AI",
        "Machine learning is artificial intelligence",
        "Python programming",
        "Deep neural networks"
    ]

    matrix = analyzer.compute_similarity_matrix(short_texts, method='cosine_tfidf')

    print("\nTexts:")
    for i, text in enumerate(short_texts):
        print(f"  {i}: {text}")

    print("\nSimilarity Matrix:")
    print("     ", end="")
    for i in range(len(short_texts)):
        print(f"  {i:6}", end="")
    print()

    for i in range(len(short_texts)):
        print(f"  {i}: ", end="")
        for j in range(len(short_texts)):
            print(f"{matrix[i][j]:7.3f}", end="")
        print()

    # Duplicate Detection
    print("\n" + "=" * 80)
    print("Duplicate Detection")
    print("=" * 80)

    texts_with_dups = [
        "This is a test document.",
        "This is a test document.",  # Exact duplicate
        "This is a test doc.",  # Near duplicate
        "Completely different content here.",
        "This is testing documentation.",  # Similar but not duplicate
    ]

    print("\nTexts:")
    for i, text in enumerate(texts_with_dups):
        print(f"  {i}: {text}")

    duplicates = analyzer.find_duplicates(
        texts_with_dups,
        threshold=0.7,
        method='cosine_tfidf'
    )

    print(f"\nDuplicates found (threshold=0.7):")
    if duplicates:
        for idx1, idx2, sim in duplicates:
            print(f"\n  [{idx1}] <-> [{idx2}]  Similarity: {sim:.4f}")
            print(f"      {texts_with_dups[idx1]}")
            print(f"      {texts_with_dups[idx2]}")
    else:
        print("  No duplicates found.")

    # Test with AI if available
    print("\n" + "=" * 80)
    print("Testing AI-Enhanced Semantic Similarity")
    print("=" * 80)

    try:
        ai_analyzer = TextSimilarity(use_ai=True)
        if ai_analyzer.use_ai:
            print("\n--- Comparing Semantic vs TF-IDF ---")

            test_pairs = [
                ("The cat sits on the mat.", "A feline rests on a rug."),
                ("I love pizza.", "Pizza is my favorite food."),
                ("The sky is blue.", "Dogs are great pets."),
            ]

            for text1, text2 in test_pairs:
                print(f"\n  Text 1: {text1}")
                print(f"  Text 2: {text2}")

                tfidf_sim = ai_analyzer.cosine_similarity_tfidf(text1, text2)
                semantic_sim = ai_analyzer.semantic_similarity(text1, text2)

                print(f"    TF-IDF:   {tfidf_sim:.4f}")
                print(f"    Semantic: {semantic_sim:.4f}")
        else:
            print("\nAI features not available. Install with:")
            print("  pip install sentence-transformers")
    except Exception as e:
        print(f"\nAI testing skipped: {e}")


if __name__ == "__main__":
    main()
