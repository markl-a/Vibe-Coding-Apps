"""
Zero-Shot Text Classification
無需訓練數據即可進行文本分類
使用 Hugging Face 的 zero-shot-classification pipeline
"""

from transformers import pipeline
import torch
from typing import List, Dict, Optional, Union
import warnings

warnings.filterwarnings('ignore')


class ZeroShotClassifier:
    """Zero-shot text classification without training data"""

    def __init__(
        self,
        model_name: str = "facebook/bart-large-mnli",
        device: Optional[str] = None
    ):
        """
        Initialize zero-shot classifier

        Args:
            model_name: Pre-trained model for zero-shot classification
            device: Device to use ('cuda', 'cpu', or None for auto)
        """
        if device is None:
            self.device = 0 if torch.cuda.is_available() else -1
        else:
            self.device = 0 if device == 'cuda' else -1

        print(f"Loading zero-shot model: {model_name}")
        print(f"Using device: {'GPU' if self.device == 0 else 'CPU'}")

        try:
            self.classifier = pipeline(
                "zero-shot-classification",
                model=model_name,
                device=self.device
            )
            self.model_name = model_name
            print("Model loaded successfully!")
        except Exception as e:
            print(f"Model loading failed: {e}")
            raise

    def classify(
        self,
        text: str,
        candidate_labels: List[str],
        multi_label: bool = False,
        hypothesis_template: str = "This text is about {}."
    ) -> Dict:
        """
        Classify text into one or more of the candidate labels

        Args:
            text: Input text to classify
            candidate_labels: List of possible labels
            multi_label: Whether to allow multiple labels
            hypothesis_template: Template for hypothesis generation

        Returns:
            Classification result with scores
        """
        if not text or not text.strip():
            return {"error": "Text cannot be empty"}

        if not candidate_labels:
            return {"error": "Candidate labels cannot be empty"}

        try:
            result = self.classifier(
                text,
                candidate_labels,
                multi_label=multi_label,
                hypothesis_template=hypothesis_template
            )

            return {
                'text': text[:100] + '...' if len(text) > 100 else text,
                'labels': result['labels'],
                'scores': result['scores'],
                'best_label': result['labels'][0],
                'best_score': result['scores'][0]
            }

        except Exception as e:
            return {
                'error': str(e),
                'text': text[:100]
            }

    def classify_batch(
        self,
        texts: List[str],
        candidate_labels: List[str],
        multi_label: bool = False
    ) -> List[Dict]:
        """
        Classify multiple texts

        Args:
            texts: List of texts
            candidate_labels: List of possible labels
            multi_label: Whether to allow multiple labels

        Returns:
            List of classification results
        """
        results = []

        for text in texts:
            result = self.classify(text, candidate_labels, multi_label=multi_label)
            results.append(result)

        return results

    def classify_with_threshold(
        self,
        text: str,
        candidate_labels: List[str],
        threshold: float = 0.5
    ) -> List[str]:
        """
        Get all labels above a confidence threshold

        Args:
            text: Input text
            candidate_labels: Possible labels
            threshold: Minimum confidence score

        Returns:
            List of labels above threshold
        """
        result = self.classify(text, candidate_labels, multi_label=True)

        if 'error' in result:
            return []

        selected_labels = []
        for label, score in zip(result['labels'], result['scores']):
            if score >= threshold:
                selected_labels.append(label)

        return selected_labels

    def hierarchical_classify(
        self,
        text: str,
        label_hierarchy: Dict[str, List[str]]
    ) -> Dict:
        """
        Perform hierarchical classification

        Args:
            text: Input text
            label_hierarchy: Dictionary mapping parent labels to child labels

        Returns:
            Hierarchical classification result
        """
        # First level classification
        parent_labels = list(label_hierarchy.keys())
        parent_result = self.classify(text, parent_labels)

        if 'error' in parent_result:
            return parent_result

        best_parent = parent_result['best_label']
        parent_score = parent_result['best_score']

        # Second level classification
        child_labels = label_hierarchy.get(best_parent, [])

        if child_labels:
            child_result = self.classify(text, child_labels)

            return {
                'text': text[:100] + '...' if len(text) > 100 else text,
                'parent_label': best_parent,
                'parent_score': parent_score,
                'child_label': child_result['best_label'],
                'child_score': child_result['best_score'],
                'full_path': f"{best_parent} > {child_result['best_label']}"
            }
        else:
            return {
                'text': text[:100] + '...' if len(text) > 100 else text,
                'parent_label': best_parent,
                'parent_score': parent_score,
                'child_label': None,
                'child_score': None
            }


