"""
情感分析器單元測試
"""

import pytest
import sys
from pathlib import Path

# 添加 src 到路徑
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from sentiment_analyzer import SentimentAnalyzer


@pytest.fixture
def analyzer():
    """創建分析器實例"""
    return SentimentAnalyzer()


def test_analyze_positive(analyzer):
    """測試正面情感分析"""
    text = "I love this product! It's amazing!"
    result = analyzer.analyze(text)
    
    assert result["label"] in ["POSITIVE", "LABEL_1"]
    assert result["score"] > 0.5
    assert "text" in result


def test_analyze_negative(analyzer):
    """測試負面情感分析"""
    text = "This is terrible. Very disappointed."
    result = analyzer.analyze(text)
    
    assert result["label"] in ["NEGATIVE", "LABEL_0"]
    assert result["score"] > 0.5


def test_analyze_empty_text(analyzer):
    """測試空文本"""
    result = analyzer.analyze("")
    
    assert "error" in result or result["label"] == "NEUTRAL"


def test_analyze_batch(analyzer):
    """測試批量分析"""
    texts = [
        "Great product!",
        "Horrible experience.",
        "It's okay."
    ]
    
    results = analyzer.analyze_batch(texts)
    
    assert len(results) == len(texts)
    for result in results:
        assert "label" in result
        assert "score" in result


def test_get_sentiment_distribution(analyzer):
    """測試情感分布統計"""
    texts = [
        "I love it!",
        "I hate it!",
        "It's okay."
    ]
    
    distribution = analyzer.get_sentiment_distribution(texts)
    
    assert isinstance(distribution, dict)
    assert sum(distribution.values()) == len(texts)


def test_analyze_with_details(analyzer):
    """測試詳細分析"""
    text = "This is excellent!"
    result = analyzer.analyze_with_details(text)
    
    assert "label" in result
    assert "score" in result
    assert "model" in result
    assert "confidence" in result
    assert "text_length" in result


def test_long_text(analyzer):
    """測試長文本處理"""
    long_text = "Great product! " * 100  # 很長的文本
    result = analyzer.analyze(long_text)
    
    assert "label" in result
    assert "score" in result


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
