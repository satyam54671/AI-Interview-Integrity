"""
Face mesh detection using MediaPipe.
"""
import cv2
import mediapipe as mp
import os
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
from typing import List, Optional, Tuple

# Default processor for backward-compatible get_face_mesh_landmarks
_default_processor: Optional["FaceMeshProcessor"] = None


class FaceMeshProcessor:
    """
    Reusable processor for MediaPipe Face Mesh.
    Converts BGR frames to landmark pixel coordinates.
    """

    def __init__(
        self,
        static_image_mode: bool = False,
        max_num_faces: int = 4,  # Updated to 4 for multi-face detection
        refine_landmarks: bool = True,
        min_detection_confidence: float = 0.5,
        min_tracking_confidence: float = 0.5,
    ):
        # Locate the model file relative to this script
        # Assuming face_landmarker.task is in the parent directory of vision/
        current_dir = os.path.dirname(os.path.abspath(__file__))
        model_path = os.path.join(current_dir, "..", "face_landmarker.task")

        base_options = python.BaseOptions(model_asset_path=model_path)
        options = vision.FaceLandmarkerOptions(
            base_options=base_options,
            running_mode=vision.RunningMode.IMAGE,
            num_faces=max_num_faces,
            min_face_detection_confidence=min_detection_confidence,
            min_face_presence_confidence=min_detection_confidence, # Using detection confidence for presence as well
            min_tracking_confidence=min_tracking_confidence,
        )
        self.detector = vision.FaceLandmarker.create_from_options(options)

    def process_frame(
        self,
        frame: "cv2.typing.MatLike",
    ) -> dict:
        """
        Process a BGR frame and return landmarks in pixel coordinates.

        Args:
            frame: OpenCV BGR image (numpy array).

        Returns:
            {
                "landmarks": list of (x, y) pixel coordinates (of the first face),
                "face_detected": True/False,
                "number_of_faces": int
            }
        """
        out = {"landmarks": [], "face_detected": False, "number_of_faces": 0}

        if frame is None or frame.size == 0:
            return out

        h, w = frame.shape[:2]
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
        results = self.detector.detect(mp_image)

        if not results.face_landmarks:
            return out

        num_faces = len(results.face_landmarks)
        out["face_detected"] = True
        out["number_of_faces"] = num_faces
        
        # Take the first face for gaze/lip analysis
        # (We only process the primary face for behavior, but report count for integrity)
        for lm in results.face_landmarks[0]:
            x = int(lm.x * w)
            y = int(lm.y * h)
            out["landmarks"].append((x, y))

        return out

    def close(self) -> None:
        """Release MediaPipe Face Mesh resources."""
        if hasattr(self, 'detector'):
            self.detector.close()


def get_face_mesh_landmarks(
    frame: "cv2.typing.MatLike",
) -> Optional[List[Tuple[float, float, float]]]:
    """
    Extract 468 face mesh landmarks from a BGR frame (normalized x, y, z).
    Backward-compatible helper using a default FaceMeshProcessor.
    """
    global _default_processor
    if _default_processor is None:
        _default_processor = FaceMeshProcessor()
    result = _default_processor.process_frame(frame)
    if not result["face_detected"]:
        return None
    h, w = frame.shape[:2]
    return [
        (x / w, y / h, 0.0)
        for (x, y) in result["landmarks"]
    ]


def close_face_mesh() -> None:
    """Release default FaceMeshProcessor resources."""
    global _default_processor
    if _default_processor is not None:
        _default_processor.close()
        _default_processor = None
