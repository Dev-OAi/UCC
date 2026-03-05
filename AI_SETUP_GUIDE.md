# 🤖 AI Intelligence Suite Setup Guide

This project now features a "Real-Time Intelligence" system that uses your local computer to research leads and generate banking strategies. Here is how to get everything running.

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
2. **Launch the Bridge:** Run this command in your project folder:
   ```bash
   python3 ucc_bridge.py
   ```
   *You should see: `Running on http://0.0.0.0:5001`*

---

### Phase 3: Use the App
Now that the Brain and Messenger are active, you can use the new features:

#### 1. The "Deep Dive" (For Bankers)
- Go to the **Action Hub**.
- Select any lead from the queue.
- Click the blue **"Get AI Intelligence Brief"** button.
- **What happens:** The Bridge will scrape the lead's website, find "growth signals," and Ollama will write a custom strategy card and email for you.
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
