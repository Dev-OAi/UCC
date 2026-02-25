# UCC Data Integration: Current State & Future Enrichment

This document outlines the current capabilities of the UCC Automation system and proposed future enhancements.

## Current Capabilities (Phase 1 & 1.5)
- **Automated Watcher:** Background process monitors the `Uploads/` directory for new CSV files.
- **Staging Workflow:** Users can select the business name column and similarity threshold from the UI before starting a scrape.
- **Robust Scraper:**
  - Florida UCC API integration with 2.0s delay to avoid 500 errors.
  - **Fuzzy Matching:** SequenceMatcher-based similarity scoring to filter out irrelevant results.
  - **Match Score:** Displays a confidence percentage for each match in the UI.
  - **Extended Data:** Captures up to 5 Secured Parties per filing.
  - **Retry Logic:** Automatic retries with randomized delays for API resilience.
  - **Checkpointing:** Resumes from the last processed name if interrupted.
- **Unified Hub:** Consolidates all results into `Data/UCC Results/all_results.csv` with concurrent-safe file locking.
- **Real-time Status:** Frontend dashboard shows progress, current processing name, and system logs/errors.

## Future Enrichment (Phase 2)

### 1. Direct Master Hub Enrichment
Link scraped UCC data back to the original records in the SunBiz (SB) or UCC hubs to provide a single "Golden Record".
- **Logic:** Search for matching rows in master files by Business Name or Document Number and patch them with the latest UCC status.

### 2. PDF Document Download
The API provides a `documentPagesCount`. Future versions could automate the downloading of the actual UCC-1 or UCC-3 PDF filings for direct viewing in the app.

### 3. Secretary of State (SunBiz) Scraper
Expand the automation to also scrape SunBiz for updated Officer/Director information, Entity Status, and FEINs when they are missing from the initial upload.

## Technical Maintenance
- **Watcher:** `ucc_watcher.py` manages the queue and staging.
- **Worker:** `ucc_worker.py` performs the actual API calls.
- **Bridge:** `ucc_bridge.py` (Flask) enables communication between the React frontend and the backend processes.
- **Logs:** Check `ucc_watcher.log` and `ucc_bridge.log` for system health.
