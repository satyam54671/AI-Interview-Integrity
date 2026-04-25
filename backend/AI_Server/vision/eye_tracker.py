
import math

def _euclidean_distance(point1, point2):
    x1, y1 = point1
    x2, y2 = point2
    return math.sqrt((x2 - x1)**2 + (y2 - y1)**2)

def analyze_eye_gaze(landmarks, frame_width, frame_height):
    """
    Analyze eye gaze direction and closure.
    
    Args:
        landmarks: List of (x, y) tuples from FaceMesh (478 landmarks expected).
        frame_width: Width of the frame.
        frame_height: Height of the frame.
        
    Returns:
        dict: {
            "gaze_direction": "center" | "left" | "right",
            "eye_closed": bool,
            "eye_score": int
        }
    """
    if not landmarks or len(landmarks) < 478:
        return {
            "gaze_direction": "center",
            "eye_closed": False,
            "eye_score": 100
        }

    # Landmark Indices (MediaPipe Face Mesh)
    # Left Eye
    LEFT_EYE_LEFT = 33
    LEFT_EYE_RIGHT = 133
    LEFT_EYE_TOP = 159
    LEFT_EYE_BOTTOM = 145
    LEFT_IRIS_CENTER = 468

    # Right Eye
    RIGHT_EYE_LEFT = 362
    RIGHT_EYE_RIGHT = 263
    RIGHT_EYE_TOP = 386
    RIGHT_EYE_BOTTOM = 374
    RIGHT_IRIS_CENTER = 473

    # --- Eye Closure Detection ---
    # Calculate Vertical Eye Opening (EAR - Eye Aspect Ratio simplified)
    
    # Left Eye Height
    left_v_dist = _euclidean_distance(landmarks[LEFT_EYE_TOP], landmarks[LEFT_EYE_BOTTOM])
    # Left Eye Width (for normalization, though usually we strictly check EAR)
    left_h_dist = _euclidean_distance(landmarks[LEFT_EYE_LEFT], landmarks[LEFT_EYE_RIGHT])
    
    # Right Eye Height
    right_v_dist = _euclidean_distance(landmarks[RIGHT_EYE_TOP], landmarks[RIGHT_EYE_BOTTOM])
    
    # Threshold for eye closure (tuned for pixel coordinates, might need adjustment based on resolution)
    # Better to use Aspect Ratio: Height / Width
    left_ratio = left_v_dist / (left_h_dist + 1e-6)
    
    # If ratio is very small, eye is closed.
    # Typical open eye ratio is > 0.2
    # Closed is < 0.15 approx.
    EYE_CLOSED_THRESHOLD = 0.12
    
    is_left_closed = left_ratio < EYE_CLOSED_THRESHOLD
    # We can average or check both, using left for simplicity or average
    
    if is_left_closed:
        return {
            "gaze_direction": "center", # Irrelevant if closed
            "eye_closed": True,
            "eye_score": 40
        }

    # --- Gaze Direction Detection ---
    # Check horizontal position of Iris relative to eye corners
    
    # Left Eye: 33 (Left Corner) ... 468 (Iris) ... 133 (Right Corner)
    # Note: "Left" and "Right" indices are from subject's perspective? 
    # MP: 33 is outer corner of left eye (screen left), 133 is inner corner.
    
    L_outer = landmarks[LEFT_EYE_LEFT]
    L_inner = landmarks[LEFT_EYE_RIGHT]
    L_iris = landmarks[LEFT_IRIS_CENTER]
    
    # Distance from Outer corner to Iris
    dist_outer = _euclidean_distance(L_outer, L_iris)
    # Distance from Inner corner to Iris
    dist_inner = _euclidean_distance(L_inner, L_iris)
    
    # Total eye width
    eye_width = _euclidean_distance(L_outer, L_inner)
    
    # Normalized position (0.0 = outer corner, 1.0 = inner corner)
    # Center is roughly 0.5
    if eye_width == 0:
        ratio = 0.5
    else:
        ratio = dist_outer / eye_width

    # Thresholds for gaze
    # Looking Left (Subject's Left) -> Iris moves towards Outer (33) -> Ratio decreases?
    # Wait, usually:
    # Looking User's Left (Screen Right) -> Iris moves to 133 (Inner)
    # Looking User's Right (Screen Left) -> Iris moves to 33 (Outer)
    
    # Let's verify standard behavior:
    # 0.5 is center.
    # < 0.40 is looking LEFT (Subject's Left / Screen Left)
    # > 0.60 is looking RIGHT (Subject's Right / Screen Right)
    
    # --- Vertical Gaze (Up/Down) ---
    # Top/Bottom landmarks
    L_top = landmarks[LEFT_EYE_TOP]
    L_bottom = landmarks[LEFT_EYE_BOTTOM]
    
    # Distance from Top corner to Iris
    dist_top = _euclidean_distance(L_top, L_iris)
    # Total Vertical Height
    eye_height = _euclidean_distance(L_top, L_bottom)
    
    if eye_height == 0:
        v_ratio = 0.5
    else:
        v_ratio = dist_top / eye_height
        
    # Vertical Thresholds (Iris center relative to lids)
    # < 0.45 is looking UP
    # > 0.65 is looking DOWN
    
    v_gaze = "center"
    if v_ratio < 0.40:
        v_gaze = "up"
    elif v_ratio > 0.60: # Iris is closer to the bottom lid
        v_gaze = "down"
        
    gaze = "center"
    score = 100
    
    # Side Horizontal
    if ratio < 0.42:
        gaze = "left"
        score = 80
    elif ratio > 0.58:
        gaze = "right"
        score = 80
        
    # Special Case: DOWN (Note reading suspect)
    if v_gaze == "down":
        score = 85 # Slight penalty for downward gaze
        if gaze == "center":
            gaze = "down" # Prioritize DOWN if not sideways
        else:
            gaze = f"{gaze}_down"
            
    return {
        "gaze_direction": gaze,
        "vertical_gaze": v_gaze,
        "eye_closed": False,
        "eye_score": score
    }
