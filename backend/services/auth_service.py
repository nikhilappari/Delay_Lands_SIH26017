import os
import secrets
import time
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, Tuple
from passlib.context import CryptContext
from jose import jwt, JWTError

# Password Hashing CryptContext
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT Configuration
JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "delay_lands_sec_gov_jwt_key_2026_dev_fallback_change_in_prod")
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.environ.get("ACCESS_TOKEN_EXPIRE_MINUTES", 60 * 24)) # 24 hours

# In-memory Rate Limiting / Brute-force Login Protection
# Tracks { ip_or_username: [timestamps] }
_login_attempts: Dict[str, list] = {}
MAX_ATTEMPTS = 5
LOCKOUT_WINDOW_SECONDS = 300 # 5 minutes

def hash_password(password: str) -> str:
    """Hashes password using bcrypt."""
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies plain password against hashed password."""
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> Tuple[str, int]:
    """Creates a signed JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
        expires_in = int(expires_delta.total_seconds())
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        expires_in = ACCESS_TOKEN_EXPIRE_MINUTES * 60

    to_encode.update({
        "exp": expire,
        "iat": datetime.utcnow()
    })
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    return encoded_jwt, expires_in

def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """Decodes and validates a JWT token."""
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        return payload
    except JWTError:
        return None

def generate_reset_token() -> str:
    """Generates a cryptographically secure random token for password reset."""
    return secrets.token_urlsafe(32)

def check_login_rate_limit(key: str) -> Tuple[bool, int]:
    """
    Checks if a username / IP has exceeded max failed attempts.
    Returns (is_locked, retry_after_seconds).
    """
    now = time.time()
    attempts = _login_attempts.get(key, [])
    # Filter attempts within lockout window
    recent_attempts = [t for t in attempts if now - t < LOCKOUT_WINDOW_SECONDS]
    _login_attempts[key] = recent_attempts

    if len(recent_attempts) >= MAX_ATTEMPTS:
        oldest_attempt = min(recent_attempts)
        retry_after = int(LOCKOUT_WINDOW_SECONDS - (now - oldest_attempt))
        return True, max(retry_after, 1)
    return False, 0

def record_failed_login(key: str):
    now = time.time()
    attempts = _login_attempts.get(key, [])
    attempts.append(now)
    _login_attempts[key] = attempts

def clear_failed_logins(key: str):
    if key in _login_attempts:
        del _login_attempts[key]
