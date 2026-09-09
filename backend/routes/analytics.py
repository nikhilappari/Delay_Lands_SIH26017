from typing import Dict, Any, List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.database.db import get_db
from backend.database.models import PredictionRecord
from backend.schemas.prediction import AnalyticsData

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])

@router.get("", response_model=AnalyticsData)
def get_analytics_summary(db: Session = Depends(get_db)):
    """
    Computes analytical aggregations from stored prediction records.
    """
    total_cases = db.query(func.count(PredictionRecord.id)).scalar() or 0

    if total_cases == 0:
        return AnalyticsData(
            total_cases=0,
            high_risk_cases=0,
            medium_risk_cases=0,
            low_risk_cases=0,
            delayed_cases=0,
            non_delayed_cases=0,
            avg_risk_score=0.0,
            risk_distribution=[
                {"name": "HIGH", "count": 0, "percentage": 0.0, "color": "#ef4444"},
                {"name": "MEDIUM", "count": 0, "percentage": 0.0, "color": "#f59e0b"},
                {"name": "LOW", "count": 0, "percentage": 0.0, "color": "#10b981"}
            ],
            outcome_distribution=[
                {"name": "Delayed", "count": 0, "percentage": 0.0, "color": "#ef4444"},
                {"name": "On Schedule", "count": 0, "percentage": 0.0, "color": "#3b82f6"}
            ],
            project_type_risk=[],
            stage_risk=[],
            complexity_risk=[]
        )

    # Risk level counts
    high_risk = db.query(func.count(PredictionRecord.id)).filter(PredictionRecord.risk_level == "HIGH").scalar() or 0
    medium_risk = db.query(func.count(PredictionRecord.id)).filter(PredictionRecord.risk_level == "MEDIUM").scalar() or 0
    low_risk = db.query(func.count(PredictionRecord.id)).filter(PredictionRecord.risk_level == "LOW").scalar() or 0

    # Outcome counts
    delayed = db.query(func.count(PredictionRecord.id)).filter(PredictionRecord.target_delayed == 1).scalar() or 0
    non_delayed = db.query(func.count(PredictionRecord.id)).filter(PredictionRecord.target_delayed == 0).scalar() or 0

    # Average Risk Score
    avg_risk = db.query(func.avg(PredictionRecord.risk_score)).scalar() or 0.0
    avg_risk = round(float(avg_risk), 2)

    # Risk distribution
    risk_distribution = [
        {"name": "HIGH", "count": high_risk, "percentage": round((high_risk / total_cases) * 100, 1), "color": "#ef4444"},
        {"name": "MEDIUM", "count": medium_risk, "percentage": round((medium_risk / total_cases) * 100, 1), "color": "#f59e0b"},
        {"name": "LOW", "count": low_risk, "percentage": round((low_risk / total_cases) * 100, 1), "color": "#10b981"}
    ]

    # Outcome distribution
    outcome_distribution = [
        {"name": "Delayed", "count": delayed, "percentage": round((delayed / total_cases) * 100, 1), "color": "#ef4444"},
        {"name": "On Schedule", "count": non_delayed, "percentage": round((non_delayed / total_cases) * 100, 1), "color": "#3b82f6"}
    ]

    # Project type vs risk score
    pt_rows = (
        db.query(
            PredictionRecord.project_type,
            func.count(PredictionRecord.id).label("total"),
            func.avg(PredictionRecord.risk_score).label("avg_risk"),
            func.sum(PredictionRecord.target_delayed).label("delayed_count")
        )
        .group_by(PredictionRecord.project_type)
        .all()
    )
    project_type_risk = [
        {
            "project_type": r.project_type,
            "total_cases": r.total,
            "avg_risk": round(float(r.avg_risk), 2),
            "delayed_cases": int(r.delayed_count or 0),
            "delay_rate": round((int(r.delayed_count or 0) / r.total) * 100, 1) if r.total else 0
        }
        for r in pt_rows
    ]

    # Stage vs risk score
    stage_rows = (
        db.query(
            PredictionRecord.current_stage,
            func.count(PredictionRecord.id).label("total"),
            func.avg(PredictionRecord.risk_score).label("avg_risk"),
            func.sum(PredictionRecord.target_delayed).label("delayed_count")
        )
        .group_by(PredictionRecord.current_stage)
        .all()
    )
    stage_risk = [
        {
            "stage": r.current_stage,
            "total_cases": r.total,
            "avg_risk": round(float(r.avg_risk), 2),
            "delayed_cases": int(r.delayed_count or 0),
            "delay_rate": round((int(r.delayed_count or 0) / r.total) * 100, 1) if r.total else 0
        }
        for r in stage_rows
    ]

    # Complexity vs risk score
    comp_rows = (
        db.query(
            PredictionRecord.land_record_complexity,
            func.count(PredictionRecord.id).label("total"),
            func.avg(PredictionRecord.risk_score).label("avg_risk"),
            func.sum(PredictionRecord.target_delayed).label("delayed_count")
        )
        .group_by(PredictionRecord.land_record_complexity)
        .all()
    )
    complexity_risk = [
        {
            "complexity": r.land_record_complexity,
            "total_cases": r.total,
            "avg_risk": round(float(r.avg_risk), 2),
            "delayed_cases": int(r.delayed_count or 0),
            "delay_rate": round((int(r.delayed_count or 0) / r.total) * 100, 1) if r.total else 0
        }
        for r in comp_rows
    ]

    # State-wise distribution
    state_rows = (
        db.query(
            PredictionRecord.state,
            func.count(PredictionRecord.id).label("total"),
            func.avg(PredictionRecord.risk_score).label("avg_risk"),
            func.sum(PredictionRecord.target_delayed).label("delayed_count")
        )
        .group_by(PredictionRecord.state)
        .all()
    )
    state_distribution = [
        {
            "state": r.state or "Maharashtra",
            "total_cases": r.total,
            "avg_risk": round(float(r.avg_risk), 2) if r.avg_risk else 0.0,
            "delayed_cases": int(r.delayed_count or 0),
            "delay_rate": round((int(r.delayed_count or 0) / r.total) * 100, 1) if r.total else 0
        }
        for r in state_rows if r.state
    ]

    # District-wise distribution
    dist_rows = (
        db.query(
            PredictionRecord.district,
            PredictionRecord.state,
            func.count(PredictionRecord.id).label("total"),
            func.avg(PredictionRecord.risk_score).label("avg_risk"),
            func.sum(PredictionRecord.target_delayed).label("delayed_count")
        )
        .group_by(PredictionRecord.district, PredictionRecord.state)
        .all()
    )
    district_distribution = [
        {
            "district": r.district or "Pune",
            "state": r.state or "Maharashtra",
            "total_cases": r.total,
            "avg_risk": round(float(r.avg_risk), 2) if r.avg_risk else 0.0,
            "delayed_cases": int(r.delayed_count or 0),
            "delay_rate": round((int(r.delayed_count or 0) / r.total) * 100, 1) if r.total else 0
        }
        for r in dist_rows if r.district
    ]

    return AnalyticsData(
        total_cases=total_cases,
        high_risk_cases=high_risk,
        medium_risk_cases=medium_risk,
        low_risk_cases=low_risk,
        delayed_cases=delayed,
        non_delayed_cases=non_delayed,
        avg_risk_score=avg_risk,
        risk_distribution=risk_distribution,
        outcome_distribution=outcome_distribution,
        project_type_risk=project_type_risk,
        stage_risk=stage_risk,
        complexity_risk=complexity_risk,
        state_distribution=state_distribution,
        district_distribution=district_distribution
    )
