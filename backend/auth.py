import hmac
import hashlib
import json
import base64
import time
from functools import wraps
from typing import Optional, Dict, Any, List
from flask import request, jsonify, g
import bcrypt
from backend.config import Config
from backend.database import get_db, serialize_doc

def hash_password(password: str) -> str:
    """Hash password using bcrypt."""
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against bcrypt hash."""
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        return False

def generate_token(user_id: str, role: str, organization_id: Optional[str] = None, expires_in_hours: int = 48) -> str:
    """Generate secure tamper-proof signed token."""
    header = {"alg": "HS256", "typ": "JWT"}
    payload = {
        "sub": str(user_id),
        "role": role,
        "org_id": str(organization_id) if organization_id else None,
        "iat": int(time.time()),
        "exp": int(time.time()) + (expires_in_hours * 3600)
    }
    
    encoded_header = base64.urlsafe_b64encode(json.dumps(header).encode()).decode().rstrip("=")
    encoded_payload = base64.urlsafe_b64encode(json.dumps(payload).encode()).decode().rstrip("=")
    signing_input = f"{encoded_header}.{encoded_payload}"
    signature = hmac.new(Config.SECRET_KEY.encode(), signing_input.encode(), hashlib.sha256).digest()
    encoded_sig = base64.urlsafe_b64encode(signature).decode().rstrip("=")
    return f"{signing_input}.{encoded_sig}"

def decode_token(token: str) -> Optional[Dict[str, Any]]:
    """Verify and decode signed token."""
    try:
        parts = token.split(".")
        if len(parts) != 3:
            return None
        header_b64, payload_b64, sig_b64 = parts
        signing_input = f"{header_b64}.{payload_b64}"
        expected_sig = hmac.new(Config.SECRET_KEY.encode(), signing_input.encode(), hashlib.sha256).digest()
        
        # Add padding back if necessary
        sig_padding = 4 - (len(sig_b64) % 4)
        if sig_padding != 4:
            sig_b64 += "=" * sig_padding
        actual_sig = base64.urlsafe_b64decode(sig_b64)
        
        if not hmac.compare_digest(expected_sig, actual_sig):
            return None
        
        payload_padding = 4 - (len(payload_b64) % 4)
        if payload_padding != 4:
            payload_b64 += "=" * payload_padding
        payload_data = json.loads(base64.urlsafe_b64decode(payload_b64).decode())
        
        if payload_data.get("exp", 0) < int(time.time()):
            return None # Expired
            
        return payload_data
    except Exception:
        return None

def get_current_user_from_request() -> Optional[Dict[str, Any]]:
    """Extract and authenticate user from Bearer header or cookies."""
    auth_header = request.headers.get("Authorization", "")
    token = None
    if auth_header.startswith("Bearer "):
        token = auth_header.split(" ", 1)[1].strip()
    elif "clinicqueue_token" in request.cookies:
        token = request.cookies.get("clinicqueue_token")
    
    if not token:
        return None
        
    payload = decode_token(token)
    if not payload:
        return None
        
    db = get_db()
    user = db["users"].find_one({"_id": payload["sub"]})
    if not user or not user.get("is_active", True):
        return None
        
    return user

def require_auth(f):
    """Decorator to require authenticated user."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        user = get_current_user_from_request()
        if not user:
            return jsonify({"error": "Unauthorized", "message": "Authentication required or session expired."}), 401
        g.current_user = user
        return f(*args, **kwargs)
    return decorated_function

def require_role(*roles: str):
    """Decorator to require specific role(s)."""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            user = get_current_user_from_request()
            if not user:
                return jsonify({"error": "Unauthorized", "message": "Authentication required."}), 401
            
            user_role = user.get("role")
            if user_role not in roles and user_role != "platform_admin":
                return jsonify({
                    "error": "Forbidden", 
                    "message": f"Access restricted. Required role: {', '.join(roles)}. Current role: {user_role}."
                }), 403
            
            g.current_user = user
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def enforce_org_scope(target_org_id: Optional[str]) -> bool:
    """Returns True if current user is allowed to access target_org_id."""
    user = getattr(g, "current_user", None)
    if not user:
        return False
    if user.get("role") == "platform_admin":
        return True
    if not target_org_id:
        return True
    return str(user.get("organization_id")) == str(target_org_id)
