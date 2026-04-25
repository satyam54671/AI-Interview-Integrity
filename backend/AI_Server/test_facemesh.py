"""
Face Mesh Processor using MediaPipe Tasks API
Compatible with mediapipe 0.10.x (Apple Silicon)
"""

import cv2
import mediapipe as mp
from mediapipe.tasks.python import vision
from mediapipe.tasks import python


class FaceMeshProcessor:
    def __init__(self):
        base_options = python.BaseOptions(
            model_asset_path="face_landmarker.task"
        )

        options = vision.FaceLandmarkerOptions(
            base_options=base_options,
            running_mode=vision.RunningMode.IMAGE,
            num_faces=1
        )

        self.detector = vision.FaceLandmarker.create_from_options(options)

    def process_frame(self, frame):
        if frame is None or frame.size == 0:
            return {"landmarks": [], "face_detected": False}

        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

        mp_image = mp.Image(
            image_format=mp.ImageFormat.SRGB,
            data=rgb_frame
        )

        results = self.detector.detect(mp_image)

        if not results.face_landmarks:
            return {"landmarks": [], "face_detected": False}

        h, w, _ = frame.shape
        pixel_landmarks = []

        for lm in results.face_landmarks[0]:
            x = int(lm.x * w)
            y = int(lm.y * h)
            pixel_landmarks.append((x, y))

        return {
            "landmarks": pixel_landmarks,
            "face_detected": True
        }

    def close(self):
        pass
