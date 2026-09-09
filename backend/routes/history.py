import os
import random
import pandas as pd
from typing import List, Optional
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import desc, asc, or_

from backend.database.db import get_db
from backend.database.models import PredictionRecord, AlertRecord
from backend.schemas.prediction import PredictionListItem, PredictionResponse
from backend.services.ml_service import ml_service
from backend.services.explainability import calculate_feature_contributions, generate_recommendations
from backend.routes.predict import INDIAN_LOCATIONS

router = APIRouter(prefix="/api/predictions", tags=["Prediction History"])

@router.get("", response_model=dict)
def get_prediction_history(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=500),
    search: Optional[str] = Query(None, description="Search by Project ID, Project Type, or Stage"),
    risk_level: Optional[str] = Query(None, description="Filter by LOW, MEDIUM, HIGH"),
    project_type: Optional[str] = Query(None, description="Filter by project type"),
    sort_by: str = Query("date_desc", description="Sort order: date_desc, date_asc, risk_desc, risk_asc"),
    db: Session = Depends(get_db)
):
    query = db.query(PredictionRecord)

    # Search filter
    if search:
        search_term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                PredictionRecord.project_id.ilike(search_term),
                PredictionRecord.project_type.ilike(search_term),
                PredictionRecord.current_stage.ilike(search_term)
            )
        )

    # Risk level filter
    if risk_level and risk_level.upper() in ["LOW", "MEDIUM", "HIGH"]:
        query = query.filter(PredictionRecord.risk_level == risk_level.upper())

    # Project type filter
    if project_type and project_type.lower() != "all":
        query = query.filter(PredictionRecord.project_type.ilike(project_type))

    # Total count for pagination
    total_count = query.count()

    # Sorting
    if sort_by == "risk_desc":
        query = query.order_by(desc(PredictionRecord.risk_score))
    elif sort_by == "risk_asc":
        query = query.order_by(asc(PredictionRecord.risk_score))
    elif sort_by == "date_asc":
        query = query.order_by(asc(PredictionRecord.created_at))
    else:
        query = query.order_by(desc(PredictionRecord.created_at))

    records = query.offset(skip).limit(limit).all()

    items = []
    for r in records:
        factors = r.risk_factors
        recs = r.recommendations

        # If older DB records do not have stored JSON factors, compute them dynamically from the record's exact data
        if not factors or not recs:
            row_dict = {
                "Project_Type": r.project_type,
                "Land_Area_Acres": r.land_area_acres,
                "Owners": r.owners,
                "Disputes": r.disputes,
                "Objections": r.objections,
                "Pending_Documents": r.pending_documents,
                "Pending_Approvals": r.pending_approvals,
                "Compensation_Pending": r.compensation_pending,
                "Current_Stage": r.current_stage,
                "Days_in_Current_Stage": r.days_in_current_stage,
                "Total_Days": r.total_days,
                "Previous_Delays": r.previous_delays,
                "Land_Record_Complexity": r.land_record_complexity
            }
            row_df = pd.DataFrame([row_dict])
            if not factors:
                factors = calculate_feature_contributions(ml_service.pipeline, row_df, r.risk_score / 100.0)
            if not recs:
                recs = generate_recommendations(row_df, factors, r.risk_level)

        items.append({
            "id": r.id,
            "project_id": r.project_id,
            "project_type": r.project_type,
            "land_area_acres": r.land_area_acres,
            "owners": r.owners,
            "current_stage": r.current_stage,
            "risk_score": r.risk_score,
            "risk_level": r.risk_level,
            "target_delayed": r.target_delayed,
            "predicted_outcome": "DELAYED" if r.target_delayed == 1 else "ON SCHEDULE",
            "state": r.state or "Maharashtra",
            "district": r.district or "Pune",
            "latitude": r.latitude or 18.5204,
            "longitude": r.longitude or 73.8567,
            "disputes": r.disputes,
            "objections": r.objections,
            "pending_documents": r.pending_documents,
            "pending_approvals": r.pending_approvals,
            "compensation_pending": r.compensation_pending,
            "days_in_current_stage": r.days_in_current_stage,
            "total_days": r.total_days,
            "previous_delays": r.previous_delays,
            "land_record_complexity": r.land_record_complexity,
            "risk_factors": factors,
            "recommendations": recs,
            "created_at": r.created_at.isoformat() if r.created_at else None
        })

    return {
        "total": total_count,
        "skip": skip,
        "limit": limit,
        "items": items
    }

@router.get("/{id}", response_model=PredictionResponse)
def get_prediction_detail(id: int, db: Session = Depends(get_db)):
    record = db.query(PredictionRecord).filter(PredictionRecord.id == id).first()
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Prediction record with ID {id} not found."
        )
    
    input_data = {
        "project_type": record.project_type,
        "land_area_acres": record.land_area_acres,
        "owners": record.owners,
        "disputes": record.disputes,
        "objections": record.objections,
        "pending_documents": record.pending_documents,
        "pending_approvals": record.pending_approvals,
        "compensation_pending": record.compensation_pending,
        "current_stage": record.current_stage,
        "days_in_current_stage": record.days_in_current_stage,
        "total_days": record.total_days,
        "previous_delays": record.previous_delays,
        "land_record_complexity": record.land_record_complexity
    }

    return PredictionResponse(
        id=record.id,
        project_id=record.project_id,
        target_delayed=record.target_delayed,
        predicted_outcome="DELAYED" if record.target_delayed == 1 else "ON SCHEDULE",
        risk_score=record.risk_score,
        risk_level=record.risk_level,
        risk_factors=record.risk_factors or [],
        recommendations=record.recommendations or [],
        input_data=input_data,
        created_at=record.created_at
    )

