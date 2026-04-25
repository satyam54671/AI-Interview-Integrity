
def compute_interview_score(eye_data, lip_data, emotion_data):
    """
    Compute weighted average score.
    
    Args:
        eye_data (dict): Result from analyze_eye_gaze
        lip_data (dict): Result from analyze_lip_movement
        emotion_data (dict): Result from detect_emotion
        
    Returns:
        dict: Final scores
    """
    
    # Extract individual scores
    eye_score = eye_data.get("eye_score", 0)
    lip_score = lip_data.get("lip_score", 0)
    emotion_score = emotion_data.get("emotion_score", 0)
    
    # Weighted Formula
    # 0.4 * Eye + 0.4 * Emotion + 0.2 * Lip
    
    weighted_score = (0.4 * eye_score) + (0.4 * emotion_score) + (0.2 * lip_score)
    
    return {
        "final_score": int(weighted_score),
        "eye_score": int(eye_score),
        "emotion_score": int(emotion_score),
        "lip_score": int(lip_score)
    }
