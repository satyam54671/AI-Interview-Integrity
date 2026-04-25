"""
Unified Backend for Interview Integrity System
Combines Dashboard API, Authentication, WebSockets, and AI Integrity Analysis
"""
import uvicorn
import json
import time
import random
import asyncio
import base64
import cv2
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List
from fastapi import FastAPI, HTTPException, Depends, WebSocket, WebSocketDisconnect, Body, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from contextlib import asynccontextmanager
import jwt

# Import AI Engine
from AI_Server.scoring_engine import ScoringEngine

# JWT Configuration
SECRET_KEY = "your-secret-key-change-in-production"
ALGORITHM = "HS256"

# Mock data storage
mock_users = {
    "admin@example.com": {
        "id": 1,
        "name": "Admin User",
        "email": "admin@example.com",
        "password": "password",
        "role": "administrator"
    }
}

mock_sessions = [
    {"id": "SESS-9021", "candidate_name": "Alex Johnson", "status": "completed", "risk_score": 12, "created_at": "2024-04-15T10:00:00Z"},
    {"id": "SESS-9022", "candidate_name": "Sarah Chen", "status": "active", "risk_score": 68, "created_at": "2024-04-16T10:00:00Z"},
    {"id": "SESS-9023", "candidate_name": "Marcus Miller", "status": "flagged", "risk_score": 89, "created_at": "2024-04-16T11:00:00Z"},
    {"id": "SESS-9024", "candidate_name": "Elena Rodriguez", "status": "completed", "risk_score": 5, "created_at": "2024-04-14T09:00:00Z"},
    {"id": "SESS-9025", "candidate_name": "David Kim", "status": "pending", "risk_score": 45, "created_at": "2024-04-15T14:00:00Z"}
]

mock_alerts = [
    {"id": 1, "alert_type": "Eye Tracking", "message": "Candidate looking away for 5s", "severity": "high", "created_at": "2024-04-16T10:24:12Z", "session_id": "SESS-9022"},
    {"id": 2, "alert_type": "Tab Activity", "message": "Browser tab switched to 'Search'", "severity": "critical", "created_at": "2024-04-16T10:26:05Z", "session_id": "SESS-9022"},
    {"id": 3, "alert_type": "Audio", "message": "Background conversation detected", "severity": "medium", "created_at": "2024-04-16T10:28:45Z", "session_id": "SESS-9022"},
    {"id": 4, "alert_type": "Face Detection", "message": "Multiple faces detected in frame", "severity": "critical", "created_at": "2024-04-16T10:30:12Z", "session_id": "SESS-9022"},
    {"id": 5, "alert_type": "Eye Tracking", "message": "Candidate not looking at screen", "severity": "medium", "created_at": "2024-04-16T10:32:00Z", "session_id": "SESS-9023"}
]

# Pydantic models
class LoginRequest(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: Dict[str, Any]

class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str

class AnalyzeRequest(BaseModel):
    image: str  # Base64 encoded image string

class ViolationRequest(BaseModel):
    type: str

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}

    async def connect(self, websocket: WebSocket, session_id: str):
        await websocket.accept()
        self.active_connections[session_id] = websocket
        print(f"✅ WebSocket connected for session {session_id}")

    def disconnect(self, session_id: str):
        if session_id in self.active_connections:
            del self.active_connections[session_id]
            print(f"❌ WebSocket disconnected for session {session_id}")

    async def send_personal_message(self, message: dict, session_id: str):
        if session_id in self.active_connections:
            websocket = self.active_connections[session_id]
            try:
                await websocket.send_text(json.dumps(message))
            except:
                self.disconnect(session_id)

manager = ConnectionManager()

# Initialize Scoring Engine
scoring_engine = ScoringEngine()

# Security
security = HTTPBearer()

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(hours=24)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return email
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