def main():
    """Example usage demonstrating zero-shot classification"""
    print("=" * 80)
    print("Zero-Shot Text Classification Demo")
    print("=" * 80)

    # Initialize classifier
    classifier = ZeroShotClassifier()

    # Example 1: News category classification
    print("\n" + "=" * 80)
    print("Example 1: News Category Classification")
    print("=" * 80)

    news_text = """
    Apple announced its latest iPhone model with improved camera capabilities
    and a faster processor. The new device features a 6.7-inch display and
    enhanced battery life. Pre-orders start next week.
    """

    categories = ["technology", "sports", "politics", "entertainment", "health"]

    print(f"\nText: {news_text.strip()}")
    print(f"\nCandidate categories: {categories}")

    result = classifier.classify(news_text, categories)

    if 'error' not in result:
        print("\nClassification results:")
        for label, score in zip(result['labels'], result['scores']):
            print(f"  {label:15} {score:.4f} {'█' * int(score * 40)}")

        print(f"\nBest match: {result['best_label']} (confidence: {result['best_score']:.4f})")

    # Example 2: Sentiment analysis
    print("\n" + "=" * 80)
    print("Example 2: Custom Sentiment Analysis")
    print("=" * 80)

    reviews = [
        "This product is amazing! Best purchase I've ever made!",
        "Terrible quality, broke after one day. Complete waste of money.",
        "It's okay, nothing special. Works as expected."
    ]

    sentiments = ["positive", "negative", "neutral"]

    print("\nAnalyzing customer reviews:\n")

    for review in reviews:
        result = classifier.classify(review, sentiments)

        if 'error' not in result:
            print(f"Review: {review}")
            print(f"Sentiment: {result['best_label']} ({result['best_score']:.2%})\n")

    # Example 3: Multi-label classification
    print("=" * 80)
    print("Example 3: Multi-Label Classification")
    print("=" * 80)

    movie_description = """
    A group of astronauts travel through a wormhole in space in search of a
    new habitable planet for humanity. Emotional drama unfolds as they face
    time dilation and must make difficult choices to save the human race.
    """

    genres = ["action", "drama", "science fiction", "comedy", "romance", "thriller"]

    print(f"\nMovie description: {movie_description.strip()}")
    print(f"\nPossible genres: {genres}")

    result = classifier.classify(movie_description, genres, multi_label=True)

    if 'error' not in result:
        print("\nGenre scores:")
        for label, score in zip(result['labels'], result['scores']):
            print(f"  {label:20} {score:.4f} {'█' * int(score * 40)}")

        # Get genres above threshold
        selected = classifier.classify_with_threshold(movie_description, genres, threshold=0.3)
        print(f"\nSelected genres (threshold=0.3): {selected}")

    # Example 4: Intent classification for chatbot
    print("\n" + "=" * 80)
    print("Example 4: Chatbot Intent Classification")
    print("=" * 80)

    user_messages = [
        "I want to cancel my subscription",
        "How much does premium cost?",
        "My app is crashing constantly",
        "Thank you for your help!",
        "I'd like to upgrade my plan"
    ]

    intents = ["cancel_service", "pricing_inquiry", "technical_support", "gratitude", "upgrade_request"]

    print("\nClassifying user intents:\n")

    for message in user_messages:
        result = classifier.classify(message, intents)

        if 'error' not in result:
            print(f"User: {message}")
            print(f"Intent: {result['best_label']} (confidence: {result['best_score']:.2%})\n")

    # Example 5: Hierarchical classification
    print("=" * 80)
    print("Example 5: Hierarchical Topic Classification")
    print("=" * 80)

    article = """
    Researchers have developed a new machine learning algorithm that can
    predict protein structures with unprecedented accuracy. This breakthrough
    could accelerate drug discovery and help develop treatments for diseases.
    """

    # Define hierarchy
    hierarchy = {
        "science": ["biology", "physics", "chemistry", "computer science"],
        "business": ["finance", "marketing", "management"],
        "arts": ["music", "literature", "visual arts"]
    }

    print(f"\nArticle: {article.strip()}")
    print("\nHierarchy:")
    for parent, children in hierarchy.items():
        print(f"  {parent}")
        for child in children:
            print(f"    - {child}")

    result = classifier.hierarchical_classify(article, hierarchy)

    if 'error' not in result:
        print(f"\nClassification result:")
        print(f"  Category: {result['parent_label']} (score: {result['parent_score']:.4f})")
        if result['child_label']:
            print(f"  Subcategory: {result['child_label']} (score: {result['child_score']:.4f})")
            print(f"  Full path: {result['full_path']}")

    # Example 6: Custom hypotheses
    print("\n" + "=" * 80)
    print("Example 6: Custom Hypothesis Templates")
    print("=" * 80)

    text = "The movie was entertaining but a bit too long."

    print(f"\nText: {text}")
    print("\nComparing different hypothesis templates:\n")

    templates = [
        "This text is about {}.",
        "The sentiment is {}.",
        "The review is {}.",
    ]

    labels = ["positive", "negative", "mixed"]

    for template in templates:
        result = classifier.classify(text, labels, hypothesis_template=template)

        if 'error' not in result:
            print(f"Template: '{template}'")
            print(f"  Result: {result['best_label']} ({result['best_score']:.4f})\n")


if __name__ == "__main__":
    main()
