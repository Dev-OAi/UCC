import time
import os
import subprocess
import json
import csv
import threading
import queue
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

WATCH_DIRECTORY = "public/Uploads"
STAGING_DIRECTORY = os.path.join(WATCH_DIRECTORY, "Staging")
COMMANDS_DIRECTORY = os.path.join(WATCH_DIRECTORY, "Commands")
PROCESSED_DIRECTORY = os.path.join(WATCH_DIRECTORY, "Processed")
PENDING_JOBS_FILE = os.path.join(WATCH_DIRECTORY, "pending_jobs.json")
STATUS_DIRECTORY = os.path.join(WATCH_DIRECTORY, "status") # Simplified path

# Ensure directories exist
for d in [STAGING_DIRECTORY, COMMANDS_DIRECTORY, PROCESSED_DIRECTORY, STATUS_DIRECTORY]:
    os.makedirs(d, exist_ok=True)

def get_csv_headers(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
            reader = csv.reader(f)
            return next(reader, [])
    except Exception as e:
        print(f"Error reading headers from {filepath}: {e}")
        return []

def update_pending_jobs():
    jobs = []
    if os.path.exists(STAGING_DIRECTORY):
        for f in os.listdir(STAGING_DIRECTORY):
            if f.endswith('.csv'):
                f_path = os.path.join(STAGING_DIRECTORY, f)
                jobs.append({
                    "filename": f,
                    "headers": get_csv_headers(f_path),
                    "added_at": os.path.getctime(f_path)
                })

    # Atomic write
    temp_file = PENDING_JOBS_FILE + ".tmp"
    with open(temp_file, 'w') as f:
        json.dump(jobs, f, indent=2)
    os.rename(temp_file, PENDING_JOBS_FILE)

class NewFileHandler(FileSystemEventHandler):
    def on_created(self, event):
        if not event.is_directory and event.src_path.endswith('.csv'):
            # Ignore if already in special directories
            if any(x in event.src_path for x in ["Staging", "Commands", "Processed", ".checkpoints"]):
                return

            print(f"New file detected: {event.src_path}")
            time.sleep(1) # Let it finish writing
            filename = os.path.basename(event.src_path)
            dest = os.path.join(STAGING_DIRECTORY, filename)

            # Handle collision
            if os.path.exists(dest):
                base, ext = os.path.splitext(filename)
                dest = os.path.join(STAGING_DIRECTORY, f"{base}_{int(time.time())}{ext}")

            try:
                os.rename(event.src_path, dest)
                update_pending_jobs()
                print(f"Moved {filename} to Staging.")
            except Exception as e:
                print(f"Error moving file: {e}")

class CommandHandler(FileSystemEventHandler):
    def __init__(self, processing_queue):
        self.processing_queue = processing_queue

    def on_created(self, event):
        if not event.is_directory and event.src_path.endswith('.json'):
            print(f"New command detected: {event.src_path}")
            time.sleep(0.5)
            try:
                with open(event.src_path, 'r') as f:
                    cmd = json.load(f)

                if cmd.get("action") == "start_scrape":
                    self.processing_queue.put(cmd)

                # Cleanup command file
                os.remove(event.src_path)
            except Exception as e:
                print(f"Error processing command {event.src_path}: {e}")

def worker_thread(processing_queue):
    while True:
        cmd = processing_queue.get()
        if cmd is None: break

        filename = cmd.get("filename")
        staging_path = os.path.join(STAGING_DIRECTORY, filename)

        if not os.path.exists(staging_path):
            print(f"File {filename} not found in Staging, skipping.")
            processing_queue.task_done()
            continue

        print(f"Starting worker for {filename}...")
        try:
            # Build command
            args = ["python3", "ucc_worker.py", staging_path]
            if cmd.get("threshold"):
                args.extend(["--threshold", str(cmd.get("threshold"))])
            if cmd.get("column"):
                args.extend(["--column", str(cmd.get("column"))])

            # Job ID for status
            job_id = cmd.get("job_id", filename)
            args.extend(["--job_id", job_id])

            subprocess.run(args, check=True)

            # Move to processed
            dest_path = os.path.join(PROCESSED_DIRECTORY, filename)
            if os.path.exists(dest_path):
                base, ext = os.path.splitext(filename)
                dest_path = os.path.join(PROCESSED_DIRECTORY, f"{base}_{int(time.time())}{ext}")

            os.rename(staging_path, dest_path)
            update_pending_jobs()
            print(f"Finished processing {filename}.")
        except subprocess.CalledProcessError as e:
            print(f"Error processing {filename}: {e}")
        except Exception as e:
            print(f"Unexpected error processing {filename}: {e}")

        processing_queue.task_done()

if __name__ == "__main__":
    # Initial sync of staging
    update_pending_jobs()

    processing_queue = queue.Queue()

    # Start worker thread
    t = threading.Thread(target=worker_thread, args=(processing_queue,))
    t.daemon = True
    t.start()

    observer = Observer()

    # Watch for new CSVs in root Uploads
    observer.schedule(NewFileHandler(), WATCH_DIRECTORY, recursive=False)

    # Watch for new commands in Commands dir
    observer.schedule(CommandHandler(processing_queue), COMMANDS_DIRECTORY, recursive=False)

    observer.start()
    print(f"Watcher started. Monitoring {WATCH_DIRECTORY} and {COMMANDS_DIRECTORY}")

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
        processing_queue.put(None)
    observer.join()
