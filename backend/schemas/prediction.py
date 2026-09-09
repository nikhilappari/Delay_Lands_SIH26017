from datetime import datetime
from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field, field_validator

class PredictionRequest(BaseModel):
    project_type: str = Field(..., description="Project type (Highway, Railway, Dam, Airport, Industrial)")
    land_area_acres: float = Field(..., gt=0, description="Total land area in acres (must be > 0)")
    owners: int = Field(..., gt=0, description="Total number of landowners (must be > 0)")
    disputes: int = Field(..., ge=0, description="Number of active legal/boundary disputes (>= 0)")
    objections: int = Field(..., ge=0, description="Number of filed objections (>= 0)")
    pending_documents: int = Field(..., ge=0, description="Number of pending title/verification documents (>= 0)")
    pending_approvals: int = Field(..., ge=0, description="Number of pending regulatory/inter-departmental approvals (>= 0)")
    compensation_pending: int = Field(..., ge=0, description="Number of pending compensation disbursements (>= 0)")
    current_stage: str = Field(..., description="Current stage (Notification, Objection, Verification, Valuation, Approval, Compensation)")
    days_in_current_stage: int = Field(..., ge=0, description="Days elapsed in the current acquisition stage (>= 0)")
    total_days: int = Field(..., ge=0, description="Total days since project initiation (>= 0)")
    previous_delays: int = Field(..., ge=0, description="Count of past stage deadline breaches (>= 0)")
    land_record_complexity: str = Field(..., description="Complexity of land records (Low, Medium, High)")
    state: Optional[str] = Field("Maharashtra", description="Indian State (e.g. Maharashtra, Uttar Pradesh, Gujarat, Karnataka)")
    district: Optional[str] = Field("Pune", description="District name (e.g. Pune, Lucknow, Ahmedabad, Bengaluru)")
    latitude: Optional[float] = Field(18.5204, description="GIS Latitude")
    longitude: Optional[float] = Field(73.8567, description="GIS Longitude")
    affected_families: Optional[int] = Field(0, ge=0, description="Number of Project Affected Families (PAFs)")

    @field_validator("owners", "disputes", "objections", "pending_documents", "pending_approvals", "compensation_pending", "days_in_current_stage", "total_days", "previous_delays", "affected_families", mode="before")
    @classmethod
    def coerce_to_int(cls, v: Any) -> int:
        if v is None:
            return 0
        try:
            return int(float(v))
        except (ValueError, TypeError):
            return 0

    @field_validator("project_type")
    @classmethod
    def validate_project_type(cls, v: str) -> str:
        valid = ["Highway", "Railway", "Dam", "Airport", "Industrial"]
        matched = [x for x in valid if x.lower() == v.lower().strip()]
        if not matched:
            raise ValueError(f"Invalid project_type '{v}'. Must be one of: {', '.join(valid)}")
        return matched[0]

    @field_validator("current_stage")
    @classmethod
    def validate_current_stage(cls, v: str) -> str:
        valid = ["Notification", "Objection", "Verification", "Valuation", "Approval", "Compensation"]
        if not v:
            return "Notification"
        v_clean = v.strip()
        # Direct case-insensitive match
        for item in valid:
            if item.lower() == v_clean.lower():
                return item
        # Substring / RFCTLARR 2013 section name mapping
        v_low = v_clean.lower()
        if "notif" in v_low or "section 11" in v_low:
            return "Notification"
        if "object" in v_low or "section 15" in v_low or "hearing" in v_low:
            return "Objection"
        if "verif" in v_low or "record" in v_low or "sia" in v_low or "survey" in v_low:
            return "Verification"
        if "valua" in v_low or "price" in v_low or "section 26" in v_low:
            return "Valuation"
        if "approv" in v_low or "section 19" in v_low or "declaration" in v_low:
            return "Approval"
        if "compens" in v_low or "award" in v_low or "disburs" in v_low or "section 30" in v_low:
            return "Compensation"
        
        raise ValueError(f"Invalid current_stage '{v}'. Must be one of: {', '.join(valid)}")

    @field_validator("land_record_complexity")
    @classmethod
    def validate_land_record_complexity(cls, v: str) -> str:
        valid = ["Low", "Medium", "High"]
        matched = [x for x in valid if x.lower() == v.lower().strip()]
        if not matched:
            raise ValueError(f"Invalid land_record_complexity '{v}'. Must be one of: {', '.join(valid)}")
        return matched[0]

class RiskFactor(BaseModel):
    feature: str
    display_name: str
    value: Any
    impact: str  # "High Impact", "Medium Impact", "Low Impact"
    impact_level: str # "HIGH", "MEDIUM", "LOW"
    score: float # Attribution score
    direction: str # "INCREASES_RISK", "REDUCES_RISK"
    description: str

class SuggestedAction(BaseModel):
    priority: str # "HIGH", "MEDIUM", "LOW"
    title: str
    action: str
    category: str # "Legal", "Documentation", "Process", "Financial", "Governance"

class PredictionResponse(BaseModel):
    id: Optional[int] = None
    project_id: str
    target_delayed: int
    predicted_outcome: str  # "DELAYED" or "ON SCHEDULE"
    risk_score: float       # 0.0 - 100.0%
    risk_level: str         # "LOW", "MEDIUM", "HIGH"
    risk_factors: List[RiskFactor]
    recommendations: List[SuggestedAction]
    input_data: Dict[str, Any]
    state: Optional[str] = "Maharashtra"
    district: Optional[str] = "Pune"
    latitude: Optional[float] = 18.5204
    longitude: Optional[float] = 73.8567
    created_at: Optional[datetime] = None

class PredictionListItem(BaseModel):
    id: int
    project_id: str
    project_type: str
    land_area_acres: float
    owners: int
    current_stage: str
    risk_score: float
    risk_level: str
    target_delayed: int
    predicted_outcome: str
    state: Optional[str] = "Maharashtra"
    district: Optional[str] = "Pune"
    latitude: Optional[float] = 18.5204
    longitude: Optional[float] = 73.8567
    created_at: datetime

    class Config:
        from_attributes = True

class AnalyticsData(BaseModel):
    total_cases: int
    high_risk_cases: int
    medium_risk_cases: int
    low_risk_cases: int
    delayed_cases: int
    non_delayed_cases: int
    avg_risk_score: float
    risk_distribution: List[Dict[str, Any]]
    outcome_distribution: List[Dict[str, Any]]
    project_type_risk: List[Dict[str, Any]]
    stage_risk: List[Dict[str, Any]]
    complexity_risk: List[Dict[str, Any]]
    state_distribution: Optional[List[Dict[str, Any]]] = None
    district_distribution: Optional[List[Dict[str, Any]]] = None

class ModelInfo(BaseModel):
    model_config = {"protected_namespaces": ()}

    model_name: str
    algorithm: str
    n_estimators: int
    class_weight: str
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    train_samples: int
    test_samples: int
    confusion_matrix: List[List[int]]
    feature_importance: List[Dict[str, Any]]
    categorical_options: Dict[str, List[str]]
    thresholds: Dict[str, float]
    version: Optional[str] = "v1.0"
    last_trained: Optional[str] = None
