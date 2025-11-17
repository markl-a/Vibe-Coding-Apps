"""
客戶流失預測 - 完整使用範例
演示如何使用客戶流失預測系統進行流失風險評估
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score
from sklearn.metrics import confusion_matrix, classification_report
import warnings
warnings.filterwarnings('ignore')

# 設置中文字體
plt.rcParams['font.sans-serif'] = ['SimHei', 'DejaVu Sans']
plt.rcParams['axes.unicode_minus'] = False

# ============================================================================
# 1. 生成示例客戶流失數據
# ============================================================================
def generate_sample_churn_data(n_samples=1000, random_state=42):
    """
    生成示例電信客戶流失數據
    """
    np.random.seed(random_state)

    data = {
        'customer_id': [f'CUST_{i:05d}' for i in range(n_samples)],
        'tenure': np.random.randint(1, 73, n_samples),  # 使用服務月數
        'monthly_charges': np.random.uniform(20, 120, n_samples),
        'total_charges': np.random.uniform(100, 10000, n_samples),
        'phone_service': np.random.choice([0, 1], n_samples),
        'streaming_tv': np.random.choice([0, 1], n_samples),
        'streaming_movies': np.random.choice([0, 1], n_samples),
        'tech_support': np.random.choice([0, 1], n_samples),
        'online_security': np.random.choice([0, 1], n_samples),
        'device_protection': np.random.choice([0, 1], n_samples),
        'paperless_billing': np.random.choice([0, 1], n_samples),
        'senior_citizen': np.random.choice([0, 1], n_samples),
        'partner': np.random.choice([0, 1], n_samples),
        'dependents': np.random.choice([0, 1], n_samples),
    }

    df = pd.DataFrame(data)

    # 添加類別變數
    df['contract_type'] = np.random.choice(['Month-to-month', 'One year', 'Two year'], n_samples)
    df['internet_service'] = np.random.choice(['DSL', 'Fiber optic', 'No'], n_samples)
    df['payment_method'] = np.random.choice(['Electronic check', 'Mailed check', 'Bank transfer', 'Credit card'], n_samples)

    # 生成流失目標變數
    # 短期合約、高月費、無附加服務 -> 高流失風險
    churn_prob = (
        0.30 * (df['contract_type'] == 'Month-to-month').astype(int) +
        0.02 * (df['monthly_charges'] > 80).astype(int) +
        0.15 * ((df['tech_support'] + df['online_security'] + df['device_protection']) == 0).astype(int) +
        0.10 * (df['tenure'] < 12).astype(int) +
        0.05 * (df['senior_citizen'] == 1).astype(int) +
        0.02  # 基礎流失率
    )
    churn_prob = np.clip(churn_prob, 0, 1)
    df['churn'] = (np.random.random(n_samples) < churn_prob).astype(int)

    return df


# ============================================================================
# 2. 數據分析和預處理
# ============================================================================
def analyze_and_preprocess_data(df):
    """
    分析和預處理客戶流失數據
    """
    print("=" * 80)
    print("1. 數據分析和預處理")
    print("=" * 80)

    # 基本信息
    print("\n數據集概況:")
    print(f"  總客戶數: {len(df)}")
    print(f"  特徵數: {df.shape[1]}")

    # 缺失值檢查
    missing = df.isnull().sum()
    if missing.sum() > 0:
        print("\n缺失值:")
        print(missing[missing > 0])
    else:
        print("\n✅ 無缺失值")

    # 流失率
    churn_rate = df['churn'].mean()
    print(f"\n流失率:")
    print(f"  保留客戶: {(df['churn'] == 0).sum()} ({(df['churn'] == 0).mean()*100:.1f}%)")
    print(f"  流失客戶: {(df['churn'] == 1).sum()} ({(df['churn'] == 1).mean()*100:.1f}%)")

    # 數據預處理
    df_processed = df.copy()

    # 編碼類別變數
    le_contract = LabelEncoder()
    le_internet = LabelEncoder()
    le_payment = LabelEncoder()

    df_processed['contract_type'] = le_contract.fit_transform(df_processed['contract_type'])
    df_processed['internet_service'] = le_internet.fit_transform(df_processed['internet_service'])
    df_processed['payment_method'] = le_payment.fit_transform(df_processed['payment_method'])

    return df_processed


# ============================================================================
# 3. 特徵分析
# ============================================================================
def analyze_features(df):
    """
    分析特徵與流失的關係
    """
    print("\n特徵與流失的關係分析:")

    # 計算每個特徵的流失率
    feature_churn_rates = {}

    for col in df.columns:
        if col not in ['customer_id', 'churn']:
            if df[col].dtype in ['int64', 'float64']:
                # 對於數值特徵，計算相關性
                if col not in ['monthly_charges', 'total_charges', 'tenure']:
                    continue
                mean_churn = df[df[col] == 1]['churn'].mean() if df[col].sum() > 0 else 0
                feature_churn_rates[f'{col}=1'] = mean_churn
            else:
                for val in df[col].unique():
                    mean_churn = df[df[col] == val]['churn'].mean()
                    feature_churn_rates[f'{col}={val}'] = mean_churn

    # 排序並顯示
    sorted_rates = sorted(feature_churn_rates.items(), key=lambda x: x[1], reverse=True)
    print("\n流失率最高的特徵值:")
    for feature, rate in sorted_rates[:10]:
        print(f"  {feature}: {rate:.1%}")


# ============================================================================
# 4. 模型訓練
# ============================================================================
def train_churn_models(X_train, y_train, X_test, y_test):
    """
    訓練客戶流失預測模型
    """
    print("\n" + "=" * 80)
    print("2. 模型訓練")
    print("=" * 80)

    # 特徵縮放
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    models = {
        'Random Forest': RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1),
        'Gradient Boosting': GradientBoostingClassifier(n_estimators=100, random_state=42)
    }

    results = {}

    for name, model in models.items():
        print(f"\n訓練 {name}...")
        model.fit(X_train_scaled, y_train)

        # 預測
        y_pred = model.predict(X_test_scaled)
        y_pred_proba = model.predict_proba(X_test_scaled)[:, 1]

        # 評估
        acc = accuracy_score(y_test, y_pred)
        prec = precision_score(y_test, y_pred, zero_division=0)
        rec = recall_score(y_test, y_pred, zero_division=0)
        f1 = f1_score(y_test, y_pred, zero_division=0)
        auc = roc_auc_score(y_test, y_pred_proba)

        results[name] = {
            'model': model,
            'scaler': scaler,
            'accuracy': acc,
            'precision': prec,
            'recall': rec,
            'f1': f1,
            'auc': auc,
            'predictions': y_pred,
            'probabilities': y_pred_proba,
            'y_test': y_test
        }

        print(f"  Accuracy:  {acc:.4f}")
        print(f"  Precision: {prec:.4f}")
        print(f"  Recall:    {rec:.4f}")
        print(f"  F1-Score:  {f1:.4f}")
        print(f"  AUC-ROC:   {auc:.4f}")

    return results, scaler


# ============================================================================
# 5. 混淆矩陣分析
# ============================================================================
def analyze_confusion_matrix(results):
    """
    分析混淆矩陣
    """
    print("\n" + "=" * 80)
    print("3. 混淆矩陣分析")
    print("=" * 80)

    for name, result in results.items():
        print(f"\n{name}:")
        cm = confusion_matrix(result['y_test'], result['predictions'])
        print(f"  真負例 (TN): {cm[0, 0]}")
        print(f"  假正例 (FP): {cm[0, 1]}")
        print(f"  假負例 (FN): {cm[1, 0]}")
        print(f"  真正例 (TP): {cm[1, 1]}")

        print(f"\n詳細分類報告:")
        print(classification_report(result['y_test'], result['predictions'], zero_division=0))


# ============================================================================
# 6. 特徵重要性分析
# ============================================================================
def analyze_feature_importance(best_result, feature_names):
    """
    分析特徵重要性
    """
    print("\n" + "=" * 80)
    print("4. 特徵重要性分析")
    print("=" * 80)

    model = best_result['model']

    if hasattr(model, 'feature_importances_'):
        importance_df = pd.DataFrame({
            'feature': feature_names,
            'importance': model.feature_importances_
        }).sort_values('importance', ascending=False)

        print("\n影響客戶流失的主要特徵 (前15個):")
        print(importance_df.head(15).to_string(index=False))

        return importance_df
    else:
        print("\n此模型不支援特徵重要性分析")
        return None


# ============================================================================
# 7. 單客戶流失預測
# ============================================================================
def predict_customer_churn(model, scaler, customer_data, feature_names):
    """
    預測單個客戶的流失風險
    """
    print("\n" + "=" * 80)
    print("5. 單客戶流失風險評估")
    print("=" * 80)

    # 準備特徵
    X = pd.DataFrame([customer_data], columns=feature_names)
    X_scaled = scaler.transform(X)

    # 預測
    churn_prob = model.predict_proba(X_scaled)[0, 1]
    churn_class = model.predict(X_scaled)[0]

    # 風險等級
    if churn_prob < 0.3:
        risk_level = '低風險'
        action = '維持現有服務'
    elif churn_prob < 0.7:
        risk_level = '中風險'
        action = '主動關懷，評估客戶需求'
    else:
        risk_level = '高風險'
        action = '優先挽留，提供優惠方案'

    print(f"\n客戶流失風險評估:")
    print(f"  流失概率: {churn_prob:.1%}")
    print(f"  風險等級: {risk_level}")
    print(f"  推薦行動: {action}")

    return {
        'churn_probability': churn_prob,
        'risk_level': risk_level,
        'recommendation': action
    }


# ============================================================================
# 8. 批量流失預測
# ============================================================================
def batch_churn_prediction(model, scaler, df_batch, feature_names):
    """
    批量預測客戶流失
    """
    print("\n" + "=" * 80)
    print("6. 批量流失風險評估")
    print("=" * 80)

    # 移除非特徵欄位
    X_batch = df_batch[feature_names]
    X_scaled = scaler.transform(X_batch)

    # 預測
    churn_probs = model.predict_proba(X_scaled)[:, 1]

    # 確定風險等級
    risk_levels = []
    for prob in churn_probs:
        if prob < 0.3:
            risk_levels.append('低風險')
        elif prob < 0.7:
            risk_levels.append('中風險')
        else:
            risk_levels.append('高風險')

    results_df = pd.DataFrame({
        'customer_id': df_batch['customer_id'].values if 'customer_id' in df_batch.columns else range(len(churn_probs)),
        'churn_probability': churn_probs,
        'risk_level': risk_levels
    })

    # 統計
    print(f"\n批量評估結果統計:")
    print(f"  評估客戶數: {len(results_df)}")
    print(f"\n風險等級分佈:")
    risk_dist = results_df['risk_level'].value_counts()
    for risk, count in risk_dist.items():
        print(f"  {risk}: {count} ({count/len(results_df)*100:.1f}%)")

    print(f"\n流失概率統計:")
    print(f"  平均: {results_df['churn_probability'].mean():.2%}")
    print(f"  中位數: {results_df['churn_probability'].median():.2%}")
    print(f"  最小: {results_df['churn_probability'].min():.2%}")
    print(f"  最大: {results_df['churn_probability'].max():.2%}")

    # 高風險客戶
    high_risk = results_df[results_df['risk_level'] == '高風險']
    print(f"\n高風險客戶詳情 (前10個):")
    print(high_risk.head(10).to_string(index=False))

    return results_df


# ============================================================================
# 9. 可視化
# ============================================================================
def visualize_results(df, results, importance_df=None):
    """
    可視化分析結果
    """
    print("\n" + "=" * 80)
    print("7. 結果可視化")
    print("=" * 80)

    fig, axes = plt.subplots(2, 2, figsize=(14, 10))

    # 1. 流失率分佈
    churn_counts = df['churn'].value_counts()
    axes[0, 0].bar(['保留客戶', '流失客戶'], churn_counts.values)
    axes[0, 0].set_title('客戶流失分佈')
    axes[0, 0].set_ylabel('計數')

    # 2. 合約類型vs流失
    contract_churn = df.groupby('contract_type')['churn'].agg(['sum', 'count'])
    contract_churn['rate'] = contract_churn['sum'] / contract_churn['count']
    axes[0, 1].bar(range(len(contract_churn)), contract_churn['rate'].values)
    axes[0, 1].set_title('合約類型與流失率')
    axes[0, 1].set_ylabel('流失率')
    axes[0, 1].set_xticks(range(len(contract_churn)))
    axes[0, 1].set_xticklabels(contract_churn.index, rotation=45, ha='right')

    # 3. 使用月數vs流失
    tenure_bins = pd.cut(df['tenure'], bins=6)
    tenure_churn = df.groupby(tenure_bins)['churn'].agg(['sum', 'count'])
    tenure_churn['rate'] = tenure_churn['sum'] / tenure_churn['count']
    axes[1, 0].plot(range(len(tenure_churn)), tenure_churn['rate'].values, marker='o')
    axes[1, 0].set_title('使用月數與流失率')
    axes[1, 0].set_ylabel('流失率')
    axes[1, 0].set_xlabel('使用月數區間')

    # 4. 特徵重要性
    if importance_df is not None:
        top_features = importance_df.head(10)
        axes[1, 1].barh(top_features['feature'], top_features['importance'])
        axes[1, 1].set_title('前10個最重要特徵')
        axes[1, 1].set_xlabel('重要性')
    else:
        axes[1, 1].text(0.5, 0.5, '特徵重要性分析不可用', ha='center', va='center')

    plt.tight_layout()
    plt.savefig('churn_analysis.png', dpi=300, bbox_inches='tight')
    print("\n✅ 圖表已保存為: churn_analysis.png")
    plt.show()


# ============================================================================
# 主程序
# ============================================================================
def main():
    """
    完整的客戶流失預測示例
    """
    print("\n" + "=" * 80)
    print("客戶流失預測 - 完整使用範例")
    print("=" * 80)

    # 1. 生成數據
    print("\n準備數據...")
    df = generate_sample_churn_data(n_samples=1000)
    df = analyze_and_preprocess_data(df)
    analyze_features(df)

    # 2. 分割數據
    feature_cols = [col for col in df.columns if col not in ['customer_id', 'churn']]
    X = df[feature_cols]
    y = df['churn']

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    print(f"\n數據分割:")
    print(f"  訓練集: {len(X_train)}")
    print(f"  測試集: {len(X_test)}")

    # 3. 訓練模型
    results, scaler = train_churn_models(X_train, y_train, X_test, y_test)

    # 4. 混淆矩陣分析
    analyze_confusion_matrix(results)

    # 5. 選擇最佳模型
    best_model_name = max(results.keys(), key=lambda x: results[x]['f1'])
    best_result = results[best_model_name]
    print(f"\n🏆 最佳模型: {best_model_name}")

    # 6. 特徵重要性
    importance_df = analyze_feature_importance(best_result, feature_cols)

    # 7. 單客戶預測
    sample_customer = {
        'tenure': 12,
        'monthly_charges': 65.5,
        'total_charges': 786.0,
        'phone_service': 1,
        'streaming_tv': 1,
        'streaming_movies': 0,
        'tech_support': 0,
        'online_security': 0,
        'device_protection': 0,
        'paperless_billing': 1,
        'senior_citizen': 0,
        'partner': 1,
        'dependents': 0,
        'contract_type': 0,  # Month-to-month
        'internet_service': 0,  # DSL
        'payment_method': 0   # Electronic check
    }
    churn_prediction = predict_customer_churn(
        best_result['model'], scaler, sample_customer, feature_cols
    )

    # 8. 批量預測
    batch_results = batch_churn_prediction(
        best_result['model'], scaler, X_test.iloc[:100].assign(customer_id=df['customer_id'].iloc[len(X_train):len(X_train)+100].values), feature_cols
    )

    # 9. 可視化
    visualize_results(df, results, importance_df)

    print("\n" + "=" * 80)
    print("✅ 分析完成！")
    print("=" * 80 + "\n")


if __name__ == '__main__':
    main()
