"""
Language Detection Tool
支援多種語言檢測方法：
- Character n-gram based detection
- Statistical language identification
- Unicode script detection
"""

import re
from collections import Counter, defaultdict
from typing import Dict, List, Tuple, Optional
import unicodedata
import warnings

warnings.filterwarnings('ignore')


class LanguageDetector:
    """Multi-method language detection system"""

    # Common words in different languages (for basic detection)
    LANGUAGE_PROFILES = {
        'en': {
            'common_words': ['the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i', 'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at'],
            'char_freq': {'e': 0.127, 't': 0.091, 'a': 0.082, 'o': 0.075, 'i': 0.070}
        },
        'es': {
            'common_words': ['el', 'la', 'de', 'que', 'y', 'a', 'en', 'un', 'ser', 'se', 'no', 'haber', 'por', 'con', 'su', 'para', 'como', 'estar', 'tener', 'le'],
            'char_freq': {'e': 0.137, 'a': 0.125, 'o': 0.091, 's': 0.080, 'n': 0.067}
        },
        'fr': {
            'common_words': ['le', 'de', 'un', 'être', 'et', 'à', 'il', 'avoir', 'ne', 'je', 'son', 'que', 'se', 'qui', 'ce', 'dans', 'en', 'du', 'elle', 'au'],
            'char_freq': {'e': 0.145, 'a': 0.081, 's': 0.079, 'i': 0.074, 't': 0.072}
        },
        'de': {
            'common_words': ['der', 'die', 'und', 'in', 'den', 'von', 'zu', 'das', 'mit', 'sich', 'des', 'auf', 'für', 'ist', 'im', 'dem', 'nicht', 'ein', 'eine', 'als'],
            'char_freq': {'e': 0.174, 'n': 0.098, 'i': 0.075, 's': 0.073, 'r': 0.070}
        },
        'it': {
            'common_words': ['il', 'di', 'e', 'la', 'a', 'che', 'è', 'per', 'un', 'in', 'non', 'essere', 'da', 'con', 'avere', 'questo', 'fare', 'uno', 'tutto', 'anche'],
            'char_freq': {'e': 0.118, 'a': 0.117, 'i': 0.111, 'o': 0.098, 'n': 0.069}
        },
        'pt': {
            'common_words': ['o', 'a', 'de', 'e', 'que', 'do', 'da', 'em', 'um', 'para', 'é', 'com', 'não', 'uma', 'os', 'no', 'se', 'na', 'por', 'mais'],
            'char_freq': {'a': 0.146, 'e': 0.126, 'o': 0.103, 's': 0.078, 'r': 0.065}
        },
        'zh': {
            'common_words': ['的', '是', '不', '了', '在', '人', '有', '我', '他', '这', '个', '们', '中', '来', '上', '大', '为', '和', '国', '地'],
            'char_freq': {}  # Chinese uses characters, not letter frequencies
        },
        'ja': {
            'common_words': ['の', 'に', 'は', 'を', 'た', 'が', 'で', 'て', 'と', 'し', 'れ', 'さ', 'ある', 'いる', 'も', 'する', 'から', 'な', 'こと', 'として'],
            'char_freq': {}  # Japanese uses mixed scripts
        },
        'ar': {
            'common_words': ['في', 'من', 'إلى', 'على', 'أن', 'هذا', 'كان', 'قد', 'التي', 'هو', 'لم', 'لا', 'ما', 'هي', 'كل', 'عن', 'أو', 'عند', 'صلى', 'الله'],
            'char_freq': {}  # Arabic script
        },
        'ru': {
            'common_words': ['в', 'и', 'не', 'на', 'я', 'быть', 'он', 'с', 'что', 'а', 'по', 'это', 'она', 'этот', 'к', 'но', 'они', 'мы', 'как', 'из'],
            'char_freq': {'о': 0.109, 'е': 0.085, 'а': 0.080, 'и': 0.074, 'н': 0.067}
        },
        'ko': {
            'common_words': ['이', '그', '저', '것', '수', '등', '년', '명', '데', '말', '일', '때', '위'],
            'char_freq': {}  # Korean uses Hangul
        }
    }

    # Unicode script ranges
    SCRIPT_RANGES = {
        'latin': [(0x0041, 0x007A), (0x00C0, 0x00FF), (0x0100, 0x017F)],
        'cyrillic': [(0x0400, 0x04FF)],
        'arabic': [(0x0600, 0x06FF)],
        'devanagari': [(0x0900, 0x097F)],
        'chinese': [(0x4E00, 0x9FFF)],
        'japanese': [(0x3040, 0x309F), (0x30A0, 0x30FF)],
        'korean': [(0xAC00, 0xD7AF)],
        'greek': [(0x0370, 0x03FF)],
        'hebrew': [(0x0590, 0x05FF)],
        'thai': [(0x0E00, 0x0E7F)]
    }

    def __init__(self):
        """Initialize language detector"""
        pass

    def detect_script(self, text: str) -> Dict[str, float]:
        """
        Detect Unicode scripts in text

        Args:
            text: Input text

        Returns:
            Dictionary of script -> proportion
        """
        script_counts = defaultdict(int)
        total_chars = 0

        for char in text:
            if char.isspace() or not char.isalnum():
                continue

            total_chars += 1
            code_point = ord(char)

            detected = False
            for script, ranges in self.SCRIPT_RANGES.items():
                for start, end in ranges:
                    if start <= code_point <= end:
                        script_counts[script] += 1
                        detected = True
                        break
                if detected:
                    break

            if not detected:
                script_counts['other'] += 1

        if total_chars == 0:
            return {}

        # Convert to proportions
        script_props = {
            script: count / total_chars
            for script, count in script_counts.items()
        }

        return dict(sorted(script_props.items(), key=lambda x: x[1], reverse=True))

    def detect_by_words(self, text: str, top_k: int = 3) -> List[Tuple[str, float]]:
        """
        Detect language by common words

        Args:
            text: Input text
            top_k: Number of top languages to return

        Returns:
            List of (language, score) tuples
        """
        text_lower = text.lower()
        words = re.findall(r'\b\w+\b', text_lower)

        if not words:
            return []

        language_scores = {}

        for lang, profile in self.LANGUAGE_PROFILES.items():
            common_words = profile['common_words']
            matches = sum(1 for word in words if word in common_words)
            score = matches / len(words)
            language_scores[lang] = score

        # Sort by score
        sorted_langs = sorted(
            language_scores.items(),
            key=lambda x: x[1],
            reverse=True
        )

        return sorted_langs[:top_k]

    def detect_by_char_freq(self, text: str, top_k: int = 3) -> List[Tuple[str, float]]:
        """
        Detect language by character frequency

        Args:
            text: Input text
            top_k: Number of top languages

        Returns:
            List of (language, score) tuples
        """
        # Extract letter frequencies
        text_lower = ''.join(c for c in text.lower() if c.isalpha())

        if not text_lower:
            return []

        char_counts = Counter(text_lower)
        total_chars = sum(char_counts.values())

        text_freq = {
            char: count / total_chars
            for char, count in char_counts.items()
        }

        # Compare with language profiles
        language_scores = {}

        for lang, profile in self.LANGUAGE_PROFILES.items():
            char_freq = profile.get('char_freq', {})

            if not char_freq:
                continue

            # Calculate similarity (using simple overlap)
            score = 0
            for char, freq in char_freq.items():
                text_freq_val = text_freq.get(char, 0)
                score += 1 - abs(freq - text_freq_val)

            language_scores[lang] = score / len(char_freq) if char_freq else 0

        sorted_langs = sorted(
            language_scores.items(),
            key=lambda x: x[1],
            reverse=True
        )

        return sorted_langs[:top_k]

    def detect_combined(self, text: str) -> Dict:
        """
        Detect language using multiple methods

        Args:
            text: Input text

        Returns:
            Detection result with confidence
        """
        if not text or not text.strip():
            return {'language': 'unknown', 'confidence': 0.0}

        # Method 1: Script detection
        scripts = self.detect_script(text)

        # Method 2: Word-based detection
        word_results = self.detect_by_words(text, top_k=3)

        # Method 3: Character frequency
        char_results = self.detect_by_char_freq(text, top_k=3)

        # Simple script-based detection for non-Latin scripts
        if scripts:
            top_script = list(scripts.keys())[0]

            if top_script == 'chinese':
                return {'language': 'zh', 'confidence': scripts[top_script], 'method': 'script'}
            elif top_script == 'japanese':
                return {'language': 'ja', 'confidence': scripts[top_script], 'method': 'script'}
            elif top_script == 'korean':
                return {'language': 'ko', 'confidence': scripts[top_script], 'method': 'script'}
            elif top_script == 'cyrillic':
                return {'language': 'ru', 'confidence': scripts[top_script], 'method': 'script'}
            elif top_script == 'arabic':
                return {'language': 'ar', 'confidence': scripts[top_script], 'method': 'script'}

        # For Latin scripts, combine word and char methods
        combined_scores = defaultdict(float)

        # Weight word-based detection more
        for lang, score in word_results:
            combined_scores[lang] += score * 0.7

        # Add character frequency scores
        for lang, score in char_results:
            combined_scores[lang] += score * 0.3

        if combined_scores:
            best_lang = max(combined_scores.items(), key=lambda x: x[1])
            return {
                'language': best_lang[0],
                'confidence': min(best_lang[1], 1.0),
                'method': 'combined',
                'alternatives': sorted(combined_scores.items(), key=lambda x: x[1], reverse=True)[:3]
            }

        return {'language': 'unknown', 'confidence': 0.0, 'method': 'none'}

    def detect_batch(self, texts: List[str]) -> List[Dict]:
        """
        Detect language for multiple texts

        Args:
            texts: List of texts

        Returns:
            List of detection results
        """
        return [self.detect_combined(text) for text in texts]

    def get_language_name(self, code: str) -> str:
        """
        Get full language name from code

        Args:
            code: Language code

        Returns:
            Full language name
        """
        names = {
            'en': 'English',
            'es': 'Spanish',
            'fr': 'French',
            'de': 'German',
            'it': 'Italian',
            'pt': 'Portuguese',
            'zh': 'Chinese',
            'ja': 'Japanese',
            'ar': 'Arabic',
            'ru': 'Russian',
            'ko': 'Korean'
        }
        return names.get(code, code)


