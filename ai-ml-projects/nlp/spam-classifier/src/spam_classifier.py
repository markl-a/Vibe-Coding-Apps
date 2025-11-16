"""
垃圾郵件分類器核心模組
使用傳統機器學習方法進行垃圾郵件檢測
"""

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.svm import SVC
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score
import joblib
import numpy as np
import pandas as pd
from typing import List, Dict, Union, Tuple
import re


class SpamClassifier:
    """垃圾郵件分類器類別"""
    
    def __init__(self, model_type: str = 'nb'):
        """
        初始化分類器
        
        Args:
            model_type: 模型類型 ('nb', 'lr', 'rf', 'svm')
        """
        self.model_type = model_type
        self.vectorizer = TfidfVectorizer(
            max_features=3000,
            ngram_range=(1, 2),
            stop_words='english'
        )
        
        # 選擇模型
        if model_type == 'nb':
            self.model = MultinomialNB()
        elif model_type == 'lr':
            self.model = LogisticRegression(max_iter=1000)
        elif model_type == 'rf':
            self.model = RandomForestClassifier(n_estimators=100)
        elif model_type == 'svm':
            self.model = SVC(probability=True)
        else:
            raise ValueError(f"不支援的模型類型: {model_type}")
        
        self.is_trained = False
    
    def preprocess_text(self, text: str) -> str:
        """
        預處理文本
        
        Args:
            text: 原始文本
            
        Returns:
            處理後的文本
        """
        # 轉小寫
        text = text.lower()
        
        # 移除 URL
        text = re.sub(r'http\S+|www\S+', '', text)
        
        # 移除郵箱
        text = re.sub(r'\S+@\S+', '', text)
        
        # 移除特殊字符（保留空格）
        text = re.sub(r'[^a-zA-Z\s]', '', text)
        
        # 移除多餘空格
        text = ' '.join(text.split())
        
        return text
    
    def extract_features(self, text: str) -> Dict[str, float]:
        """
        提取額外特徵
        
        Args:
            text: 文本
            
        Returns:
            特徵字典
        """
        features = {
            'length': len(text),
            'num_words': len(text.split()),
            'num_uppercase': sum(1 for c in text if c.isupper()),
            'num_exclamation': text.count('!'),
            'num_question': text.count('?'),
            'num_dollar': text.count('$'),
        }
        return features
    
    def train(
        self,
        texts: List[str],
        labels: List[Union[str, int]],
        test_size: float = 0.2
    ) -> Dict:
        """
        訓練模型
        
        Args:
            texts: 文本列表
            labels: 標籤列表 (spam/ham 或 1/0)
            test_size: 測試集比例
            
        Returns:
            評估結果
        """
        # 預處理文本
        processed_texts = [self.preprocess_text(text) for text in texts]
        
        # 轉換標籤為數字
        if isinstance(labels[0], str):
            labels = [1 if label.lower() == 'spam' else 0 for label in labels]
        
        # 分割數據
        X_train, X_test, y_train, y_test = train_test_split(
            processed_texts, labels, test_size=test_size, random_state=42
        )
        
        # 特徵提取
        X_train_tfidf = self.vectorizer.fit_transform(X_train)
        X_test_tfidf = self.vectorizer.transform(X_test)
        
        # 訓練模型
        print(f"使用 {self.model_type} 模型訓練...")
        self.model.fit(X_train_tfidf, y_train)
        self.is_trained = True
        
        # 評估
        y_pred = self.model.predict(X_test_tfidf)
        
        results = {
            'accuracy': accuracy_score(y_test, y_pred),
            'classification_report': classification_report(y_test, y_pred, 
                                                          target_names=['ham', 'spam']),
            'confusion_matrix': confusion_matrix(y_test, y_pred).tolist()
        }
        
        print(f"\n準確率: {results['accuracy']:.4f}")
        print("\n分類報告:")
        print(results['classification_report'])
        
        return results
    
    def predict(self, text: str) -> Dict:
        """
        預測單個文本
        
        Args:
            text: 要預測的文本
            
        Returns:
            預測結果
        """
        if not self.is_trained:
            raise ValueError("模型尚未訓練！請先調用 train() 或 load()")
        
        # 預處理
        processed = self.preprocess_text(text)
        
        # 特徵提取
        X = self.vectorizer.transform([processed])
        
        # 預測
        prediction = self.model.predict(X)[0]
        probability = self.model.predict_proba(X)[0]
        
        return {
            'text': text[:100] + '...' if len(text) > 100 else text,
            'is_spam': bool(prediction),
            'label': 'spam' if prediction else 'ham',
            'confidence': float(probability[prediction]),
            'probabilities': {
                'ham': float(probability[0]),
                'spam': float(probability[1])
            }
        }
    
    def predict_batch(self, texts: List[str]) -> List[Dict]:
        """
        批量預測
        
        Args:
            texts: 文本列表
            
        Returns:
            預測結果列表
        """
        if not self.is_trained:
            raise ValueError("模型尚未訓練！")
        
        # 預處理
        processed = [self.preprocess_text(text) for text in texts]
        
        # 特徵提取
        X = self.vectorizer.transform(processed)
        
        # 預測
        predictions = self.model.predict(X)
        probabilities = self.model.predict_proba(X)
        
        results = []
        for i, (text, pred, prob) in enumerate(zip(texts, predictions, probabilities)):
            results.append({
                'text': text[:100] + '...' if len(text) > 100 else text,
                'is_spam': bool(pred),
                'label': 'spam' if pred else 'ham',
                'confidence': float(prob[pred]),
                'probabilities': {
                    'ham': float(prob[0]),
                    'spam': float(prob[1])
                }
            })
        
        return results
    
    def save(self, filepath: str):
        """保存模型"""
        if not self.is_trained:
            raise ValueError("模型尚未訓練！")
        
        model_data = {
            'model': self.model,
            'vectorizer': self.vectorizer,
            'model_type': self.model_type
        }
        
        joblib.dump(model_data, filepath)
        print(f"模型已保存到: {filepath}")
    
    def load(self, filepath: str):
        """載入模型"""
        model_data = joblib.load(filepath)
        
        self.model = model_data['model']
        self.vectorizer = model_data['vectorizer']
        self.model_type = model_data['model_type']
        self.is_trained = True
        
        print(f"模型已載入: {filepath}")


