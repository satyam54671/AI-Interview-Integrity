import requests
import base64
import cv2
import numpy as np
import json
import time

BASE_URL = "http://localhost:8000"

def create_dummy_image():
    img = np.zeros((480, 640, 3), dtype=np.uint8)
    cv2.rectangle(img, (200, 150), (400, 350), (255, 255, 255), -1)
    _, buffer = cv2.imencode('.jpg', img)
    return base64.b64encode(buffer).decode('utf-8')

def test_integrity_flow():
    print("--- Starting Integrity Layer Verification ---")
    
    # 1. Initial Analysis
    print("\n1. Testing /analyze (Initial)...")
    payload = {"image": create_dummy_image()}
    try:
        resp = requests.post(f"{BASE_URL}/analyze", json=payload)
        data = resp.json()
        print(f"Initial Score: {data.get('final_score')}")
        print(f"Initial Penalty: {data.get('integrity_penalty')}")
    except Exception as e:
        print(f"Failed: {e}")
        return

    # 2. Register Violation
    print("\n2. Testing /violation (Simulating Tab Switch)...")
    try:
        resp = requests.post(f"{BASE_URL}/violation", json={"type": "tab_switch"})
        print(f"Response: {resp.json()}")
    except Exception as e:
        print(f"Failed: {e}")

    # 3. Verify Penalty Applied
    print("\n3. Testing /analyze (After Violation)...")
    try:
        resp = requests.post(f"{BASE_URL}/analyze", json=payload)
        data = resp.json()
        print(f"New Score: {data.get('final_score')}")
        print(f"New Penalty: {data.get('integrity_penalty')}")
        
        if data.get('integrity_penalty') >= 20:
            print("SUCCESS: Penalty applied correctly.")
        else:
            print("FAILURE: Penalty not applied.")
            
    except Exception as e:
        print(f"Failed: {e}")

if __name__ == "__main__":
    test_integrity_flow()