def main():
    """Example usage"""
    print("=" * 80)
    print("Language Detection Demo")
    print("=" * 80)

    detector = LanguageDetector()

    # Test texts in different languages
    test_texts = [
        ("This is a sample text in English.", "en"),
        ("Esto es un texto de ejemplo en español.", "es"),
        ("Ceci est un exemple de texte en français.", "fr"),
        ("Dies ist ein Beispieltext auf Deutsch.", "de"),
        ("Questo è un testo di esempio in italiano.", "it"),
        ("Este é um texto de exemplo em português.", "pt"),
        ("这是一个中文示例文本。", "zh"),
        ("これは日本語のサンプルテキストです。", "ja"),
        ("이것은 한국어 샘플 텍스트입니다.", "ko"),
        ("Это пример текста на русском языке.", "ru"),
    ]

    print("\n" + "=" * 80)
    print("Language Detection Results")
    print("=" * 80)

    correct = 0
    total = len(test_texts)

    for text, expected_lang in test_texts:
        result = detector.detect_combined(text)
        detected_lang = result['language']
        confidence = result['confidence']

        is_correct = detected_lang == expected_lang
        if is_correct:
            correct += 1

        status = "✓" if is_correct else "✗"
        lang_name = detector.get_language_name(detected_lang)

        print(f"\n{status} Text: {text[:50]}...")
        print(f"   Expected: {detector.get_language_name(expected_lang)}")
        print(f"   Detected: {lang_name} ({detected_lang})")
        print(f"   Confidence: {confidence:.4f}")
        print(f"   Method: {result.get('method', 'unknown')}")

    print(f"\n{'=' * 80}")
    print(f"Accuracy: {correct}/{total} ({correct/total*100:.1f}%)")

    # Script detection
    print("\n" + "=" * 80)
    print("Script Detection")
    print("=" * 80)

    mixed_text = "Hello 世界! This is mixed script text. 日本語も含まれています。"
    print(f"\nText: {mixed_text}")

    scripts = detector.detect_script(mixed_text)
    print("\nDetected scripts:")
    for script, proportion in scripts.items():
        print(f"  {script:15} {proportion*100:5.1f}%")

    # Batch detection
    print("\n" + "=" * 80)
    print("Batch Detection")
    print("=" * 80)

    batch_texts = [
        "The quick brown fox jumps over the lazy dog.",
        "El rápido zorro marrón salta sobre el perro perezoso.",
        "Le rapide renard brun saute par-dessus le chien paresseux.",
    ]

    print("\nProcessing batch of texts...")
    results = detector.detect_batch(batch_texts)

    for text, result in zip(batch_texts, results):
        lang = detector.get_language_name(result['language'])
        print(f"\n  Text: {text[:40]}...")
        print(f"  Language: {lang} (confidence: {result['confidence']:.4f})")


if __name__ == "__main__":
    main()
