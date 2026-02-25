import csv
import time
from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import os
from werkzeug.utils import secure_filename

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = "public/Uploads"
COMMANDS_DIR = os.path.join(UPLOAD_FOLDER, "Commands")
STAGING_DIR = os.path.join(UPLOAD_FOLDER, "Staging")

# Ensure directories exist
for d in [UPLOAD_FOLDER, COMMANDS_DIR, STAGING_DIR]:
    os.makedirs(d, exist_ok=True)

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ok"}), 200

@app.route('/manual', methods=['POST'])
def manual_search():
    data = request.json
    if not data or 'name' not in data:
        return jsonify({"error": "No name provided"}), 400

    name = data['name'].strip()
    job_id = data.get('job_id', f"manual_{int(time.time())}")

    # 1. Create a single-name CSV in Staging
    filename = f"{secure_filename(name)}_{int(time.time())}.csv"
    filepath = os.path.join(STAGING_DIR, filename)

    with open(filepath, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(["Name"])
        writer.writerow([name])

    # 2. Trigger the scrape immediately via Command
    cmd_filename = f"{job_id}.json"
    cmd_filepath = os.path.join(COMMANDS_DIR, cmd_filename)

    cmd_data = {
        "action": "start_scrape",
        "filename": filename,
        "column": "Name",
        "threshold": 0.7,
        "job_id": job_id
    }

    with open(cmd_filepath, 'w') as f:
        json.dump(cmd_data, f)

    return jsonify({
        "status": "Manual search triggered",
        "job_id": job_id,
        "filename": filename
    }), 200

@app.route('/upload', methods=['POST'])
def upload_file():
    app.logger.info(f"Upload request received: {request.files}")
    if 'file' not in request.files:
        app.logger.error("No file part in request")
        return jsonify({"error": "No file part"}), 400
    file = request.files['file']
    if file.filename == '':
        app.logger.error("No selected file")
        return jsonify({"error": "No selected file"}), 400
    if file and file.filename.lower().endswith('.csv'):
        filename = secure_filename(file.filename)
        save_path = os.path.join(UPLOAD_FOLDER, filename)
        try:
            file.save(save_path)
            app.logger.info(f"File saved to {save_path}")
            return jsonify({"status": "File uploaded successfully", "filename": filename}), 200
        except Exception as e:
            app.logger.error(f"Failed to save file: {str(e)}")
            return jsonify({"error": f"Internal server error: {str(e)}"}), 500
    app.logger.error(f"Invalid file type: {file.filename}")
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
