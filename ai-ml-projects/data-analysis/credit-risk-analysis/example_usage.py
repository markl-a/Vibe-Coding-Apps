"""
信用風險分析 - 完整使用範例
演示如何使用信用風險分析系統進行風險評估
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, confusion_matrix
import warnings
warnings.filterwarnings('ignore')

# 設置中文字體
plt.rcParams['font.sans-serif'] = ['SimHei', 'DejaVu Sans']
plt.rcParams['axes.unicode_minus'] = False

# ============================================================================
# 1. 生成示例信用風險數據
# ============================================================================
def generate_sample_credit_data(n_samples=1000, random_state=42):
    """
    生成示例信用風險數據
    """
    np.random.seed(random_state)

    data = {
        'age': np.random.randint(18, 75, n_samples),
        'annual_income': np.random.randint(20000, 200000, n_samples),
        'employment_length': np.random.randint(0, 50, n_samples),
        'loan_amount': np.random.randint(1000, 50000, n_samples),
        'debt_to_income_ratio': np.random.uniform(0, 1, n_samples),
        'credit_history_length': np.random.randint(0, 50, n_samples),
        'number_of_accounts': np.random.randint(0, 30, n_samples),
        'number_of_delinquencies': np.random.randint(0, 5, n_samples),
        'revolving_balance': np.random.randint(0, 50000, n_samples),
        'total_credit_limit': np.random.randint(5000, 500000, n_samples),
    }

    df = pd.DataFrame(data)

    # 添加類別變數
    df['home_ownership'] = np.random.choice(['RENT', 'OWN', 'MORTGAGE'], n_samples)
    df['loan_purpose'] = np.random.choice(
        ['debt_consolidation', 'credit_card', 'home_improvement', 'personal', 'auto'],
        n_samples
    )

    # 生成目標變數（違約概率由特徵決定）
    # 高齡、高收入、低債務比、低逾期次數 -> 低違約風險
    default_prob = (
        0.02 * (df['age'] < 30).astype(int) +
        0.03 * (df['annual_income'] < 30000).astype(int) +
        0.05 * (df['debt_to_income_ratio'] > 0.5).astype(int) +
        0.04 * (df['number_of_delinquencies'] > 0).astype(int) +
        0.02 * (df['employment_length'] < 2).astype(int) +
        0.01  # 基礎風險
    )
    default_prob = np.clip(default_prob, 0, 1)
    df['default'] = (np.random.random(n_samples) < default_prob).astype(int)

    return df


# ============================================================================
# 2. 數據分析和預處理
# ============================================================================
def analyze_and_preprocess_data(df):
    """
    分析和預處理信用風險數據
    """
    print("=" * 80)
    print("1. 數據分析和預處理")
    print("=" * 80)

    # 基本信息
    print("\n數據集概況:")
    print(f"  總記錄數: {len(df)}")
    print(f"  特徵數: {df.shape[1]}")
    print(f"  數值特徵: {df.select_dtypes(include=[np.number]).shape[1]}")
    print(f"  類別特徵: {df.select_dtypes(include=['object']).shape[1]}")

    # 缺失值檢查
    missing = df.isnull().sum()
    if missing.sum() > 0:
        print("\n缺失值:")
        print(missing[missing > 0])
    else:
        print("\n✅ 無缺失值")

    # 目標變數分佈
    print("\n目標變數分佈 (default):")
    print(f"  沒有違約 (0): {(df['default'] == 0).sum()} ({(df['default'] == 0).mean()*100:.1f}%)")
    print(f"  違約 (1): {(df['default'] == 1).sum()} ({(df['default'] == 1).mean()*100:.1f}%)")

    # 描述統計
    print("\n數值特徵描述統計:")
    print(df.describe().round(2))

    # 相關性分析
    print("\n與違約最相關的特徵:")
    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    numeric_cols.remove('default')
    correlations = df[numeric_cols + ['default']].corr()['default'].drop('default').sort_values(ascending=False)
    print(correlations.head(10).round(3))

    # 數據預處理
    df_processed = df.copy()

    # 編碼類別變數
    le_home = LabelEncoder()
    le_purpose = LabelEncoder()
    df_processed['home_ownership'] = le_home.fit_transform(df_processed['home_ownership'])
    df_processed['loan_purpose'] = le_purpose.fit_transform(df_processed['loan_purpose'])

    return df_processed


# ============================================================================
# 3. 特徵工程
# ============================================================================
def create_features(df):
    """
    創建新的特徵以改進模型性能
    """
    print("\n創建新特徵:")

    # 特徵工程
    df['income_per_account'] = df['annual_income'] / (df['number_of_accounts'] + 1)
    df['credit_utilization'] = df['revolving_balance'] / (df['total_credit_limit'] + 1)
    df['age_groups'] = pd.cut(df['age'], bins=[0, 25, 35, 50, 65, 100], labels=[0, 1, 2, 3, 4]).astype(int)
    df['high_risk_features'] = (df['number_of_delinquencies'] > 0).astype(int)
    df['credit_history_years'] = df['credit_history_length']

    print("  ✅ 創建了5個新特徵:")
    print("    - income_per_account: 人均年收入")
    print("    - credit_utilization: 信用使用率")
    print("    - age_groups: 年齡分組")
    print("    - high_risk_features: 高風險特徵標記")
    print("    - credit_history_years: 信用歷史年數")

    return df


# ============================================================================
# 4. 模型訓練
# ============================================================================
def train_credit_risk_models(X_train, y_train, X_test, y_test):
    """
    訓練多個信用風險預測模型
    """
    print("\n" + "=" * 80)
    print("2. 模型訓練")
    print("=" * 80)

    # 特徵縮放
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    models = {
        'Logistic Regression': LogisticRegression(max_iter=1000, random_state=42),
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
            'probabilities': y_pred_proba
        }

        print(f"  Accuracy:  {acc:.4f}")
        print(f"  Precision: {prec:.4f}")
        print(f"  Recall:    {rec:.4f}")
        print(f"  F1-Score:  {f1:.4f}")
        print(f"  AUC-ROC:   {auc:.4f}")

    return results, scaler


# ============================================================================
# 5. 模型評估和可視化
# ============================================================================
def evaluate_models(results):
    """
    評估和比較模型性能
    """
    print("\n" + "=" * 80)
    print("3. 模型評估")
    print("=" * 80)

    # 性能比較表
    print("\n模型性能比較:")
    performance_df = pd.DataFrame({
        'Model': list(results.keys()),
        'Accuracy': [results[m]['accuracy'] for m in results.keys()],
        'Precision': [results[m]['precision'] for m in results.keys()],
        'Recall': [results[m]['recall'] for m in results.keys()],
        'F1-Score': [results[m]['f1'] for m in results.keys()],
        'AUC-ROC': [results[m]['auc'] for m in results.keys()]
    })
    print(performance_df.to_string(index=False))

    # 最佳模型
    best_model_name = performance_df.loc[performance_df['F1-Score'].idxmax(), 'Model']
    print(f"\n🏆 最佳模型: {best_model_name}")

    return best_model_name, results[best_model_name]


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

    # Random Forest 和 Gradient Boosting 有特徵重要性
    if hasattr(model, 'feature_importances_'):
        importance_df = pd.DataFrame({
            'feature': feature_names,
            'importance': model.feature_importances_
        }).sort_values('importance', ascending=False)

        print("\n前10個最重要的特徵:")
        print(importance_df.head(10).to_string(index=False))

        return importance_df
    else:
        print("\n此模型不支援特徵重要性分析")
        return None


# ============================================================================
# 7. 信用風險評估
# ============================================================================
def predict_credit_risk(model, scaler, applicant_data, feature_names):
    """
    評估單個申請人的信用風險
    """
    print("\n" + "=" * 80)
    print("5. 單人信用風險評估")
    print("=" * 80)

    # 準備特徵
    X = pd.DataFrame([applicant_data], columns=feature_names)
    X_scaled = scaler.transform(X)

    # 預測
    risk_prob = model.predict_proba(X_scaled)[0, 1]
    risk_class = model.predict(X_scaled)[0]

    # 風險等級（基於違約概率）
    if risk_prob < 0.05:
        risk_grade = 'A'
        recommendation = '批准，優惠利率'
    elif risk_prob < 0.10:
        risk_grade = 'B'
        recommendation = '批准，標準利率'
    elif risk_prob < 0.20:
        risk_grade = 'C'
        recommendation = '批准，較高利率'
    elif risk_prob < 0.35:
        risk_grade = 'D'
        recommendation = '謹慎考慮，高利率'
    elif risk_prob < 0.50:
        risk_grade = 'E'
        recommendation = '不建議批准'
    else:
        risk_grade = 'F'
        recommendation = '拒絕'

    # 信用評分（300-850）
    credit_score = int(850 - risk_prob * 550)

    print(f"\n申請人信息:")
    for key, value in applicant_data.items():
        print(f"  {key}: {value}")

    print(f"\n風險評估結果:")
    print(f"  違約概率: {risk_prob:.2%}")
    print(f"  信用評分: {credit_score}")
    print(f"  風險等級: {risk_grade}")
    print(f"  建議: {recommendation}")

    return {
        'risk_probability': risk_prob,
        'credit_score': credit_score,
        'risk_grade': risk_grade,
        'recommendation': recommendation
    }


# ============================================================================
# 8. 批次風險評估
# ============================================================================
def batch_credit_assessment(model, scaler, df_batch, feature_names):
    """
    批量評估多個申請人
    """
    print("\n" + "=" * 80)
    print("6. 批量風險評估")
    print("=" * 80)

    X_batch = df_batch[feature_names]
    X_scaled = scaler.transform(X_batch)

    # 預測
    risk_probs = model.predict_proba(X_scaled)[:, 1]

    # 確定風險等級
    risk_grades = []
    for prob in risk_probs:
        if prob < 0.05:
            risk_grades.append('A')
        elif prob < 0.10:
            risk_grades.append('B')
        elif prob < 0.20:
            risk_grades.append('C')
        elif prob < 0.35:
            risk_grades.append('D')
        elif prob < 0.50:
            risk_grades.append('E')
        else:
            risk_grades.append('F')

    results_df = pd.DataFrame({
        'risk_probability': risk_probs,
        'credit_score': (850 - risk_probs * 550).astype(int),
        'risk_grade': risk_grades
    })

    # 統計
    print(f"\n批量評估結果統計:")
    print(f"  評估人數: {len(results_df)}")
    print(f"\n風險等級分佈:")
    grade_dist = results_df['risk_grade'].value_counts().sort_index()
    for grade, count in grade_dist.items():
        print(f"  {grade}: {count} ({count/len(results_df)*100:.1f}%)")

    print(f"\n違約概率統計:")
    print(f"  平均: {results_df['risk_probability'].mean():.2%}")
    print(f"  中位數: {results_df['risk_probability'].median():.2%}")
    print(f"  最小: {results_df['risk_probability'].min():.2%}")
    print(f"  最大: {results_df['risk_probability'].max():.2%}")

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

    # 1. 違約分佈
    default_counts = df['default'].value_counts()
    axes[0, 0].bar(['無違約', '違約'], default_counts.values)
    axes[0, 0].set_title('目標變數分佈')
    axes[0, 0].set_ylabel('計數')

    # 2. 年齡vs違約
    age_bins = pd.cut(df['age'], bins=5)
    default_by_age = df.groupby(age_bins)['default'].agg(['sum', 'count'])
    default_by_age['rate'] = default_by_age['sum'] / default_by_age['count']
    axes[0, 1].plot(range(len(default_by_age)), default_by_age['rate'].values, marker='o')
    axes[0, 1].set_title('不同年齡段的違約率')
    axes[0, 1].set_ylabel('違約率')
    axes[0, 1].set_xlabel('年齡段')

    # 3. 收入vs違約
    income_bins = pd.cut(df['annual_income'], bins=5)
    default_by_income = df.groupby(income_bins)['default'].agg(['sum', 'count'])
    default_by_income['rate'] = default_by_income['sum'] / default_by_income['count']
    axes[1, 0].plot(range(len(default_by_income)), default_by_income['rate'].values, marker='o')
    axes[1, 0].set_title('不同收入水準的違約率')
    axes[1, 0].set_ylabel('違約率')
    axes[1, 0].set_xlabel('收入水準')

    # 4. 特徵重要性
    if importance_df is not None:
        top_features = importance_df.head(10)
        axes[1, 1].barh(top_features['feature'], top_features['importance'])
        axes[1, 1].set_title('前10個最重要特徵')
        axes[1, 1].set_xlabel('重要性')
    else:
        axes[1, 1].text(0.5, 0.5, '特徵重要性分析不可用', ha='center', va='center')

    plt.tight_layout()
    plt.savefig('credit_risk_analysis.png', dpi=300, bbox_inches='tight')
    print("\n✅ 圖表已保存為: credit_risk_analysis.png")
    plt.show()


# ============================================================================
# 主程序
# ============================================================================
def main():
    """
    完整的信用風險分析示例
    """
    print("\n" + "=" * 80)
    print("信用風險分析 - 完整使用範例")
    print("=" * 80)

    # 1. 生成數據
    print("\n準備數據...")
    df = generate_sample_credit_data(n_samples=1000)
    df = analyze_and_preprocess_data(df)
    df = create_features(df)

    # 2. 分割數據
    feature_cols = [col for col in df.columns if col != 'default']
    X = df[feature_cols]
    y = df['default']

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    print(f"\n數據分割:")
    print(f"  訓練集: {len(X_train)}")
    print(f"  測試集: {len(X_test)}")

    # 3. 訓練模型
    results, scaler = train_credit_risk_models(X_train, y_train, X_test, y_test)

    # 4. 評估模型
    best_model_name, best_result = evaluate_models(results)

    # 5. 特徵重要性
    importance_df = analyze_feature_importance(best_result, feature_cols)

    # 6. 單人評估
    sample_applicant = {
        'age': 35,
        'annual_income': 75000,
        'employment_length': 5,
        'loan_amount': 15000,
        'debt_to_income_ratio': 0.35,
        'credit_history_length': 10,
        'number_of_accounts': 8,
        'number_of_delinquencies': 0,
        'revolving_balance': 5000,
        'total_credit_limit': 50000,
        'home_ownership': 1,  # MORTGAGE (encoded)
        'loan_purpose': 0,    # debt_consolidation (encoded)
        'income_per_account': 75000 / 8,
        'credit_utilization': 5000 / 50000,
        'age_groups': 2,
        'high_risk_features': 0,
        'credit_history_years': 10
    }
    risk_assessment = predict_credit_risk(
        best_result['model'], scaler, sample_applicant, feature_cols
    )

    # 7. 批量評估
    batch_results = batch_credit_assessment(
        best_result['model'], scaler, X_test.iloc[:50], feature_cols
    )

    # 8. 可視化
    visualize_results(df, results, importance_df)

    print("\n" + "=" * 80)
    print("✅ 分析完成！")
    print("=" * 80 + "\n")


if __name__ == '__main__':
    main()
