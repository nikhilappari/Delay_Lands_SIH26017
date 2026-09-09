from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from sqlalchemy import or_

from backend.database.db import get_db
from backend.database.models import User, AuditLog
from backend.schemas.auth import (
    UserRegisterRequest,
    UserLoginRequest,
    UserResponse,
    TokenResponse,
    ProfileUpdateRequest,
    ChangePasswordRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest
)
from backend.services.auth_service import (
    hash_password,
    verify_password,
    create_access_token,
    generate_reset_token,
    check_login_rate_limit,
    record_failed_login,
    clear_failed_logins
)
from backend.auth.dependencies import get_current_user

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/register", status_code=status.HTTP_201_CREATED)
def register_officer(payload: UserRegisterRequest, db: Session = Depends(get_db)):
    """
    Registers a new Government Officer.
    Account is created in PENDING status awaiting administrator approval.
    """
    if payload.password != payload.confirmPassword:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password and Confirm Password do not match."
        )

    # Check for duplicate email
    existing_email = db.query(User).filter(User.email.ilike(payload.email.strip())).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this official email is already registered."
        )

    # Check for duplicate Employee ID
    existing_emp = db.query(User).filter(User.employeeId.ilike(payload.employeeId.strip())).first()
    if existing_emp:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this Employee ID is already registered."
        )

    # Create new officer user in PENDING status
    new_user = User(
        fullName=payload.fullName.strip(),
        employeeId=payload.employeeId.strip(),
        email=payload.email.strip().lower(),
        department=payload.department.strip(),
        designation=payload.designation.strip(),
        passwordHash=hash_password(payload.password),
        role="OFFICER",      # Forced to OFFICER (cannot self-register as ADMIN)
        status="PENDING",    # New registrations must be reviewed and activated by an Administrator
        createdAt=datetime.utcnow(),
        updatedAt=datetime.utcnow()
    )

    db.add(new_user)
    db.flush()

    # Log registration audit
    audit = AuditLog(
        user_id=new_user.id,
        actor_email=new_user.email,
        actor_name=new_user.fullName,
        actor_role="OFFICER",
        action="USER_REGISTERED",
        resource=f"User:{new_user.id}",
        details={
            "employeeId": new_user.employeeId,
            "department": new_user.department,
            "designation": new_user.designation,
            "status": "PENDING"
        },
        timestamp=datetime.utcnow()
    )
    db.add(audit)
    db.commit()
    db.refresh(new_user)

    return {
        "message": "Account created successfully. Your account is currently pending administrator approval before you can log in.",
        "user": UserResponse.from_orm(new_user)
    }

@router.post("/login", response_model=TokenResponse)
def login_user(payload: UserLoginRequest, request: Request, db: Session = Depends(get_db)):
    """
    Authenticates a user by official Email or Employee ID and password.
    Enforces rate-limiting against brute-force attacks and checks account status.
    """
    username = payload.username.strip()
    rate_key = f"{username}_{request.client.host if request.client else 'local'}"

    # Rate limiting check
    is_locked, retry_after = check_login_rate_limit(rate_key)
    if is_locked:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Too many failed login attempts. For security reasons, please try again in {retry_after} seconds."
        )

    # Find user by Email or Employee ID
    user = db.query(User).filter(
        or_(
            User.email.ilike(username),
            User.employeeId.ilike(username)
        )
    ).first()

    if not user or not verify_password(payload.password, user.passwordHash):
        record_failed_login(rate_key)
        # Log failed attempt
        audit = AuditLog(
            user_id=user.id if user else None,
            actor_email=username,
            actor_name="Unknown",
            actor_role="Anonymous",
            action="FAILED_LOGIN",
            resource="Auth",
            details={"attempted_username": username, "ip": request.client.host if request.client else "unknown"},
            timestamp=datetime.utcnow()
        )
        db.add(audit)
        db.commit()

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email/Employee ID or password."
        )

    # Check account status
    if user.status == "DISABLED":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been disabled. Please contact the administrator."
        )

    if user.status == "PENDING":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account is awaiting administrator approval."
        )

    # Login successful: clear failed counter
    clear_failed_logins(rate_key)

    # Update last login timestamp
    user.lastLogin = datetime.utcnow()
    user.updatedAt = datetime.utcnow()

    # Generate JWT
    expires_delta = timedelta(days=7) if payload.rememberMe else timedelta(hours=24)
    token_str, expires_in = create_access_token(
        data={
            "sub": user.email,
            "user_id": user.id,
            "role": user.role,
            "employeeId": user.employeeId,
            "fullName": user.fullName
        },
        expires_delta=expires_delta
    )

    # Log successful login audit
    audit = AuditLog(
        user_id=user.id,
        actor_email=user.email,
        actor_name=user.fullName,
        actor_role=user.role,
        action="LOGIN",
        resource="Auth",
        details={"ip": request.client.host if request.client else "unknown", "rememberMe": payload.rememberMe},
        timestamp=datetime.utcnow()
    )
    db.add(audit)
    db.commit()
    db.refresh(user)

    return TokenResponse(
        access_token=token_str,
        token_type="Bearer",
        expires_in=expires_in,
        user=UserResponse.from_orm(user)
    )

