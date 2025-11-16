"""
命名實體識別器核心模組
使用 spaCy 和 Transformers 進行實體識別
"""

import spacy
from transformers import pipeline, AutoTokenizer, AutoModelForTokenClassification
import torch
from typing import List, Dict, Union, Optional
from collections import Counter
import warnings

warnings.filterwarnings('ignore')


class NERExtractor:
    """命名實體識別器類別"""
    
    def __init__(
        self,
        model_type: str = 'spacy',
        model_name: Optional[str] = None
    ):
        """
        初始化 NER 提取器
        
        Args:
            model_type: 模型類型 ('spacy' 或 'transformers')
            model_name: 自定義模型名稱
        """
        self.model_type = model_type
        
        if model_type == 'spacy':
            # 使用 spaCy
            if model_name is None:
                model_name = 'en_core_web_sm'
            
            try:
                self.nlp = spacy.load(model_name)
                self.model_name = model_name
                print(f"載入 spaCy 模型: {model_name}")
            except OSError:
                print(f"模型 {model_name} 未安裝")
                print(f"請運行: python -m spacy download {model_name}")
                raise
        
        elif model_type == 'transformers':
            # 使用 Transformers
            if model_name is None:
                model_name = 'dslim/bert-base-NER'
            
            device = 0 if torch.cuda.is_available() else -1
            print(f"載入 Transformers 模型: {model_name}")
            print(f"使用設備: {'GPU' if device == 0 else 'CPU'}")
            
            self.nlp = pipeline(
                "ner",
                model=model_name,
                device=device,
                aggregation_strategy="simple"
            )
            self.model_name = model_name
        
        else:
            raise ValueError(f"不支援的模型類型: {model_type}")
        
        print("模型載入成功！")
    
    def extract(self, text: str) -> List[Dict]:
        """
        提取文本中的命名實體
        
        Args:
            text: 要處理的文本
            
        Returns:
            實體列表
        """
        if not text or not text.strip():
            return []
        
        entities = []
        
        if self.model_type == 'spacy':
            doc = self.nlp(text)
            for ent in doc.ents:
                entities.append({
                    'text': ent.text,
                    'label': ent.label_,
                    'start': ent.start_char,
                    'end': ent.end_char
                })
        
        elif self.model_type == 'transformers':
            results = self.nlp(text)
            for ent in results:
                entities.append({
                    'text': ent['word'],
                    'label': ent['entity_group'],
                    'start': ent['start'],
                    'end': ent['end'],
                    'score': float(ent['score'])
                })
        
        return entities
    
    def extract_batch(
        self,
        texts: List[str],
        batch_size: int = 8
    ) -> List[List[Dict]]:
        """
        批量提取實體
        
        Args:
            texts: 文本列表
            batch_size: 批次大小
            
        Returns:
            實體列表的列表
        """
        if not texts:
            return []
        
        results = []
        
        if self.model_type == 'spacy':
            # spaCy 支援批量處理
            docs = self.nlp.pipe(texts, batch_size=batch_size)
            for doc in docs:
                entities = []
                for ent in doc.ents:
                    entities.append({
                        'text': ent.text,
                        'label': ent.label_,
                        'start': ent.start_char,
                        'end': ent.end_char
                    })
                results.append(entities)
        
        elif self.model_type == 'transformers':
            # 逐個處理（transformers pipeline 批量處理較複雜）
            for text in texts:
                results.append(self.extract(text))
        
        return results
    
    def get_entity_stats(
        self,
        text: str
    ) -> Dict[str, int]:
        """
        獲取實體類型統計
        
        Args:
            text: 文本
            
        Returns:
            實體類型計數字典
        """
        entities = self.extract(text)
        labels = [ent['label'] for ent in entities]
        return dict(Counter(labels))
    
    def filter_entities(
        self,
        text: str,
        entity_types: List[str]
    ) -> List[Dict]:
        """
        只提取特定類型的實體
        
        Args:
            text: 文本
            entity_types: 要提取的實體類型列表
            
        Returns:
            過濾後的實體列表
        """
        all_entities = self.extract(text)
        return [
            ent for ent in all_entities 
            if ent['label'] in entity_types
        ]
    
    def visualize(self, text: str) -> str:
        """
        生成實體可視化 HTML
        
        Args:
            text: 文本
            
        Returns:
            HTML 字符串
        """
        if self.model_type == 'spacy':
            doc = self.nlp(text)
            from spacy import displacy
            html = displacy.render(doc, style='ent', page=True)
            return html
        else:
            # 為 transformers 創建簡單的 HTML 可視化
            entities = self.extract(text)
            
            # 顏色映射
            colors = {
                'PERSON': '#aa9cfc',
                'PER': '#aa9cfc',
                'ORG': '#7aecec',
                'GPE': '#feca74',
                'LOC': '#ff9561',
                'DATE': '#bfe1d9',
                'MISC': '#e4e7d2'
            }
            
            html = f"<div style='font-family: Arial; line-height: 2.5;'>{text}"
            
            # 按位置倒序排序，從後往前替換
            sorted_entities = sorted(entities, key=lambda x: x['start'], reverse=True)
            
            for ent in sorted_entities:
                color = colors.get(ent['label'], '#ddd')
                replacement = (
                    f"<mark style='background-color: {color}; "
                    f"padding: 0.2em 0.4em; border-radius: 0.25em;'>"
                    f"{ent['text']}"
                    f"<span style='font-size: 0.8em; font-weight: bold;'> {ent['label']}</span>"
                    f"</mark>"
                )
                html = html[:ent['start']] + replacement + html[ent['end']:]
            
            html += "</div>"
            return html
    
    def extract_persons(self, text: str) -> List[str]:
        """提取所有人名"""
        entities = self.filter_entities(text, ['PERSON', 'PER'])
        return [ent['text'] for ent in entities]
    
    def extract_organizations(self, text: str) -> List[str]:
        """提取所有組織名"""
        entities = self.filter_entities(text, ['ORG'])
        return [ent['text'] for ent in entities]
    
    def extract_locations(self, text: str) -> List[str]:
        """提取所有地點"""
        entities = self.filter_entities(text, ['GPE', 'LOC'])
        return [ent['text'] for ent in entities]


