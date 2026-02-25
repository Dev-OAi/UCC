from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import os
from werkzeug.utils import secure_filename

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = "Uploads"
COMMANDS_DIR = os.path.join(UPLOAD_FOLDER, "Commands")

# Ensure directories exist
for d in [UPLOAD_FOLDER, COMMANDS_DIR]:
    os.makedirs(d, exist_ok=True)

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
    if file and file.filename.lower().endswith('.csv'):
        filename = secure_filename(file.filename)
        # Ensure filename is unique if it exists?
        # Actually watcher handles move to staging immediately, but just in case:
        save_path = os.path.join(UPLOAD_FOLDER, filename)
        file.save(save_path)
        return jsonify({"status": "File uploaded successfully", "filename": filename}), 200
    return jsonify({"error": "Invalid file type. Only CSV allowed."}), 400

@app.route('/command', methods=['POST'])
def handle_command():
    data = request.json
    if not data or 'filename' not in data:
        return jsonify({"error": "Invalid command"}), 400

    # Sanitize inputs to prevent path traversal
    job_id = os.path.basename(data.get('job_id', 'cmd'))
    filename = job_id + ".json"
    filepath = os.path.join(COMMANDS_DIR, filename)

    # Also sanitize the target filename for the worker
    data['filename'] = os.path.basename(data['filename'])

    with open(filepath, 'w') as f:
        json.dump(data, f)

    return jsonify({"status": "Command received", "file": filepath}), 200

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5001)
