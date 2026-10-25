"""
SecretPixel Python Steganography REST API Server
================================================
Exposes lightweight, high-performance Flask endpoints for LSB image steganography
and AES-256-GCM authenticated encryption.

Endpoints:
- GET  /api/health     : Service health, uptime, and library versions
- GET  /api/info       : Protocol metadata, cipher suites, and capabilities
- POST /api/capacity   : Evaluates byte and character capacity of an image
- POST /api/hide       : Encrypts message and embeds into image pixels via LSB
- POST /api/extract    : Extracts and authenticates encrypted payload from stego-image
"""

import os
import sys
import time
import base64
import io
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import PIL
from PIL import Image

# Ensure python_backend package import works cleanly
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from python_backend.steganography import (
    hide_message_in_image,
    extract_message_from_image,
    calculate_capacity,
    HEADER_LENGTH,
    MAGIC_SIGNATURE,
    PROTOCOL_VERSION,
)

app = Flask(__name__)
# Enable CORS for local development and iframe integration
CORS(app, resources={r"/api/*": {"origins": "*"}})

START_TIME = time.time()


def extract_image_bytes_from_request():
    """Helper to extract image bytes from either multipart form or JSON payload."""
    if "image" in request.files:
        return request.files["image"].read(), request.files["image"].filename or "uploaded.png"

    if request.is_json:
        data = request.get_json(silent=True) or {}
        img_b64 = data.get("imageBase64") or data.get("imageDataUrl")
        if img_b64:
            if "," in img_b64:
                img_b64 = img_b64.split(",", 1)[1]
            try:
                raw_bytes = base64.b64decode(img_b64)
                return raw_bytes, data.get("filename", "image.png")
            except Exception as e:
                raise ValueError(f"Invalid base64 image data: {str(e)}")

    # Check form text
    img_b64 = request.form.get("imageBase64")
    if img_b64:
        if "," in img_b64:
            img_b64 = img_b64.split(",", 1)[1]
        raw_bytes = base64.b64decode(img_b64)
        return raw_bytes, request.form.get("filename", "image.png")

    raise ValueError("No image provided in request (expected 'image' file or 'imageBase64' string).")


@app.route("/api/health", methods=["GET"])
def health():
    """Health check endpoint."""
    return jsonify({
        "status": "ok",
        "service": "SecretPixel Python Steganography Engine",
        "runtime": f"Python {sys.version.split()[0]}",
        "pillow": PIL.__version__,
        "uptime": round(time.time() - START_TIME),
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    })


@app.route("/api/info", methods=["GET"])
def info():
    """Protocol metadata and cryptographic capabilities."""
    return jsonify({
        "protocol": "SPXL",
        "version": PROTOCOL_VERSION,
        "backend": "Python 3.11 / Pillow (PIL)",
        "ciphers": ["AES-256-GCM"],
        "kdf": "PBKDF2-HMAC-SHA-256",
        "kdfIterations": 100_000,
        "headerLengthBytes": HEADER_LENGTH,
        "steganography": "RGB LSB (Alpha-Preserving)",
        "offlineSupport": True,
        "deploymentMode": "python-flask-service"
    })


@app.route("/api/capacity", methods=["POST"])
def capacity():
    """Calculates image byte capacity for LSB hiding."""
    try:
        if request.is_json:
            data = request.get_json(silent=True) or {}
            width = data.get("width")
            height = data.get("height")
            if width and height:
                return jsonify(calculate_capacity(int(width), int(height)))

        img_bytes, _ = extract_image_bytes_from_request()
        img = Image.open(io.BytesIO(img_bytes))
        cap = calculate_capacity(img.width, img.height)
        return jsonify(cap)
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@app.route("/api/hide", methods=["POST"])
def hide():
    """
    Encrypts message with AES-256-GCM and embeds into image via LSB steganography.
    Accepts JSON or multipart/form-data.
    Returns stego PNG (as base64 data URL and metadata).
    """
    try:
        img_bytes, filename = extract_image_bytes_from_request()

        if request.is_json:
            json_data = request.get_json() or {}
            message = json_data.get("message", "")
            password = json_data.get("password", "")
        else:
            message = request.form.get("message", "")
            password = request.form.get("password", "")

        if not message.strip():
            return jsonify({"error": "Secret message cannot be empty."}), 400
        if not password:
            return jsonify({"error": "Encryption password is required."}), 400

        # Perform steganography in Python
        png_bytes, metrics = hide_message_in_image(img_bytes, message, password)

        # Check if caller wants direct binary file download
        if request.headers.get("Accept") == "image/png" or request.args.get("format") == "raw":
            return send_file(
                io.BytesIO(png_bytes),
                mimetype="image/png",
                as_attachment=True,
                download_name="secretpixel_encoded.png"
            )

        # Default: Return JSON with Base64 Data URL and full quality metrics
        b64_data = base64.b64encode(png_bytes).decode("ascii")
        data_url = f"data:image/png;base64,{b64_data}"

        return jsonify({
            "success": True,
            "stegoImageBase64": data_url,
            "filename": "secretpixel_encoded.png",
            "sizeBytes": len(png_bytes),
            "metrics": metrics,
        })

    except ValueError as ve:
        return jsonify({"error": str(ve)}), 400
    except Exception as ex:
        return jsonify({"error": f"Internal steganography error: {str(ex)}"}), 500


@app.route("/api/extract", methods=["POST"])
def extract():
    """
    Extracts LSB payload from stego-image, validates SPXL header, and decrypts.
    Accepts JSON or multipart/form-data.
    """
    try:
        img_bytes, filename = extract_image_bytes_from_request()

        if request.is_json:
            json_data = request.get_json() or {}
            password = json_data.get("password", "")
        else:
            password = request.form.get("password", "")

        if not password:
            return jsonify({"error": "Decryption password is required."}), 400

        # Extract and decrypt in Python
        plaintext, details = extract_message_from_image(img_bytes, password)

        return jsonify({
            "success": True,
            "message": plaintext,
            "payloadSizeBytes": details.get("cipherLength", 0),
            "details": details,
        })

    except ValueError as ve:
        err_msg = str(ve)
        err_type = "auth_failure" if "password" in err_msg.lower() else "signature_missing"
        return jsonify({"error": err_msg, "type": err_type}), 400
    except Exception as ex:
        return jsonify({"error": f"Internal extraction error: {str(ex)}"}), 500


if __name__ == "__main__":
    port = int(os.environ.get("PYTHON_PORT", "5000"))
    print(f"[SecretPixel Python API] Starting on http://127.0.0.1:{port}")
    app.run(host="0.0.0.0", port=port, debug=False)
