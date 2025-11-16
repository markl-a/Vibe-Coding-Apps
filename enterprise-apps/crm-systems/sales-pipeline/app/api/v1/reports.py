from fastapi import APIRouter

router = APIRouter()


@router.get("/conversion-rate")
def get_conversion_rate():
    """獲取轉化率報表"""
    return {"message": "Conversion rate report endpoint"}


@router.get("/sales-trend")
def get_sales_trend():
    """獲取銷售趨勢"""
    return {"message": "Sales trend report endpoint"}
