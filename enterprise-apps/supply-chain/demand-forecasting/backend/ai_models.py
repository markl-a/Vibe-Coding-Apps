"""
AI 深度學習模型
包含 LSTM、GRU、Transformer 等先進預測模型
"""
import numpy as np
import pandas as pd
from typing import Tuple, List, Dict
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers, models
from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau
from sklearn.preprocessing import MinMaxScaler
import logging

logger = logging.getLogger(__name__)


class LSTMForecaster:
    """LSTM 時間序列預測模型"""

    def __init__(
        self,
        lookback_window: int = 30,
        forecast_horizon: int = 12,
        lstm_units: List[int] = [64, 32],
        dropout_rate: float = 0.2,
        learning_rate: float = 0.001
    ):
        """
        初始化 LSTM 預測器

        Args:
            lookback_window: 回看窗口大小（使用過去多少個時間步預測）
            forecast_horizon: 預測範圍（預測未來多少個時間步）
            lstm_units: LSTM 層的單元數列表
            dropout_rate: Dropout 比率
            learning_rate: 學習率
        """
        self.lookback_window = lookback_window
        self.forecast_horizon = forecast_horizon
        self.lstm_units = lstm_units
        self.dropout_rate = dropout_rate
        self.learning_rate = learning_rate

        self.model = None
        self.scaler = MinMaxScaler(feature_range=(0, 1))
        self.history = None

    def build_model(self, n_features: int = 1) -> keras.Model:
        """構建 LSTM 模型"""
        model = models.Sequential(name='LSTM_Forecaster')

        # 輸入層
        model.add(layers.Input(shape=(self.lookback_window, n_features)))

        # LSTM 層
        for i, units in enumerate(self.lstm_units):
            return_sequences = i < len(self.lstm_units) - 1
            model.add(layers.LSTM(
                units,
                return_sequences=return_sequences,
                name=f'lstm_{i+1}'
            ))
            model.add(layers.Dropout(self.dropout_rate, name=f'dropout_{i+1}'))

        # 全連接層
        model.add(layers.Dense(32, activation='relu', name='dense_1'))
        model.add(layers.Dropout(self.dropout_rate, name='dropout_final'))

        # 輸出層
        model.add(layers.Dense(self.forecast_horizon, name='output'))

        # 編譯模型
        optimizer = keras.optimizers.Adam(learning_rate=self.learning_rate)
        model.compile(
            optimizer=optimizer,
            loss='mse',
            metrics=['mae', 'mape']
        )

        self.model = model
        return model

    def prepare_sequences(
        self,
        data: np.ndarray,
        create_labels: bool = True
    ) -> Tuple[np.ndarray, np.ndarray]:
        """
        準備時間序列數據為監督學習格式

        Args:
            data: 原始時間序列數據
            create_labels: 是否創建標籤（預測時為 False）

        Returns:
            X: 輸入序列
            y: 目標序列（如果 create_labels=True）
        """
        X, y = [], []

        if create_labels:
            for i in range(len(data) - self.lookback_window - self.forecast_horizon + 1):
                X.append(data[i:i + self.lookback_window])
                y.append(data[i + self.lookback_window:i + self.lookback_window + self.forecast_horizon])
        else:
            # 預測模式：只創建最後一個序列
            if len(data) >= self.lookback_window:
                X.append(data[-self.lookback_window:])
            else:
                raise ValueError(f"數據長度 {len(data)} 小於回看窗口 {self.lookback_window}")

        X = np.array(X)
        y = np.array(y) if create_labels else None

        return X, y

    def train(
        self,
        data: pd.Series,
        validation_split: float = 0.2,
        epochs: int = 100,
        batch_size: int = 32,
        verbose: int = 1
    ) -> Dict:
        """
        訓練模型

        Args:
            data: 時間序列數據
            validation_split: 驗證集比例
            epochs: 訓練輪數
            batch_size: 批次大小
            verbose: 詳細程度

        Returns:
            訓練歷史和指標
        """
        # 數據標準化
        data_scaled = self.scaler.fit_transform(data.values.reshape(-1, 1))

        # 準備序列
        X, y = self.prepare_sequences(data_scaled.flatten(), create_labels=True)

        if len(X) == 0:
            raise ValueError("訓練數據不足")

        # 重塑輸入數據
        X = X.reshape(X.shape[0], X.shape[1], 1)

        # 構建模型
        if self.model is None:
            self.build_model(n_features=1)

        # 回調函數
        callbacks = [
            EarlyStopping(
                monitor='val_loss',
                patience=15,
                restore_best_weights=True,
                verbose=1
            ),
            ReduceLROnPlateau(
                monitor='val_loss',
                factor=0.5,
                patience=5,
                min_lr=1e-7,
                verbose=1
            )
        ]

        # 訓練模型
        logger.info(f"開始訓練 LSTM 模型，訓練樣本數: {len(X)}")
        self.history = self.model.fit(
            X, y,
            validation_split=validation_split,
            epochs=epochs,
            batch_size=batch_size,
            callbacks=callbacks,
            verbose=verbose
        )

        # 計算最終指標
        val_loss = min(self.history.history['val_loss'])
        val_mae = min(self.history.history['val_mae'])

        return {
            'final_val_loss': float(val_loss),
            'final_val_mae': float(val_mae),
            'epochs_trained': len(self.history.history['loss']),
            'training_samples': len(X)
        }

    def predict(self, data: pd.Series, steps: int = None) -> np.ndarray:
        """
        預測未來值

        Args:
            data: 歷史時間序列數據
            steps: 預測步數（默認使用 forecast_horizon）

        Returns:
            預測值（已反標準化）
        """
        if self.model is None:
            raise ValueError("模型尚未訓練")

        steps = steps or self.forecast_horizon

        # 標準化數據
        data_scaled = self.scaler.transform(data.values.reshape(-1, 1))

        # 準備輸入序列
        X, _ = self.prepare_sequences(data_scaled.flatten(), create_labels=False)
        X = X.reshape(X.shape[0], X.shape[1], 1)

        # 預測
        predictions_scaled = self.model.predict(X, verbose=0)[0]

        # 反標準化
        predictions = self.scaler.inverse_transform(
            predictions_scaled.reshape(-1, 1)
        ).flatten()

        return predictions[:steps]

    def get_model_summary(self) -> str:
        """獲取模型摘要"""
        if self.model is None:
            return "模型尚未構建"

        from io import StringIO
        stream = StringIO()
        self.model.summary(print_fn=lambda x: stream.write(x + '\n'))
        return stream.getvalue()


