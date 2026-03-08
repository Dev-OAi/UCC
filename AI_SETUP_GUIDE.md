# 🤖 AI Intelligence Suite Setup Guide

This project features a "Local-First" AI Intelligence system. Strategic reasoning and deep lead analysis happen **entirely on your local machine** using Ollama. No lead data or strategic insights are sent to external AI providers or GitHub.

---

---

### Phase 1: Setup Ollama (The Brain)
Your computer needs a "Brain" to process lead data. We use **Ollama**, which is free and private.

1. **Install Ollama:** Download and install it from [ollama.com](https://ollama.com).
2. **Download the Model:** Open your terminal (Command Prompt or Terminal) and run:
   ```bash
   ollama pull lfm2.5-thinking:1.2b
   ```
   *This is a lightweight but powerful model that understands banking rules.*
3. **Keep it Running:** Ensure the Ollama app is running in your system tray.

---

### Phase 2: Start the Bridge (The Messenger)
The "Bridge" is a Python script that lets your browser talk to Ollama and search the web.

1. **Install Requirements:** (If you haven't already)
   ```bash
   pip install flask flask-cors ollama beautifulsoup4 pandas requests fpdf
   ```
2. **Launch the Bridge:** Open **Command Prompt (CMD)** or Terminal, navigate to the project's root folder, and run:
   ```bash
   python3 ucc_bridge.py
   ```
   *(Note: The bridge file `ucc_bridge.py` is located in the main folder of this project.)*
   *You should see: `Running on http://0.0.0.0:5001`*

---

### Phase 3: Use the App
Now that the Brain and Messenger are active, you can use the new features:

#### 1. The "Deep Dive" (For Bankers)
- Go to the **Action Hub**.
- Select any lead from the queue.
- **Manual Context:** Use the "Manual Banker Context" box to add observations from networking or calls (e.g., "Owner mentioned they are hiring").
- Click the blue **"Get AI Intelligence Brief"** button.
- **What happens:** The Bridge performs a multi-vector search (News, Locations, Social) and combines it with your manual context. Ollama then writes a custom strategy card and email for you.
- **New Feature:** Click **"Download PDF Insight Brief"** to generate a professional 1-page summary for your files or to share with team members.

#### 2. Market Intelligence (For Managers)
- Click the **Market Intelligence** tab in the sidebar.
- **What happens:** You’ll see a dashboard of all the leads that have been "Deep Researched." It shows industry trends and the most recent findings from the territory.

#### 3. Nightly Discovery (Automatic)
- If you push this project to GitHub, it will automatically run a "Nightly Discovery" script.
- It finds new UCC filings and looks for hiring/expansion clues so they are ready for you the next morning.

---

### Troubleshooting
- **"Bridge Offline" Error:** Make sure you ran `python3 ucc_bridge.py`.
- **"AI Error":** Ensure Ollama is running and you have pulled the `lfm2.5-thinking:1.2b` model.

---

### 🔒 Private AI on a Public Website: How it Works
You might notice this project is hosted on GitHub. You might wonder: *"If the website is public, is my data public too?"*

**The answer is No.** Here is why:

1. **The "Localhost" Rule:** The website is programmed to talk only to `localhost` (which is YOUR computer). It's like a TV that only works if it's plugged into YOUR wall.
2. **Individual Silos:** If another banker visits the same public GitHub website, the website will try to talk to *their* computer. It cannot see your bridge, your Ollama, or your research.
3. **No Cloud Storage:** Lead research and AI "thinking" happen inside your computer's memory and the local `Business_Intelligence.csv` file on your drive. None of this is "uploaded" to GitHub unless you manually commit and push files yourself.

---

### Browser Security & Privacy
Because this tool uses a **Local AI** strategy, your browser may ask for permission to "Access other apps and services on this device."

1. **Is it safe?** Yes. This is Chrome's way of saying "this website is trying to talk to a tool on your computer." Since YOU are running the tool (`ucc_bridge.py`), it is completely safe.
2. **Why do I need to click Allow?** If you don't, the website cannot "talk" to Ollama, and the AI features will stay Offline.
3. **Data Privacy:** Your lead data and strategy notes **never leave your computer**. They are sent to your local bridge, processed by your local Ollama, and displayed back to you. Nothing is sent to external AI servers.
