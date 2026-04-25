import uvicorn
import os
import sys

# Ensure the root directory is in the python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

if __name__ == "__main__":
    print("🚀 Starting Unified Interview Integrity System for Deployment...")
    # Hugging Face Spaces uses port 7860
    PORT = int(os.environ.get("PORT", 7860))
    print(f"📍 Host: 0.0.0.0 | Port: {PORT}")
    print("💡 Dashboard and AI Engine are now running in a single process.")
    
    # Run uvicorn
    uvicorn.run(
        "unified_backend:app", 
        host="0.0.0.0", 
        port=PORT, 
        reload=False # Disable reload for production
    )
