from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List

from app.db.session import get_db
from app.db import models
from app.api.deps import get_current_user
from pydantic import BaseModel


router = APIRouter()


# Schemas
class StageOverview(BaseModel):
    stage: str
    count: int
    total_value: float
    weighted_value: float


class PipelineOverview(BaseModel):
    stages: List[StageOverview]
    total_opportunities: int
    total_pipeline_value: float
    weighted_pipeline_value: float


# Routes
@router.get("/overview", response_model=PipelineOverview)
def get_pipeline_overview(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """獲取銷售漏斗概覽"""
    # Get stage statistics
    stage_stats = db.query(
        models.Opportunity.stage,
        func.count(models.Opportunity.id).label('count'),
        func.sum(models.Opportunity.amount).label('total_value'),
        func.sum(models.Opportunity.amount * models.Opportunity.probability / 100).label('weighted_value')
    ).filter(
        models.Opportunity.owner_id == current_user.id
    ).group_by(
        models.Opportunity.stage
    ).all()

    stages = [
        StageOverview(
            stage=stat.stage,
            count=stat.count,
            total_value=float(stat.total_value or 0),
            weighted_value=float(stat.weighted_value or 0)
        )
        for stat in stage_stats
    ]

    total_opportunities = sum(s.count for s in stages)
    total_pipeline_value = sum(s.total_value for s in stages)
    weighted_pipeline_value = sum(s.weighted_value for s in stages)

    return PipelineOverview(
        stages=stages,
        total_opportunities=total_opportunities,
        total_pipeline_value=total_pipeline_value,
        weighted_pipeline_value=weighted_pipeline_value
    )
