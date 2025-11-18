"""
Training Script for Sales Forecasting
销售预测模型训练脚本
"""

import argparse
import pandas as pd
import joblib
from pathlib import Path
from sales_forecaster import SalesForecaster


def train_model(
    data_path: str,
    model_type: str = 'arima',
    horizon: int = 30,
    output_dir: str = 'models',
    **model_params
):
    """
    训练销售预测模型

    Args:
        data_path: 数据文件路径
        model_type: 模型类型
        horizon: 预测周期
        output_dir: 模型输出目录
        **model_params: 模型参数
    """
    print("=" * 80)
    print(f"训练 {model_type.upper()} 销售预测模型")
    print("=" * 80)

    # 创建输出目录
    output_path = Path(output_dir)
    output_path.mkdir(exist_ok=True)

    # 初始化预测器
    forecaster = SalesForecaster(model_type=model_type)

    # 载入数据
    print(f"\n载入数据: {data_path}")
    forecaster.load_data(data_path, date_col='date', value_col='sales')

    # 数据分析
    print("\n执行数据分析...")
    forecaster.check_stationarity()
    forecaster.analyze_seasonality()

    # 训练模型
    print("\n开始训练...")
    result = forecaster.train(train_size=0.8, **model_params)

    # 保存模型
    model_file = output_path / f"{model_type}_model.pkl"
    joblib.dump({
        'forecaster': forecaster,
        'metrics': result['metrics'],
        'model_type': model_type,
        'horizon': horizon
    }, model_file)

    print(f"\n模型已保存: {model_file}")
    print("\n训练完成！")
    print("=" * 80)

    return forecaster, result


def main():
    parser = argparse.ArgumentParser(description='训练销售预测模型')

    parser.add_argument(
        '--data',
        type=str,
        default='sample_data/sales_daily.csv',
        help='数据文件路径'
    )

    parser.add_argument(
        '--model',
        type=str,
        default='arima',
        choices=['arima', 'prophet', 'xgboost'],
        help='模型类型'
    )

    parser.add_argument(
        '--horizon',
        type=int,
        default=30,
        help='预测周期（天）'
    )

    parser.add_argument(
        '--output',
        type=str,
        default='models',
        help='模型输出目录'
    )

    # ARIMA 参数
    parser.add_argument('--p', type=int, default=1, help='ARIMA p 参数')
    parser.add_argument('--d', type=int, default=1, help='ARIMA d 参数')
    parser.add_argument('--q', type=int, default=1, help='ARIMA q 参数')

    # XGBoost 参数
    parser.add_argument('--lookback', type=int, default=7, help='XGBoost 回溯窗口')
    parser.add_argument('--n_estimators', type=int, default=100, help='树的数量')
    parser.add_argument('--max_depth', type=int, default=6, help='最大深度')

    args = parser.parse_args()

    # 准备模型参数
    model_params = {}
    if args.model == 'arima':
        model_params['order'] = (args.p, args.d, args.q)
    elif args.model == 'xgboost':
        model_params['lookback'] = args.lookback
        model_params['n_estimators'] = args.n_estimators
        model_params['max_depth'] = args.max_depth

    # 训练模型
    forecaster, result = train_model(
        data_path=args.data,
        model_type=args.model,
        horizon=args.horizon,
        output_dir=args.output,
        **model_params
    )

    # 绘制结果
    print("\n绘制预测结果...")
    forecaster.plot_forecast(result)


if __name__ == '__main__':
    main()
