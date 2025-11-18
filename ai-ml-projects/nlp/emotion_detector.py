"""
Emotion Detection System
檢測文本中的情緒（更細緻than sentiment analysis）
支援多種情緒：joy, sadness, anger, fear, surprise, love, etc.
"""

from transformers import pipeline
import torch
from typing import List, Dict, Optional, Tuple
from collections import Counter
import warnings

warnings.filterwarnings('ignore')


class EmotionDetector:
    """Detect emotions in text with fine-grained analysis"""

    # Standard emotion categories
    EMOTION_CATEGORIES = {
        'joy': ['happy', 'delighted', 'cheerful', 'excited', 'joyful'],
        'sadness': ['sad', 'disappointed', 'depressed', 'unhappy', 'melancholy'],
        'anger': ['angry', 'furious', 'annoyed', 'irritated', 'enraged'],
        'fear': ['afraid', 'scared', 'anxious', 'worried', 'terrified'],
        'surprise': ['surprised', 'amazed', 'astonished', 'shocked'],
        'love': ['loving', 'affectionate', 'caring', 'tender'],
        'disgust': ['disgusted', 'revolted', 'repulsed'],
    }

    def __init__(
        self,
        model_name: str = "bhadresh-savani/distilbert-base-uncased-emotion",
        device: Optional[str] = None,
        use_zero_shot: bool = False
    ):
        """
        Initialize emotion detector

        Args:
            model_name: Pre-trained emotion detection model
            device: Device to use ('cuda', 'cpu', or None for auto)
            use_zero_shot: Use zero-shot classification instead
        """
        if device is None:
            self.device = 0 if torch.cuda.is_available() else -1
        else:
            self.device = 0 if device == 'cuda' else -1

        self.use_zero_shot = use_zero_shot

        print(f"Loading emotion detection model: {model_name}")
        print(f"Using device: {'GPU' if self.device == 0 else 'CPU'}")

        try:
            if use_zero_shot:
                self.detector = pipeline(
                    "zero-shot-classification",
                    model="facebook/bart-large-mnli",
                    device=self.device
                )
            else:
                self.detector = pipeline(
                    "text-classification",
                    model=model_name,
                    device=self.device,
                    top_k=None  # Return all scores
                )

            self.model_name = model_name
            print("Model loaded successfully!")
        except Exception as e:
            print(f"Model loading failed: {e}")
            raise

    def detect(
        self,
        text: str,
        top_k: int = 3
    ) -> Dict:
        """
        Detect emotions in text

        Args:
            text: Input text
            top_k: Number of top emotions to return

        Returns:
            Dictionary with emotion scores
        """
        if not text or not text.strip():
            return {"error": "Text cannot be empty"}

        try:
            if self.use_zero_shot:
                # Use zero-shot with emotion labels
                labels = list(self.EMOTION_CATEGORIES.keys())
                result = self.detector(
                    text,
                    labels,
                    multi_label=True
                )

                emotions = []
                for label, score in zip(result['labels'], result['scores']):
                    emotions.append({
                        'emotion': label,
                        'score': float(score)
                    })

            else:
                # Use fine-tuned emotion model
                result = self.detector(text)

                if isinstance(result[0], list):
                    result = result[0]

                emotions = []
                for item in result:
                    emotions.append({
                        'emotion': item['label'],
                        'score': float(item['score'])
                    })

            # Sort by score
            emotions = sorted(emotions, key=lambda x: x['score'], reverse=True)

            return {
                'text': text[:100] + '...' if len(text) > 100 else text,
                'emotions': emotions[:top_k],
                'primary_emotion': emotions[0]['emotion'],
                'confidence': emotions[0]['score'],
                'all_emotions': emotions
            }

        except Exception as e:
            return {
                'error': str(e),
                'text': text[:100]
            }

    def detect_batch(
        self,
        texts: List[str],
        top_k: int = 3
    ) -> List[Dict]:
        """
        Detect emotions in multiple texts

        Args:
            texts: List of texts
            top_k: Number of top emotions per text

        Returns:
            List of detection results
        """
        results = []

        for text in texts:
            result = self.detect(text, top_k=top_k)
            results.append(result)

        return results

    def get_emotion_distribution(
        self,
        texts: List[str]
    ) -> Dict[str, int]:
        """
        Get emotion distribution across multiple texts

        Args:
            texts: List of texts

        Returns:
            Dictionary of emotion -> count
        """
        emotions = []

        for text in texts:
            result = self.detect(text, top_k=1)

            if 'error' not in result:
                emotions.append(result['primary_emotion'])

        return dict(Counter(emotions))

    def analyze_conversation(
        self,
        messages: List[str]
    ) -> Dict:
        """
        Analyze emotional flow in a conversation

        Args:
            messages: List of messages in order

        Returns:
            Conversation analysis with emotional arc
        """
        emotional_arc = []

        for i, message in enumerate(messages):
            result = self.detect(message, top_k=1)

            if 'error' not in result:
                emotional_arc.append({
                    'index': i,
                    'message': message[:50] + '...' if len(message) > 50 else message,
                    'emotion': result['primary_emotion'],
                    'confidence': result['confidence']
                })

        # Get overall emotion distribution
        emotions = [turn['emotion'] for turn in emotional_arc]
        distribution = dict(Counter(emotions))

        return {
            'num_messages': len(messages),
            'emotional_arc': emotional_arc,
            'emotion_distribution': distribution,
            'dominant_emotion': max(distribution.items(), key=lambda x: x[1])[0] if distribution else None
        }

    def compare_emotions(
        self,
        text1: str,
        text2: str
    ) -> Dict:
        """
        Compare emotions between two texts

        Args:
            text1: First text
            text2: Second text

        Returns:
            Comparison result
        """
        result1 = self.detect(text1, top_k=3)
        result2 = self.detect(text2, top_k=3)

        if 'error' in result1 or 'error' in result2:
            return {'error': 'Failed to detect emotions'}

        return {
            'text1': {
                'text': text1[:50] + '...' if len(text1) > 50 else text1,
                'primary_emotion': result1['primary_emotion'],
                'confidence': result1['confidence']
            },
            'text2': {
                'text': text2[:50] + '...' if len(text2) > 50 else text2,
                'primary_emotion': result2['primary_emotion'],
                'confidence': result2['confidence']
            },
            'same_emotion': result1['primary_emotion'] == result2['primary_emotion'],
            'emotional_contrast': abs(result1['confidence'] - result2['confidence'])
        }

    def get_emotion_intensity(
        self,
        text: str
    ) -> Tuple[str, str]:
        """
        Get emotion and its intensity

        Args:
            text: Input text

        Returns:
            Tuple of (emotion, intensity)
        """
        result = self.detect(text, top_k=1)

        if 'error' in result:
            return ('unknown', 'none')

        confidence = result['confidence']

        if confidence > 0.8:
            intensity = 'very strong'
        elif confidence > 0.6:
            intensity = 'strong'
        elif confidence > 0.4:
            intensity = 'moderate'
        elif confidence > 0.2:
            intensity = 'weak'
        else:
            intensity = 'very weak'

        return (result['primary_emotion'], intensity)


