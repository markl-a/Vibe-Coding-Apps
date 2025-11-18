"""
Advanced Keyword Extraction
支援多種關鍵字提取方法：
- TF-IDF
- RAKE (Rapid Automatic Keyword Extraction)
- YAKE (Yet Another Keyword Extractor)
- KeyBERT (BERT-based keyword extraction)
- TextRank
"""
import re
from collections import Counter, defaultdict
from typing import List, Tuple, Dict, Optional
import numpy as np
from itertools import combinations
import warnings

warnings.filterwarnings('ignore')


class KeywordExtractor:
    """Advanced keyword extraction with multiple methods"""

    def __init__(self, use_ai: bool = False):
        """
        Initialize keyword extractor

        Args:
            use_ai: Whether to use AI-enhanced methods (requires additional models)
        """
        self.use_ai = use_ai

        # Common English stop words
        self.stop_words = set([
            'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
            'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the',
            'to', 'was', 'will', 'with', 'this', 'but', 'they', 'have', 'had',
            'what', 'when', 'where', 'who', 'which', 'why', 'how', 'been',
            'being', 'been', 'would', 'could', 'should', 'may', 'might', 'must',
            'can', 'will', 'shall', 'do', 'does', 'did', 'doing', 'done'
        ])

        # Load AI models if requested
        self._bert_model = None
        self._sentence_model = None
        if use_ai:
            self._load_ai_models()

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

    def _load_ai_models(self):
        """Load AI models for advanced keyword extraction"""
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

    def extract_rake(
        self,
        text: str,
        top_n: int = 10,
        max_words: int = 4
    ) -> List[Tuple[str, float]]:
        """
        RAKE (Rapid Automatic Keyword Extraction) algorithm

        Args:
            text: Input text
            top_n: Number of keywords
            max_words: Maximum words per phrase

        Returns:
            List of (phrase, score) tuples
        """
        # Split into sentences
        sentences = re.split(r'[.!?;]', text.lower())

        # Extract candidate phrases
        phrases = []
        for sentence in sentences:
            words = re.findall(r'\b[a-z]+\b', sentence)
            phrase = []
            for word in words:
                if word not in self.stop_words and len(word) > 2:
                    phrase.append(word)
                else:
                    if len(phrase) > 0 and len(phrase) <= max_words:
                        phrases.append(' '.join(phrase))
                    phrase = []
            if len(phrase) > 0 and len(phrase) <= max_words:
                phrases.append(' '.join(phrase))

        if not phrases:
            return []

        # Calculate word scores
        word_freq = Counter()
        word_degree = defaultdict(int)

        for phrase in phrases:
            words = phrase.split()
            degree = len(words) - 1
            for word in words:
                word_freq[word] += 1
                word_degree[word] += degree

        # Calculate word scores (degree/frequency)
        word_scores = {}
        for word in word_freq:
            word_scores[word] = word_degree[word] / word_freq[word]

        # Calculate phrase scores
        phrase_scores = {}
        for phrase in phrases:
            words = phrase.split()
            score = sum(word_scores.get(word, 0) for word in words)
            phrase_scores[phrase] = score

        # Sort and return top phrases
        sorted_phrases = sorted(
            phrase_scores.items(),
            key=lambda x: x[1],
            reverse=True
        )

        return sorted_phrases[:top_n]

    def extract_textrank(
        self,
        text: str,
        top_n: int = 10,
        window: int = 2
    ) -> List[Tuple[str, float]]:
        """
        TextRank algorithm for keyword extraction

        Args:
            text: Input text
            top_n: Number of keywords
            window: Co-occurrence window size

        Returns:
            List of (keyword, score) tuples
        """
        tokens = self.preprocess_text(text)

        if len(tokens) < 2:
            return []

        # Build co-occurrence graph
        graph = defaultdict(lambda: defaultdict(int))

        for i, word in enumerate(tokens):
            for j in range(max(0, i - window), min(len(tokens), i + window + 1)):
                if i != j:
                    graph[word][tokens[j]] += 1

        # TextRank scoring (simplified PageRank)
        scores = {word: 1.0 for word in graph}
        damping = 0.85
        iterations = 30

        for _ in range(iterations):
            new_scores = {}
            for word in graph:
                rank_sum = 0
                for neighbor, weight in graph[word].items():
                    neighbor_sum = sum(graph[neighbor].values())
                    if neighbor_sum > 0:
                        rank_sum += (weight / neighbor_sum) * scores.get(neighbor, 1.0)
                new_scores[word] = (1 - damping) + damping * rank_sum
            scores = new_scores

        # Sort by score
        sorted_words = sorted(scores.items(), key=lambda x: x[1], reverse=True)

        return sorted_words[:top_n]

    def extract_keybert(
        self,
        text: str,
        top_n: int = 10,
        diversity: float = 0.5
    ) -> List[Tuple[str, float]]:
        """
        KeyBERT: BERT-based keyword extraction

        Args:
            text: Input text
            top_n: Number of keywords
            diversity: Diversity of results (0-1, higher = more diverse)

        Returns:
            List of (keyword, score) tuples
        """
        if not self.use_ai or self._sentence_model is None:
            print("AI models not available. Falling back to TF-IDF.")
            return self.extract(text, top_n, method='tfidf')

        try:
            from sklearn.metrics.pairwise import cosine_similarity

            # Extract candidate keywords (unigrams, bigrams, trigrams)
            candidates = []

            # Unigrams
            tokens = self.preprocess_text(text)
            candidates.extend(tokens)

            # Bigrams
            for i in range(len(tokens) - 1):
                candidates.append(f"{tokens[i]} {tokens[i+1]}")

            # Trigrams
            for i in range(len(tokens) - 2):
                candidates.append(f"{tokens[i]} {tokens[i+1]} {tokens[i+2]}")

            if not candidates:
                return []

            # Encode text and candidates
            doc_embedding = self._sentence_model.encode([text])
            candidate_embeddings = self._sentence_model.encode(candidates)

            # Calculate similarities
            similarities = cosine_similarity(doc_embedding, candidate_embeddings)[0]

            # Get top candidates
            candidate_scores = list(zip(candidates, similarities))
            candidate_scores = sorted(candidate_scores, key=lambda x: x[1], reverse=True)

            # Maximal Marginal Relevance (MMR) for diversity
            if diversity > 0:
                selected = []
                candidates_list = [c for c, _ in candidate_scores]
                scores_list = [s for _, s in candidate_scores]

                while len(selected) < top_n and candidates_list:
                    if not selected:
                        # Select first candidate
                        idx = 0
                    else:
                        # Calculate MMR scores
                        mmr_scores = []
                        selected_embeddings = self._sentence_model.encode(selected)

                        for i, cand in enumerate(candidates_list):
                            cand_emb = candidate_embeddings[candidates.index(cand)]
                            relevance = scores_list[i]

                            # Max similarity to already selected
                            max_sim = max(
                                cosine_similarity([cand_emb], selected_embeddings)[0]
                            )

                            # MMR = relevance - diversity * max_similarity
                            mmr = relevance - diversity * max_sim
                            mmr_scores.append(mmr)

                        idx = np.argmax(mmr_scores)

                    selected.append(candidates_list[idx])
                    candidates_list.pop(idx)
                    scores_list.pop(idx)

                # Get scores for selected candidates
                result = []
                for kw in selected:
                    orig_idx = candidates.index(kw)
                    result.append((kw, similarities[orig_idx]))

                return result
            else:
                return candidate_scores[:top_n]

        except Exception as e:
            print(f"KeyBERT extraction failed: {e}")
            return self.extract(text, top_n, method='tfidf')

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

    def extract_all_methods(
        self,
        text: str,
        top_n: int = 10
    ) -> Dict[str, List[Tuple[str, float]]]:
        """
        Extract keywords using all available methods

        Args:
            text: Input text
            top_n: Number of keywords per method

        Returns:
            Dictionary of method -> keywords
        """
        results = {
            'frequency': self.extract(text, top_n, method='frequency'),
            'tfidf': self.extract(text, top_n, method='tfidf'),
            'rake': self.extract_rake(text, top_n),
            'textrank': self.extract_textrank(text, top_n),
        }

        if self.use_ai:
            results['keybert'] = self.extract_keybert(text, top_n)

        return results

    def compare_methods(
        self,
        text: str,
        top_n: int = 10
    ) -> None:
        """
        Compare different keyword extraction methods

        Args:
            text: Input text
            top_n: Number of keywords per method
        """
        results = self.extract_all_methods(text, top_n)

        print("=" * 80)
        print("Keyword Extraction Method Comparison")
        print("=" * 80)

        for method, keywords in results.items():
            print(f"\n{method.upper()}:")
            print("-" * 40)
            for kw, score in keywords[:5]:  # Show top 5
                print(f"  {kw:30} {score:.4f}")

    def get_keyword_context(
        self,
        text: str,
        keyword: str,
        window: int = 50
    ) -> List[str]:
        """
        Get context snippets where keyword appears

        Args:
            text: Input text
            keyword: Keyword to find
            window: Number of characters around keyword

        Returns:
            List of context snippets
        """
        contexts = []
        keyword_lower = keyword.lower()
        text_lower = text.lower()

        start = 0
        while True:
            idx = text_lower.find(keyword_lower, start)
            if idx == -1:
                break

            context_start = max(0, idx - window)
            context_end = min(len(text), idx + len(keyword) + window)

            context = text[context_start:context_end]
            if context_start > 0:
                context = "..." + context
            if context_end < len(text):
                context = context + "..."

            contexts.append(context)
            start = idx + 1

        return contexts


