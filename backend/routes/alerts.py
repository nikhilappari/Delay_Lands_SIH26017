import uuid
from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from pydantic import BaseModel

from backend.database.db import get_db
from backend.database.models import AlertRecord, AuditLog, PredictionRecord

router = APIRouter(prefix="/api", tags=["Alerts & Escalations"])

class DispatchRequest(BaseModel):
    channel: str = "ALL"  # "SMS", "EMAIL", "IN_APP", "SMS + Email", "ALL"
    recipient_role: Optional[str] = None
    recipient_email: Optional[str] = None
    recipient_phone: Optional[str] = None
    priority: Optional[str] = "HIGH"
    custom_note: Optional[str] = None
    notes: Optional[str] = None

@router.get("/alerts")
def get_alerts(
    status_filter: Optional[str] = Query(None, alias="status"),
    severity: Optional[str] = None,
    role: Optional[str] = None,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """
    Returns automated early warning alerts filtered by status, severity, or stakeholder role.
    """
    query = db.query(AlertRecord)
    if status_filter and status_filter.upper() != "ALL":
        query = query.filter(AlertRecord.status == status_filter.upper())
    if severity and severity.upper() != "ALL":
        query = query.filter(AlertRecord.severity == severity.upper())
    if role and role.upper() != "ALL":
        query = query.filter(AlertRecord.target_role.ilike(f"%{role}%"))
    
    alerts = query.order_by(desc(AlertRecord.created_at)).limit(limit).all()
    
    return [
        {
            "id": a.id,
            "project_id": a.project_id,
            "alert_type": a.alert_type,
            "severity": a.severity,
            "title": a.title,
            "message": a.message,
            "target_role": a.target_role,
            "status": a.status,
            "notified_channels": a.notified_channels or ["IN_APP"],
            "created_at": a.created_at.isoformat(),
            "acknowledged_at": a.acknowledged_at.isoformat() if a.acknowledged_at else None
        }
        for a in alerts
    ]

@router.post("/alerts/{alert_id}/acknowledge")
def acknowledge_alert(
    alert_id: int,
    db: Session = Depends(get_db)
):
    alert = db.query(AlertRecord).filter(AlertRecord.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    alert.status = "ACKNOWLEDGED"
    alert.acknowledged_at = datetime.utcnow()
    
    audit = AuditLog(
        action="ALERT_ACKNOWLEDGED",
        actor_role=alert.target_role,
        details={"alert_id": alert_id, "project_id": alert.project_id},
        timestamp=datetime.utcnow()
    )
    db.add(audit)
    db.commit()
    
    return {"message": "Alert acknowledged successfully", "id": alert_id, "status": "ACKNOWLEDGED"}

@router.post("/alerts/{alert_id}/dispatch")
def dispatch_notification(
    alert_id: int,
    payload: DispatchRequest,
    db: Session = Depends(get_db)
):
    alert = db.query(AlertRecord).filter(AlertRecord.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    # SMS / Email Gateway Dispatch Simulator
    dispatch_id = f"GW-{uuid.uuid4().hex[:8].upper()}"
    ch = (payload.channel or "ALL").upper()
    channels_used = []
    if "SMS" in ch or ch == "ALL":
        channels_used.append("SMS")
    if "EMAIL" in ch or "MAIL" in ch or ch == "ALL":
        channels_used.append("EMAIL")
    if not channels_used:
        channels_used = [payload.channel or "IN_APP"]
    
    alert.notified_channels = list(set((alert.notified_channels or []) + channels_used))
    
    target_email = payload.recipient_email or f"{alert.target_role.lower().replace(' ', '.').replace('/', '.')[:15]}@nic.in"
    target_phone = payload.recipient_phone or "+91 98765 43210"

    delivery_receipts = []
    if "SMS" in channels_used:
        delivery_receipts.append(f"SMS dispatched to {target_phone} via CDAC National Gateway (Delivered)")
    if "EMAIL" in channels_used:
        delivery_receipts.append(f"Official Notice dispatched to {target_email} via NIC Relay Gateway (Delivered)")

    note_content = payload.notes or payload.custom_note or "Automated operational escalation notice."

    audit = AuditLog(
        action="NOTIFICATION_DISPATCHED",
        actor_role=payload.recipient_role or alert.target_role,
        details={
            "dispatch_id": dispatch_id,
            "alert_id": alert_id,
            "project_id": alert.project_id,
            "channels": channels_used,
            "recipient_email": target_email,
            "recipient_phone": target_phone,
            "priority": payload.priority or "HIGH",
            "custom_note": note_content
        },
        timestamp=datetime.utcnow()
    )
    db.add(audit)
    db.commit()
    
    return {
        "status": "DISPATCHED",
        "dispatch_id": dispatch_id,
        "recipient_role": alert.target_role,
        "recipient_email": target_email,
        "recipient_phone": target_phone,
        "channels": channels_used,
        "timestamp": datetime.utcnow().isoformat(),
        "delivery_confirmation": " • ".join(delivery_receipts),
        "receipts": delivery_receipts
    }

@router.get("/audit-logs")
def get_audit_logs(
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """
    Returns immutable audit trails for multi-stakeholder governance.
    """
    logs = db.query(AuditLog).order_by(desc(AuditLog.timestamp)).limit(limit).all()
    return [
        {
            "id": log.id,
            "action": log.action,
            "actor_role": log.actor_role,
            "details": log.details,
            "timestamp": log.timestamp.isoformat()
        }
        for log in logs
    ]
