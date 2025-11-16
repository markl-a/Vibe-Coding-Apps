from fastapi import APIRouter
from app.api.v1 import auth, opportunities, pipeline, reports

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(opportunities.router, prefix="/opportunities", tags=["opportunities"])
api_router.include_router(pipeline.router, prefix="/pipeline", tags=["pipeline"])
api_router.include_router(reports.router, prefix="/reports", tags=["reports"])
