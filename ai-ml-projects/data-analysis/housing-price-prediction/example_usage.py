"""
房價預測 - 完整使用範例
演示如何使用房價預測系統進行房價估算和市場分析
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
import warnings
warnings.filterwarnings('ignore')

# 設置中文字體
plt.rcParams['font.sans-serif'] = ['SimHei', 'DejaVu Sans']
plt.rcParams['axes.unicode_minus'] = False

# ============================================================================
# 1. 生成示例房價數據
# ============================================================================
def generate_sample_housing_data(n_samples=500, random_state=42):
    """
    生成示例房地產數據
    """
    np.random.seed(random_state)

    data = {
        'bedrooms': np.random.randint(1, 6, n_samples),
        'bathrooms': np.random.randint(1, 5, n_samples) + np.random.random(n_samples),
        'sqft_living': np.random.randint(1000, 5000, n_samples),
        'sqft_lot': np.random.randint(5000, 100000, n_samples),
        'floors': np.random.choice([1.0, 1.5, 2.0, 2.5, 3.0], n_samples),
        'waterfront': np.random.choice([0, 1], n_samples, p=[0.95, 0.05]),
        'view': np.random.randint(0, 5, n_samples),
        'condition': np.random.randint(1, 6, n_samples),
        'grade': np.random.randint(3, 14, n_samples),
        'yr_built': np.random.randint(1950, 2024, n_samples),
        'yr_renovated': np.random.randint(0, 2024, n_samples),
        'lat': np.random.uniform(47.15, 47.78, n_samples),
        'long': np.random.uniform(-122.52, -122.21, n_samples),
    }

    df = pd.DataFrame(data)

    # 生成房價（基於特徵）
    price = (
        100000 +  # 基礎價格
        150000 * df['bedrooms'] +
        80000 * df['bathrooms'] +
        100 * df['sqft_living'] +
        5 * df['sqft_lot'] +
        50000 * df['floors'] +
        200000 * df['waterfront'] +
        50000 * df['view'] +
        30000 * df['condition'] +
        20000 * df['grade'] +
        500 * (2024 - df['yr_built']) +
        -500 * (2024 - df['yr_renovated']) +
        np.random.normal(0, 100000, n_samples)  # 噪音
    )

    df['price'] = np.maximum(price, 100000)  # 最低價格100000
    df['price'] = df['price'].astype(int)

    return df


# ============================================================================
# 2. 數據分析和預處理
# ============================================================================
def analyze_and_preprocess_data(df):
    """
    分析和預處理房價數據
    """
    print("=" * 80)
    print("1. 數據分析和預處理")
    print("=" * 80)

    # 基本信息
    print("\n數據集概況:")
    print(f"  總房屋數: {len(df)}")
    print(f"  特徵數: {df.shape[1]}")

    # 缺失值檢查
    missing = df.isnull().sum()
    if missing.sum() > 0:
        print("\n缺失值:")
        print(missing[missing > 0])
    else:
        print("\n✅ 無缺失值")

    # 房價統計
    print("\n房價統計:")
    print(f"  最低: ${df['price'].min():,.0f}")
    print(f"  最高: ${df['price'].max():,.0f}")
    print(f"  平均: ${df['price'].mean():,.0f}")
    print(f"  中位數: ${df['price'].median():,.0f}")
    print(f"  標準差: ${df['price'].std():,.0f}")

    # 描述統計
    print("\n數值特徵描述統計:")
    print(df.describe().round(2))

    # 相關性分析
    print("\n與房價最相關的特徵:")
    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    numeric_cols.remove('price')
    correlations = df[numeric_cols + ['price']].corr()['price'].drop('price').sort_values(ascending=False)
    print(correlations.round(3))

    return df


# ============================================================================
# 3. 特徵工程
# ============================================================================
def create_features(df):
    """
    創建新的特徵以改進模型性能
    """
    print("\n創建新特徵:")

    # 特徵工程
    df['price_per_sqft'] = df['price'] / df['sqft_living']
    df['total_rooms'] = df['bedrooms'] + df['bathrooms']
    df['bathrooms_per_bedroom'] = df['bathrooms'] / (df['bedrooms'] + 1)
    df['lot_to_living_ratio'] = df['sqft_lot'] / df['sqft_living']
    df['age'] = 2024 - df['yr_built']
    df['years_since_renovation'] = 2024 - df['yr_renovated']
    df['is_renovated'] = (df['yr_renovated'] > 0).astype(int)

    print("  ✅ 創建了7個新特徵:")
    print("    - price_per_sqft: 每平方英尺價格")
    print("    - total_rooms: 總房間數")
    print("    - bathrooms_per_bedroom: 浴室/臥室比例")
    print("    - lot_to_living_ratio: 土地/室內面積比")
    print("    - age: 房齡")
    print("    - years_since_renovation: 距上次翻新年數")
    print("    - is_renovated: 是否已翻新")

    return df


# ============================================================================
# 4. 模型訓練
# ============================================================================
def train_price_prediction_models(X_train, y_train, X_test, y_test):
    """
    訓練多個房價預測模型
    """
    print("\n" + "=" * 80)
    print("2. 模型訓練")
    print("=" * 80)

    # 特徵縮放
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    models = {
        'Linear Regression': LinearRegression(),
        'Random Forest': RandomForestRegressor(n_estimators=100, random_state=42, n_jobs=-1),
        'Gradient Boosting': GradientBoostingRegressor(n_estimators=100, random_state=42)
    }

    results = {}

    for name, model in models.items():
        print(f"\n訓練 {name}...")

        if name == 'Linear Regression':
            model.fit(X_train_scaled, y_train)
            y_pred = model.predict(X_test_scaled)
        else:
            model.fit(X_train, y_train)
            y_pred = model.predict(X_test)

        # 評估
        mse = mean_squared_error(y_test, y_pred)
        rmse = np.sqrt(mse)
        mae = mean_absolute_error(y_test, y_pred)
        r2 = r2_score(y_test, y_pred)

        results[name] = {
            'model': model,
            'scaler': scaler,
            'mse': mse,
            'rmse': rmse,
            'mae': mae,
            'r2': r2,
            'predictions': y_pred,
            'y_test': y_test,
            'use_scaling': (name == 'Linear Regression')
        }

        print(f"  MSE:  ${mse:,.0f}")
        print(f"  RMSE: ${rmse:,.0f}")
        print(f"  MAE:  ${mae:,.0f}")
        print(f"  R²:   {r2:.4f}")

    return results, scaler


# ============================================================================
# 5. 模型評估
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
        'RMSE': [results[m]['rmse'] for m in results.keys()],
        'MAE': [results[m]['mae'] for m in results.keys()],
        'R² Score': [results[m]['r2'] for m in results.keys()]
    })

    # 格式化輸出
    for idx, row in performance_df.iterrows():
        print(f"\n{row['Model']}:")
        print(f"  RMSE: ${row['RMSE']:,.0f}")
        print(f"  MAE:  ${row['MAE']:,.0f}")
        print(f"  R²:   {row['R² Score']:.4f}")

    # 最佳模型
    best_model_name = performance_df.loc[performance_df['R² Score'].idxmax(), 'Model']
    print(f"\n🏆 最佳模型: {best_model_name}")

    return best_model_name, results[best_model_name]


# ============================================================================
# 6. 特徵重要性分析
# ============================================================================
def analyze_feature_importance(best_result, feature_names, model_name):
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

        print(f"\n{model_name} - 前15個最重要的特徵:")
        print(importance_df.head(15).to_string(index=False))

        return importance_df
    else:
        if hasattr(model, 'coef_'):
            coef_df = pd.DataFrame({
                'feature': feature_names,
                'coefficient': np.abs(model.coef_)
            }).sort_values('coefficient', ascending=False)

            print(f"\n{model_name} - 前15個最重要的特徵 (按係數絕對值):")
            print(coef_df.head(15).to_string(index=False))

            return coef_df
        else:
            print("\n此模型不支援特徵重要性分析")
            return None


# ============================================================================
# 7. 單房屋價格預測
# ============================================================================
def predict_house_price(model, scaler, house_data, feature_names, use_scaling=False):
    """
    預測單棟房屋的價格
    """
    print("\n" + "=" * 80)
    print("5. 單房屋價格預測")
    print("=" * 80)

    # 準備特徵
    X = pd.DataFrame([house_data], columns=feature_names)

    if use_scaling:
        X_scaled = scaler.transform(X)
        predicted_price = model.predict(X_scaled)[0]
    else:
        predicted_price = model.predict(X)[0]

    print(f"\n房屋特徵:")
    for key, value in house_data.items():
        if isinstance(value, float):
            print(f"  {key}: {value:.2f}")
        else:
            print(f"  {key}: {value}")

    print(f"\n預測結果:")
    print(f"  預測房價: ${predicted_price:,.0f}")

    return predicted_price


# ============================================================================
# 8. 批量房價預測
# ============================================================================
def batch_price_prediction(model, scaler, df_batch, feature_names, use_scaling=False):
    """
    批量預測房屋價格
    """
    print("\n" + "=" * 80)
    print("6. 批量房價預測")
    print("=" * 80)

    X_batch = df_batch[feature_names]

    if use_scaling:
        X_scaled = scaler.transform(X_batch)
        predictions = model.predict(X_scaled)
    else:
        predictions = model.predict(X_batch)

    # 計算誤差（如果有實際價格）
    results_df = pd.DataFrame({
        'predicted_price': predictions.astype(int)
    })

    if 'price' in df_batch.columns:
        results_df['actual_price'] = df_batch['price'].values
        results_df['error'] = results_df['actual_price'] - results_df['predicted_price']
        results_df['error_percentage'] = (results_df['error'] / results_df['actual_price'] * 100).round(2)

        print(f"\n批量預測結果統計:")
        print(f"  預測房屋數: {len(results_df)}")
        print(f"\n預測誤差統計:")
        print(f"  平均誤差: ${results_df['error'].mean():,.0f}")
        print(f"  平均誤差率: {results_df['error_percentage'].mean():.2f}%")
        print(f"  最大誤差: ${results_df['error'].max():,.0f}")
        print(f"  最小誤差: ${results_df['error'].min():,.0f}")

        print(f"\n樣本預測 (前10個):")
        print(results_df[['predicted_price', 'actual_price', 'error', 'error_percentage']].head(10).to_string(index=False))
    else:
        print(f"\n批量預測完成:")
        print(f"  預測房屋數: {len(results_df)}")
        print(f"\n樣本預測 (前10個):")
        print(results_df.head(10).to_string(index=False))

    return results_df


# ============================================================================
# 9. 地點分析
# ============================================================================
def analyze_location_effect(df):
    """
    分析地點對房價的影響
    """
    print("\n" + "=" * 80)
    print("7. 地點分析")
    print("=" * 80)

    # 按緯度和經度分組
    df['lat_zone'] = pd.cut(df['lat'], bins=5)
    df['long_zone'] = pd.cut(df['long'], bins=5)

    # 計算各區域的平均房價
    location_prices = df.groupby(['lat_zone', 'long_zone'])['price'].agg(['mean', 'count']).reset_index()
    location_prices = location_prices[location_prices['count'] > 0].sort_values('mean', ascending=False)

    print("\n平均房價最高的地區 (前5個):")
    print(location_prices.head(5)[['lat_zone', 'long_zone', 'mean', 'count']].to_string(index=False))

    # 按緯度的平均房價
    avg_price_by_lat = df.groupby(df['lat_zone'])['price'].mean().sort_values(ascending=False)
    print("\n按緯度區間的平均房價:")
    for lat_zone, price in avg_price_by_lat.items():
        print(f"  {lat_zone}: ${price:,.0f}")

    return location_prices


# ============================================================================
# 10. 可視化
# ============================================================================
def visualize_results(df, results, importance_df=None):
    """
    可視化分析結果
    """
    print("\n" + "=" * 80)
    print("8. 結果可視化")
    print("=" * 80)

    fig, axes = plt.subplots(2, 2, figsize=(14, 10))

    # 1. 房價分佈
    axes[0, 0].hist(df['price'], bins=30, edgecolor='black')
    axes[0, 0].set_title('房價分佈')
    axes[0, 0].set_xlabel('房價 ($)')
    axes[0, 0].set_ylabel('頻數')

    # 2. 居住面積vs房價
    axes[0, 1].scatter(df['sqft_living'], df['price'], alpha=0.5)
    axes[0, 1].set_title('居住面積 vs 房價')
    axes[0, 1].set_xlabel('居住面積 (sqft)')
    axes[0, 1].set_ylabel('房價 ($)')

    # 3. 房齡vs房價
    axes[1, 0].scatter(df['age'], df['price'], alpha=0.5)
    axes[1, 0].set_title('房齡 vs 房價')
    axes[1, 0].set_xlabel('房齡 (年)')
    axes[1, 0].set_ylabel('房價 ($)')

    # 4. 特徵重要性
    if importance_df is not None:
        top_features = importance_df.head(10)
        axes[1, 1].barh(top_features['feature'], top_features['importance'])
        axes[1, 1].set_title('前10個最重要特徵')
        axes[1, 1].set_xlabel('重要性')
    else:
        axes[1, 1].text(0.5, 0.5, '特徵重要性分析不可用', ha='center', va='center')

    plt.tight_layout()
    plt.savefig('housing_price_analysis.png', dpi=300, bbox_inches='tight')
    print("\n✅ 圖表已保存為: housing_price_analysis.png")
    plt.show()


# ============================================================================
# 主程序
# ============================================================================
def main():
    """
    完整的房價預測示例
    """
    print("\n" + "=" * 80)
    print("房價預測 - 完整使用範例")
    print("=" * 80)

    # 1. 生成數據
    print("\n準備數據...")
    df = generate_sample_housing_data(n_samples=500)
    df = analyze_and_preprocess_data(df)
    df = create_features(df)

    # 2. 地點分析
    location_info = analyze_location_effect(df)

    # 3. 分割數據
    feature_cols = [col for col in df.columns if col != 'price']
    X = df[feature_cols]
    y = df['price']

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    print(f"\n數據分割:")
    print(f"  訓練集: {len(X_train)}")
    print(f"  測試集: {len(X_test)}")

    # 4. 訓練模型
    results, scaler = train_price_prediction_models(X_train, y_train, X_test, y_test)

    # 5. 評估模型
    best_model_name, best_result = evaluate_models(results)

    # 6. 特徵重要性
    importance_df = analyze_feature_importance(best_result, feature_cols, best_model_name)

    # 7. 單房屋預測
    sample_house = {
        'bedrooms': 3,
        'bathrooms': 2.0,
        'sqft_living': 2000,
        'sqft_lot': 5000,
        'floors': 2.0,
        'waterfront': 0,
        'view': 3,
        'condition': 4,
        'grade': 7,
        'yr_built': 2005,
        'yr_renovated': 2015,
        'lat': 47.5,
        'long': -122.3,
        'price_per_sqft': 0,  # 將在predict函數中計算
        'total_rooms': 5.0,
        'bathrooms_per_bedroom': 0.67,
        'lot_to_living_ratio': 2.5,
        'age': 19,
        'years_since_renovation': 9,
        'is_renovated': 1
    }
    predicted_price = predict_house_price(
        best_result['model'], scaler, sample_house, feature_cols,
        use_scaling=best_result['use_scaling']
    )

    # 8. 批量預測
    batch_results = batch_price_prediction(
        best_result['model'], scaler, X_test.iloc[:20].assign(price=y_test.iloc[:20].values),
        feature_cols, use_scaling=best_result['use_scaling']
    )

    # 9. 可視化
    visualize_results(df, results, importance_df)

    print("\n" + "=" * 80)
    print("✅ 分析完成！")
    print("=" * 80 + "\n")


if __name__ == '__main__':
    main()
