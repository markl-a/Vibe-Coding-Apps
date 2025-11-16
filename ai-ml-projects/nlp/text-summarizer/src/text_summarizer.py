"""
文本摘要器核心模組
使用 Hugging Face Transformers 進行文本摘要
"""

from transformers import pipeline, AutoTokenizer, AutoModelForSeq2SeqLM
import torch
from typing import List, Dict, Union, Optional
import warnings

warnings.filterwarnings('ignore')


class TextSummarizer:
    """文本摘要器類別"""
    
    def __init__(
        self,
        model_name: str = "facebook/bart-large-cnn",
        device: Optional[str] = None
    ):
        """
        初始化文本摘要器
        
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
                "summarization",
                model=model_name,
                device=self.device
            )
            self.model_name = model_name
            print("模型載入成功！")
        except Exception as e:
            print(f"模型載入失敗: {e}")
            raise
    
    def summarize(
        self,
        text: str,
        max_length: int = 130,
        min_length: int = 30,
        do_sample: bool = False,
        num_beams: int = 4,
        length_penalty: float = 2.0
    ) -> str:
        """
        生成文本摘要
        
        Args:
            text: 要摘要的文本
            max_length: 摘要最大長度
            min_length: 摘要最小長度
            do_sample: 是否使用採樣
            num_beams: Beam search 數量
            length_penalty: 長度懲罰係數
            
        Returns:
            摘要文本
        """
        if not text or not text.strip():
            return ""
        
        try:
            # 限制輸入長度（BART 限制為 1024 tokens）
            result = self.pipeline(
                text[:4096],  # 限制字符數
                max_length=max_length,
                min_length=min_length,
                do_sample=do_sample,
                num_beams=num_beams,
                length_penalty=length_penalty
            )
            
            return result[0]['summary_text']
        except Exception as e:
            print(f"摘要生成失敗: {e}")
            return f"[錯誤: {str(e)}]"
    
    def summarize_batch(
        self,
        texts: List[str],
        max_length: int = 130,
        min_length: int = 30,
        batch_size: int = 4
    ) -> List[str]:
        """
        批量生成文本摘要
        
        Args:
            texts: 文本列表
            max_length: 摘要最大長度
            min_length: 摘要最小長度
            batch_size: 批次大小
            
        Returns:
            摘要列表
        """
        if not texts:
            return []
        
        # 過濾空文本
        valid_texts = [text[:4096] for text in texts if text and text.strip()]
        
        if not valid_texts:
            return [""] * len(texts)
        
        try:
            results = self.pipeline(
                valid_texts,
                max_length=max_length,
                min_length=min_length,
                batch_size=batch_size
            )
            
            summaries = [result['summary_text'] for result in results]
            
            # 處理空文本的情況
            summary_idx = 0
            final_summaries = []
            for text in texts:
                if text and text.strip():
                    final_summaries.append(summaries[summary_idx])
                    summary_idx += 1
                else:
                    final_summaries.append("")
            
            return final_summaries
        except Exception as e:
            print(f"批量摘要失敗: {e}")
            return [f"[錯誤: {str(e)}]"] * len(texts)
    
    def summarize_with_ratio(
        self,
        text: str,
        ratio: float = 0.3
    ) -> str:
        """
        根據比例生成摘要
        
        Args:
            text: 要摘要的文本
            ratio: 摘要長度比例 (0-1)
            
        Returns:
            摘要文本
        """
        if not text or not text.strip():
            return ""
        
        # 估算文本長度（粗略估計）
        text_length = len(text.split())
        max_length = max(30, int(text_length * ratio))
        min_length = max(10, int(max_length * 0.5))
        
        return self.summarize(
            text,
            max_length=max_length,
            min_length=min_length
        )
    
    def summarize_long_text(
        self,
        text: str,
        chunk_size: int = 1000,
        max_length: int = 130,
        min_length: int = 30
    ) -> str:
        """
        處理超長文本的摘要
        將文本分段後分別摘要，然後合併
        
        Args:
            text: 長文本
            chunk_size: 每段的字符數
            max_length: 每段摘要的最大長度
            min_length: 每段摘要的最小長度
            
        Returns:
            合併後的摘要
        """
        if not text or not text.strip():
            return ""
        
        # 按段落分割
        paragraphs = [p.strip() for p in text.split('\n') if p.strip()]
        
        # 將段落組合成適當大小的塊
        chunks = []
        current_chunk = ""
        
        for para in paragraphs:
            if len(current_chunk) + len(para) <= chunk_size:
                current_chunk += para + " "
            else:
                if current_chunk:
                    chunks.append(current_chunk.strip())
                current_chunk = para + " "
        
        if current_chunk:
            chunks.append(current_chunk.strip())
        
        # 摘要每個塊
        summaries = self.summarize_batch(
            chunks,
            max_length=max_length,
            min_length=min_length
        )
        
        # 合併摘要
        combined_summary = " ".join(summaries)
        
        # 如果合併後的摘要仍然很長，再次摘要
        if len(combined_summary.split()) > max_length * 1.5:
            combined_summary = self.summarize(
                combined_summary,
                max_length=max_length,
                min_length=min_length
            )
        
        return combined_summary
    
    def get_summary_stats(self, text: str, summary: str) -> Dict:
        """
        獲取摘要統計信息
        
        Args:
            text: 原文
            summary: 摘要
            
        Returns:
            統計信息字典
        """
        original_words = len(text.split())
        summary_words = len(summary.split())
        
        return {
            "original_length": len(text),
            "original_words": original_words,
            "summary_length": len(summary),
            "summary_words": summary_words,
            "compression_ratio": summary_words / original_words if original_words > 0 else 0
        }


def main():
    """測試函數"""
    # 初始化摘要器
    summarizer = TextSummarizer()
    
    # 測試文本
    article = """
    Artificial intelligence (AI) is intelligence demonstrated by machines, 
    in contrast to the natural intelligence displayed by humans and animals. 
    Leading AI textbooks define the field as the study of "intelligent agents": 
    any device that perceives its environment and takes actions that maximize 
    its chance of successfully achieving its goals. Colloquially, the term 
    "artificial intelligence" is often used to describe machines (or computers) 
    that mimic "cognitive" functions that humans associate with the human mind, 
    such as "learning" and "problem solving".
    
    As machines become increasingly capable, tasks considered to require 
    "intelligence" are often removed from the definition of AI, a phenomenon 
    known as the AI effect. A quip in Tesler's Theorem says "AI is whatever 
    hasn't been done yet." For instance, optical character recognition is 
    frequently excluded from things considered to be AI, having become a 
    routine technology.
    """
    
    print("="*60)
    print("文本摘要測試")
    print("="*60)
    
    print(f"\n原文 ({len(article.split())} 詞):")
    print(article.strip())
    
    print("\n" + "-"*60)
    
    summary = summarizer.summarize(article)
    print(f"\n摘要 ({len(summary.split())} 詞):")
    print(summary)
    
    # 統計信息
    stats = summarizer.get_summary_stats(article, summary)
    print("\n" + "-"*60)
    print("統計信息:")
    print(f"  原文字數: {stats['original_words']}")
    print(f"  摘要字數: {stats['summary_words']}")
    print(f"  壓縮比例: {stats['compression_ratio']:.2%}")


if __name__ == "__main__":
    main()
