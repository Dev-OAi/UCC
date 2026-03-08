import csv
import time
from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import os
import re
import requests
import pandas as pd
from fpdf import FPDF
from bs4 import BeautifulSoup
from werkzeug.utils import secure_filename
from flask import send_from_directory
import ollama

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = "public/Uploads"
COMMANDS_DIR = os.path.join(UPLOAD_FOLDER, "Commands")
STAGING_DIR = os.path.join(UPLOAD_FOLDER, "Staging")
LEAD_BRIEFS_DIR = "Lead_Insight_Briefs"
INTEL_FILE = "Data/Intelligence/Business_Intelligence.csv"

# Ensure directories exist
for d in [UPLOAD_FOLDER, COMMANDS_DIR, STAGING_DIR, LEAD_BRIEFS_DIR]:
    os.makedirs(d, exist_ok=True)

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ok"}), 200

@app.route('/manual', methods=['POST'])
def manual_search():
    data = request.json
    if not data or ('name' not in data and 'names' not in data):
        return jsonify({"error": "No name provided"}), 400

    names = []
    if 'names' in data:
        names = [n.strip() for n in data['names'] if n.strip()]
    else:
        # Handle multiline name string
        raw_name = data['name']
        names = [n.strip() for n in raw_name.replace('\r', '\n').split('\n') if n.strip()]

    if not names:
        return jsonify({"error": "No valid names provided"}), 400

    job_id = data.get('job_id', f"manual_{int(time.time())}")
    mode = data.get('mode', 'standard')

    # 1. Create a CSV in Staging
    base_name = secure_filename(names[0][:20])
    filename = f"manual_{base_name}_{int(time.time())}.csv"
    filepath = os.path.join(STAGING_DIR, filename)

    with open(filepath, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(["Name"])
        for name in names:
            writer.writerow([name])

    # 2. Trigger the scrape immediately via Command
    cmd_filename = f"{job_id}.json"
    cmd_filepath = os.path.join(COMMANDS_DIR, cmd_filename)

    cmd_data = {
        "action": "start_scrape",
        "filename": filename,
        "column": "Name",
        "threshold": data.get('threshold', 0.7),
        "job_id": job_id,
        "mode": mode
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

@app.route('/stop', methods=['POST'])
def stop_all_scrapes():
    try:
        # Kill any running worker processes
        os.system("pkill -f ucc_worker.py")
        # Also clear any pending commands in the Commands directory to prevent restart
        for f in os.listdir(COMMANDS_DIR):
            if f.endswith('.json'):
                try:
                    os.remove(os.path.join(COMMANDS_DIR, f))
                except:
                    pass
        return jsonify({"status": "All scrapes stopped and commands cleared"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/delete_pending', methods=['POST'])
def delete_pending():
    data = request.json
    if not data or 'filename' not in data:
        return jsonify({"error": "No filename provided"}), 400

    filename = os.path.basename(data['filename'])
    filepath = os.path.join(STAGING_DIR, filename)

    if os.path.exists(filepath):
        try:
            os.remove(filepath)
            # Update the pending jobs file immediately
            os.system("python3 -c \"from ucc_watcher import update_pending_jobs; update_pending_jobs()\"")
            return jsonify({"status": f"Deleted {filename}"}), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    return jsonify({"error": "File not found"}), 404

@app.route('/system/status', methods=['GET'])
def system_status():
    watcher_alive = False
    worker_alive = False
    try:
        # Check if ucc_watcher.py is running
        if os.popen("pgrep -f ucc_watcher.py").read().strip():
            watcher_alive = True
        # Check if ucc_worker.py is running
        if os.popen("pgrep -f ucc_worker.py").read().strip():
            worker_alive = True
    except:
        pass

    return jsonify({
        "bridge": "online",
        "watcher": "online" if watcher_alive else "offline",
        "worker": "active" if worker_alive else "idle",
        "timestamp": time.time()
    }), 200

@app.route('/system/restart', methods=['POST'])
def system_restart():
    try:
        # Restart the watcher
        os.system("pkill -f ucc_watcher.py")
        os.system("pkill -f ucc_worker.py")
        time.sleep(1)
        os.system("python3 ucc_watcher.py > watcher_output.log 2>&1 &")

        return jsonify({"status": "Watcher restart triggered"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# =================================================================
# ENRICHMENT & AI LOGIC (PHASE 2)
# =================================================================

BANKING_RULES = """
- ROLE: You are a Senior Valley Bank Expert Commercial Banker with 20+ years of experience.
- CORE PRODUCTS (High-Value Vertical Focus):
    * SMB Bundle 3 (Premier Business) - [30 POINTS] Lead with this for established firms.
    * SBA 7(a) & 504 Loans - Critical for expansion, building purchases, or business acquisition.
    * Business Analysis Checking - Essential for "Heavy Transactors" (Manufacturing, Distribution, Retail).
    * Treasury Management Suite:
        - Remote Deposit Capture (RDC): For firms with high check volume or multiple regional offices.
        - ACH Positive Pay & Check Positive Pay: Mandatory "Fraud Prevention" for high-dollar manufacturers.
        - ACH Origination [10 POINTS]: For payroll and vendor payments.
    * Merchant Services (Fiserv): Lead with this for any B2C retail/service business.
    * Partner Referrals:
        - ADP Payroll: [25 POINTS] Essential if 'Hiring' or 'Scale' is mentioned.
        - Valley National Title & Insurance: Vital for Storage, Real Estate, or Property Management.
        - Specialized: Escrow/IOLTA (Law Firms), HOA (Prop Management).
    * Commercial & Industrial (C&I) / Lines of Credit: For raw material inventory or working capital cycles.

- TRIGGER & PATTERN MATCHING LOGIC:
    * If 'Hiring' or 'Careers' -> Suggest ADP Payroll + SMB Bundle 3.
    * If 'New Site' or 'Opening Soon' -> Suggest SBA Loans + Treasury (RDC) + Title/Insurance.
    * If Industry is 'Manufacturing' -> Suggest Business Analysis Checking + RDC + Positive Pay (Fraud Protection).
    * If Industry is 'Retail', 'Automotive', 'Food Services', or 'Hospitality' -> Suggest Fiserv Merchant Services + Analysis Checking.
    * If Industry is 'Professional Services' (Law/Accounting) -> Suggest IOLTA/Escrow + Bill Pay. **(STRICT: IOLTA is ONLY for Law Firms).**
    * If Industry is 'Storage' or 'Real Estate' -> Suggest SBA 504 + Valley National Title + Insurance.
    * If multiple physical locations detected -> Suggest Remote Deposit Capture (RDC).
    * If HIGH Transaction Volume detected -> Suggest Analysis Checking to offset fees with Earnings Credit.

- STYLE: Senior, strategic, and proactive. Focus on "Total Relationship Value". Talk like a partner, not a vendor.
"""

def web_search_fallback(query):
    # Multi-Vector Fallback: News, Growth, and Basic Info
    vectors = [
        f"{query} news growth",
        f"{query} owner linkedin",
        f"{query} locations"
    ]
    all_clues = []

    for v in vectors:
        try:
            url = f"https://www.google.com/search?q={v}&gbv=1"
            headers = {'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)'}
            res = requests.get(url, headers=headers, timeout=8)
            if res.status_code == 200:
                soup = BeautifulSoup(res.text, 'html.parser')
                results = soup.find_all(['div', 'h3'], class_=['kCrYT', 'BNeawe'])
                if results:
                    all_clues.append(" ".join([r.get_text() for r in results[:3]]))
            time.sleep(1) # Be gentle
        except:
            continue

    return " | ".join(all_clues) if all_clues else ""

def get_website_content(url, business_name=None):
    if not url or str(url).lower() in ["n/a", "none", ""]:
        if business_name:
            return web_search_fallback(business_name), []
        return "", []

    if not str(url).startswith(('http://', 'https://')):
        url = 'http://' + str(url)

    try:
        headers = {'User-Agent': 'Mozilla/5.0'}
        response = requests.get(url, timeout=10, headers=headers)
        soup = BeautifulSoup(response.text, 'html.parser')
        content = " ".join(soup.get_text().split())[:3000]

        sub_links = []
        for link in soup.find_all('a', href=True):
            href = link['href'].lower()
            if any(x in href for x in ['about', 'contact', 'team', 'staff', 'owner', 'career', 'service', 'product', 'news']):
                full_url = href if href.startswith('http') else url.rstrip('/') + '/' + href.lstrip('/')
                sub_links.append(full_url)

        return content, list(set(sub_links))[:5]
    except:
        if business_name:
            return web_search_fallback(business_name), []
        return "", []

@app.route('/research', methods=['POST'])
def research_lead():
    data = request.json
    if not data or 'businessName' not in data:
        return jsonify({"error": "Business name is required"}), 400

    business_name = data['businessName']
    website = data.get('website', '')
    industry = data.get('industry', 'Business')
    city = data.get('city', '')
    zip_code = data.get('zip', '')
    manual_context = data.get('manualContext', '')

    # 1. THE EYES (Research)
    content, sub_links = get_website_content(website, business_name)

    # 2. THE BRAIN (Ollama)
    prompt = f"""
    ROLE: Senior Valley Bank Expert Product Matching Agent.
    CONTEXT: Analyzing business '{business_name}' in industry '{industry}'.

    BANKING RULES:
    {BANKING_RULES}

    RESEARCH DATA:
    - Business: {business_name}
    - Found Web Context: {content[:4000]}
    - BANKER'S MANUAL OBSERVATION: {manual_context}

    TASK:
    1. Weigh the 'BANKER'S MANUAL OBSERVATION' extremely highly. If the banker mentions growth or hiring, prioritize ADP and SBA products regardless of what the web says.
    2. Identify exact products from BANKING RULES.
    2. Provide a 3-sentence 'Strategic Intelligence' summary.
    3. Detect 'Signals' (hiring, expansion, etc).
    4. Write a personalized 3-sentence outreach script.

    OUTPUT FORMAT (JSON ONLY):
    {{
        "products": ["Product 1", "Product 2"],
        "intelligence": "...",
        "signals": ["Signal 1", "Signal 2"],
        "script": "...",
        "naics": "000000"
    }}
    """

    try:
        response = ollama.generate(model="lfm2.5-thinking:1.2b", prompt=prompt)
        # Attempt to parse JSON from AI response
        ai_text = response['response']
        # Simple extraction if AI includes markdown
        json_match = re.search(r'\{.*\}', ai_text, re.DOTALL)
        if json_match:
            ai_data = json.loads(json_match.group())

            # Save to Business_Intelligence.csv
            new_intel = {
                'Business Name': business_name,
                'NAICS_Code': ai_data.get('naics', '000000'),
                'Industry_Pain_Point': ai_data.get('intelligence', ''),
                'Suppliers_Customers': ", ".join(ai_data.get('signals', []))
            }

            if not os.path.exists(INTEL_FILE):
                pd.DataFrame(columns=['Business Name', 'NAICS_Code', 'Industry_Pain_Point', 'Suppliers_Customers']).to_csv(INTEL_FILE, index=False)

            intel_df = pd.read_csv(INTEL_FILE)
            intel_df = pd.concat([intel_df, pd.DataFrame([new_intel])], ignore_index=True)
            intel_df.to_csv(INTEL_FILE, index=False)
        else:
            ai_data = {"error": "AI response format invalid"}

        return jsonify({
            "businessName": business_name,
            "ai": ai_data,
            "raw_content_preview": content[:200]
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/briefs/<filename>', methods=['GET'])
def get_brief(filename):
    return send_from_directory(LEAD_BRIEFS_DIR, filename)

@app.route('/generate-brief', methods=['POST'])
def generate_brief():
    data = request.json
    if not data or 'businessName' not in data or 'ai' not in data:
        return jsonify({"error": "Missing data for brief generation"}), 400

    business_name = data['businessName']
    ai_res = data['ai']
    industry = data.get('industry', 'Business')
    website = data.get('website', 'N/A')

    try:
        # Clean business name for filename
        safe_name = re.sub(r'[^a-zA-Z0-9]', '_', business_name)
        pdf_filename = f"{safe_name}_Insight_Brief.pdf"
        pdf_path = os.path.join(LEAD_BRIEFS_DIR, pdf_filename)

        pdf = FPDF()
        pdf.add_page()
        pdf.set_font("Arial", 'B', 16)
        pdf.cell(0, 10, txt="Valley Bank: Lead Insight Brief", ln=True, align='C')
        pdf.ln(5)

        # Business Basics - Header
        pdf.set_font("Arial", 'B', 12)
        pdf.set_fill_color(220, 230, 240)
        pdf.cell(0, 10, txt=f"TARGET: {business_name}", ln=True, fill=True)
        pdf.ln(2)

        # Helper for wrapped field layout
        def field(label, value):
            pdf.set_font("Arial", 'B', 10)
            pdf.cell(0, 8, txt=f"{label}:", ln=True)
            pdf.set_font("Arial", '', 10)
            pdf.multi_cell(0, 7, txt=str(value))
            pdf.ln(1)

        field("Website", website)
        field("Industry", industry)
        pdf.ln(2)

        # Intelligence Section
        pdf.set_font("Arial", 'B', 12)
        pdf.cell(0, 10, txt="Strategic Intelligence", ln=True, border='B')
        pdf.ln(2)

        pdf.set_font("Arial", 'B', 10)
        pdf.cell(0, 8, txt=f"NAICS Code: {ai_res.get('naics', 'N/A')}", ln=True)

        field("Detected Triggers & Pain Points", ai_res.get('intelligence', 'Standard industry needs.'))
        field("Signals Detected", ", ".join(ai_res.get('signals', [])))
        pdf.ln(2)

        # Expert Matching
        pdf.set_font("Arial", 'B', 12)
        pdf.set_text_color(0, 102, 204) # Professional Blue
        pdf.set_fill_color(245, 245, 245)
        pdf.cell(0, 12, txt=f"EXPERT PROPOSED SOLUTIONS: {', '.join(ai_res.get('products', []))}", ln=True, fill=True)
        pdf.set_text_color(0, 0, 0)
        pdf.ln(4)

        # Conversion Starter
        pdf.set_font("Arial", 'B', 12)
        pdf.cell(0, 10, txt="Conversation Starter", ln=True, border='B')
        pdf.ln(2)
        pdf.set_font("Arial", 'I', 10)
        pdf.multi_cell(0, 7, txt=ai_res.get('script', 'N/A'))

        pdf.output(pdf_path)

        return jsonify({
            "status": "Brief generated",
            "filename": pdf_filename,
            "path": pdf_path
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/market-intelligence', methods=['GET'])
def get_market_intelligence():
    intel_file = INTEL_FILE
    if not os.path.exists(intel_file):
        return jsonify({
            "summary": "No intelligence data collected yet.",
            "top_industries": [],
            "growth_signals": 0,
            "recent_findings": []
        }), 200

    try:
        df = pd.read_csv(intel_file)

        # Simple aggregation for the manager
        top_industries = df['NAICS_Code'].value_counts().head(5).to_dict()
        growth_signals = df['Industry_Pain_Point'].str.contains('growth|expand|hiring', case=False).sum()

        return jsonify({
            "summary": f"Analyzed {len(df)} leads in this territory.",
            "top_industries": [{"code": k, "count": int(v)} for k, v in top_industries.items()],
            "growth_signals": int(growth_signals),
            "recent_findings": df.tail(10).to_dict(orient='records')
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5001)
