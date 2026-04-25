
from deepface import DeepFace
import cv2
import threading
import queue

def detect_emotion(frame):
    """
    Detect dominant emotion from a frame.
    
    Args:
        frame: BGR image (numpy array).
        
    Returns:
        dict: {
            "dominant_emotion": str,
            "emotion_score": int
        }
    """
    if frame is None or frame.size == 0:
        return {
            "dominant_emotion": "neutral",
            "emotion_score": 90
        }
        
    try:
        # DeepFace analyze
        # enforce_detection=False allows returning neutral if no face found
        results = DeepFace.analyze(
            img_path=frame, 
            actions=['emotion'], 
            enforce_detection=False,
            silent=True
        )
        
        # Determine dominant emotion
        if isinstance(results, list):
            result = results[0]
        else:
            result = results
            
        emotion = result['dominant_emotion']
        
        # Scoring Logic
        # Happy / Neutral = 90
        # Sad / Fear = 60
        # Angry / Disgust = 50
        # Surprise = 80
        
        score_map = {
            "happy": 90,
            "neutral": 90,
            "surprise": 80,
            "sad": 60,
            "fear": 60,
            "angry": 50,
            "disgust": 50
        }
        
        score = score_map.get(emotion, 70) # Default 70
        
        return {
            "dominant_emotion": emotion,
            "emotion_score": score
        }
        
    except Exception as e:
        print(f"DeepFace Error: {e}")
        return {
            "dominant_emotion": "error",
            "emotion_score": 0
        }