@router.get("/me", response_model=UserResponse)
def get_current_authenticated_user(current_user: User = Depends(get_current_user)):
    """Fetches the profile of the currently logged-in user."""
    return UserResponse.from_orm(current_user)

@router.put("/profile", response_model=UserResponse)
def update_profile(
    payload: ProfileUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Allows an authenticated user to update their name, department, or designation."""
    updated = False
    if payload.fullName and payload.fullName.strip():
        current_user.fullName = payload.fullName.strip()
        updated = True
    if payload.department and payload.department.strip():
        current_user.department = payload.department.strip()
        updated = True
    if payload.designation and payload.designation.strip():
        current_user.designation = payload.designation.strip()
        updated = True

    if updated:
        current_user.updatedAt = datetime.utcnow()
        audit = AuditLog(
            user_id=current_user.id,
            actor_email=current_user.email,
            actor_name=current_user.fullName,
            actor_role=current_user.role,
            action="PROFILE_UPDATED",
            resource=f"User:{current_user.id}",
            details={"fullName": current_user.fullName, "department": current_user.department, "designation": current_user.designation},
            timestamp=datetime.utcnow()
        )
        db.add(audit)
        db.commit()
        db.refresh(current_user)

    return UserResponse.from_orm(current_user)

@router.put("/change-password")
def change_password(
    payload: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Allows an authenticated user to change their account password."""
    if not verify_password(payload.currentPassword, current_user.passwordHash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect."
        )

    if payload.newPassword != payload.confirmNewPassword:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New Password and Confirm New Password do not match."
        )

    if verify_password(payload.newPassword, current_user.passwordHash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password cannot be identical to your current password."
        )

    current_user.passwordHash = hash_password(payload.newPassword)
    current_user.updatedAt = datetime.utcnow()

    audit = AuditLog(
        user_id=current_user.id,
        actor_email=current_user.email,
        actor_name=current_user.fullName,
        actor_role=current_user.role,
        action="PASSWORD_CHANGED",
        resource=f"User:{current_user.id}",
        details={},
        timestamp=datetime.utcnow()
    )
    db.add(audit)
    db.commit()

    return {"message": "Password updated successfully. Please use your new password on next login."}

@router.post("/forgot-password")
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """
    Generates a secure password reset token for the specified account email.
    In production, this triggers an official email service.
    """
    user = db.query(User).filter(User.email.ilike(payload.email.strip())).first()
    if not user:
        # Prevent user enumeration by returning standard message
        return {
            "message": "If an account with this official email exists, a password reset token has been generated."
        }

    token = generate_reset_token()
    user.resetToken = token
    user.resetTokenExpiry = datetime.utcnow() + timedelta(hours=1)
    user.updatedAt = datetime.utcnow()

    audit = AuditLog(
        user_id=user.id,
        actor_email=user.email,
        actor_name=user.fullName,
        actor_role=user.role,
        action="PASSWORD_RESET_REQUESTED",
        resource=f"User:{user.id}",
        details={"token_generated": True},
        timestamp=datetime.utcnow()
    )
    db.add(audit)
    db.commit()

    return {
        "message": "If an account with this official email exists, a password reset token has been generated.",
        "note": "For prototype testing, use the reset token below or in the UI reset form.",
        "resetToken": token
    }

@router.post("/reset-password")
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    """
    Resets an account password using a valid, non-expired password reset token.
    """
    if payload.newPassword != payload.confirmNewPassword:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New Password and Confirm New Password do not match."
        )

    user = db.query(User).filter(User.resetToken == payload.token).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or unrecognized password reset token."
        )

    if not user.resetTokenExpiry or user.resetTokenExpiry < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password reset token has expired. Please request a new token."
        )

    user.passwordHash = hash_password(payload.newPassword)
    user.resetToken = None
    user.resetTokenExpiry = None
    user.updatedAt = datetime.utcnow()

    audit = AuditLog(
        user_id=user.id,
        actor_email=user.email,
        actor_name=user.fullName,
        actor_role=user.role,
        action="PASSWORD_RESET_COMPLETED",
        resource=f"User:{user.id}",
        details={},
        timestamp=datetime.utcnow()
    )
    db.add(audit)
    db.commit()

    return {"message": "Password reset successfully. You can now log in with your new password."}

@router.post("/logout")
def logout_user(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Logs out user and registers audit record."""
    audit = AuditLog(
        user_id=current_user.id,
        actor_email=current_user.email,
        actor_name=current_user.fullName,
        actor_role=current_user.role,
        action="LOGOUT",
        resource="Auth",
        details={},
        timestamp=datetime.utcnow()
    )
    db.add(audit)
    db.commit()
    return {"message": "Successfully logged out."}
