
import math

def _euclidean_distance(point1, point2):
    x1, y1 = point1
    x2, y2 = point2
    return math.sqrt((x2 - x1)**2 + (y2 - y1)**2)

def analyze_lip_movement(landmarks):
    """
    Analyze lip openness.
    
    Args:
        landmarks: List of (x, y) tuples from FaceMesh.
        
    Returns:
        dict: {
            "lip_distance": float,
            "lip_score": int
        }
    """
    if not landmarks or len(landmarks) < 468:
        return {
            "lip_distance": 0.0,
            "lip_score": 100
        }

    # Landmark Indices (MediaPipe Face Mesh)
    # Upper Lip Top: 13
    # Lower Lip Bottom: 14
    # Improved measure: Inner lip distance
    # Upper Inner: 13
    # Lower Inner: 14
    # Wait, 13/14 are outer.
    # Inner lips: 13, 14, 312, 317, 82, 87...
    # Let's use 13 (upper) and 14 (lower) for simplicity, or 0 and 17.
    # Standard: 13 (upper inner) and 14 (lower inner).

    UPPER_LIP = 13
    LOWER_LIP = 14
    
    # Face Height Normalizer (Forehead to Chin)
    # 10 (top) to 152 (chin)
    FACE_TOP = 10
    FACE_BOTTOM = 152
    
    lip_dist = _euclidean_distance(landmarks[UPPER_LIP], landmarks[LOWER_LIP])
    face_height = _euclidean_distance(landmarks[FACE_TOP], landmarks[FACE_BOTTOM])
    
    if face_height == 0:
        normalized_dist = 0
    else:
        normalized_dist = lip_dist / face_height

    # Scoring Logic
    # 0.0 - 0.05: Closed / Normal (Score 100)
    # > 0.15: Wide Open / Yawning / Excessive (Score < 80)
    
    score = 100
    if normalized_dist > 0.15:
        score = 60 # Penalty for excessive mouth opening (e.g. yawning/talking too loud)
    elif normalized_dist > 0.08:
        score = 80 # Just talking
        
    return {
        "lip_distance": round(normalized_dist, 3),
        "lip_score": score
    }