def base64_to_cv2(base64_string: str) -> np.ndarray:
    """Convert base64 image string to OpenCV BGR image."""
    try:
        if "," in base64_string:
            base64_string = base64_string.split(",")[1]
        image_data = base64.b64decode(base64_string)
        nparr = np.frombuffer(image_data, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        return frame
    except Exception as e:
        raise ValueError(f"Invalid image data: {str(e)}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🧠 Unified Backend starting up... AI Engine warming up.")
    yield
    print("👋 Unified Backend shutting down...")

app = FastAPI(
    title="Unified Interview Integrity System",
    description="Combined Dashboard API and AI Analysis Engine",
    version="1.5.0",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- AI ANALYSIS ENDPOINTS ---

@app.post("/analyze")
async def analyze_frame(request: AnalyzeRequest):
    """Analyze a webcam frame for interview integrity."""
    try:
        frame = base64_to_cv2(request.image)
        if frame is None:
            raise HTTPException(status_code=400, detail="Could not decode image")
        
        result = scoring_engine.process_frame(frame)
        
        # Sync risk score with mock session if possible (demo purposes)
        # In a real app, we'd update the database here
        
        return result
    except Exception as e:
        print(f"Analysis error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.post("/violation")
async def report_violation(request: ViolationRequest):
    """Report a frontend violation (events like copy/paste, tab switch)."""
    violation_type = request.type
    penalty = 15
    confidence = 1.0
    
    # Strict Penalty Mapping
    if violation_type == "copy_paste": 
        penalty = 30
        description = "Unauthorized Copy/Paste Operation"
    elif violation_type == "tab_switch": 
        penalty = 25
        description = "Browser Tab Switch Detected"
    elif violation_type == "window_blur": 
        penalty = 20
        description = "Window Focus Lost (Alt-Tab)"
    elif "speaking" in violation_type: 
        penalty = 18
        description = "External Speech Detected"
    else:
        description = f"Security Event: {violation_type.replace('_', ' ').title()}"
        
    scoring_engine.register_violation(description, penalty, confidence)
    
    # Create a real alert for the dashboard
    new_alert = {
        "id": len(mock_alerts) + 1,
        "alert_type": "Security Violation",
        "message": description,
        "severity": "critical" if penalty >= 25 else "high",
        "created_at": datetime.utcnow().isoformat() + "Z",
        "session_id": "SESS-ACTIVE",
        "confidence": confidence
    }
    mock_alerts.insert(0, new_alert)
    
    return {
        "status": "violation_registered", 
        "penalty_applied": penalty,
        "current_penalty_total": scoring_engine.integrity_penalty,
        "confidence": confidence
    }

# --- DASHBOARD & AUTH ENDPOINTS ---

@app.post("/auth/login", response_model=TokenResponse)
async def login(request: LoginRequest):
    user = mock_users.get(request.email)
    if not user or user["password"] != request.password:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token = create_access_token(data={"sub": user["email"], "user_id": user["id"]})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@app.get("/users/me", response_model=UserResponse)
async def get_current_user(current_user: str = Depends(verify_token)):
    user = mock_users.get(current_user)
    if not user: raise HTTPException(status_code=404, detail="User not found")
    return user

@app.get("/sessions")
async def get_sessions(): return mock_sessions

@app.post("/sessions")
async def create_session(data: Dict[str, str] = Body(...)):
    new_session = {
        "id": f"SESS-{random.randint(1000, 9999)}",
        "candidate_name": data.get("candidate_name", "Unknown"),
        "status": "active",
        "risk_score": 0,
        "created_at": datetime.utcnow().isoformat() + "Z"
    }
    mock_sessions.insert(0, new_session)
    return new_session

@app.get("/sessions/{session_id}")
async def get_session(session_id: str):
    session = next((s for s in mock_sessions if s["id"] == session_id), None)
    if not session: raise HTTPException(status_code=404, detail="Session not found")
    return session

@app.get("/alerts")
async def get_alerts(limit: int = 100): return mock_alerts[:limit]

@app.get("/analytics")
async def get_analytics():
    return {
        "timeline": [
            {"timestamp": (datetime.utcnow() - timedelta(minutes=i*15)).isoformat() + "Z", 
             "alert_count": random.randint(2, 15), 
             "avg_risk_score": random.randint(10, 80)}
            for i in range(7)
        ][::-1]
    }

# --- WEBSOCKET ENDPOINT ---

@app.websocket("/ws/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str, token: str = None):
    await manager.connect(websocket, session_id)
    try:
        while True:
            await asyncio.sleep(5)
            # Sync AI engine score with WebSocket updates
            risk_score = min(100, int(scoring_engine.suspicion_level))
            await manager.send_personal_message({
                "type": "risk_update",
                "overall_score": risk_score,
                "breakdown": {
                    "eye_tracking": random.randint(10, 40),
                    "face_detection": random.randint(10, 30),
                    "audio": random.randint(5, 20),
                    "behavior": risk_score
                },
                "timestamp": datetime.utcnow().isoformat() + "Z"
            }, session_id)
    except WebSocketDisconnect:
        manager.disconnect(session_id)

@app.get("/health")
async def health():
    return {"status": "ok", "engine": "AI_CONNECTED", "timestamp": datetime.utcnow().isoformat() + "Z"}

@app.get("/")
async def root():
    return {"message": "Unified Interview Integrity System is Active", "port": 8000}

if __name__ == "__main__":
    uvicorn.run("unified_backend:app", host="0.0.0.0", port=8000, reload=True)
