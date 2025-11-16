"""
數據模型定義
"""
from typing import Optional, List
from datetime import datetime
from enum import Enum
from pydantic import BaseModel, Field


class OrderStatus(str, Enum):
    """訂單狀態"""
    DRAFT = "DRAFT"  # 草稿
    SUBMITTED = "SUBMITTED"  # 已提交
    APPROVED = "APPROVED"  # 已審批
    REJECTED = "REJECTED"  # 已拒絕
    COMPLETED = "COMPLETED"  # 已完成
    CANCELLED = "CANCELLED"  # 已取消


class Supplier(BaseModel):
    """供應商模型"""
    code: str = Field(..., description="供應商編號")
    name: str = Field(..., description="供應商名稱")
    contact_person: Optional[str] = Field(None, description="聯絡人")
    phone: Optional[str] = Field(None, description="電話")
    email: Optional[str] = Field(None, description="電子郵件")
    address: Optional[str] = Field(None, description="地址")
    payment_terms: Optional[str] = Field(None, description="付款條款")
    rating: Optional[int] = Field(None, ge=1, le=5, description="評級 (1-5)")
    created_at: Optional[datetime] = None


class OrderItem(BaseModel):
    """訂單明細"""
    product_code: str = Field(..., description="產品編號")
    product_name: Optional[str] = None
    quantity: int = Field(..., gt=0, description="數量")
    unit_price: float = Field(..., gt=0, description="單價")
    received_quantity: int = Field(default=0, description="已收貨數量")


class CreateOrderRequest(BaseModel):
    """創建訂單請求"""
    supplier_code: str
    items: List[OrderItem]
    requester: Optional[str] = None
    delivery_date: Optional[str] = None
    notes: Optional[str] = None


class ApproveOrderRequest(BaseModel):
    """審批訂單請求"""
    approver: str
    notes: Optional[str] = None


class RejectOrderRequest(BaseModel):
    """拒絕訂單請求"""
    approver: str
    reason: str


class ReceiveGoodsRequest(BaseModel):
    """收貨請求"""
    items: List[dict]  # [{'product_code': 'P001', 'quantity': 10}]
    receiver: Optional[str] = None
    notes: Optional[str] = None