def main():
    """測試函數"""
    # 創建示例數據
    spam_emails = [
        "Congratulations! You've won $1000000! Click here now!",
        "Get rich quick! Make money fast!",
        "FREE! Buy now! Limited time offer!",
        "You won! Claim your prize today!",
        "Hot singles in your area! Click here!",
    ]
    
    ham_emails = [
        "Hi, let's meet for coffee tomorrow at 3pm",
        "The project deadline is next Monday",
        "Can you send me the report when you get a chance?",
        "Thanks for your help with the presentation",
        "Meeting rescheduled to next week",
    ]
    
    # 組合數據
    texts = spam_emails + ham_emails
    labels = ['spam'] * len(spam_emails) + ['ham'] * len(ham_emails)
    
    print("="*60)
    print("垃圾郵件分類器測試")
    print("="*60)
    
    # 訓練模型
    classifier = SpamClassifier(model_type='nb')
    results = classifier.train(texts, labels, test_size=0.2)
    
    # 測試預測
    print("\n" + "="*60)
    print("預測測試")
    print("="*60)
    
    test_texts = [
        "Win a free iPhone now!",
        "Let's discuss the project tomorrow",
        "URGENT! Your account needs verification!"
    ]
    
    for text in test_texts:
        result = classifier.predict(text)
        print(f"\n文本: {text}")
        print(f"預測: {result['label']} (信心: {result['confidence']:.2%})")


if __name__ == "__main__":
    main()
