"""
智能需求預測系統 - 主應用程式
使用 FastAPI + Prophet 實現時間序列預測
"""
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timedelta
import pandas as pd
import numpy as np
from prophet import Prophet
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
import logging

# 設置日誌
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 創建 FastAPI 應用
app = FastAPI(
    title="智能需求預測系統",
    description="基於 AI 的供應鏈需求預測系統",
    version="1.0.0"
)

# CORS 設置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 資料庫設置
SQLALCHEMY_DATABASE_URL = "sqlite:///./demand_forecasting.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# 資料模型
class DemandHistory(Base):
    """歷史需求數據模型"""
    __tablename__ = "demand_history"

    id = Column(Integer, primary_key=True, index=True)
    item_id = Column(String, index=True)
    item_name = Column(String)
    date = Column(DateTime)
    quantity = Column(Float)
    is_promotion = Column(Integer, default=0)
    price = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class ForecastResult(Base):
    """預測結果模型"""
    __tablename__ = "forecast_results"

    id = Column(Integer, primary_key=True, index=True)
    item_id = Column(String, index=True)
    forecast_date = Column(DateTime)
    predicted_quantity = Column(Float)
    lower_bound = Column(Float)
    upper_bound = Column(Float)
    confidence = Column(Float)
    model_params = Column(JSON)
    accuracy_metrics = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

# 創建資料庫表
Base.metadata.create_all(bind=engine)

# Pydantic 模型
class DemandHistoryCreate(BaseModel):
    """創建歷史需求記錄"""
    item_id: str
    item_name: str
    date: datetime
    quantity: float
    is_promotion: int = 0
    price: Optional[float] = None

class DemandHistoryBatch(BaseModel):
    """批量創建歷史需求記錄"""
    records: List[DemandHistoryCreate]

class ForecastRequest(BaseModel):
    """預測請求"""
    item_id: str
    periods: int = Field(12, description="預測未來幾個時期")
    frequency: str = Field("M", description="時間頻率: D(日), W(週), M(月)")
    include_promotions: bool = False

class ForecastResponse(BaseModel):
    """預測響應"""
    item_id: str
    forecasts: List[dict]
    accuracy_metrics: dict
    model_info: dict

