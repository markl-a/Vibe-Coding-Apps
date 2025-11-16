"""
情感分析器核心模組
使用 Hugging Face Transformers 進行情感分析
"""

from transformers import pipeline, AutoTokenizer, AutoModelForSequenceClassification
import torch
from typing import List, Dict, Union, Optional
import warnings

warnings.filterwarnings('ignore')


class SentimentAnalyzer:
    """情感分析器類別"""
    
    def __init__(
        self,
        model_name: str = "distilbert-base-uncased-finetuned-sst-2-english",
        device: Optional[str] = None
    ):
        """
        初始化情感分析器
        
        Args:
            model_name: 預訓練模型名稱或路徑
            device: 運算設備 ('cuda', 'cpu', 或 None 自動選擇)
        """
        if device is None:
            self.device = 0 if torch.cuda.is_available() else -1
        else:
            self.device = 0 if device == 'cuda' else -1
        
        print(f"載入模型: {model_name}")
        print(f"使用設備: {'GPU' if self.device == 0 else 'CPU'}")
        
        try:
            self.pipeline = pipeline(
                "sentiment-analysis",
                model=model_name,
                device=self.device
            )
            self.model_name = model_name
            print("模型載入成功！")
        except Exception as e:
            print(f"模型載入失敗: {e}")
            raise
    
    def analyze(self, text: str) -> Dict[str, Union[str, float]]:
        """
        分析單個文本的情感
        
        Args:
            text: 要分析的文本
            
        Returns:
            包含標籤和分數的字典
        """
        if not text or not text.strip():
            return {"label": "NEUTRAL", "score": 0.0, "error": "Empty text"}
        
        try:
            result = self.pipeline(text[:512])[0]  # 限制長度避免超出模型限制
            return {
                "label": result["label"],
                "score": float(result["score"]),
                "text": text[:100] + "..." if len(text) > 100 else text
            }
        except Exception as e:
            return {
                "label": "ERROR",
                "score": 0.0,
                "error": str(e),
                "text": text[:100]
            }
    
    def analyze_batch(
        self,
        texts: List[str],
        batch_size: int = 8
    ) -> List[Dict[str, Union[str, float]]]:
        """
        批量分析多個文本的情感
        
        Args:
            texts: 文本列表
            batch_size: 批次大小
            
        Returns:
            結果列表
        """
        if not texts:
            return []
        
        # 過濾空文本並記錄索引
        valid_texts = []
        valid_indices = []
        for i, text in enumerate(texts):
            if text and text.strip():
                valid_texts.append(text[:512])
                valid_indices.append(i)
        
        if not valid_texts:
            return [{"label": "NEUTRAL", "score": 0.0, "error": "Empty text"} 
                    for _ in texts]
        
        try:
            # 批量處理
            results = self.pipeline(valid_texts, batch_size=batch_size)
            
            # 重建完整結果列表
            full_results = []
            valid_idx = 0
            for i, text in enumerate(texts):
                if i in valid_indices:
                    result = results[valid_idx]
                    full_results.append({
                        "label": result["label"],
                        "score": float(result["score"]),
                        "text": text[:100] + "..." if len(text) > 100 else text
                    })
                    valid_idx += 1
                else:
                    full_results.append({
                        "label": "NEUTRAL",
                        "score": 0.0,
                        "error": "Empty text",
                        "text": ""
                    })
            
            return full_results
        except Exception as e:
            return [{
                "label": "ERROR",
                "score": 0.0,
                "error": str(e),
                "text": text[:100]
            } for text in texts]
    
    def get_sentiment_distribution(
        self,
        texts: List[str]
    ) -> Dict[str, int]:
        """
        獲取文本集合的情感分布
        
        Args:
            texts: 文本列表
            
        Returns:
            情感分布字典
        """
        results = self.analyze_batch(texts)
        distribution = {}
        
        for result in results:
            label = result.get("label", "UNKNOWN")
            distribution[label] = distribution.get(label, 0) + 1
        
        return distribution
    
    def analyze_with_details(self, text: str) -> Dict:
        """
        詳細分析，包含更多信息
        
        Args:
            text: 要分析的文本
            
        Returns:
            詳細分析結果
        """
        basic_result = self.analyze(text)
        
        return {
            **basic_result,
            "model": self.model_name,
            "text_length": len(text),
            "confidence": "high" if basic_result.get("score", 0) > 0.9 
                         else "medium" if basic_result.get("score", 0) > 0.7 
                         else "low"
        }


def main():
    """測試函數"""
    # 初始化分析器
    analyzer = SentimentAnalyzer()
    
    # 測試文本
    test_texts = [
        "I absolutely love this product! It's amazing!",
        "This is the worst experience I've ever had.",
        "It's okay, nothing special.",
        "The customer service was excellent and very helpful.",
        "I'm very disappointed with the quality."
    ]
    
    print("\n" + "="*60)
    print("單個文本分析測試")
    print("="*60)
    
    for text in test_texts[:2]:
        result = analyzer.analyze(text)
        print(f"\n文本: {result['text']}")
        print(f"情感: {result['label']}")
        print(f"信心分數: {result['score']:.4f}")
    
    print("\n" + "="*60)
    print("批量分析測試")
    print("="*60)
    
    results = analyzer.analyze_batch(test_texts)
    for text, result in zip(test_texts, results):
        print(f"\n{text}")
        print(f"  -> {result['label']} (信心: {result['score']:.2f})")
    
    print("\n" + "="*60)
    print("情感分布統計")
    print("="*60)
    
    distribution = analyzer.get_sentiment_distribution(test_texts)
    for label, count in distribution.items():
        print(f"{label}: {count}")


if __name__ == "__main__":
    main()
