from datetime import datetime
from typing import Optional, Any, Dict, List
from pydantic import BaseModel, Field, EmailStr, field_validator
import re

class UserRegisterRequest(BaseModel):
    fullName: str = Field(..., min_length=2, max_length=100, description="Full Name of Officer")
    employeeId: str = Field(..., min_length=3, max_length=50, description="Official Government Employee / Service ID")
    email: EmailStr = Field(..., description="Official Government Email ID")
    department: str = Field(..., min_length=2, max_length=100, description="Government Department / Ministry")
    designation: str = Field(..., min_length=2, max_length=100, description="Official Designation / Rank")
    password: str = Field(..., min_length=8, max_length=100, description="Account Password")
    confirmPassword: str = Field(..., min_length=8, max_length=100, description="Confirm Password")

    @field_validator("fullName", "employeeId", "department", "designation")
    @classmethod
    def strip_whitespace(cls, v: str) -> str:
        return v.strip() if v else v

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter (A-Z)")
        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain at least one lowercase letter (a-z)")
        if not re.search(r"[0-9]", v):
            raise ValueError("Password must contain at least one digit (0-9)")
        if not any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?/~`" for c in v):
            raise ValueError("Password must contain at least one special character (!@#$%^&*)")
        return v

class UserLoginRequest(BaseModel):
    username: str = Field(..., description="Email address or Employee ID")
    password: str = Field(..., description="Account password")
    rememberMe: Optional[bool] = Field(False, description="Remember login session")

class UserResponse(BaseModel):
    id: int
    fullName: str
    employeeId: str
    email: str
    department: str
    designation: str
    role: str
    status: str
    createdAt: datetime
    updatedAt: datetime
    lastLogin: Optional[datetime] = None

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "Bearer"
    expires_in: int
    user: UserResponse

class ProfileUpdateRequest(BaseModel):
    fullName: Optional[str] = Field(None, min_length=2, max_length=100)
    department: Optional[str] = Field(None, min_length=2, max_length=100)
    designation: Optional[str] = Field(None, min_length=2, max_length=100)

class ChangePasswordRequest(BaseModel):
    currentPassword: str = Field(..., description="Current password")
    newPassword: str = Field(..., min_length=8, description="New password")
    confirmNewPassword: str = Field(..., min_length=8, description="Confirm new password")

    @field_validator("newPassword")
    @classmethod
    def validate_new_pwd(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter (A-Z)")
        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain at least one lowercase letter (a-z)")
        if not re.search(r"[0-9]", v):
            raise ValueError("Password must contain at least one digit (0-9)")
        if not any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?/~`" for c in v):
            raise ValueError("Password must contain at least one special character")
        return v

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str = Field(..., description="Password reset token")
    newPassword: str = Field(..., min_length=8, description="New password")
    confirmNewPassword: str = Field(..., min_length=8, description="Confirm new password")

class UserStatusUpdateRequest(BaseModel):
    status: str = Field(..., description="Status: ACTIVE, DISABLED, PENDING")

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        valid = ["ACTIVE", "DISABLED", "PENDING"]
        if v.upper() not in valid:
            raise ValueError(f"Invalid status. Must be one of: {', '.join(valid)}")
        return v.upper()

class UserRoleUpdateRequest(BaseModel):
    role: str = Field(..., description="Role: OFFICER, ADMIN")

    @field_validator("role")
    @classmethod
    def validate_role(cls, v: str) -> str:
        valid = ["OFFICER", "ADMIN"]
        if v.upper() not in valid:
            raise ValueError(f"Invalid role. Must be one of: {', '.join(valid)}")
        return v.upper()

class AuditLogResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    actor_email: Optional[str] = None
    actor_name: Optional[str] = None
    actor_role: str
    action: str
    resource: Optional[str] = None
    details: Optional[Dict[str, Any]] = None
    timestamp: datetime

    class Config:
        from_attributes = True