class GRUForecaster(LSTMForecaster):
    """GRU 時間序列預測模型（繼承自 LSTM）"""

    def build_model(self, n_features: int = 1) -> keras.Model:
        """構建 GRU 模型"""
        model = models.Sequential(name='GRU_Forecaster')

        # 輸入層
        model.add(layers.Input(shape=(self.lookback_window, n_features)))

        # GRU 層（替代 LSTM）
        for i, units in enumerate(self.lstm_units):
            return_sequences = i < len(self.lstm_units) - 1
            model.add(layers.GRU(
                units,
                return_sequences=return_sequences,
                name=f'gru_{i+1}'
            ))
            model.add(layers.Dropout(self.dropout_rate, name=f'dropout_{i+1}'))

        # 全連接層
        model.add(layers.Dense(32, activation='relu', name='dense_1'))
        model.add(layers.Dropout(self.dropout_rate, name='dropout_final'))

        # 輸出層
        model.add(layers.Dense(self.forecast_horizon, name='output'))

        # 編譯模型
        optimizer = keras.optimizers.Adam(learning_rate=self.learning_rate)
        model.compile(
            optimizer=optimizer,
            loss='mse',
            metrics=['mae', 'mape']
        )

        self.model = model
        return model


class EnsembleForecaster:
    """集成預測模型（結合多個模型）"""

    def __init__(
        self,
        models: List[LSTMForecaster],
        weights: List[float] = None
    ):
        """
        初始化集成預測器

        Args:
            models: 模型列表
            weights: 模型權重（默認為平均權重）
        """
        self.models = models
        self.weights = weights or [1.0 / len(models)] * len(models)

        if len(self.weights) != len(self.models):
            raise ValueError("權重數量必須與模型數量相同")

        if abs(sum(self.weights) - 1.0) > 1e-6:
            raise ValueError("權重總和必須為 1")

    def predict(self, data: pd.Series, steps: int = None) -> np.ndarray:
        """
        使用加權平均進行集成預測

        Args:
            data: 歷史時間序列數據
            steps: 預測步數

        Returns:
            集成預測值
        """
        predictions_list = []

        for model in self.models:
            try:
                pred = model.predict(data, steps)
                predictions_list.append(pred)
            except Exception as e:
                logger.warning(f"模型預測失敗: {e}")
                continue

        if not predictions_list:
            raise ValueError("所有模型預測都失敗")

        # 加權平均
        predictions_array = np.array(predictions_list)
        weighted_predictions = np.average(
            predictions_array,
            axis=0,
            weights=self.weights[:len(predictions_list)]
        )

        return weighted_predictions


class AIForecastingService:
    """AI 預測服務（整合多種模型）"""

    @staticmethod
    def auto_select_model(
        data_length: int,
        forecast_horizon: int
    ) -> str:
        """
        根據數據長度自動選擇最佳模型

        Args:
            data_length: 數據長度
            forecast_horizon: 預測範圍

        Returns:
            推薦的模型類型
        """
        if data_length < 50:
            return "prophet"  # 數據少時使用 Prophet
        elif data_length < 200:
            return "gru"  # 中等數據使用 GRU
        else:
            return "lstm"  # 大數據使用 LSTM

    @staticmethod
    def calculate_confidence_intervals(
        predictions: np.ndarray,
        historical_errors: np.ndarray,
        confidence_level: float = 0.95
    ) -> Tuple[np.ndarray, np.ndarray]:
        """
        計算預測的置信區間

        Args:
            predictions: 預測值
            historical_errors: 歷史預測誤差
            confidence_level: 置信水平

        Returns:
            lower_bound: 下界
            upper_bound: 上界
        """
        from scipy import stats

        # 計算標準誤差
        std_error = np.std(historical_errors)

        # 計算 Z 值
        z_score = stats.norm.ppf((1 + confidence_level) / 2)

        # 計算置信區間
        margin = z_score * std_error
        lower_bound = predictions - margin
        upper_bound = predictions + margin

        return lower_bound, upper_bound
