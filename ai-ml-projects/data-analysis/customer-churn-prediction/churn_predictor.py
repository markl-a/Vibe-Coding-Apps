"""
客戶流失預測模型
提供完整的訓練、預測和評估功能
"""

import pandas as pd
import numpy as np
import joblib
from sklearn.model_selection import train_test_split, cross_val_score, GridSearchCV
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, confusion_matrix, classification_report,
    roc_curve
)
import matplotlib.pyplot as plt
import seaborn as sns
import warnings
warnings.filterwarnings('ignore')

try:
    import xgboost as xgb
    XGBOOST_AVAILABLE = True
except ImportError:
    XGBOOST_AVAILABLE = False

try:
    import lightgbm as lgb
    LIGHTGBM_AVAILABLE = True
except ImportError:
    LIGHTGBM_AVAILABLE = False


class ChurnPredictor:
    """客戶流失預測器"""

    def __init__(self, model_type='random_forest'):
        """
        初始化預測器

        Args:
            model_type: 模型類型 ('random_forest', 'xgboost', 'lightgbm')
        """
        self.model_type = model_type
        self.model = None
        self.label_encoders = {}
        self.scaler = StandardScaler()
        self.feature_names = None
        self.target_col = 'churn'

    def preprocess(self, df, is_training=True):
        """
        資料預處理

        Args:
            df: 輸入資料框
            is_training: 是否為訓練模式

        Returns:
            處理後的特徵矩陣和標籤（如果是訓練模式）
        """
        df = df.copy()

        # 處理目標變數
        if self.target_col in df.columns:
            y = (df[self.target_col] == 'Yes').astype(int)
            df = df.drop(self.target_col, axis=1)
        else:
            y = None

        # 移除 customer_id
        if 'customer_id' in df.columns:
            df = df.drop('customer_id', axis=1)

        # 處理 total_charges（可能有空值）
        if 'total_charges' in df.columns:
            df['total_charges'] = pd.to_numeric(df['total_charges'], errors='coerce')
            df['total_charges'].fillna(df['total_charges'].median(), inplace=True)

        # 分離數值和類別特徵
        numeric_features = df.select_dtypes(include=[np.number]).columns.tolist()
        categorical_features = df.select_dtypes(include=['object']).columns.tolist()

        # 編碼類別特徵
        for col in categorical_features:
            if is_training:
                le = LabelEncoder()
                df[col] = le.fit_transform(df[col].astype(str))
                self.label_encoders[col] = le
            else:
                if col in self.label_encoders:
                    le = self.label_encoders[col]
                    # 處理未見過的類別
                    df[col] = df[col].astype(str).apply(
                        lambda x: x if x in le.classes_ else le.classes_[0]
                    )
                    df[col] = le.transform(df[col])

        # 標準化數值特徵
        if is_training:
            df[numeric_features] = self.scaler.fit_transform(df[numeric_features])
        else:
            df[numeric_features] = self.scaler.transform(df[numeric_features])

        if is_training:
            self.feature_names = df.columns.tolist()

        return df.values, y

    def train(self, X_train, y_train, X_val=None, y_val=None, **kwargs):
        """
        訓練模型

        Args:
            X_train: 訓練特徵
            y_train: 訓練標籤
            X_val: 驗證特徵
            y_val: 驗證標籤
            **kwargs: 模型參數
        """
        print(f"訓練 {self.model_type} 模型...")

        if self.model_type == 'random_forest':
            self.model = RandomForestClassifier(
                n_estimators=kwargs.get('n_estimators', 100),
                max_depth=kwargs.get('max_depth', 10),
                min_samples_split=kwargs.get('min_samples_split', 10),
                min_samples_leaf=kwargs.get('min_samples_leaf', 4),
                random_state=42,
                n_jobs=-1
            )
        elif self.model_type == 'xgboost' and XGBOOST_AVAILABLE:
            self.model = xgb.XGBClassifier(
                n_estimators=kwargs.get('n_estimators', 100),
                max_depth=kwargs.get('max_depth', 6),
                learning_rate=kwargs.get('learning_rate', 0.1),
                random_state=42,
                n_jobs=-1,
                eval_metric='logloss'
            )
        elif self.model_type == 'lightgbm' and LIGHTGBM_AVAILABLE:
            self.model = lgb.LGBMClassifier(
                n_estimators=kwargs.get('n_estimators', 100),
                max_depth=kwargs.get('max_depth', 6),
                learning_rate=kwargs.get('learning_rate', 0.1),
                random_state=42,
                n_jobs=-1,
                verbose=-1
            )
        else:
            raise ValueError(f"不支援的模型類型: {self.model_type}")

        # 訓練模型
        if X_val is not None and y_val is not None and self.model_type in ['xgboost', 'lightgbm']:
            eval_set = [(X_val, y_val)]
            self.model.fit(
                X_train, y_train,
                eval_set=eval_set,
                verbose=False
            )
        else:
            self.model.fit(X_train, y_train)

        # 評估訓練集性能
        train_pred = self.model.predict(X_train)
        train_acc = accuracy_score(y_train, train_pred)
        print(f"訓練集準確率: {train_acc:.4f}")

        if X_val is not None and y_val is not None:
            val_pred = self.model.predict(X_val)
            val_acc = accuracy_score(y_val, val_pred)
            print(f"驗證集準確率: {val_acc:.4f}")

    def predict(self, X):
        """預測類別"""
        if self.model is None:
            raise ValueError("模型尚未訓練或載入")
        return self.model.predict(X)

    def predict_proba(self, X):
        """預測機率"""
        if self.model is None:
            raise ValueError("模型尚未訓練或載入")
        return self.model.predict_proba(X)[:, 1]

    def evaluate(self, X_test, y_test):
        """
        評估模型性能

        Args:
            X_test: 測試特徵
            y_test: 測試標籤

        Returns:
            評估指標字典
        """
        y_pred = self.predict(X_test)
        y_pred_proba = self.predict_proba(X_test)

        metrics = {
            'accuracy': accuracy_score(y_test, y_pred),
            'precision': precision_score(y_test, y_pred),
            'recall': recall_score(y_test, y_pred),
            'f1': f1_score(y_test, y_pred),
            'auc': roc_auc_score(y_test, y_pred_proba)
        }

        print("\n模型評估結果:")
        print("=" * 50)
        print(f"準確率 (Accuracy):  {metrics['accuracy']:.4f}")
        print(f"精確率 (Precision): {metrics['precision']:.4f}")
        print(f"召回率 (Recall):    {metrics['recall']:.4f}")
        print(f"F1 分數:            {metrics['f1']:.4f}")
        print(f"AUC:               {metrics['auc']:.4f}")
        print("=" * 50)

        print("\n分類報告:")
        print(classification_report(y_test, y_pred, target_names=['未流失', '流失']))

        return metrics

    def get_feature_importance(self, top_n=None):
        """
        取得特徵重要性

        Args:
            top_n: 返回前 N 個重要特徵

        Returns:
            特徵重要性 DataFrame
        """
        if self.model is None:
            raise ValueError("模型尚未訓練或載入")

        if hasattr(self.model, 'feature_importances_'):
            importance = self.model.feature_importances_
        else:
            raise ValueError("此模型不支援特徵重要性")

        importance_df = pd.DataFrame({
            'feature': self.feature_names,
            'importance': importance
        }).sort_values('importance', ascending=False)

        if top_n:
            importance_df = importance_df.head(top_n)

        return importance_df

    def plot_feature_importance(self, top_n=15, figsize=(10, 8)):
        """視覺化特徵重要性"""
        importance_df = self.get_feature_importance(top_n)

        plt.figure(figsize=figsize)
        sns.barplot(data=importance_df, x='importance', y='feature', palette='viridis')
        plt.title(f'前 {top_n} 個重要特徵', fontsize=16, fontweight='bold')
        plt.xlabel('重要性', fontsize=12)
        plt.ylabel('特徵', fontsize=12)
        plt.tight_layout()
        plt.savefig('feature_importance.png', dpi=300, bbox_inches='tight')
        plt.show()

    def plot_confusion_matrix(self, X_test, y_test, figsize=(8, 6)):
        """視覺化混淆矩陣"""
        y_pred = self.predict(X_test)
        cm = confusion_matrix(y_test, y_pred)

        plt.figure(figsize=figsize)
        sns.heatmap(cm, annot=True, fmt='d', cmap='Blues',
                    xticklabels=['未流失', '流失'],
                    yticklabels=['未流失', '流失'])
        plt.title('混淆矩陣', fontsize=16, fontweight='bold')
        plt.ylabel('實際值', fontsize=12)
        plt.xlabel('預測值', fontsize=12)
        plt.tight_layout()
        plt.savefig('confusion_matrix.png', dpi=300, bbox_inches='tight')
        plt.show()

    def plot_roc_curve(self, X_test, y_test, figsize=(8, 6)):
        """視覺化 ROC 曲線"""
        y_pred_proba = self.predict_proba(X_test)
        fpr, tpr, _ = roc_curve(y_test, y_pred_proba)
        auc = roc_auc_score(y_test, y_pred_proba)

        plt.figure(figsize=figsize)
        plt.plot(fpr, tpr, label=f'AUC = {auc:.3f}', linewidth=2)
        plt.plot([0, 1], [0, 1], 'k--', label='隨機猜測')
        plt.xlabel('False Positive Rate', fontsize=12)
        plt.ylabel('True Positive Rate', fontsize=12)
        plt.title('ROC 曲線', fontsize=16, fontweight='bold')
        plt.legend(fontsize=12)
        plt.grid(alpha=0.3)
        plt.tight_layout()
        plt.savefig('roc_curve.png', dpi=300, bbox_inches='tight')
        plt.show()

    def save_model(self, filepath):
        """儲存模型"""
        model_data = {
            'model': self.model,
            'model_type': self.model_type,
            'label_encoders': self.label_encoders,
            'scaler': self.scaler,
            'feature_names': self.feature_names
        }
        joblib.dump(model_data, filepath)
        print(f"模型已儲存到: {filepath}")

    def load_model(self, filepath):
        """載入模型"""
        model_data = joblib.load(filepath)
        self.model = model_data['model']
        self.model_type = model_data['model_type']
        self.label_encoders = model_data['label_encoders']
        self.scaler = model_data['scaler']
        self.feature_names = model_data['feature_names']
        print(f"模型已載入: {filepath}")

    def predict_single(self, customer_data):
        """
        預測單一客戶流失機率

        Args:
            customer_data: 客戶資料字典

        Returns:
            流失機率
        """
        df = pd.DataFrame([customer_data])
        X, _ = self.preprocess(df, is_training=False)
        return self.predict_proba(X)[0]

    def predict_batch(self, df):
        """
        批次預測

        Args:
            df: 客戶資料框

        Returns:
            包含預測結果的資料框
        """
        X, _ = self.preprocess(df.copy(), is_training=False)
        predictions = self.predict(X)
        probabilities = self.predict_proba(X)

        result_df = df.copy()
        result_df['churn_prediction'] = ['Yes' if p == 1 else 'No' for p in predictions]
        result_df['churn_probability'] = probabilities

        return result_df

    def get_retention_recommendations(self, customer_data, churn_prob):
        """
        根據客戶資料提供挽留建議

        Args:
            customer_data: 客戶資料字典
            churn_prob: 流失機率

        Returns:
            建議清單
        """
        recommendations = []

        if churn_prob < 0.3:
            return ["客戶流失風險低，維持現有服務品質"]

        # 基於合約類型
        if customer_data.get('contract_type') == 'Month-to-month':
            recommendations.append("建議升級為長期合約（一年或兩年），提供折扣優惠")

        # 基於服務使用情況
        if customer_data.get('internet_service') == 'Fiber optic':
            if customer_data.get('online_security') == 'No':
                recommendations.append("推薦加購線上安全服務")
            if customer_data.get('tech_support') == 'No':
                recommendations.append("提供免費技術支援試用")

        # 基於費用
        if customer_data.get('monthly_charges', 0) > 70:
            recommendations.append("考慮提供費用優惠或額外服務")

        # 基於使用期限
        if customer_data.get('tenure', 0) < 12:
            recommendations.append("提供新客戶專屬優惠以增加黏著度")

        if not recommendations:
            recommendations.append("主動聯繫客戶了解需求，提供個人化服務方案")

        return recommendations
