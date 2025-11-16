"""
智能庫存優化系統
實現 EOQ、安全庫存、補貨點優化等功能
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import numpy as np
import math
from scipy import stats

app = FastAPI(
    title="智能庫存優化系統",
    description="基於數學模型的庫存優化系統",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 請求模型
class EOQRequest(BaseModel):
    """經濟訂購量(EOQ)計算請求"""
    annual_demand: float  # 年需求量
    ordering_cost: float  # 每次訂購成本
    holding_cost_rate: float  # 持有成本率(年)
    unit_cost: float  # 單位成本

class SafetyStockRequest(BaseModel):
    """安全庫存計算請求"""
    avg_demand: float  # 平均需求
    demand_std: float  # 需求標準差
    lead_time: float  # 前置時間(天)
    lead_time_std: float = 0.0  # 前置時間標準差
    service_level: float = 0.95  # 服務水平(95%, 99% etc)

class ReorderPointRequest(BaseModel):
    """補貨點計算請求"""
    avg_daily_demand: float  # 平均日需求
    lead_time_days: float  # 前置時間(天)
    safety_stock: Optional[float] = None  # 安全庫存
    demand_std: Optional[float] = None  # 需求標準差
    service_level: float = 0.95  # 服務水平

class ABCAnalysisRequest(BaseModel):
    """ABC 分類分析請求"""
    items: list[dict]  # [{"item_id": "...", "annual_value": 1000}, ...]

class InventoryOptimizationRequest(BaseModel):
    """綜合庫存優化請求"""
    item_id: str
    annual_demand: float
    ordering_cost: float
    holding_cost_rate: float
    unit_cost: float
    avg_daily_demand: float
    demand_std: float
    lead_time_days: float
    lead_time_std: float = 0.0
    service_level: float = 0.95

# 庫存優化服務
class InventoryOptimizationService:
    """庫存優化服務"""

    @staticmethod
    def calculate_eoq(annual_demand: float, ordering_cost: float, holding_cost: float) -> dict:
        """
        計算經濟訂購量 (Economic Order Quantity)

        公式: EOQ = sqrt((2 * D * S) / H)
        D = 年需求量
        S = 每次訂購成本
        H = 單位持有成本
        """
        eoq = math.sqrt((2 * annual_demand * ordering_cost) / holding_cost)

        # 計算相關指標
        orders_per_year = annual_demand / eoq
        time_between_orders = 365 / orders_per_year
        total_ordering_cost = orders_per_year * ordering_cost
        avg_inventory = eoq / 2
        total_holding_cost = avg_inventory * holding_cost
        total_cost = total_ordering_cost + total_holding_cost

        return {
            "eoq": round(eoq, 2),
            "orders_per_year": round(orders_per_year, 2),
            "days_between_orders": round(time_between_orders, 2),
            "average_inventory": round(avg_inventory, 2),
            "annual_ordering_cost": round(total_ordering_cost, 2),
            "annual_holding_cost": round(total_holding_cost, 2),
            "total_annual_cost": round(total_cost, 2)
        }

    @staticmethod
    def calculate_safety_stock(
        avg_demand: float,
        demand_std: float,
        lead_time: float,
        lead_time_std: float,
        service_level: float
    ) -> dict:
        """
        計算安全庫存

        公式: SS = Z * sqrt((LT * σD²) + (D² * σLT²))
        Z = 服務水平對應的 Z 值
        LT = 平均前置時間
        σD = 需求標準差
        D = 平均需求
        σLT = 前置時間標準差
        """
        # 獲取 Z 值
        z_score = stats.norm.ppf(service_level)

        # 計算安全庫存
        variance = (lead_time * demand_std ** 2) + (avg_demand ** 2 * lead_time_std ** 2)
        safety_stock = z_score * math.sqrt(variance)

        # 計算缺貨概率
        stockout_probability = 1 - service_level

        return {
            "safety_stock": round(safety_stock, 2),
            "z_score": round(z_score, 2),
            "service_level": service_level,
            "stockout_probability": round(stockout_probability, 4),
            "demand_during_lead_time": round(avg_demand * lead_time, 2)
        }

    @staticmethod
    def calculate_reorder_point(
        avg_daily_demand: float,
        lead_time_days: float,
        safety_stock: float
    ) -> dict:
        """
        計算補貨點

        公式: ROP = (平均日需求 × 前置時間) + 安全庫存
        """
        demand_during_lead_time = avg_daily_demand * lead_time_days
        reorder_point = demand_during_lead_time + safety_stock

        return {
            "reorder_point": round(reorder_point, 2),
            "demand_during_lead_time": round(demand_during_lead_time, 2),
            "safety_stock": round(safety_stock, 2),
            "lead_time_days": lead_time_days
        }

    @staticmethod
    def abc_analysis(items: list) -> dict:
        """
        ABC 分類分析

        A 類: 累計價值 0-80%
        B 類: 累計價值 80-95%
        C 類: 累計價值 95-100%
        """
        # 按年度價值排序
        sorted_items = sorted(items, key=lambda x: x['annual_value'], reverse=True)

        # 計算總價值
        total_value = sum(item['annual_value'] for item in sorted_items)

        # 分類
        cumulative_value = 0
        classified_items = []

        for item in sorted_items:
            cumulative_value += item['annual_value']
            cumulative_percentage = (cumulative_value / total_value) * 100

            if cumulative_percentage <= 80:
                category = 'A'
            elif cumulative_percentage <= 95:
                category = 'B'
            else:
                category = 'C'

            classified_items.append({
                **item,
                'category': category,
                'cumulative_value': round(cumulative_value, 2),
                'cumulative_percentage': round(cumulative_percentage, 2),
                'value_percentage': round((item['annual_value'] / total_value) * 100, 2)
            })

        # 統計
        a_count = sum(1 for item in classified_items if item['category'] == 'A')
        b_count = sum(1 for item in classified_items if item['category'] == 'B')
        c_count = sum(1 for item in classified_items if item['category'] == 'C')

        return {
            "total_items": len(items),
            "total_value": round(total_value, 2),
            "category_distribution": {
                "A": {"count": a_count, "percentage": round((a_count / len(items)) * 100, 2)},
                "B": {"count": b_count, "percentage": round((b_count / len(items)) * 100, 2)},
                "C": {"count": c_count, "percentage": round((c_count / len(items)) * 100, 2)}
            },
            "items": classified_items
        }

# API 路由
@app.get("/")
async def root():
    return {
        "message": "智能庫存優化系統 API",
        "version": "1.0.0",
        "endpoints": {
            "eoq": "/api/eoq",
            "safety_stock": "/api/safety-stock",
            "reorder_point": "/api/reorder-point",
            "abc_analysis": "/api/abc-analysis",
            "optimize": "/api/optimize"
        }
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.post("/api/eoq")
async def calculate_eoq(request: EOQRequest):
    """計算經濟訂購量(EOQ)"""
    try:
        service = InventoryOptimizationService()
        holding_cost = request.unit_cost * request.holding_cost_rate

        result = service.calculate_eoq(
            request.annual_demand,
            request.ordering_cost,
            holding_cost
        )

        return {
            "status": "success",
            "input": request.dict(),
            "result": result,
            "recommendations": [
                f"建議每次訂購 {result['eoq']} 件",
                f"每年訂購 {result['orders_per_year']} 次",
                f"每 {result['days_between_orders']:.0f} 天訂購一次",
                f"預計年度總成本: ${result['total_annual_cost']:,.2f}"
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/safety-stock")
async def calculate_safety_stock(request: SafetyStockRequest):
    """計算安全庫存"""
    try:
        service = InventoryOptimizationService()

        result = service.calculate_safety_stock(
            request.avg_demand,
            request.demand_std,
            request.lead_time,
            request.lead_time_std,
            request.service_level
        )

        service_level_pct = request.service_level * 100

        return {
            "status": "success",
            "input": request.dict(),
            "result": result,
            "recommendations": [
                f"建議安全庫存: {result['safety_stock']} 件",
                f"服務水平: {service_level_pct}%",
                f"預期缺貨概率: {result['stockout_probability']*100:.2f}%",
                f"前置時間需求: {result['demand_during_lead_time']} 件"
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/reorder-point")
async def calculate_reorder_point(request: ReorderPointRequest):
    """計算補貨點"""
    try:
        service = InventoryOptimizationService()

        # 如果沒提供安全庫存，先計算
        if request.safety_stock is None:
            if request.demand_std is None:
                raise HTTPException(
                    status_code=400,
                    detail="必須提供 safety_stock 或 demand_std"
                )

            safety_result = service.calculate_safety_stock(
                request.avg_daily_demand,
                request.demand_std,
                request.lead_time_days,
                0.0,
                request.service_level
            )
            safety_stock = safety_result['safety_stock']
        else:
            safety_stock = request.safety_stock

        result = service.calculate_reorder_point(
            request.avg_daily_demand,
            request.lead_time_days,
            safety_stock
        )

        return {
            "status": "success",
            "input": request.dict(),
            "result": result,
            "recommendations": [
                f"建議補貨點: {result['reorder_point']} 件",
                f"當庫存降至 {result['reorder_point']} 件時下單",
                f"前置時間需求: {result['demand_during_lead_time']} 件",
                f"安全庫存: {result['safety_stock']} 件"
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/abc-analysis")
async def abc_analysis(request: ABCAnalysisRequest):
    """ABC 分類分析"""
    try:
        service = InventoryOptimizationService()
        result = service.abc_analysis(request.items)

        return {
            "status": "success",
            "result": result,
            "recommendations": [
                f"A 類物料 ({result['category_distribution']['A']['count']} 件): 重點管理，緊密監控",
                f"B 類物料 ({result['category_distribution']['B']['count']} 件): 中等管理，定期檢查",
                f"C 類物料 ({result['category_distribution']['C']['count']} 件): 簡化管理，批量處理"
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/optimize")
async def comprehensive_optimization(request: InventoryOptimizationRequest):
    """綜合庫存優化"""
    try:
        service = InventoryOptimizationService()

        # 1. 計算 EOQ
        holding_cost = request.unit_cost * request.holding_cost_rate
        eoq_result = service.calculate_eoq(
            request.annual_demand,
            request.ordering_cost,
            holding_cost
        )

        # 2. 計算安全庫存
        safety_result = service.calculate_safety_stock(
            request.avg_daily_demand,
            request.demand_std,
            request.lead_time_days,
            request.lead_time_std,
            request.service_level
        )

        # 3. 計算補貨點
        reorder_result = service.calculate_reorder_point(
            request.avg_daily_demand,
            request.lead_time_days,
            safety_result['safety_stock']
        )

        # 4. 計算最大庫存
        max_inventory = reorder_result['reorder_point'] + eoq_result['eoq']

        return {
            "status": "success",
            "item_id": request.item_id,
            "optimization_results": {
                "economic_order_quantity": eoq_result,
                "safety_stock": safety_result,
                "reorder_point": reorder_result,
                "max_inventory": round(max_inventory, 2)
            },
            "inventory_policy": {
                "order_quantity": eoq_result['eoq'],
                "reorder_point": reorder_result['reorder_point'],
                "safety_stock": safety_result['safety_stock'],
                "max_stock": round(max_inventory, 2),
                "service_level": request.service_level * 100
            },
            "recommendations": [
                f"採用 (Q, R) 策略: 當庫存降至 {reorder_result['reorder_point']} 時，訂購 {eoq_result['eoq']} 件",
                f"維持安全庫存 {safety_result['safety_stock']} 件",
                f"最大庫存不超過 {max_inventory:.0f} 件",
                f"預計年度庫存成本: ${eoq_result['total_annual_cost']:,.2f}",
                f"服務水平: {request.service_level*100}%"
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
