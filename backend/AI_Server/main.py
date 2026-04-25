"""
FastAPI entry point for the real-time AI interview integrity system.
"""
import base64
import cv2
import numpy as np
from fastapi import FastAPI, Body, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, Optional

from fastapi.staticfiles import StaticFiles
from AI_Server.scoring_engine import ScoringEngine
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Confirm models are ready
    print("🧠 Starting up... AI Engine warming up.")
    yield
    print("👋 Shutting down...")

app = FastAPI(
    title="AI Interview Integrity App",
    description="Real-time integrity monitoring for video interviews",
    version="1.2.0",
    lifespan=lifespan
)

# Enable CORS for frontend access (kept for flexibility)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Scoring Engine once to load models
scoring_engine = ScoringEngine()

class AnalyzeRequest(BaseModel):
    image: str  # Base64 encoded image string

class ViolationRequest(BaseModel):
    type: str

def base64_to_cv2(base64_string: str) -> np.ndarray:
    """Convert base64 image string to OpenCV BGR image."""
    try:
        # Remove header if present (e.g., "data:image/jpeg;base64,")
        if "," in base64_string:
            base64_string = base64_string.split(",")[1]
        
        image_data = base64.b64decode(base64_string)
        nparr = np.frombuffer(image_data, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        return frame
    except Exception as e:
        raise ValueError(f"Invalid image data: {str(e)}")

@app.get("/health")
def health():
    """Health check endpoint."""
    return {"status": "ok"}


@app.post("/analyze")
def analyze_frame(request: AnalyzeRequest):
    """
    Analyze a webcam frame for interview integrity.
    Input: Base64 image
    Output: Integrity scores and analysis
    """
    try:
        frame = base64_to_cv2(request.image)
        if frame is None:
            raise HTTPException(status_code=400, detail="Could not decode image")
        
        result = scoring_engine.process_frame(frame)
        return result
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        # Log error in production
        print(f"Analysis error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.post("/violation")
def report_violation(request: ViolationRequest):
    """
    Report a frontend violation (events like copy/paste, tab switch).
    """
    violation_type = request.type
    penalty = 0
    
    if violation_type == "copy_paste":
        penalty = 25
    elif violation_type == "tab_switch":
        penalty = 20
    elif violation_type == "window_blur":
        penalty = 15
    elif violation_type == "continuous_speaking" or violation_type == "speaking":
        penalty = 15
    else:
        penalty = 10 # Default for unknown
        
    scoring_engine.register_violation(violation_type, penalty)
    
    return {
        "status": "violation_registered", 
        "penalty_applied": penalty,
        "current_penalty_total": scoring_engine.integrity_penalty
    }

# Serve UI and static files safely
import os
UI_DIR = "Web_UI"
if os.path.exists(UI_DIR):
    from fastapi.responses import FileResponse
    @app.get("/")
    def serve_ui():
        return FileResponse(os.path.join(UI_DIR, "index.html"))
    
    app.mount("/static", StaticFiles(directory=UI_DIR), name="static")
else:
    @app.get("/")
    def api_status():
        return {"status": "AI_API_RUNNING", "message": "ProctorMax API is active. UI is hosted separately."}