# 依賴項
def get_db():
    """獲取資料庫會話"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# 需求預測服務
class DemandForecastingService:
    """需求預測服務類"""

    def __init__(self):
        self.model = None

    def prepare_data(self, historical_data: pd.DataFrame) -> pd.DataFrame:
        """準備訓練數據"""
        df = pd.DataFrame({
            'ds': pd.to_datetime(historical_data['date']),
            'y': historical_data['quantity'],
        })

        if 'is_promotion' in historical_data.columns:
            df['promotions'] = historical_data['is_promotion']

        return df.sort_values('ds')

    def train_model(self, df: pd.DataFrame, include_promotions: bool = False):
        """訓練 Prophet 模型"""
        self.model = Prophet(
            yearly_seasonality=True,
            weekly_seasonality=True,
            daily_seasonality=False,
            seasonality_mode='multiplicative',
            changepoint_prior_scale=0.05,
        )

        if include_promotions and 'promotions' in df.columns:
            self.model.add_regressor('promotions')

        self.model.fit(df)
        return self.model

    def forecast(
        self,
        df: pd.DataFrame,
        periods: int = 12,
        freq: str = 'M',
        include_promotions: bool = False
    ) -> pd.DataFrame:
        """生成預測"""
        # 訓練模型
        self.train_model(df, include_promotions)

        # 創建未來日期
        future = self.model.make_future_dataframe(periods=periods, freq=freq)

        if include_promotions and 'promotions' in df.columns:
            future['promotions'] = 0  # 假設未來沒有促銷

        # 預測
        forecast = self.model.predict(future)

        return forecast

    def calculate_accuracy(self, actual: pd.Series, predicted: pd.Series) -> dict:
        """計算預測準確度"""
        # MAPE (Mean Absolute Percentage Error)
        mape = np.mean(np.abs((actual - predicted) / actual)) * 100

        # RMSE (Root Mean Square Error)
        rmse = np.sqrt(np.mean((actual - predicted) ** 2))

        # MAE (Mean Absolute Error)
        mae = np.mean(np.abs(actual - predicted))

        # R² Score
        ss_res = np.sum((actual - predicted) ** 2)
        ss_tot = np.sum((actual - np.mean(actual)) ** 2)
        r2 = 1 - (ss_res / ss_tot) if ss_tot != 0 else 0

        return {
            'mape': round(float(mape), 2),
            'rmse': round(float(rmse), 2),
            'mae': round(float(mae), 2),
            'r2_score': round(float(r2), 4)
        }

    def detect_anomalies(self, demand_data: pd.DataFrame, contamination: float = 0.1) -> pd.DataFrame:
        """檢測需求異常"""
        from sklearn.ensemble import IsolationForest

        clf = IsolationForest(contamination=contamination, random_state=42)
        predictions = clf.fit_predict(demand_data[['quantity']])

        demand_data['is_anomaly'] = predictions == -1
        anomalies = demand_data[demand_data['is_anomaly']]

        return anomalies

# API 路由
@app.get("/")
async def root():
    """根路徑"""
    return {
        "message": "智能需求預測系統 API",
        "version": "1.0.0",
        "endpoints": {
            "health": "/health",
            "demand_history": "/api/demand-history",
            "forecast": "/api/forecast",
            "anomalies": "/api/anomalies"
        }
    }

@app.get("/health")
async def health_check():
    """健康檢查"""
    return {"status": "healthy", "timestamp": datetime.utcnow()}

@app.post("/api/demand-history/")
async def create_demand_history(
    demand: DemandHistoryCreate,
    db: Session = Depends(get_db)
):
    """創建單筆歷史需求記錄"""
    db_demand = DemandHistory(**demand.dict())
    db.add(db_demand)
    db.commit()
    db.refresh(db_demand)
    return {"status": "success", "id": db_demand.id}

@app.post("/api/demand-history/batch")
async def create_demand_history_batch(
    batch: DemandHistoryBatch,
    db: Session = Depends(get_db)
):
    """批量創建歷史需求記錄"""
    for record in batch.records:
        db_demand = DemandHistory(**record.dict())
        db.add(db_demand)

    db.commit()
    return {
        "status": "success",
        "count": len(batch.records),
        "message": f"成功創建 {len(batch.records)} 筆記錄"
    }

@app.get("/api/demand-history/{item_id}")
async def get_demand_history(
    item_id: str,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """獲取物料的歷史需求數據"""
    records = db.query(DemandHistory).filter(
        DemandHistory.item_id == item_id
    ).order_by(DemandHistory.date.desc()).limit(limit).all()

    if not records:
        raise HTTPException(status_code=404, detail="找不到該物料的歷史數據")

    return {
        "item_id": item_id,
        "count": len(records),
        "records": [
            {
                "date": r.date.isoformat(),
                "quantity": r.quantity,
                "is_promotion": r.is_promotion,
                "price": r.price
            }
            for r in records
        ]
    }

@app.post("/api/forecast/", response_model=ForecastResponse)
async def generate_forecast(
    request: ForecastRequest,
    db: Session = Depends(get_db)
):
    """生成需求預測"""
    try:
        # 獲取歷史數據
        historical_records = db.query(DemandHistory).filter(
            DemandHistory.item_id == request.item_id
        ).order_by(DemandHistory.date).all()

        if len(historical_records) < 10:
            raise HTTPException(
                status_code=400,
                detail="歷史數據不足，至少需要 10 筆記錄"
            )

        # 轉換為 DataFrame
        df_records = pd.DataFrame([
            {
                'date': r.date,
                'quantity': r.quantity,
                'is_promotion': r.is_promotion
            }
            for r in historical_records
        ])

        # 創建預測服務
        service = DemandForecastingService()

        # 準備數據
        df = service.prepare_data(df_records)

        # 生成預測
        forecast = service.forecast(
            df,
            periods=request.periods,
            freq=request.frequency,
            include_promotions=request.include_promotions
        )

        # 計算準確度（使用歷史數據驗證）
        historical_len = len(df)
        actual_values = df['y'].values
        predicted_values = forecast['yhat'].values[:historical_len]
        accuracy_metrics = service.calculate_accuracy(
            pd.Series(actual_values),
            pd.Series(predicted_values)
        )

        # 提取未來預測
        future_forecast = forecast.tail(request.periods)

        forecasts = [
            {
                'date': row['ds'].isoformat(),
                'predicted_quantity': round(float(row['yhat']), 2),
                'lower_bound': round(float(row['yhat_lower']), 2),
                'upper_bound': round(float(row['yhat_upper']), 2),
                'trend': round(float(row['trend']), 2) if 'trend' in row else None
            }
            for _, row in future_forecast.iterrows()
        ]

        # 保存預測結果到資料庫
        for fc in forecasts:
            db_forecast = ForecastResult(
                item_id=request.item_id,
                forecast_date=datetime.fromisoformat(fc['date']),
                predicted_quantity=fc['predicted_quantity'],
                lower_bound=fc['lower_bound'],
                upper_bound=fc['upper_bound'],
                confidence=0.95,
                model_params={'periods': request.periods, 'frequency': request.frequency},
                accuracy_metrics=accuracy_metrics
            )
            db.add(db_forecast)

        db.commit()

        return ForecastResponse(
            item_id=request.item_id,
            forecasts=forecasts,
            accuracy_metrics=accuracy_metrics,
            model_info={
                'model_type': 'Prophet',
                'training_samples': historical_len,
                'forecast_periods': request.periods,
                'frequency': request.frequency
            }
        )

    except Exception as e:
        logger.error(f"預測生成失敗: {str(e)}")
        raise HTTPException(status_code=500, detail=f"預測生成失敗: {str(e)}")

@app.get("/api/anomalies/{item_id}")
async def detect_anomalies(
    item_id: str,
    contamination: float = 0.1,
    db: Session = Depends(get_db)
):
    """檢測需求異常"""
    try:
        # 獲取歷史數據
        records = db.query(DemandHistory).filter(
            DemandHistory.item_id == item_id
        ).order_by(DemandHistory.date).all()

        if len(records) < 10:
            raise HTTPException(
                status_code=400,
                detail="數據不足，至少需要 10 筆記錄"
            )

        # 轉換為 DataFrame
        df = pd.DataFrame([
            {
                'date': r.date,
                'quantity': r.quantity
            }
            for r in records
        ])

        # 檢測異常
        service = DemandForecastingService()
        anomalies = service.detect_anomalies(df, contamination)

        return {
            "item_id": item_id,
            "total_records": len(df),
            "anomaly_count": len(anomalies),
            "anomalies": [
                {
                    'date': row['date'].isoformat(),
                    'quantity': float(row['quantity'])
                }
                for _, row in anomalies.iterrows()
            ]
        }

    except Exception as e:
        logger.error(f"異常檢測失敗: {str(e)}")
        raise HTTPException(status_code=500, detail=f"異常檢測失敗: {str(e)}")

@app.get("/api/items")
async def get_items(db: Session = Depends(get_db)):
    """獲取所有物料列表"""
    items = db.query(
        DemandHistory.item_id,
        DemandHistory.item_name
    ).distinct().all()

    return {
        "count": len(items),
        "items": [
            {"item_id": item.item_id, "item_name": item.item_name}
            for item in items
        ]
    }

# ==================== AI 增強功能 ====================

from ai_models import LSTMForecaster, GRUForecaster, AIForecastingService
from ai_assistant import DemandForecastingAssistant, generate_natural_language_report

class LSTMForecastRequest(BaseModel):
    """LSTM 預測請求"""
    item_id: str
    periods: int = Field(12, description="預測未來幾個時期")
    lookback_window: int = Field(30, description="回看窗口大小")
    model_type: str = Field("lstm", description="模型類型: lstm 或 gru")

class ChatRequest(BaseModel):
    """AI 助手對話請求"""
    message: str
    item_id: Optional[str] = None

@app.post("/api/forecast/lstm")
async def forecast_with_lstm(
    request: LSTMForecastRequest,
    db: Session = Depends(get_db)
):
    """使用 LSTM 深度學習模型進行預測"""
    try:
        # 獲取歷史數據
        historical_records = db.query(DemandHistory).filter(
            DemandHistory.item_id == request.item_id
        ).order_by(DemandHistory.date).all()

        if len(historical_records) < request.lookback_window + 10:
            raise HTTPException(
                status_code=400,
                detail=f"歷史數據不足，至少需要 {request.lookback_window + 10} 筆記錄"
            )

        # 準備數據
        df = pd.DataFrame([
            {'date': r.date, 'quantity': r.quantity}
            for r in historical_records
        ])

        data_series = pd.Series(
            df['quantity'].values,
            index=pd.to_datetime(df['date'])
        )

        # 選擇模型
        if request.model_type.lower() == 'gru':
            model = GRUForecaster(
                lookback_window=request.lookback_window,
                forecast_horizon=request.periods
            )
        else:
            model = LSTMForecaster(
                lookback_window=request.lookback_window,
                forecast_horizon=request.periods
            )

        # 訓練模型
        training_metrics = model.train(
            data_series,
            epochs=50,
            batch_size=16,
            verbose=0
        )

        # 預測
        predictions = model.predict(data_series, steps=request.periods)

        # 生成預測日期
        last_date = df['date'].max()
        forecast_dates = pd.date_range(
            start=last_date + timedelta(days=30),
            periods=request.periods,
            freq='M'
        )

        # 構建結果
        forecasts = [
            {
                'date': date.isoformat(),
                'predicted_quantity': float(pred),
                'model_type': request.model_type.upper()
            }
            for date, pred in zip(forecast_dates, predictions)
        ]

        return {
            "status": "success",
            "item_id": request.item_id,
            "model_type": request.model_type.upper(),
            "forecasts": forecasts,
            "training_metrics": training_metrics,
            "model_info": {
                "lookback_window": request.lookback_window,
                "forecast_horizon": request.periods,
                "training_samples": training_metrics['training_samples'],
                "epochs_trained": training_metrics['epochs_trained']
            }
        }

    except Exception as e:
        logger.error(f"LSTM 預測失敗: {str(e)}")
        raise HTTPException(status_code=500, detail=f"LSTM 預測失敗: {str(e)}")

@app.post("/api/forecast/smart")
async def smart_forecast(
    request: ForecastRequest,
    db: Session = Depends(get_db)
):
    """智能預測（自動選擇最佳模型）"""
    try:
        # 獲取歷史數據
        historical_records = db.query(DemandHistory).filter(
            DemandHistory.item_id == request.item_id
        ).order_by(DemandHistory.date).all()

        if len(historical_records) < 10:
            raise HTTPException(
                status_code=400,
                detail="歷史數據不足"
            )

        # 自動選擇模型
        ai_service = AIForecastingService()
        recommended_model = ai_service.auto_select_model(
            len(historical_records),
            request.periods
        )

        logger.info(f"為 {request.item_id} 推薦使用 {recommended_model} 模型")

        # 根據推薦使用相應的預測方法
        if recommended_model in ['lstm', 'gru']:
            lstm_request = LSTMForecastRequest(
                item_id=request.item_id,
                periods=request.periods,
                model_type=recommended_model
            )
            return await forecast_with_lstm(lstm_request, db)
        else:
            # 使用 Prophet
            return await generate_forecast(request, db)

    except Exception as e:
        logger.error(f"智能預測失敗: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/ai/analyze")
async def ai_analysis(
    request: ForecastRequest,
    db: Session = Depends(get_db)
):
    """AI 分析預測結果"""
    try:
        # 先生成預測
        forecast_result = await generate_forecast(request, db)

        # 獲取歷史數據
        historical_records = db.query(DemandHistory).filter(
            DemandHistory.item_id == request.item_id
        ).order_by(DemandHistory.date).all()

        historical_df = pd.DataFrame([
            {'date': r.date, 'quantity': r.quantity}
            for r in historical_records
        ])

        # AI 分析
        assistant = DemandForecastingAssistant()
        analysis = assistant.analyze_forecast(
            historical_df,
            forecast_result['forecasts'],
            forecast_result['accuracy_metrics']
        )

        # 生成自然語言報告
        item_name = historical_records[0].item_name if historical_records else request.item_id
        report = generate_natural_language_report(
            item_name,
            forecast_result['forecasts'],
            forecast_result['accuracy_metrics'],
            analysis
        )

        return {
            "status": "success",
            "item_id": request.item_id,
            "forecasts": forecast_result['forecasts'],
            "accuracy_metrics": forecast_result['accuracy_metrics'],
            "ai_analysis": analysis,
            "natural_language_report": report
        }

    except Exception as e:
        logger.error(f"AI 分析失敗: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/ai/chat")
async def ai_chat(request: ChatRequest):
    """AI 助手對話"""
    try:
        assistant = DemandForecastingAssistant()

        # 如果提供了 item_id，獲取相關上下文
        context = {}
        # 這裡可以從數據庫獲取上下文信息

        response = assistant.chat(request.message, context)

        return {
            "status": "success",
            "user_message": request.message,
            "ai_response": response,
            "timestamp": datetime.utcnow().isoformat()
        }

    except Exception as e:
        logger.error(f"AI 對話失敗: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
