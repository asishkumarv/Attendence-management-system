import os
import cv2
import numpy as np
import face_recognition
from flask import Flask, request, jsonify

app = Flask(__name__)

# Basic health check endpoint
@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ok", "message": "Face recognition service is running"})

# Endpoint to extract face encoding from an image (used during registration)
@app.route('/encode', methods=['POST'])
def get_encoding():
    try:
        if 'image' not in request.files:
            return jsonify({"error": "No image provided"}), 400
        
        file = request.files['image']
        # Read the file bytes directly and decode with OpenCV
        file_bytes = np.frombuffer(file.read(), np.uint8)
        img_bgr = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)
        
        if img_bgr is None:
            return jsonify({"error": "Failed to decode image"}), 400
            
        # Convert BGR (OpenCV default) to RGB (face_recognition expects RGB)
        image = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
        
        # Detect face encodings
        encodings = face_recognition.face_encodings(image)
        
        if len(encodings) == 0:
            return jsonify({"error": "No face detected in the image"}), 400
        if len(encodings) > 1:
            return jsonify({"error": "Multiple faces detected. Please ensure only one face is in the image"}), 400
            
        # Convert numpy array to list for JSON serialization
        encoding_list = encodings[0].tolist()
        return jsonify({"encoding": encoding_list})
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

# Endpoint to verify a face against a known encoding (used during login/logoff)
@app.route('/verify', methods=['POST'])
def verify_face():
    if 'image' not in request.files:
        return jsonify({"error": "No image provided"}), 400
    if 'known_encoding' not in request.form:
        return jsonify({"error": "No known encoding provided"}), 400
        
    try:
        import json
        known_encoding_list = json.loads(request.form['known_encoding'])
        known_encoding = np.array(known_encoding_list)
        
        file = request.files['image']
        unknown_image = face_recognition.load_image_file(file)
        unknown_encodings = face_recognition.face_encodings(unknown_image)
        
        if len(unknown_encodings) == 0:
            return jsonify({"error": "No face detected in the image"}), 400
            
        unknown_encoding = unknown_encodings[0]
        
        # Compare faces
        results = face_recognition.compare_faces([known_encoding], unknown_encoding, tolerance=0.6)
        match = bool(results[0])
        
        # Calculate distance (confidence)
        face_distances = face_recognition.face_distance([known_encoding], unknown_encoding)
        confidence = 1 - face_distances[0]
        
        return jsonify({
            "match": match,
            "confidence": float(confidence)
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    # Run on port 5001 to avoid conflict with Node.js which usually runs on 5000
    port = int(os.environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=port)
