# AI Interview Integrity System

A production-grade interview surveillance platform using MediaPipe, DeepFace, and FastAPI.

## 🚀 Deployment Guide

### 1. Backend (Hugging Face Spaces)
1. Create a new **Space** on Hugging Face.
2. Select **Docker** as the SDK.
3. Upload everything inside the `backend/` directory.
4. Hugging Face will automatically build and host the API.

### 2. Frontend (Vercel)
1. Push the `frontend/` directory to GitHub.
2. Connect the repository to **Vercel**.
3. Set the Environment Variable:
   - `VITE_API_URL`: Your Hugging Face Space URL (e.g., `https://user-space.hf.space`)
4. Deploy.

## 🛡️ Security Protocol
The system detects:
- Tab switching
- Gaze deviation
- Multiple faces
- Continuous speaking
- Emotional anomalies
