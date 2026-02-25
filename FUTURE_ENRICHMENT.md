# Future Enrichment Strategy: UCC Data Integration

This document outlines the proposed strategy for the next phase of the UCC tool: automatically updating or enriching existing records in the "All" or "3. UCC" hubs with scraped data.

## Phase 2 Goals
1. **Identify Matches:** Link scraped UCC data back to the original records in the SunBiz (SB) or UCC hubs.
2. **Data Enrichment:** Update fields like `UCC Status`, `Date Filed`, and `Expires` in the master datasets.
3. **Audit Trail:** Maintain a record of when a data point was last updated by the scraper.

## Implementation Steps

### 1. Unique Identifier Mapping
To accurately update records, we must use a reliable unique identifier.
- **SunBiz Records:** Use the `Document Number` (e.g., `L14000119816`).
- **UCC Records:** Use the `UCC Number`.

### 2. Update `ucc_worker.py` Logic
The worker should be modified to perform a "Lookup and Patch" operation:
```python
def enrich_master_data(scraped_result):
    # 1. Identify the target master file (e.g., Data/3. UCC/UCC Palm Beach.csv)
    # 2. Search for the matching row (by Business Name or Document Number)
    # 3. Update the relevant columns in that row:
    #    - UCC Status
    #    - Date Filed
    #    - Expires
    #    - Filings Completed Through
    # 4. Save the master file back to disk.
```

### 3. Record deduplication
Before appending to `Data/UCC Results/all_results.csv`, the worker should check if the `UCC Number` already exists to prevent duplicate entries for the same filing.

### 4. Fuzzy Matching Refinement
As requested, the scraper should eventually only show similar matching business names.
- Implement a similarity score (e.g., Levenshtein distance) between the "Search Term" and the "Debtor Name" returned by the API.
- Filter out results that fall below a certain confidence threshold (e.g., 85%).

## Technical Considerations
- **Concurrency:** Ensure that multiple worker processes don't attempt to write to the same master file simultaneously (use file locking).
- **Performance:** Large CSV files should be indexed in memory or processed using a streaming approach to avoid high RAM usage.
- **Backup:** Always create a backup of master files before performing enrichment operations.
