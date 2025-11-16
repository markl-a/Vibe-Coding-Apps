"""
數據模型定義
"""
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field


class Product(BaseModel):
    """產品模型"""
    code: str = Field(..., description="產品編號")
    name: str = Field(..., description="產品名稱")
    unit: str = Field(..., description="計量單位")
    min_quantity: int = Field(default=0, description="最低庫存量")
    description: Optional[str] = Field(None, description="產品描述")
    created_at: Optional[datetime] = None


class Warehouse(BaseModel):
    """倉庫模型"""
    code: str = Field(..., description="倉庫編號")
    name: str = Field(..., description="倉庫名稱")
    location: Optional[str] = Field(None, description="倉庫地址")
    description: Optional[str] = Field(None, description="倉庫描述")
    created_at: Optional[datetime] = None


class Stock(BaseModel):
    """庫存模型"""
    product_code: str = Field(..., description="產品編號")
    warehouse_code: str = Field(..., description="倉庫編號")
    quantity: int = Field(default=0, description="庫存數量")
    last_updated: Optional[datetime] = None


class Transaction(BaseModel):
    """庫存異動模型"""
    transaction_type: str = Field(..., description="異動類型 (IN/OUT)")
    product_code: str = Field(..., description="產品編號")
    warehouse_code: str = Field(..., description="倉庫編號")
    quantity: int = Field(..., description="異動數量")
    batch_no: Optional[str] = Field(None, description="批次號")
    reference: Optional[str] = Field(None, description="參考單號")
    operator: Optional[str] = Field(None, description="操作人員")
    notes: Optional[str] = Field(None, description="備註")
    timestamp: Optional[datetime] = None


class StockInRequest(BaseModel):
    """入庫請求"""
    product_code: str
    warehouse_code: str
    quantity: int = Field(..., gt=0)
    batch_no: Optional[str] = None
    reference: Optional[str] = None
    operator: Optional[str] = None
    notes: Optional[str] = None


class StockOutRequest(BaseModel):
    """出庫請求"""
    product_code: str
    warehouse_code: str
    quantity: int = Field(..., gt=0)
    reference: Optional[str] = None
    operator: Optional[str] = None
    notes: Optional[str] = None
