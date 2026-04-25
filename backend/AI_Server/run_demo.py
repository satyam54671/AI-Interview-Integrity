
import cv2
import sys
import os
import time
import requests
import json
import threading

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    from vision.face_mesh import FaceMeshProcessor
    from vision.eye_tracker import analyze_eye_gaze
    from vision.lip_tracker import analyze_lip_movement
    from vision.emotion import detect_emotion
    from scoring.engine import compute_interview_score
except ImportError as e:
    print(f"Error importing modules: {e}")
    sys.exit(1)

# Configuration
API_URL = "http://localhost:8000/update_score"
EMOTION_INTERVAL = 15

def send_score_update(score_data):
    """Send score update to the API in a separate thread to avoid blocking UI."""
    def _send():
        try:
            requests.post(API_URL, json=score_data, timeout=0.5)
        except requests.exceptions.RequestException:
            pass # Ignore connection errors (e.g. if server is not running)
    
    threading.Thread(target=_send, daemon=True).start()

def main():
    print("Initializing components...")
    
    try:
        processor = FaceMeshProcessor(
            max_num_faces=1,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
    except Exception as e:
        print(f"Failed to initialize FaceMeshProcessor: {e}")
        return

    print("Opening camera...")
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("Default backend failed, trying AVFoundation...")
        cap = cv2.VideoCapture(0, cv2.CAP_AVFOUNDATION)

    if not cap.isOpened():
        print("ERROR: Could not open camera. Please check permissions.")
        return

    print("Starting video loop... Press 'q' to quit.")
    
    frame_count = 0
    current_emotion = {"dominant_emotion": "neutral", "emotion_score": 90}
    
    # Smoothing queues (simple list for rolling average could be added here, 
    # but for prototype we just update live)
    
    while True:
        ret, frame = cap.read()
        if not ret:
            print("Failed to read frame.")
            break
            
        frame_count += 1
        h, w = frame.shape[:2]

        # 1. Face Mesh
        start_time = time.time()
        mesh_result = processor.process_frame(frame)
        
        face_detected = mesh_result.get("face_detected", False)
        landmarks = mesh_result.get("landmarks", []) # Pixel coordinates
        
        # We need normalized or pixel? 
        # eye_tracker uses pixel distance logic? 
        # Let's check eye_tracker implementation.. it uses Euclidean distance.
        # If passed pixel coords, it returns pixel distance.
        # But ratio (dist/eye_width) is unitless.
        # So pixel coords are fine.
        
        if face_detected and landmarks:
            # 2. Eye Tracker
            eye_data = analyze_eye_gaze(landmarks, w, h)
            
            # 3. Lip Tracker
            lip_data = analyze_lip_movement(landmarks)
            
            # 4. Emotion Detection (Every N frames)
            if frame_count % EMOTION_INTERVAL == 0:
                # Run in thread? DeepFace is heavy. 
                # For prototype, blocking is okay but might lag.
                # Let's run it anyway.
                # Optimization: Resize for emotion detection
                small_frame = cv2.resize(frame, (0, 0), fx=0.5, fy=0.5)
                new_emotion = detect_emotion(small_frame)
                if new_emotion["dominant_emotion"] != "error":
                    current_emotion = new_emotion
            
            # 5. Scoring
            score_data = compute_interview_score(eye_data, lip_data, current_emotion)
            
            # Merge all data for API
            full_state = {
                **score_data,
                "gaze_direction": eye_data["gaze_direction"],
                "eye_closed": eye_data["eye_closed"],
                "lip_distance": lip_data["lip_distance"],
                "dominant_emotion": current_emotion["dominant_emotion"]
            }
            
            # 6. Send Update
            send_score_update(full_state)
            
            # 7. Visualization
            final_score = score_data["final_score"]
            cv2.putText(frame, f"Score: {final_score}", (10, 50), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0) if final_score > 70 else (0, 0, 255), 2)
            cv2.putText(frame, f"Gaze: {eye_data['gaze_direction']}", (10, 90), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 1)
            cv2.putText(frame, f"Emotion: {current_emotion['dominant_emotion']}", (10, 120), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 1)
            cv2.putText(frame, f"Lip Dist: {lip_data['lip_distance']:.2f}", (10, 150), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 1)
            
            # Draw landmarks
            for (x, y) in landmarks:
                cv2.circle(frame, (x, y), 1, (0, 255, 255), -1)

        else:
            cv2.putText(frame, "No face detected", (10, 50), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)

        fps = 1.0 / (time.time() - start_time)
        cv2.putText(frame, f"FPS: {fps:.1f}", (w - 120, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)

        cv2.imshow('Interview Integrity Demo', frame)

        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()
    processor.close()
    print("Demo finished.")

if __name__ == "__main__":
    main()