def main():
    """Example usage showcasing all features"""
    text = """
    Machine learning is a subset of artificial intelligence that focuses on
    the development of algorithms and statistical models. These machine learning
    models enable computer systems to improve their performance on tasks through
    experience. Deep learning, a subset of machine learning, uses neural networks
    with multiple layers. Natural language processing is another important area
    of artificial intelligence that deals with text and language understanding.
    The field of machine learning has revolutionized many industries including
    healthcare, finance, and autonomous vehicles. Neural networks and deep learning
    techniques have enabled breakthrough achievements in computer vision, speech
    recognition, and natural language processing tasks.
    """

    print("=" * 80)
    print("Advanced Keyword Extraction Demo")
    print("=" * 80)

    # Initialize extractor (without AI for basic demo)
    extractor = KeywordExtractor(use_ai=False)

    # Frequency-based extraction
    print("\n=== Frequency-based Keywords ===")
    keywords = extractor.extract(text, top_n=8, method='frequency')
    for word, score in keywords:
        print(f"  {word:25} {score:.4f}")

    # TF-IDF based extraction
    print("\n=== TF-IDF Keywords ===")
    keywords = extractor.extract(text, top_n=8, method='tfidf')
    for word, score in keywords:
        print(f"  {word:25} {score:.4f}")

    # RAKE extraction
    print("\n=== RAKE (Phrase-based) ===")
    keywords = extractor.extract_rake(text, top_n=8)
    for phrase, score in keywords:
        print(f"  {phrase:35} {score:.4f}")

    # TextRank extraction
    print("\n=== TextRank (Graph-based) ===")
    keywords = extractor.extract_textrank(text, top_n=8)
    for word, score in keywords:
        print(f"  {word:25} {score:.4f}")

    # Phrase extraction
    print("\n=== Bigram Phrases ===")
    phrases = extractor.extract_phrases(text, n_gram=2, top_n=8)
    for phrase, freq in phrases:
        print(f"  {phrase:35} {freq}")

    # Trigram Phrases
    print("\n=== Trigram Phrases ===")
    phrases = extractor.extract_phrases(text, n_gram=3, top_n=5)
    for phrase, freq in phrases:
        print(f"  {phrase:45} {freq}")

    # Method comparison
    print("\n")
    extractor.compare_methods(text, top_n=5)

    # Keyword context
    print("\n" + "=" * 80)
    print("Keyword Context Examples")
    print("=" * 80)
    keyword = "machine learning"
    contexts = extractor.get_keyword_context(text, keyword, window=60)
    print(f"\nContexts for '{keyword}':")
    for i, context in enumerate(contexts, 1):
        print(f"\n{i}. {context}")

    # AI-enhanced extraction (if available)
    print("\n" + "=" * 80)
    print("Testing AI-Enhanced Features")
    print("=" * 80)

    try:
        ai_extractor = KeywordExtractor(use_ai=True)
        if ai_extractor.use_ai:
            print("\n=== KeyBERT (AI-based) ===")
            keywords = ai_extractor.extract_keybert(text, top_n=8, diversity=0.7)
            for word, score in keywords:
                print(f"  {word:35} {score:.4f}")
        else:
            print("\nAI features not available. Install with:")
            print("  pip install sentence-transformers")
    except Exception as e:
        print(f"\nAI extraction not available: {e}")


if __name__ == "__main__":
    main()
