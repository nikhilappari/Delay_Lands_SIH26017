import random
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.database.db import get_db
from backend.database.models import PredictionRecord, AlertRecord, AuditLog, User
from backend.schemas.prediction import PredictionRequest, PredictionResponse
from backend.services.ml_service import ml_service
from backend.auth.dependencies import get_current_user

router = APIRouter(prefix="/api", tags=["Prediction"])

INDIAN_LOCATIONS = [
    {"state": "Maharashtra", "district": "Pune", "lat": 18.5204, "lng": 73.8567},
    {"state": "Uttar Pradesh", "district": "Lucknow", "lat": 26.8467, "lng": 80.9462},
    {"state": "Gujarat", "district": "Ahmedabad", "lat": 23.0225, "lng": 72.5714},
    {"state": "Karnataka", "district": "Bengaluru", "lat": 12.9716, "lng": 77.5946},
    {"state": "Tamil Nadu", "district": "Chennai", "lat": 13.0827, "lng": 80.2707},
    {"state": "Andhra Pradesh", "district": "Visakhapatnam", "lat": 17.6868, "lng": 83.2185},
    {"state": "Rajasthan", "district": "Jaipur", "lat": 26.9124, "lng": 75.7873},
    {"state": "Telangana", "district": "Hyderabad", "lat": 17.3850, "lng": 78.4867},
    {"state": "Odisha", "district": "Bhubaneswar", "lat": 20.2961, "lng": 85.8245},
    {"state": "Madhya Pradesh", "district": "Bhopal", "lat": 23.2599, "lng": 77.4126},
    {"state": "West Bengal", "district": "Kolkata", "lat": 22.5726, "lng": 88.3639},
    {"state": "Bihar", "district": "Patna", "lat": 25.5941, "lng": 85.1376},
    {"state": "Kerala", "district": "Kochi", "lat": 9.9312, "lng": 76.2673},
    {"state": "Punjab", "district": "Ludhiana", "lat": 30.9010, "lng": 75.8573},
    {"state": "Haryana", "district": "Gurugram", "lat": 28.4595, "lng": 77.0266}
]

def generate_project_id(db: Session) -> str:
    count = db.query(func.count(PredictionRecord.id)).scalar() or 0
    next_num = 1001 + count
    return f"P{next_num:04d}"

@router.post("/predict", response_model=PredictionResponse, status_code=status.HTTP_201_CREATED)
def predict_land_acquisition_delay(
    payload: PredictionRequest,
    db: Session = Depends(get_db)
):
    """
    Accepts new land acquisition case details, runs inference on the trained
    Random Forest pipeline, computes risk score, level, explainability factors,
    generates automated early warnings / alerts, and persists to SQLite database.
    """
    try:
        input_dict = payload.model_dump()
        
        # ML Inference
        prediction_result = ml_service.predict(input_dict)
        
        # Geolocation Assignment
        state = payload.state
        district = payload.district
        lat = payload.latitude
        lng = payload.longitude
        
        if not state or not district:
            loc = random.choice(INDIAN_LOCATIONS)
            state = loc["state"]
            district = loc["district"]
            lat = loc["lat"]
            lng = loc["lng"]
            
        # Generate new Project ID
        project_id = generate_project_id(db)
        
        # Persist Prediction Record
        db_record = PredictionRecord(
            project_id=project_id,
            project_type=payload.project_type,
            land_area_acres=payload.land_area_acres,
            owners=payload.owners,
            disputes=payload.disputes,
            objections=payload.objections,
            pending_documents=payload.pending_documents,
            pending_approvals=payload.pending_approvals,
            compensation_pending=payload.compensation_pending,
            current_stage=payload.current_stage,
            days_in_current_stage=payload.days_in_current_stage,
            total_days=payload.total_days,
            previous_delays=payload.previous_delays,
            land_record_complexity=payload.land_record_complexity,
            state=state,
            district=district,
            latitude=lat,
            longitude=lng,
            affected_families=payload.affected_families or int(payload.owners * 1.2),
            target_delayed=prediction_result["target_delayed"],
            risk_score=prediction_result["risk_score"],
            risk_level=prediction_result["risk_level"],
            risk_factors=prediction_result["risk_factors"],
            recommendations=prediction_result["recommendations"],
            created_at=datetime.utcnow()
        )
        
        db.add(db_record)
        
        # Automated Early Warning & Alert Generation
        if prediction_result["risk_level"] == "HIGH" or payload.days_in_current_stage > 45 or payload.disputes >= 3:
            alert_type = "HIGH_RISK" if prediction_result["risk_level"] == "HIGH" else "STAGE_BREACH"
            severity = "HIGH" if prediction_result["risk_score"] >= 75 else "MEDIUM"
            target_role = "District Collector" if payload.disputes > 0 else "SLAO (Land Acquiring Authority)"
            
            alert = AlertRecord(
                project_id=project_id,
                alert_type=alert_type,
                severity=severity,
                title=f"Delay Risk Warning: {project_id} ({payload.project_type} in {district}, {state})",
                message=f"Project {project_id} flagged with {prediction_result['risk_score']}% delay probability at {payload.current_stage} stage ({payload.days_in_current_stage} days elapsed, {payload.disputes} disputes).",
                target_role=target_role,
                status="ACTIVE",
                notified_channels=["SMS", "EMAIL", "IN_APP"],
                created_at=datetime.utcnow()
            )
            db.add(alert)
        
        # Audit Log
        audit = AuditLog(
            action="PREDICTION_EVALUATED",
            actor_role="Project Evaluation Officer",
            details={
                "project_id": project_id,
                "project_type": payload.project_type,
                "risk_score": prediction_result["risk_score"],
                "risk_level": prediction_result["risk_level"],
                "state": state,
                "district": district
            },
            timestamp=datetime.utcnow()
        )
        db.add(audit)
        
        db.commit()
        db.refresh(db_record)
        
        return PredictionResponse(
            id=db_record.id,
            project_id=project_id,
            target_delayed=prediction_result["target_delayed"],
            predicted_outcome=prediction_result["predicted_outcome"],
            risk_score=prediction_result["risk_score"],
            risk_level=prediction_result["risk_level"],
            risk_factors=prediction_result["risk_factors"],
            recommendations=prediction_result["recommendations"],
            input_data=prediction_result["input_data"],
            state=db_record.state,
            district=db_record.district,
            latitude=db_record.latitude,
            longitude=db_record.longitude,
            created_at=db_record.created_at
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while evaluating prediction: {str(e)}"
        )
