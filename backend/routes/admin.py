from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc

from backend.database.db import get_db
from backend.database.models import User, AuditLog
from backend.schemas.auth import (
    UserResponse,
    UserStatusUpdateRequest,
    UserRoleUpdateRequest,
    AuditLogResponse
)
from backend.auth.dependencies import require_admin

router = APIRouter(prefix="/api/admin", tags=["Administrator"])

@router.get("/users", response_model=dict)
def list_all_users(
    search: Optional[str] = Query(None, description="Search by name, email, employee ID, or department"),
    role: Optional[str] = Query(None, description="Filter by role: OFFICER, ADMIN"),
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status: ACTIVE, PENDING, DISABLED"),
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Returns the registry of all platform users with filtering and search capabilities.
    Restricted strictly to administrators.
    """
    query = db.query(User)

    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                User.fullName.ilike(term),
                User.email.ilike(term),
                User.employeeId.ilike(term),
                User.department.ilike(term),
                User.designation.ilike(term)
            )
        )

    if role and role.upper() in ["OFFICER", "ADMIN"]:
        query = query.filter(User.role == role.upper())

    if status_filter and status_filter.upper() in ["ACTIVE", "PENDING", "DISABLED"]:
        query = query.filter(User.status == status_filter.upper())

    total = query.count()
    users = query.order_by(desc(User.createdAt)).all()

    # Summary counts for admin KPI badges
    pending_count = db.query(User).filter(User.status == "PENDING").count()
    active_count = db.query(User).filter(User.status == "ACTIVE").count()
    disabled_count = db.query(User).filter(User.status == "DISABLED").count()

    return {
        "total": total,
        "pendingCount": pending_count,
        "activeCount": active_count,
        "disabledCount": disabled_count,
        "users": [UserResponse.from_orm(u) for u in users]
    }

@router.get("/users/{user_id}", response_model=dict)
def get_user_detail(
    user_id: int,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Retrieves full user details along with their recent security and activity audit logs."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} not found."
        )

    user_logs = db.query(AuditLog).filter(
        or_(
            AuditLog.user_id == user_id,
            AuditLog.actor_email == user.email,
            AuditLog.resource == f"User:{user_id}"
        )
    ).order_by(desc(AuditLog.timestamp)).limit(20).all()

    return {
        "user": UserResponse.from_orm(user),
        "recentLogs": [AuditLogResponse.from_orm(log) for log in user_logs]
    }

@router.patch("/users/{user_id}/status", response_model=UserResponse)
def update_user_status(
    user_id: int,
    payload: UserStatusUpdateRequest,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Activates, disables, or sets pending state for an officer account.
    Prevents an administrator from disabling their own active account.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} not found."
        )

    if user.id == current_admin.id and payload.status != "ACTIVE":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot disable or suspend your own administrator account."
        )

    old_status = user.status
    user.status = payload.status
    user.updatedAt = datetime.utcnow()

    # Log action in audit trail
    audit = AuditLog(
        user_id=current_admin.id,
        actor_email=current_admin.email,
        actor_name=current_admin.fullName,
        actor_role="ADMIN",
        action=f"USER_STATUS_{payload.status}",
        resource=f"User:{user.id}",
        details={
            "target_user_id": user.id,
            "target_user_email": user.email,
            "old_status": old_status,
            "new_status": payload.status
        },
        timestamp=datetime.utcnow()
    )
    db.add(audit)
    db.commit()
    db.refresh(user)

    return UserResponse.from_orm(user)

@router.patch("/users/{user_id}/role", response_model=UserResponse)
def update_user_role(
    user_id: int,
    payload: UserRoleUpdateRequest,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Promotes an Officer to Admin or demotes an Admin to Officer.
    Prevents an administrator from removing their own admin role.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} not found."
        )

    if user.id == current_admin.id and payload.role != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot revoke your own administrator privileges."
        )

    old_role = user.role
    user.role = payload.role
    user.updatedAt = datetime.utcnow()

    audit = AuditLog(
        user_id=current_admin.id,
        actor_email=current_admin.email,
        actor_name=current_admin.fullName,
        actor_role="ADMIN",
        action="USER_ROLE_CHANGED",
        resource=f"User:{user.id}",
        details={
            "target_user_id": user.id,
            "target_user_email": user.email,
            "old_role": old_role,
            "new_role": payload.role
        },
        timestamp=datetime.utcnow()
    )
    db.add(audit)
    db.commit()
    db.refresh(user)

    return UserResponse.from_orm(user)

@router.get("/audit-logs", response_model=dict)
def get_security_audit_logs(
    limit: int = Query(50, ge=1, le=500),
    action_filter: Optional[str] = Query(None, alias="action"),
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Returns the comprehensive governance and security audit log.
    Includes login attempts, user approvals, role changes, and data queries.
    """
    query = db.query(AuditLog)
    if action_filter and action_filter.strip():
        query = query.filter(AuditLog.action.ilike(f"%{action_filter.strip()}%"))

    total = query.count()
    logs = query.order_by(desc(AuditLog.timestamp)).limit(limit).all()

    return {
        "total": total,
        "logs": [AuditLogResponse.from_orm(log) for log in logs]
    }

@router.delete("/users/{user_id}", status_code=status.HTTP_200_OK)
def delete_user(
    user_id: int,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Permanently removes a user record from the database."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} not found."
        )

    if user.id == current_admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot delete your own active administrator account."
        )

    audit = AuditLog(
        user_id=current_admin.id,
        actor_email=current_admin.email,
        actor_name=current_admin.fullName,
        actor_role="ADMIN",
        action="USER_DELETED",
        resource=f"User:{user.id}",
        details={"deleted_email": user.email, "deleted_empId": user.employeeId, "deleted_name": user.fullName},
        timestamp=datetime.utcnow()
    )
    db.add(audit)
    db.delete(user)
    db.commit()

    return {"message": f"User account {user_id} successfully deleted."}
