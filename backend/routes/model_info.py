from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from backend.schemas.prediction import ModelInfo
from backend.services.ml_service import ml_service

router = APIRouter(prefix="/api/model-info", tags=["Model Governance & Info"])

class UpdateThresholdsRequest(BaseModel):
    low_max: float = Field(..., gt=0, lt=100, description="Upper boundary percentage for LOW risk")
    medium_max: float = Field(..., gt=0, lt=100, description="Upper boundary percentage for MEDIUM risk")

@router.get("", response_model=ModelInfo)
def get_model_information():
    """
    Returns complete model architecture metadata, evaluation metrics,
    feature importance scores, and configuration thresholds.
    """
    metadata = ml_service.get_metadata()
    if not metadata:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Model metadata is currently unavailable."
        )
    return ModelInfo(**metadata)

@router.post("/thresholds", status_code=status.HTTP_200_OK)
def update_risk_thresholds(payload: UpdateThresholdsRequest):
    """
    Updates the low/medium risk classification thresholds dynamically.
    """
    if payload.low_max >= payload.medium_max:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="low_max threshold must be strictly less than medium_max threshold."
        )
    
    metadata = ml_service.get_metadata()
    metadata["thresholds"] = {
        "low_max": payload.low_max,
        "medium_max": payload.medium_max
    }
    return {
        "message": "Risk thresholds updated successfully.",
        "thresholds": metadata["thresholds"]
    }
