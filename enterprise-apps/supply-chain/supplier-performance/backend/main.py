"""
供應商績效管理系統
使用 AI 進行供應商評估、績效追蹤和風險預測
"""
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from datetime import datetime, timedelta
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
import logging
import json

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# FastAPI 應用
app = FastAPI(
    title="供應商績效管理系統",
    description="基於 AI 的供應商評估和風險預測系統",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 資料庫
SQLALCHEMY_DATABASE_URL = "sqlite:///./supplier_performance.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# 資料模型
class Supplier(Base):
    """供應商基本資料"""
    __tablename__ = "suppliers"

    id = Column(Integer, primary_key=True, index=True)
    supplier_code = Column(String, unique=True, index=True)
    supplier_name = Column(String)
    category = Column(String)  # RAW_MATERIAL, COMPONENT, FINISHED_GOOD, SERVICE
    tier = Column(String)  # STRATEGIC, PREFERRED, APPROVED, CONDITIONAL
    status = Column(String, default="ACTIVE")  # ACTIVE, INACTIVE, BLOCKED

    contact_person = Column(String)
    email = Column(String)
    phone = Column(String)
    address = Column(Text)

    payment_terms = Column(String)
    credit_limit = Column(Float, default=0.0)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class PerformanceMetric(Base):
    """供應商績效指標"""
    __tablename__ = "performance_metrics"

    id = Column(Integer, primary_key=True, index=True)
    supplier_code = Column(String, index=True)
    period = Column(String)  # 2024-01, 2024-Q1

    # 績效指標
    on_time_delivery_rate = Column(Float)  # 準時交付率 (%)
    quality_rate = Column(Float)  # 質量合格率 (%)
    response_time = Column(Float)  # 平均響應時間 (小時)
    price_competitiveness = Column(Float)  # 價格競爭力 (1-5)

    # 訂單統計
    total_orders = Column(Integer, default=0)
    delivered_orders = Column(Integer, default=0)
    late_orders = Column(Integer, default=0)
    rejected_orders = Column(Integer, default=0)

    # 財務指標
    total_amount = Column(Float, default=0.0)

    # 整體評分
    overall_score = Column(Float)  # 0-100

    created_at = Column(DateTime, default=datetime.utcnow)

class RiskAssessment(Base):
    """供應商風險評估"""
    __tablename__ = "risk_assessments"

    id = Column(Integer, primary_key=True, index=True)
    supplier_code = Column(String, index=True)
    assessment_date = Column(DateTime, default=datetime.utcnow)

    risk_level = Column(String)  # LOW, MEDIUM, HIGH
    risk_score = Column(Float)  # 0-1

    # 風險因素
    financial_risk = Column(Float)
    operational_risk = Column(Float)
    compliance_risk = Column(Float)
    geographic_risk = Column(Float)

    # 風險詳情
    risk_factors = Column(Text)  # JSON
    recommendations = Column(Text)  # JSON
    alternative_suppliers = Column(Text)  # JSON

    created_at = Column(DateTime, default=datetime.utcnow)

Base.metadata.create_all(bind=engine)

# Pydantic 模型
class SupplierCreate(BaseModel):
    supplier_code: str
    supplier_name: str
    category: str
    tier: str = "APPROVED"
    contact_person: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    payment_terms: Optional[str] = None
    credit_limit: float = 0.0

class PerformanceMetricCreate(BaseModel):
    supplier_code: str
    period: str
    on_time_delivery_rate: float
    quality_rate: float
    response_time: float
    price_competitiveness: float
    total_orders: int = 0
    delivered_orders: int = 0
    late_orders: int = 0
    rejected_orders: int = 0
    total_amount: float = 0.0

class RiskAssessmentRequest(BaseModel):
    supplier_code: str

# 依賴項
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# 供應商績效分析服務
class SupplierPerformanceService:
    """供應商績效分析服務"""

    def calculate_overall_score(self, metric: PerformanceMetricCreate) -> float:
        """計算綜合評分"""
        # 權重配置
        weights = {
            'on_time_delivery': 0.30,
            'quality': 0.30,
            'response_time': 0.20,
            'price': 0.20
        }

        # 響應時間評分 (越低越好，24小時內為滿分)
        response_score = max(0, 100 - (metric.response_time / 24) * 100)
        response_score = min(100, response_score)

        # 價格評分 (1-5 轉換為 0-100)
        price_score = (metric.price_competitiveness / 5) * 100

        # 加權計算
        overall_score = (
            metric.on_time_delivery_rate * weights['on_time_delivery'] +
            metric.quality_rate * weights['quality'] +
            response_score * weights['response_time'] +
            price_score * weights['price']
        )

        return round(overall_score, 2)

    def assess_risk(self, supplier_code: str, db: Session) -> Dict:
        """評估供應商風險"""
        # 獲取歷史績效數據
        metrics = db.query(PerformanceMetric).filter(
            PerformanceMetric.supplier_code == supplier_code
        ).order_by(PerformanceMetric.period.desc()).limit(12).all()

        if len(metrics) < 3:
            raise ValueError("歷史數據不足，至少需要3個時期的數據")

        # 計算風險因素
        avg_otd = np.mean([m.on_time_delivery_rate for m in metrics])
        avg_quality = np.mean([m.quality_rate for m in metrics])
        avg_response = np.mean([m.response_time for m in metrics])
        recent_score = metrics[0].overall_score if metrics else 70

        # 財務風險 (基於交付績效)
        financial_risk = 1 - (avg_otd / 100)

        # 運營風險 (基於質量和響應時間)
        operational_risk = 1 - ((avg_quality / 100 + (1 - min(avg_response / 48, 1))) / 2)

        # 合規風險 (基於近期表現)
        compliance_risk = 1 - (recent_score / 100)

        # 地理風險 (簡化處理，實際應考慮供應商地理位置)
        geographic_risk = 0.3

        # 綜合風險評分
        risk_score = (
            financial_risk * 0.25 +
            operational_risk * 0.35 +
            compliance_risk * 0.25 +
            geographic_risk * 0.15
        )

        # 風險等級
        if risk_score < 0.3:
            risk_level = "LOW"
        elif risk_score < 0.6:
            risk_level = "MEDIUM"
        else:
            risk_level = "HIGH"

        # 識別風險因素
        risk_factors = []
        if avg_otd < 90:
            risk_factors.append({
                "factor": "準時交付率低",
                "value": f"{avg_otd:.1f}%",
                "severity": "high"
            })
        if avg_quality < 95:
            risk_factors.append({
                "factor": "質量合格率低",
                "value": f"{avg_quality:.1f}%",
                "severity": "high"
            })
        if avg_response > 24:
            risk_factors.append({
                "factor": "響應時間長",
                "value": f"{avg_response:.1f}小時",
                "severity": "medium"
            })
        if recent_score < 70:
            risk_factors.append({
                "factor": "綜合評分下降",
                "value": f"{recent_score:.1f}分",
                "severity": "high"
            })

        # 生成建議
        recommendations = []
        if risk_level in ["MEDIUM", "HIGH"]:
            recommendations.append("增加供應商審核頻率")
            recommendations.append("要求提交改善計劃")

        if avg_otd < 90:
            recommendations.append("與供應商溝通交付問題，優化物流安排")

        if avg_quality < 95:
            recommendations.append("加強質量檢驗，要求供應商提升品質管理")

        if risk_level == "HIGH":
            recommendations.append("尋找替代供應商")
            recommendations.append("降低訂單量，分散風險")

        # 查找替代供應商 (相同類別的其他供應商)
        supplier = db.query(Supplier).filter(Supplier.supplier_code == supplier_code).first()
        alternatives = []

        if supplier and risk_level == "HIGH":
            alt_suppliers = db.query(Supplier).filter(
                Supplier.category == supplier.category,
                Supplier.supplier_code != supplier_code,
                Supplier.status == "ACTIVE"
            ).limit(3).all()

            alternatives = [
                {
                    "supplier_code": s.supplier_code,
                    "supplier_name": s.supplier_name,
                    "tier": s.tier
                }
                for s in alt_suppliers
            ]

        return {
            "risk_level": risk_level,
            "risk_score": round(risk_score, 4),
            "risk_components": {
                "financial_risk": round(financial_risk, 4),
                "operational_risk": round(operational_risk, 4),
                "compliance_risk": round(compliance_risk, 4),
                "geographic_risk": round(geographic_risk, 4)
            },
            "risk_factors": risk_factors,
            "recommendations": recommendations,
            "alternative_suppliers": alternatives
        }

    def get_supplier_ranking(self, db: Session, category: Optional[str] = None) -> List[Dict]:
        """獲取供應商排名"""
        # 獲取最新的績效數據
        latest_metrics = {}

        query = db.query(PerformanceMetric).order_by(PerformanceMetric.period.desc())

        for metric in query.all():
            if metric.supplier_code not in latest_metrics:
                latest_metrics[metric.supplier_code] = metric

        # 排序
        ranking = sorted(
            latest_metrics.values(),
            key=lambda x: x.overall_score,
            reverse=True
        )

        # 過濾類別
        if category:
            suppliers = db.query(Supplier).filter(Supplier.category == category).all()
            supplier_codes = [s.supplier_code for s in suppliers]
            ranking = [r for r in ranking if r.supplier_code in supplier_codes]

        return ranking

# API 路由
@app.get("/")
async def root():
    return {
        "message": "供應商績效管理系統 API",
        "version": "1.0.0",
        "endpoints": {
            "health": "/health",
            "suppliers": "/api/suppliers",
            "metrics": "/api/metrics",
            "risk": "/api/risk",
            "ranking": "/api/ranking"
        }
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow()}

# 供應商管理
@app.post("/api/suppliers/")
async def create_supplier(supplier: SupplierCreate, db: Session = Depends(get_db)):
    """創建供應商"""
    # 檢查是否已存在
    existing = db.query(Supplier).filter(
        Supplier.supplier_code == supplier.supplier_code
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="供應商編號已存在")

    db_supplier = Supplier(**supplier.dict())
    db.add(db_supplier)
    db.commit()
    db.refresh(db_supplier)

    return {"status": "success", "id": db_supplier.id}

@app.get("/api/suppliers/")
async def get_suppliers(
    category: Optional[str] = None,
    tier: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """獲取供應商列表"""
    query = db.query(Supplier)

    if category:
        query = query.filter(Supplier.category == category)
    if tier:
        query = query.filter(Supplier.tier == tier)
    if status:
        query = query.filter(Supplier.status == status)

    suppliers = query.all()

    return {
        "count": len(suppliers),
        "suppliers": [
            {
                "id": s.id,
                "supplier_code": s.supplier_code,
                "supplier_name": s.supplier_name,
                "category": s.category,
                "tier": s.tier,
                "status": s.status,
                "contact_person": s.contact_person,
                "email": s.email,
                "phone": s.phone
            }
            for s in suppliers
        ]
    }

@app.get("/api/suppliers/{supplier_code}")
async def get_supplier(supplier_code: str, db: Session = Depends(get_db)):
    """獲取供應商詳情"""
    supplier = db.query(Supplier).filter(
        Supplier.supplier_code == supplier_code
    ).first()

    if not supplier:
        raise HTTPException(status_code=404, detail="供應商不存在")

    # 獲取最新績效
    latest_metric = db.query(PerformanceMetric).filter(
        PerformanceMetric.supplier_code == supplier_code
    ).order_by(PerformanceMetric.period.desc()).first()

    return {
        "supplier": {
            "supplier_code": supplier.supplier_code,
            "supplier_name": supplier.supplier_name,
            "category": supplier.category,
            "tier": supplier.tier,
            "status": supplier.status,
            "contact_person": supplier.contact_person,
            "email": supplier.email,
            "phone": supplier.phone,
            "address": supplier.address,
            "payment_terms": supplier.payment_terms,
            "credit_limit": supplier.credit_limit
        },
        "latest_performance": {
            "period": latest_metric.period,
            "overall_score": latest_metric.overall_score,
            "on_time_delivery_rate": latest_metric.on_time_delivery_rate,
            "quality_rate": latest_metric.quality_rate,
            "response_time": latest_metric.response_time
        } if latest_metric else None
    }

# 績效管理
@app.post("/api/metrics/")
async def create_metric(metric: PerformanceMetricCreate, db: Session = Depends(get_db)):
    """創建績效記錄"""
    # 計算綜合評分
    service = SupplierPerformanceService()
    overall_score = service.calculate_overall_score(metric)

    db_metric = PerformanceMetric(
        **metric.dict(),
        overall_score=overall_score
    )

    db.add(db_metric)
    db.commit()
    db.refresh(db_metric)

    return {
        "status": "success",
        "id": db_metric.id,
        "overall_score": overall_score
    }

@app.get("/api/metrics/{supplier_code}")
async def get_metrics(
    supplier_code: str,
    limit: int = 12,
    db: Session = Depends(get_db)
):
    """獲取供應商績效歷史"""
    metrics = db.query(PerformanceMetric).filter(
        PerformanceMetric.supplier_code == supplier_code
    ).order_by(PerformanceMetric.period.desc()).limit(limit).all()

    if not metrics:
        raise HTTPException(status_code=404, detail="找不到績效數據")

    return {
        "supplier_code": supplier_code,
        "count": len(metrics),
        "metrics": [
            {
                "period": m.period,
                "overall_score": m.overall_score,
                "on_time_delivery_rate": m.on_time_delivery_rate,
                "quality_rate": m.quality_rate,
                "response_time": m.response_time,
                "price_competitiveness": m.price_competitiveness,
                "total_orders": m.total_orders,
                "total_amount": m.total_amount
            }
            for m in metrics
        ]
    }

# 風險評估
@app.post("/api/risk/assess")
async def assess_risk(request: RiskAssessmentRequest, db: Session = Depends(get_db)):
    """評估供應商風險"""
    try:
        service = SupplierPerformanceService()
        risk_assessment = service.assess_risk(request.supplier_code, db)

        # 保存評估結果
        db_assessment = RiskAssessment(
            supplier_code=request.supplier_code,
            risk_level=risk_assessment['risk_level'],
            risk_score=risk_assessment['risk_score'],
            financial_risk=risk_assessment['risk_components']['financial_risk'],
            operational_risk=risk_assessment['risk_components']['operational_risk'],
            compliance_risk=risk_assessment['risk_components']['compliance_risk'],
            geographic_risk=risk_assessment['risk_components']['geographic_risk'],
            risk_factors=json.dumps(risk_assessment['risk_factors']),
            recommendations=json.dumps(risk_assessment['recommendations']),
            alternative_suppliers=json.dumps(risk_assessment['alternative_suppliers'])
        )

        db.add(db_assessment)
        db.commit()

        return risk_assessment

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"風險評估失敗: {str(e)}")
        raise HTTPException(status_code=500, detail=f"風險評估失敗: {str(e)}")

@app.get("/api/risk/{supplier_code}")
async def get_risk_history(supplier_code: str, db: Session = Depends(get_db)):
    """獲取風險評估歷史"""
    assessments = db.query(RiskAssessment).filter(
        RiskAssessment.supplier_code == supplier_code
    ).order_by(RiskAssessment.assessment_date.desc()).limit(10).all()

    return {
        "supplier_code": supplier_code,
        "count": len(assessments),
        "assessments": [
            {
                "assessment_date": a.assessment_date.isoformat(),
                "risk_level": a.risk_level,
                "risk_score": a.risk_score,
                "financial_risk": a.financial_risk,
                "operational_risk": a.operational_risk,
                "compliance_risk": a.compliance_risk,
                "geographic_risk": a.geographic_risk
            }
            for a in assessments
        ]
    }

# 供應商排名
@app.get("/api/ranking")
async def get_ranking(category: Optional[str] = None, db: Session = Depends(get_db)):
    """獲取供應商排名"""
    service = SupplierPerformanceService()
    ranking = service.get_supplier_ranking(db, category)

    # 獲取供應商詳情
    supplier_map = {}
    suppliers = db.query(Supplier).all()
    for s in suppliers:
        supplier_map[s.supplier_code] = s

    result = []
    for idx, metric in enumerate(ranking, 1):
        supplier = supplier_map.get(metric.supplier_code)
        if supplier:
            result.append({
                "rank": idx,
                "supplier_code": metric.supplier_code,
                "supplier_name": supplier.supplier_name,
                "tier": supplier.tier,
                "category": supplier.category,
                "overall_score": metric.overall_score,
                "on_time_delivery_rate": metric.on_time_delivery_rate,
                "quality_rate": metric.quality_rate,
                "period": metric.period
            })

    return {
        "category": category,
        "count": len(result),
        "ranking": result
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
