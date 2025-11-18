"""
AI 模型單元測試
測試 LSTM、GRU 和輔助功能
"""
import unittest
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import sys
import os

# 添加模組路徑
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from ai_models import LSTMForecaster, GRUForecaster, AIForecastingService
from ai_assistant import DemandForecastingAssistant, generate_natural_language_report


class TestLSTMForecaster(unittest.TestCase):
    """測試 LSTM 預測器"""

    def setUp(self):
        """設置測試數據"""
        # 生成簡單的時間序列數據
        dates = pd.date_range(start='2023-01-01', periods=100, freq='D')
        # 線性趨勢 + 隨機噪音
        values = np.arange(100) + np.random.randn(100) * 5 + 100
        self.data_series = pd.Series(values, index=dates)

    def test_model_creation(self):
        """測試模型創建"""
        model = LSTMForecaster(lookback_window=10, forecast_horizon=5)
        self.assertIsNotNone(model)
        self.assertEqual(model.lookback_window, 10)
        self.assertEqual(model.forecast_horizon, 5)

    def test_build_model(self):
        """測試模型構建"""
        model = LSTMForecaster()
        keras_model = model.build_model(n_features=1)
        self.assertIsNotNone(keras_model)
        self.assertEqual(len(keras_model.layers) > 0, True)

    def test_prepare_sequences(self):
        """測試序列準備"""
        model = LSTMForecaster(lookback_window=10, forecast_horizon=3)
        data = np.arange(50)

        X, y = model.prepare_sequences(data, create_labels=True)

        self.assertEqual(len(X.shape), 2)
        self.assertEqual(X.shape[1], 10)  # lookback_window
        self.assertEqual(y.shape[1], 3)   # forecast_horizon

    def test_training(self):
        """測試模型訓練"""
        model = LSTMForecaster(
            lookback_window=10,
            forecast_horizon=3,
            lstm_units=[16],
            dropout_rate=0.1
        )

        # 訓練（使用少量 epochs 以加快測試）
        result = model.train(
            self.data_series,
            epochs=5,
            batch_size=8,
            verbose=0
        )

        self.assertIn('final_val_loss', result)
        self.assertIn('epochs_trained', result)
        self.assertTrue(result['epochs_trained'] > 0)

    def test_prediction(self):
        """測試預測"""
        model = LSTMForecaster(
            lookback_window=10,
            forecast_horizon=5,
            lstm_units=[16]
        )

        # 訓練
        model.train(self.data_series, epochs=5, verbose=0)

        # 預測
        predictions = model.predict(self.data_series, steps=5)

        self.assertEqual(len(predictions), 5)
        self.assertTrue(all(isinstance(p, (int, float, np.number)) for p in predictions))


class TestGRUForecaster(unittest.TestCase):
    """測試 GRU 預測器"""

    def setUp(self):
        """設置測試數據"""
        dates = pd.date_range(start='2023-01-01', periods=100, freq='D')
        values = np.arange(100) + np.random.randn(100) * 5 + 100
        self.data_series = pd.Series(values, index=dates)

    def test_model_creation(self):
        """測試 GRU 模型創建"""
        model = GRUForecaster(lookback_window=10, forecast_horizon=5)
        self.assertIsNotNone(model)

    def test_build_model(self):
        """測試 GRU 模型構建"""
        model = GRUForecaster()
        keras_model = model.build_model(n_features=1)
        self.assertIsNotNone(keras_model)

    def test_training_and_prediction(self):
        """測試 GRU 訓練和預測"""
        model = GRUForecaster(
            lookback_window=10,
            forecast_horizon=3,
            lstm_units=[16]
        )

        # 訓練
        model.train(self.data_series, epochs=5, verbose=0)

        # 預測
        predictions = model.predict(self.data_series, steps=3)

        self.assertEqual(len(predictions), 3)


class TestAIForecastingService(unittest.TestCase):
    """測試 AI 預測服務"""

    def test_auto_select_model(self):
        """測試自動模型選擇"""
        # 少數據
        model_type = AIForecastingService.auto_select_model(30, 12)
        self.assertEqual(model_type, 'prophet')

        # 中等數據
        model_type = AIForecastingService.auto_select_model(100, 12)
        self.assertEqual(model_type, 'gru')

        # 大數據
        model_type = AIForecastingService.auto_select_model(300, 12)
        self.assertEqual(model_type, 'lstm')

    def test_confidence_intervals(self):
        """測試置信區間計算"""
        predictions = np.array([100, 110, 120, 115, 125])
        historical_errors = np.array([5, -3, 7, -2, 4, -6, 8])

        lower, upper = AIForecastingService.calculate_confidence_intervals(
            predictions,
            historical_errors,
            confidence_level=0.95
        )

        self.assertEqual(len(lower), len(predictions))
        self.assertEqual(len(upper), len(predictions))
        self.assertTrue(all(lower < predictions))
        self.assertTrue(all(upper > predictions))