def main():
    """測試函數"""
    print("="*60)
    print("命名實體識別測試")
    print("="*60)
    
    # 初始化提取器
    try:
        extractor = NERExtractor(model_type='spacy')
    except:
        print("\nspaCy 模型未安裝，使用 transformers...")
        extractor = NERExtractor(model_type='transformers')
    
    # 測試文本
    text = """
    Apple Inc. was founded by Steve Jobs, Steve Wozniak, and Ronald Wayne 
    in April 1976 in Cupertino, California. The company's first product 
    was the Apple I computer. In 2011, Tim Cook became CEO after Steve Jobs 
    passed away. Apple is now one of the most valuable companies in the world, 
    worth over $2 trillion.
    """
    
    print(f"\n原文:")
    print(text.strip())
    
    # 提取實體
    print("\n" + "-"*60)
    print("提取的實體:")
    print("-"*60)
    
    entities = extractor.extract(text)
    for ent in entities:
        print(f"  {ent['text']:25} -> {ent['label']}")
    
    # 統計
    print("\n" + "-"*60)
    print("實體類型統計:")
    print("-"*60)
    
    stats = extractor.get_entity_stats(text)
    for label, count in stats.items():
        print(f"  {label}: {count}")
    
    # 特定類型
    print("\n" + "-"*60)
    print("人名:")
    persons = extractor.extract_persons(text)
    for person in persons:
        print(f"  - {person}")
    
    print("\n組織:")
    orgs = extractor.extract_organizations(text)
    for org in orgs:
        print(f"  - {org}")


if __name__ == "__main__":
    main()
