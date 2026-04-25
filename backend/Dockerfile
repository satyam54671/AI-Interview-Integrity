# Use Python 3.9 as base
FROM python:3.9

# Create user to avoid running as root
RUN useradd -m -u 1000 user
USER user
ENV HOME=/home/user \
	PATH=/home/user/.local/bin:$PATH

WORKDIR $HOME/app

# Install system dependencies for OpenCV and MediaPipe
USER root
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*
USER user

# Copy requirements and install
COPY --chown=user requirements.txt $HOME/app/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY --chown=user . $HOME/app

# Hugging Face Spaces run on port 7860
EXPOSE 7860

# Command to run the unified backend
CMD ["python", "run_app.py"]
