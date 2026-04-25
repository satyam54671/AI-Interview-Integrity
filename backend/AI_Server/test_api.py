import requests
import base64
import cv2
import numpy as np
import json

def create_dummy_image():
    # Create a black image
    img = np.zeros((480, 640, 3), dtype=np.uint8)
    # Draw a rectangle to simulate a "face" so it's not empty, 
    # though FaceMesh won't detect it, we just want to test the API flow.
    cv2.rectangle(img, (200, 150), (400, 350), (255, 255, 255), -1)
    
    _, buffer = cv2.imencode('.jpg', img)
    base64_str = base64.b64encode(buffer).decode('utf-8')
    return base64_str

def test_analyze_endpoint():
    url = "http://localhost:8000/analyze"
    base64_img = create_dummy_image()
    
    payload = {
        "image": base64_img
    }
    
    try:
        print("Sending request to /analyze...")
        response = requests.post(url, json=payload)
        
        if response.status_code == 200:
            print("Success! Response:")
            print(json.dumps(response.json(), indent=2))
        else:
            print(f"Failed with status {response.status_code}")
            print(response.text)
            
    except requests.exceptions.ConnectionError:
        print("Error: Could not connect to localhost:8000. Is the backend running?")

if __name__ == "__main__":
    test_analyze_endpoint()