class TestDemandForecastingAssistant(unittest.TestCase):
    """測試需求預測助手"""

    def setUp(self):
        """設置測試數據"""
        self.assistant = DemandForecastingAssistant()

        # 創建測試數據
        self.historical_data = pd.DataFrame({
            'date': pd.date_range(start='2023-01-01', periods=36, freq='M'),
            'quantity': np.random.randint(80, 120, size=36)
        })

        self.forecasts = [
            {
                'predicted_quantity': 100 + i * 2,
                'lower_bound': 90 + i * 2,
                'upper_bound': 110 + i * 2
            }
            for i in range(12)
        ]

        self.accuracy_metrics = {
            'mape': 5.5,
            'rmse': 12.3,
            'mae': 10.2,
            'r2_score': 0.92
        }

    def test_analyze_forecast(self):
        """測試預測分析"""
        analysis = self.assistant.analyze_forecast(
            self.historical_data,
            self.forecasts,
            self.accuracy_metrics
        )

        self.assertIn('insights', analysis)
        self.assertIn('recommendations', analysis)
        self.assertIn('alerts', analysis)
        self.assertIn('summary', analysis)
        self.assertTrue(isinstance(analysis['insights'], list))

    def test_analyze_trend(self):
        """測試趨勢分析"""
        # 上升趨勢
        increasing_values = [100, 105, 110, 115, 120]
        trend = self.assistant._analyze_trend(increasing_values)
        self.assertEqual(trend['type'], 'increasing')

        # 下降趨勢
        decreasing_values = [120, 115, 110, 105, 100]
        trend = self.assistant._analyze_trend(decreasing_values)
        self.assertEqual(trend['type'], 'decreasing')

        # 穩定趨勢
        stable_values = [100, 101, 100, 99, 100]
        trend = self.assistant._analyze_trend(stable_values)
        self.assertEqual(trend['type'], 'stable')

    def test_detect_forecast_anomalies(self):
        """測試異常檢測"""
        # 包含異常值的數據
        values_with_anomaly = [100, 105, 110, 500, 115, 120]  # 500 是異常值
        anomalies = self.assistant._detect_forecast_anomalies(values_with_anomaly)

        self.assertTrue(len(anomalies) > 0)
        self.assertTrue(any(a['value'] == 500 for a in anomalies))

    def test_chat_functionality(self):
        """測試聊天功能"""
        # 測試幫助
        response = self.assistant.chat("幫助")
        self.assertIn("助手", response.lower() or "功能" in response.lower())

        # 測試建議
        response = self.assistant.chat("有什麼建議？")
        self.assertIsInstance(response, str)
        self.assertTrue(len(response) > 0)


class TestNaturalLanguageReport(unittest.TestCase):
    """測試自然語言報告生成"""

    def test_generate_report(self):
        """測試報告生成"""
        forecasts = [
            {'predicted_quantity': 100 + i, 'lower_bound': 90 + i, 'upper_bound': 110 + i}
            for i in range(12)
        ]

        accuracy_metrics = {
            'mape': 5.5,
            'rmse': 12.3
        }

        insights = {
            'summary': '預測準確度良好',
            'insights': [
                {
                    'type': 'accuracy',
                    'level': 'good',
                    'message': '準確度良好',
                    'details': '可信賴'
                }
            ],
            'alerts': [],
            'next_actions': ['保持監控']
        }

        report = generate_natural_language_report(
            "測試產品",
            forecasts,
            accuracy_metrics,
            insights
        )

        self.assertIsInstance(report, str)
        self.assertIn("測試產品", report)
        self.assertIn("MAPE", report)
        self.assertTrue(len(report) > 100)


def run_tests():
    """運行所有測試"""
    print("=" * 70)
    print("  需求預測 AI 模型測試套件")
    print("=" * 70)
    print()

    # 創建測試套件
    loader = unittest.TestLoader()
    suite = unittest.TestSuite()

    # 添加測試
    suite.addTests(loader.loadTestsFromTestCase(TestLSTMForecaster))
    suite.addTests(loader.loadTestsFromTestCase(TestGRUForecaster))
    suite.addTests(loader.loadTestsFromTestCase(TestAIForecastingService))
    suite.addTests(loader.loadTestsFromTestCase(TestDemandForecastingAssistant))
    suite.addTests(loader.loadTestsFromTestCase(TestNaturalLanguageReport))

    # 運行測試
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)

    # 打印摘要
    print("\n" + "=" * 70)
    print("測試摘要:")
    print(f"  運行測試數: {result.testsRun}")
    print(f"  成功: {result.testsRun - len(result.failures) - len(result.errors)}")
    print(f"  失敗: {len(result.failures)}")
    print(f"  錯誤: {len(result.errors)}")
    print("=" * 70)

    return result.wasSuccessful()


if __name__ == '__main__':
    success = run_tests()
    sys.exit(0 if success else 1)
