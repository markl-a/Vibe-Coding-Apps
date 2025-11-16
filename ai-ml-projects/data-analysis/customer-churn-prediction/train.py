"""
模型訓練腳本
訓練多個模型並比較性能
"""

import pandas as pd
import numpy as np
import argparse
import os
from churn_predictor import ChurnPredictor
import matplotlib.pyplot as plt
import seaborn as sns

sns.set_style('whitegrid')


def load_data(data_dir='data'):
    """載入訓練、驗證和測試資料"""
    print("載入資料...")
    train_df = pd.read_csv(os.path.join(data_dir, 'train_customers.csv'))
    val_df = pd.read_csv(os.path.join(data_dir, 'val_customers.csv'))
    test_df = pd.read_csv(os.path.join(data_dir, 'test_customers.csv'))

    print(f"訓練集: {len(train_df)} 筆")
    print(f"驗證集: {len(val_df)} 筆")
    print(f"測試集: {len(test_df)} 筆")

    return train_df, val_df, test_df


def train_model(model_type, train_df, val_df, test_df):
    """
    訓練單個模型

    Args:
        model_type: 模型類型
        train_df: 訓練資料
        val_df: 驗證資料
        test_df: 測試資料

    Returns:
        訓練好的模型和評估指標
    """
    print(f"\n{'='*60}")
    print(f"訓練 {model_type.upper()} 模型")
    print(f"{'='*60}")

    # 初始化預測器
    predictor = ChurnPredictor(model_type=model_type)

    # 預處理資料
    X_train, y_train = predictor.preprocess(train_df, is_training=True)
    X_val, y_val = predictor.preprocess(val_df, is_training=False)
    X_test, y_test = predictor.preprocess(test_df, is_training=False)

    # 訓練模型
    predictor.train(X_train, y_train, X_val, y_val)

    # 評估模型
    print("\n在測試集上評估:")
    metrics = predictor.evaluate(X_test, y_test)

    # 視覺化
    print("\n生成視覺化圖表...")
    predictor.plot_confusion_matrix(X_test, y_test)
    predictor.plot_roc_curve(X_test, y_test)
    predictor.plot_feature_importance(top_n=15)

    # 儲存模型
    os.makedirs('models', exist_ok=True)
    model_path = f'models/{model_type}_model.pkl'
    predictor.save_model(model_path)

    return predictor, metrics


def compare_models(models_metrics):
    """
    比較多個模型的性能

    Args:
        models_metrics: 字典，格式為 {model_name: metrics}
    """
    print(f"\n{'='*60}")
    print("模型性能比較")
    print(f"{'='*60}")

    # 建立比較表格
    comparison_df = pd.DataFrame(models_metrics).T
    comparison_df = comparison_df.round(4)

    print("\n", comparison_df)

    # 找出最佳模型
    best_model = comparison_df['auc'].idxmax()
    print(f"\n🏆 最佳模型: {best_model.upper()} (AUC = {comparison_df.loc[best_model, 'auc']:.4f})")

    # 視覺化比較
    fig, axes = plt.subplots(2, 3, figsize=(15, 10))
    metrics = ['accuracy', 'precision', 'recall', 'f1', 'auc']

    for idx, metric in enumerate(metrics):
        ax = axes[idx // 3, idx % 3]
        data = comparison_df[metric].sort_values(ascending=False)
        bars = ax.barh(range(len(data)), data.values)

        # 最佳模型用不同顏色標記
        colors = ['#2ecc71' if model == best_model else '#3498db' for model in data.index]
        for bar, color in zip(bars, colors):
            bar.set_color(color)

        ax.set_yticks(range(len(data)))
        ax.set_yticklabels(data.index)
        ax.set_xlabel('分數')
        ax.set_title(metric.upper(), fontweight='bold')
        ax.grid(axis='x', alpha=0.3)

        # 添加數值標籤
        for i, v in enumerate(data.values):
            ax.text(v, i, f' {v:.4f}', va='center')

    # 隱藏最後一個子圖
    axes[1, 2].axis('off')

    plt.tight_layout()
    plt.savefig('models/model_comparison.png', dpi=300, bbox_inches='tight')
    plt.show()

    print(f"\n比較圖表已儲存: models/model_comparison.png")

    return best_model


def main():
    """主函數"""
    parser = argparse.ArgumentParser(description='訓練客戶流失預測模型')
    parser.add_argument('--data-dir', type=str, default='data',
                        help='資料目錄路徑')
    parser.add_argument('--models', type=str, nargs='+',
                        default=['random_forest', 'xgboost', 'lightgbm'],
                        help='要訓練的模型類型')
    parser.add_argument('--compare', action='store_true',
                        help='比較所有模型')

    args = parser.parse_args()

    print("="*60)
    print("客戶流失預測模型訓練")
    print("="*60)

    # 載入資料
    train_df, val_df, test_df = load_data(args.data_dir)

    # 訓練模型
    trained_models = {}
    models_metrics = {}

    for model_type in args.models:
        try:
            predictor, metrics = train_model(model_type, train_df, val_df, test_df)
            trained_models[model_type] = predictor
            models_metrics[model_type] = metrics
        except Exception as e:
            print(f"\n❌ 訓練 {model_type} 時發生錯誤: {e}")
            continue

    # 比較模型
    if args.compare and len(models_metrics) > 1:
        best_model_name = compare_models(models_metrics)

        # 複製最佳模型
        best_model_path = f'models/{best_model_name}_model.pkl'
        import shutil
        shutil.copy(best_model_path, 'models/best_model.pkl')
        print(f"\n最佳模型已複製到: models/best_model.pkl")

    print("\n" + "="*60)
    print("✅ 訓練完成!")
    print("="*60)


if __name__ == '__main__':
    main()
