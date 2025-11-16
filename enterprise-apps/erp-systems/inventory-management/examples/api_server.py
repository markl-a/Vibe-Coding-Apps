"""
REST API 服務範例
使用 FastAPI 提供 HTTP API 介面
"""
import sys
sys.path.insert(0, '../src')

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from inventory_manager import InventoryManager
from models import Product, Warehouse, StockInRequest, StockOutRequest

app = FastAPI(
    title="庫存管理系統 API",
    description="完整的庫存管理 RESTful API",
    version="1.0.0"
)

# 創建全局管理器實例
manager = InventoryManager('inventory.db')


@app.on_event("startup")
async def startup_event():
    """啟動時初始化數據庫"""
    manager.initialize_db()


# ========== 產品管理 API ==========

@app.post("/api/products", tags=["產品管理"])
async def create_product(product: Product):
    """新增產品"""
    success = manager.add_product(
        product.code,
        product.name,
        product.unit,
        product.min_quantity,
        product.description
    )
    if not success:
        raise HTTPException(status_code=400, detail="產品已存在")
    return {"message": "產品新增成功", "code": product.code}


@app.get("/api/products", tags=["產品管理"])
async def get_products():
    """獲取所有產品"""
    return manager.get_all_products()


@app.get("/api/products/{code}", tags=["產品管理"])
async def get_product(code: str):
    """獲取產品詳情"""
    product = manager.get_product(code)
    if not product:
        raise HTTPException(status_code=404, detail="產品不存在")
    return product


# ========== 倉庫管理 API ==========

@app.post("/api/warehouses", tags=["倉庫管理"])
async def create_warehouse(warehouse: Warehouse):
    """新增倉庫"""
    success = manager.add_warehouse(
        warehouse.code,
        warehouse.name,
        warehouse.location,
        warehouse.description
    )
    if not success:
        raise HTTPException(status_code=400, detail="倉庫已存在")
    return {"message": "倉庫新增成功", "code": warehouse.code}


@app.get("/api/warehouses", tags=["倉庫管理"])
async def get_warehouses():
    """獲取所有倉庫"""
    return manager.get_all_warehouses()


@app.get("/api/warehouses/{code}", tags=["倉庫管理"])
async def get_warehouse(code: str):
    """獲取倉庫詳情"""
    warehouse = manager.get_warehouse(code)
    if not warehouse:
        raise HTTPException(status_code=404, detail="倉庫不存在")
    return warehouse


# ========== 庫存操作 API ==========

@app.post("/api/stock/in", tags=["庫存操作"])
async def stock_in(request: StockInRequest):
    """入庫操作"""
    try:
        manager.stock_in(
            request.product_code,
            request.quantity,
            request.warehouse_code,
            request.batch_no,
            request.reference,
            request.operator,
            request.notes
        )
        return {"message": "入庫成功"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/stock/out", tags=["庫存操作"])
async def stock_out(request: StockOutRequest):
    """出庫操作"""
    try:
        manager.stock_out(
            request.product_code,
            request.quantity,
            request.warehouse_code,
            request.reference,
            request.operator,
            request.notes
        )
        return {"message": "出庫成功"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ========== 庫存查詢 API ==========

@app.get("/api/stock", tags=["庫存查詢"])
async def get_all_stock():
    """獲取所有庫存"""
    return manager.get_all_stock()


@app.get("/api/stock/{product_code}", tags=["庫存查詢"])
async def get_stock(product_code: str, warehouse_code: Optional[str] = None):
    """獲取產品庫存"""
    stock = manager.get_stock(product_code, warehouse_code)
    if not stock:
        return {"quantity": 0}
    return stock


@app.get("/api/stock/alerts/low-stock", tags=["庫存查詢"])
async def get_low_stock():
    """獲取低庫存產品"""
    return manager.get_low_stock_products()


# ========== 異動記錄 API ==========

@app.get("/api/transactions", tags=["異動記錄"])
async def get_transactions(
    product_code: Optional[str] = None,
    warehouse_code: Optional[str] = None,
    transaction_type: Optional[str] = None,
    limit: int = 100
):
    """查詢異動記錄"""
    return manager.get_transactions(product_code, warehouse_code, transaction_type, limit)


# ========== 統計報表 API ==========

@app.get("/api/reports/summary", tags=["統計報表"])
async def get_summary():
    """獲取庫存統計摘要"""
    return manager.get_stock_summary()


@app.get("/", tags=["系統"])
async def root():
    """API 首頁"""
    return {
        "name": "庫存管理系統 API",
        "version": "1.0.0",
        "docs": "/docs",
        "redoc": "/redoc"
    }


if __name__ == "__main__":
    import uvicorn
    print("啟動 API 服務...")
    print("訪問 http://localhost:8000/docs 查看 API 文檔")
    uvicorn.run(app, host="0.0.0.0", port=8000)