@router.delete("/{id}", status_code=status.HTTP_200_OK)
def delete_prediction(id: int, db: Session = Depends(get_db)):
    record = db.query(PredictionRecord).filter(PredictionRecord.id == id).first()
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Prediction record with ID {id} not found."
        )
    db.delete(record)
    db.commit()
    return {"message": f"Prediction record {id} deleted successfully."}

@router.post("/seed-dataset", status_code=status.HTTP_201_CREATED)
def seed_dataset_predictions(count: int = Query(50, ge=1, le=500), db: Session = Depends(get_db)):
    """
    Seeds a subset of historical dataset cases through the ML pipeline to populate
    prediction history and analytics for presentations or testing.
    """
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    csv_path = os.path.join(base_dir, "ml", "data", "land_acquisition_dataset.csv")
    if not os.path.exists(csv_path):
        raise HTTPException(status_code=404, detail="Dataset CSV not found.")

    df = pd.read_csv(csv_path).head(count)
    inserted_count = 0

    for idx, row in df.iterrows():
        # Check if already seeded by project ID
        existing = db.query(PredictionRecord).filter(PredictionRecord.project_id == row["Project_ID"]).first()
        if existing:
            continue

        case_dict = {
            "project_type": str(row["Project_Type"]),
            "land_area_acres": float(row["Land_Area_Acres"]),
            "owners": int(row["Owners"]),
            "disputes": int(row["Disputes"]),
            "objections": int(row["Objections"]),
            "pending_documents": int(row["Pending_Documents"]),
            "pending_approvals": int(row["Pending_Approvals"]),
            "compensation_pending": int(row["Compensation_Pending"]),
            "current_stage": str(row["Current_Stage"]),
            "days_in_current_stage": int(row["Days_in_Current_Stage"]),
            "total_days": int(row["Total_Days"]),
            "previous_delays": int(row["Previous_Delays"]),
            "land_record_complexity": str(row["Land_Record_Complexity"])
        }

        # Run through ML model
        res = ml_service.predict(case_dict)
        
        # Simulating realistic historical timestamps
        created_time = datetime.utcnow() - timedelta(days=(count - idx) * 2, hours=random.randint(1, 12))

        # Assign Indian state and district coordinates
        loc = INDIAN_LOCATIONS[idx % len(INDIAN_LOCATIONS)]
        # add tiny jitter for distinct GIS map pins
        lat = loc["lat"] + random.uniform(-0.15, 0.15)
        lng = loc["lng"] + random.uniform(-0.15, 0.15)

        record = PredictionRecord(
            project_id=str(row["Project_ID"]),
            project_type=case_dict["project_type"],
            land_area_acres=case_dict["land_area_acres"],
            owners=case_dict["owners"],
            disputes=case_dict["disputes"],
            objections=case_dict["objections"],
            pending_documents=case_dict["pending_documents"],
            pending_approvals=case_dict["pending_approvals"],
            compensation_pending=case_dict["compensation_pending"],
            current_stage=case_dict["current_stage"],
            days_in_current_stage=case_dict["days_in_current_stage"],
            total_days=case_dict["total_days"],
            previous_delays=case_dict["previous_delays"],
            land_record_complexity=case_dict["land_record_complexity"],
            state=loc["state"],
            district=loc["district"],
            latitude=round(lat, 4),
            longitude=round(lng, 4),
            affected_families=int(case_dict["owners"] * 1.3),
            target_delayed=res["target_delayed"],
            risk_score=res["risk_score"],
            risk_level=res["risk_level"],
            risk_factors=res["risk_factors"],
            recommendations=res["recommendations"],
            created_at=created_time
        )
        db.add(record)
        
        # Also seed early warning alerts for High Risk cases
        if res["risk_level"] == "HIGH" or case_dict["days_in_current_stage"] > 40:
            target_role = "District Collector" if case_dict["disputes"] > 0 else "SLAO (Land Acquiring Authority)"
            alert = AlertRecord(
                project_id=str(row["Project_ID"]),
                alert_type="HIGH_RISK" if res["risk_level"] == "HIGH" else "STAGE_BREACH",
                severity="HIGH" if res["risk_score"] >= 75 else "MEDIUM",
                title=f"Critical Delay Warning: {row['Project_ID']} ({case_dict['project_type']} in {loc['district']}, {loc['state']})",
                message=f"Project {row['Project_ID']} identified with {res['risk_score']}% delay probability during {case_dict['current_stage']} phase ({case_dict['days_in_current_stage']} days in stage, {case_dict['disputes']} disputes).",
                target_role=target_role,
                status="ACTIVE",
                notified_channels=["SMS", "EMAIL", "IN_APP"],
                created_at=created_time
            )
            db.add(alert)
        
        inserted_count += 1

    db.commit()
    return {"message": f"Successfully processed and seeded {inserted_count} cases."}

@router.delete("/clear/all", status_code=status.HTTP_200_OK)
def clear_all_predictions(db: Session = Depends(get_db)):
    deleted = db.query(PredictionRecord).delete()
    db.commit()
    return {"message": f"Cleared all {deleted} prediction records."}
