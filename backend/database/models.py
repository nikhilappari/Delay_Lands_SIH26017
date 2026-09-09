from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Text, JSON, Boolean
from .db import Base

class PredictionRecord(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    project_id = Column(String(50), index=True, nullable=False)
    project_type = Column(String(50), nullable=False)
    land_area_acres = Column(Float, nullable=False)
    owners = Column(Integer, nullable=False)
    disputes = Column(Integer, nullable=False)
    objections = Column(Integer, nullable=False)
    pending_documents = Column(Integer, nullable=False)
    pending_approvals = Column(Integer, nullable=False)
    compensation_pending = Column(Integer, nullable=False)
    current_stage = Column(String(50), nullable=False)
    days_in_current_stage = Column(Integer, nullable=False)
    total_days = Column(Integer, nullable=False)
    previous_delays = Column(Integer, nullable=False)
    land_record_complexity = Column(String(50), nullable=False)
    
    # Spatial & Demographics (GIS Map & State/District analytics)
    state = Column(String(100), nullable=True, default="Maharashtra")
    district = Column(String(100), nullable=True, default="Pune")
    latitude = Column(Float, nullable=True, default=18.5204)
    longitude = Column(Float, nullable=True, default=73.8567)
    affected_families = Column(Integer, nullable=True, default=0)
    
    # Prediction Results
    target_delayed = Column(Integer, nullable=False)  # 0 or 1
    risk_score = Column(Float, nullable=False)       # 0.0 - 100.0%
    risk_level = Column(String(20), nullable=False)   # LOW, MEDIUM, HIGH
    
    # Explainability & Recommendations
    risk_factors = Column(JSON, nullable=True)        # List of risk factor objects
    recommendations = Column(JSON, nullable=True)     # List of suggested actions
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

class AlertRecord(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    project_id = Column(String(50), index=True, nullable=False)
    alert_type = Column(String(50), nullable=False)  # CRITICAL_BOTTLENECK, STAGE_BREACH, DISPUTE_SPIKE, HIGH_RISK
    severity = Column(String(20), nullable=False)    # HIGH, MEDIUM, LOW
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    target_role = Column(String(100), nullable=False) # District Collector, SLAO, Project Director, Ministry
    status = Column(String(20), default="ACTIVE")    # ACTIVE, ACKNOWLEDGED, RESOLVED
    notified_channels = Column(JSON, nullable=True)  # ["SMS", "EMAIL", "IN_APP"]
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    acknowledged_at = Column(DateTime, nullable=True)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    fullName = Column(String(100), nullable=False)
    employeeId = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(120), unique=True, index=True, nullable=False)
    department = Column(String(100), nullable=False)
    designation = Column(String(100), nullable=False)
    passwordHash = Column(String(255), nullable=False)
    role = Column(String(20), default="OFFICER", nullable=False)  # OFFICER, ADMIN
    status = Column(String(20), default="PENDING", nullable=False) # PENDING, ACTIVE, DISABLED
    createdAt = Column(DateTime, default=datetime.utcnow, nullable=False)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    lastLogin = Column(DateTime, nullable=True)
    resetToken = Column(String(255), nullable=True)
    resetTokenExpiry = Column(DateTime, nullable=True)

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, nullable=True, index=True)
    actor_email = Column(String(120), nullable=True)
    actor_name = Column(String(100), nullable=True)
    actor_role = Column(String(100), nullable=False, default="System")
    action = Column(String(100), nullable=False) # LOGIN, LOGOUT, FAILED_LOGIN, REGISTER, USER_ACTIVATED, USER_DISABLED, ROLE_CHANGED, PREDICTION_RUN, etc.
    resource = Column(String(100), nullable=True)
    details = Column(JSON, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