def main():
    """Example usage demonstrating emotion detection"""
    print("=" * 80)
    print("Emotion Detection System Demo")
    print("=" * 80)

    # Initialize detector
    detector = EmotionDetector()

    # Example 1: Basic emotion detection
    print("\n" + "=" * 80)
    print("Example 1: Basic Emotion Detection")
    print("=" * 80)

    test_texts = [
        "I'm so happy and excited about the new job!",
        "I'm feeling really sad and depressed today.",
        "This makes me so angry and frustrated!",
        "I'm scared and worried about the future.",
        "Wow, I can't believe this happened! Amazing!",
        "I love spending time with my family.",
    ]

    for text in test_texts:
        result = detector.detect(text, top_k=3)

        if 'error' not in result:
            print(f"\nText: {text}")
            print(f"Primary emotion: {result['primary_emotion']} (confidence: {result['confidence']:.4f})")

            print("Top 3 emotions:")
            for emotion in result['emotions']:
                bar = '█' * int(emotion['score'] * 40)
                print(f"  {emotion['emotion']:12} {emotion['score']:.4f} {bar}")

    # Example 2: Emotion intensity
    print("\n" + "=" * 80)
    print("Example 2: Emotion Intensity Analysis")
    print("=" * 80)

    intensity_tests = [
        "I'm extremely happy!",
        "I'm kind of happy.",
        "I'm a bit sad.",
        "I'm absolutely furious!",
    ]

    print("\nAnalyzing emotion intensity:\n")

    for text in intensity_tests:
        emotion, intensity = detector.get_emotion_intensity(text)
        print(f"Text: {text}")
        print(f"  Emotion: {emotion}, Intensity: {intensity}\n")

    # Example 3: Batch processing
    print("=" * 80)
    print("Example 3: Batch Emotion Detection")
    print("=" * 80)

    reviews = [
        "This product exceeded my expectations! Love it!",
        "Disappointed with the quality. Not worth the price.",
        "It's okay, nothing special.",
        "Terrible customer service. Very frustrating experience.",
        "Amazing! Best purchase ever!",
    ]

    print("\nAnalyzing customer reviews:\n")

    results = detector.detect_batch(reviews, top_k=1)

    for review, result in zip(reviews, results):
        if 'error' not in result:
            print(f"Review: {review}")
            print(f"  Emotion: {result['primary_emotion']} ({result['confidence']:.2%})\n")

    # Emotion distribution
    distribution = detector.get_emotion_distribution(reviews)
    print("Emotion distribution:")
    for emotion, count in sorted(distribution.items(), key=lambda x: x[1], reverse=True):
        print(f"  {emotion:12} {'█' * count} ({count})")

    # Example 4: Conversation analysis
    print("\n" + "=" * 80)
    print("Example 4: Conversation Emotional Arc")
    print("=" * 80)

    conversation = [
        "Hi! I'm so excited to start working with you!",
        "Thanks! I have a question about the project.",
        "I'm a bit confused about the requirements.",
        "Oh no, this is more complicated than I thought.",
        "I'm getting frustrated with this issue.",
        "Wait, I think I found a solution!",
        "Yes! It works! I'm so happy!",
    ]

    print("\nAnalyzing conversation:\n")

    analysis = detector.analyze_conversation(conversation)

    print(f"Number of messages: {analysis['num_messages']}")
    print("\nEmotional arc:")

    for turn in analysis['emotional_arc']:
        print(f"  {turn['index']+1}. [{turn['emotion']:8}] {turn['message']}")

    print(f"\nDominant emotion: {analysis['dominant_emotion']}")

    print("\nEmotion distribution:")
    for emotion, count in sorted(analysis['emotion_distribution'].items(), key=lambda x: x[1], reverse=True):
        print(f"  {emotion:12} {'█' * count} ({count})")

    # Example 5: Emotion comparison
    print("\n" + "=" * 80)
    print("Example 5: Comparing Emotions Between Texts")
    print("=" * 80)

    pairs = [
        ("I love this movie!", "I hate this movie!"),
        ("Great day today!", "Having a wonderful time!"),
        ("This is scary.", "I'm feeling anxious."),
    ]

    for text1, text2 in pairs:
        comparison = detector.compare_emotions(text1, text2)

        if 'error' not in comparison:
            print(f"\nText 1: {text1}")
            print(f"  Emotion: {comparison['text1']['primary_emotion']} ({comparison['text1']['confidence']:.2%})")

            print(f"\nText 2: {text2}")
            print(f"  Emotion: {comparison['text2']['primary_emotion']} ({comparison['text2']['confidence']:.2%})")

            if comparison['same_emotion']:
                print(f"\n  → Same emotion detected")
            else:
                print(f"\n  → Different emotions (contrast: {comparison['emotional_contrast']:.4f})")

    # Example 6: Real-world scenarios
    print("\n" + "=" * 80)
    print("Example 6: Real-World Application - Social Media Monitoring")
    print("=" * 80)

    social_posts = [
        "Just got promoted! Best day ever! 🎉",
        "Feeling down today. Nothing seems to go right.",
        "This news is absolutely shocking!",
        "So grateful for my amazing friends and family ❤️",
        "Really annoyed by this constant spam.",
    ]

    print("\nMonitoring social media posts:\n")

    for post in social_posts:
        result = detector.detect(post, top_k=1)

        if 'error' not in result:
            emotion_emoji = {
                'joy': '😊',
                'sadness': '😢',
                'anger': '😠',
                'fear': '😨',
                'surprise': '😲',
                'love': '❤️'
            }

            emoji = emotion_emoji.get(result['primary_emotion'], '😐')

            print(f"{emoji} {post}")
            print(f"   Detected: {result['primary_emotion']} ({result['confidence']:.2%})\n")


if __name__ == "__main__":
    main()
