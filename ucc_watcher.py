import time
import os
import subprocess
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

WATCH_DIRECTORY = "Uploads"
PROCESSED_DIRECTORY = os.path.join(WATCH_DIRECTORY, "Processed")

class NewFileHandler(FileSystemEventHandler):
    def on_created(self, event):
        if not event.is_directory and event.src_path.endswith('.csv'):
            # Check if it's already in Processed (shouldn't happen with recursive=False)
            if "Processed" in event.src_path:
                return
            print(f"New file detected: {event.src_path}")
            self.process_file(event.src_path)

    def process_file(self, file_path):
        # Small delay to ensure the file is completely written
        time.sleep(2)

        filename = os.path.basename(file_path)

        print(f"Starting worker for {filename}...")
        try:
            subprocess.run(["python3", "ucc_worker.py", file_path], check=True)

            # Move to processed
            dest_path = os.path.join(PROCESSED_DIRECTORY, filename)
            # Handle name collisions in processed
            if os.path.exists(dest_path):
                base, ext = os.path.splitext(filename)
                dest_path = os.path.join(PROCESSED_DIRECTORY, f"{base}_{int(time.time())}{ext}")

            os.rename(file_path, dest_path)
            print(f"Finished processing {filename}. Moved to {PROCESSED_DIRECTORY}.")
        except subprocess.CalledProcessError as e:
            print(f"Error processing {filename}: {e}")
        except Exception as e:
            print(f"Unexpected error: {e}")

if __name__ == "__main__":
    if not os.path.exists(WATCH_DIRECTORY):
        os.makedirs(WATCH_DIRECTORY)
    if not os.path.exists(PROCESSED_DIRECTORY):
        os.makedirs(PROCESSED_DIRECTORY)

    # Check for existing files in Uploads on startup
    for f in os.listdir(WATCH_DIRECTORY):
        f_path = os.path.join(WATCH_DIRECTORY, f)
        if os.path.isfile(f_path) and f.endswith('.csv'):
            print(f"Found existing file on startup: {f}")
            handler = NewFileHandler()
            handler.process_file(f_path)

    event_handler = NewFileHandler()
    observer = Observer()
    observer.schedule(event_handler, WATCH_DIRECTORY, recursive=False)
    observer.start()
    print(f"Watching directory: {WATCH_DIRECTORY}")

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
    observer.join()
