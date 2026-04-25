"""
Scoring Engine for Interview Integrity System.
Orchestrates FaceMesh, Eye Tracking, Lip Detection, and Emotion Analysis.
"""
import time
import cv2
import numpy as np
from typing import Dict, Any, Optional

# Import vision modules
from AI_Server.vision.face_mesh import FaceMeshProcessor
from AI_Server.vision.eye_tracker import analyze_eye_gaze
from AI_Server.vision.lip_tracker import analyze_lip_movement
from AI_Server.vision.emotion import detect_emotion

def _euclidean_distance(p1, p2):
    """Helper to calculate distance between two points."""
    return np.sqrt((p1[0] - p2[0])**2 + (p1[1] - p2[1])**2)

class ScoringEngine:
    def __init__(self):
        # MediaPipe Configuration
        self.face_mesh = FaceMeshProcessor(
            max_num_faces=4,
            refine_landmarks=True,
            min_detection_confidence=0.6, # Increased for accuracy
            min_tracking_confidence=0.6
        )
        
        # State Management
        self.suspicious_events = []
        self.integrity_penalty = 0
        self.last_violation_time = {} 
        
        # Persistence Counters (For Temporal Consistency)
        self.multi_face_frames = 0
        self.down_gaze_frames = 0
        self.head_turn_frames = 0
        self.speaking_frames = 0
        self.looking_away_frames = 0
        
        # Pattern Tracking
        self.gaze_history = [] # Track recent gaze directions
        self.last_gaze_direction = "center"
        self.gaze_switch_count = 0
        self.last_gaze_switch_time = time.time()
        
        # Scoring Optimization
        self.smoothed_behavior_score = 100.0
        self.suspicion_level = 0.0 
        self.last_recovery_time = time.time()
        self.alpha = 0.05 
        
        # Emotion State
        self.last_emotion_time = 0
        self.emotion_interval = 1.0
        self.last_emotion_result = {"dominant_emotion": "neutral", "emotion_score": 90}

    def register_violation(self, reason: str, penalty: int, confidence: float = 1.0):
        """
        Register a violation with incremental penalty and temporal debouncing.
        """
        current_time = time.time()
        last_time = self.last_violation_time.get(reason, 0)
        
        # Debounce to prevent spam (8 seconds window for same type)
        if current_time - last_time > 8.0: 
            self.last_violation_time[reason] = current_time
            self.suspicious_events.append({
                "reason": reason,
                "timestamp": round(current_time, 2),
                "penalty": penalty,
                "confidence": round(confidence, 2)
            })
            self.integrity_penalty += penalty
            print(f"🚨 INTEGRITY ALERT: {reason} | Penalty: -{penalty} | Total: {self.integrity_penalty}")

    def process_frame(self, frame: np.ndarray) -> Dict[str, Any]:
        """
        Main analysis pipeline with strict behavioral detection.
        """
        if frame is None or frame.size == 0:
            return self._get_default_response()

        h, w = frame.shape[:2]
        current_time = time.time()

        # 1. Face Mesh Analysis
        mesh_result = self.face_mesh.process_frame(frame)
        
        if not mesh_result["face_detected"]:
            # Check for sustained "No Face" (Cheating attempt)
            self.looking_away_frames += 1
            if self.looking_away_frames > 15: # ~1.5s
                self.register_violation("No face detected / Subject left frame", 20, 0.95)
                self.looking_away_frames = 0
            return self._get_no_face_response()
        else:
            self.looking_away_frames = 0

        landmarks = mesh_result["landmarks"]
        num_faces = mesh_result.get("number_of_faces", 1)

        # --- MODULE 1: Multiple Face Detection (Consistency Check) ---
        if num_faces > 1:
            self.multi_face_frames += 1
            if self.multi_face_frames > 5: # Consistent for ~500ms
                self.register_violation("Multiple faces detected in frame", 35, 0.98)
                self.multi_face_frames = 0
        else:
            self.multi_face_frames = max(0, self.multi_face_frames - 1)

        # 2. Extract Sub-Analysis
        eye_result = analyze_eye_gaze(landmarks, w, h)
        lip_result = analyze_lip_movement(landmarks)
        
        # Emotion (Rate Limited)
        if current_time - self.last_emotion_time >= self.emotion_interval:
            self.last_emotion_result = detect_emotion(cv2.resize(frame, (320, 240)))
            self.last_emotion_time = current_time
        
        # --- MODULE 2: Reading Notes Detection (Downward Gaze + Persistence) ---
        curr_gaze = eye_result["gaze_direction"]
        
        # Estimate Pitch (Downward tilt)
        nose = landmarks[1]
        eye_center = (landmarks[33][1] + landmarks[263][1]) / 2
        pitch_val = (nose[1] - eye_center) / (_euclidean_distance(landmarks[33], landmarks[263]) + 1e-6)

        if "down" in curr_gaze or pitch_val > 0.55:
            self.down_gaze_frames += 1
            if self.down_gaze_frames > 25: # ~2.5 seconds of looking down
                self.register_violation("Sustained downward gaze (Reading Notes Detected)", 25, 0.85)
                self.down_gaze_frames = 0
        else:
            self.down_gaze_frames = max(0, self.down_gaze_frames - 2)

        # --- MODULE 3: Eye Movement / Gaze Tracking (Left/Right Patterns) ---
        if curr_gaze in ["left", "right"]:
            if curr_gaze != self.last_gaze_direction:
                self.gaze_switch_count += 1
                self.last_gaze_switch_time = current_time
                self.last_gaze_direction = curr_gaze
            
            # Detect rapid darting eyes (3 switches within 4 seconds)
            if self.gaze_switch_count >= 3:
                self.register_violation("Suspicious eye movement (Repeatedly looking away)", 15, 0.80)
                self.gaze_switch_count = 0
        
        # Reset switch count if no switches for 4 seconds
        if current_time - self.last_gaze_switch_time > 4.0:
            self.gaze_switch_count = 0

        # --- MODULE 4: Speaking Detection (Temporal Consistency) ---
        # lip_score decreases when mouth opens. normalized_dist > 0.08 is "talking"
        if lip_result["lip_distance"] > 0.08:
            self.speaking_frames += 1
            if self.speaking_frames > 20: # Consistent talking for ~2s
                self.register_violation("Continuous speaking detected", 18, 0.90)
                self.speaking_frames = 0
        else:
            self.speaking_frames = max(0, self.speaking_frames - 1)

        # --- MODULE 5: Head Pose / Orientation ---
        dist_L = _euclidean_distance(nose, landmarks[33])
        dist_R = _euclidean_distance(nose, landmarks[263])
        yaw_ratio = dist_L / (dist_R + 1e-6)

        if yaw_ratio > 1.6 or yaw_ratio < 0.6: # Significant turn
            self.head_turn_frames += 1
            if self.head_turn_frames > 20: # ~2s
                self.register_violation("Subject looking away from screen", 15, 0.95)
                self.head_turn_frames = 0
        else:
            self.head_turn_frames = max(0, self.head_turn_frames - 1)

        # 6. Integrity Scoring Engine
        raw_behavior = (eye_result["eye_score"] * 0.45) + (self.last_emotion_result["emotion_score"] * 0.35) + (lip_result["lip_score"] * 0.20)
        
        # Smoothing
        self.smoothed_behavior_score = (self.alpha * raw_behavior) + ((1 - self.alpha) * self.smoothed_behavior_score)
        
        # Integrity Score Calculation
        # Final = (Base Behavior - Penalties)
        final_score = int(self.smoothed_behavior_score - self.integrity_penalty)
        final_score = max(0, min(100, final_score))
        
        # Suspicion Level (0-100)
        self.suspicion_level = min(100.0, (self.integrity_penalty * 1.2) + (len(self.suspicious_events) * 4))

        return {
            "final_score": final_score,
            "behavior_score": int(self.smoothed_behavior_score),
            "integrity_penalty": self.integrity_penalty,
            "violations": self.suspicious_events, 
            "dominant_emotion": self.last_emotion_result["dominant_emotion"],
            "emotion_score": int(self.last_emotion_result["emotion_score"]),
            "eye_score": int(eye_result["eye_score"]),
            "lip_score": int(lip_result["lip_score"]),
            "gaze_direction": eye_result["gaze_direction"],
            "yaw": round(yaw_ratio, 2),
            "pitch": round(pitch_val, 2),
            "face_detected": True,
            "number_of_faces": num_faces,
            "suspicion_level": int(self.suspicion_level)
        }

    def _get_default_response(self):
        return {
            "final_score": 0,
            "behavior_score": 0,
            "integrity_penalty": self.integrity_penalty,
            "violations": self.suspicious_events,
            "face_detected": False,
            "suspicion_level": int(self.suspicion_level)
        }

    def _get_no_face_response(self):
        return {
            "final_score": max(0, int(self.smoothed_behavior_score - self.integrity_penalty)),
            "behavior_score": int(self.smoothed_behavior_score),
            "integrity_penalty": self.integrity_penalty,
            "violations": self.suspicious_events,
            "face_detected": False,
            "suspicion_level": int(self.suspicion_level),
            "message": "Subject missing from frame"
        }
