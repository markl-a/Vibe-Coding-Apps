from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date

from app.db.session import get_db
from app.db import models
from app.api.deps import get_current_user
from pydantic import BaseModel, EmailStr


router = APIRouter()


# Schemas
class OpportunityCreate(BaseModel):
    customer_name: str
    customer_company: Optional[str] = None
    customer_email: Optional[EmailStr] = None
    opportunity_name: str
    stage: str = "潛在客戶"
    amount: float = 0
    probability: int = 0
    expected_close_date: Optional[date] = None
    products: List[str] = []
    notes: Optional[str] = None


class OpportunityUpdate(BaseModel):
    opportunity_name: Optional[str] = None
    stage: Optional[str] = None
    amount: Optional[float] = None
    probability: Optional[int] = None
    expected_close_date: Optional[date] = None
    products: Optional[List[str]] = None
    notes: Optional[str] = None


class OpportunityResponse(BaseModel):
    id: int
    customer_id: int
    opportunity_name: str
    stage: str
    amount: float
    probability: int
    expected_close_date: Optional[date]
    owner_id: int

    class Config:
        from_attributes = True


# Routes
@router.get("/", response_model=List[OpportunityResponse])
def get_opportunities(
    stage: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """獲取所有銷售機會"""
    query = db.query(models.Opportunity).filter(
        models.Opportunity.owner_id == current_user.id
    )

    if stage:
        query = query.filter(models.Opportunity.stage == stage)

    opportunities = query.offset(skip).limit(limit).all()
    return opportunities


@router.post("/", response_model=OpportunityResponse, status_code=status.HTTP_201_CREATED)
def create_opportunity(
    opportunity_in: OpportunityCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """創建新的銷售機會"""
    # Create or get customer
    customer = db.query(models.Customer).filter(
        models.Customer.name == opportunity_in.customer_name
    ).first()

    if not customer:
        customer = models.Customer(
            name=opportunity_in.customer_name,
            company=opportunity_in.customer_company,
            email=opportunity_in.customer_email
        )
        db.add(customer)
        db.commit()
        db.refresh(customer)

    # Create opportunity
    opportunity = models.Opportunity(
        customer_id=customer.id,
        opportunity_name=opportunity_in.opportunity_name,
        stage=opportunity_in.stage,
        amount=opportunity_in.amount,
        probability=opportunity_in.probability,
        expected_close_date=opportunity_in.expected_close_date,
        products=opportunity_in.products,
        notes=opportunity_in.notes,
        owner_id=current_user.id
    )
    db.add(opportunity)
    db.commit()
    db.refresh(opportunity)

    # Create stage history
    history = models.StageHistory(
        opportunity_id=opportunity.id,
        from_stage=None,
        to_stage=opportunity.stage,
        changed_by=current_user.id,
        notes="創建銷售機會"
    )
    db.add(history)
    db.commit()

    return opportunity


@router.get("/{opportunity_id}", response_model=OpportunityResponse)
def get_opportunity(
    opportunity_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """獲取單個銷售機會"""
    opportunity = db.query(models.Opportunity).filter(
        models.Opportunity.id == opportunity_id,
        models.Opportunity.owner_id == current_user.id
    ).first()

    if not opportunity:
        raise HTTPException(status_code=404, detail="Opportunity not found")

    return opportunity


@router.put("/{opportunity_id}", response_model=OpportunityResponse)
def update_opportunity(
    opportunity_id: int,
    opportunity_in: OpportunityUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """更新銷售機會"""
    opportunity = db.query(models.Opportunity).filter(
        models.Opportunity.id == opportunity_id,
        models.Opportunity.owner_id == current_user.id
    ).first()

    if not opportunity:
        raise HTTPException(status_code=404, detail="Opportunity not found")

    update_data = opportunity_in.dict(exclude_unset=True)

    # Track stage change
    if "stage" in update_data and update_data["stage"] != opportunity.stage:
        history = models.StageHistory(
            opportunity_id=opportunity.id,
            from_stage=opportunity.stage,
            to_stage=update_data["stage"],
            changed_by=current_user.id
        )
        db.add(history)

    for field, value in update_data.items():
        setattr(opportunity, field, value)

    db.commit()
    db.refresh(opportunity)

    return opportunity


@router.delete("/{opportunity_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_opportunity(
    opportunity_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """刪除銷售機會"""
    opportunity = db.query(models.Opportunity).filter(
        models.Opportunity.id == opportunity_id,
        models.Opportunity.owner_id == current_user.id
    ).first()

    if not opportunity:
        raise HTTPException(status_code=404, detail="Opportunity not found")

    db.delete(opportunity)
    db.commit()

    return None
