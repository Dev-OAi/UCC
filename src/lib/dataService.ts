import Papa from 'papaparse';
import { calculateScore } from './scoring';

export interface FileManifest {
  path: string;
  type: string;
  zip?: string;
  location?: string;
  category?: string;
  filename: string;
}

export interface DataRow {
  [key: string]: any;
  _source?: string;
  _type?: string;
  _zip?: string;
  _location?: string;
}

export function isZipCode(val: string): boolean {
  return /^\d{5}(-\d{4})?$/.test(val.trim());
}

export function isPhoneNumber(val: string): boolean {
  return /\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/.test(val.trim());
}

export function isDocumentNumber(val: string): boolean {
  return /^([A-Za-z]\d{5,}|\d{10,12})$/.test(val.trim());
}

const VALLEY_REGEX = /valley/gi;
const DOUBLE_SPACE_REGEX = /\s\s+/g;
const AMP_REGEX = /&amp;/gi;
const QUOTE_REGEX = /&#39;/g;

export function scrubValue(value: any): any {
  if (typeof value !== 'string' || value.length === 0) return value;

  const hasV = value.includes('v') || value.includes('V');
  if (hasV) {
    const lowerValue = value.toLowerCase();
    if (lowerValue.includes('valley')) {
      if (lowerValue.includes('http') ||
          lowerValue.includes('www.') ||
          lowerValue.includes('.com') ||
          lowerValue.includes('.org') ||
          lowerValue.includes('.net')) {
        return 'https://www.google.com';
      }
      value = value.replace(VALLEY_REGEX, '');
    }
  }

  if (value.includes('  ')) {
    value = value.replace(DOUBLE_SPACE_REGEX, ' ');
  }

  value = value.trim();

  if (value.includes('&')) {
    value = value.replace(AMP_REGEX, '&');
  }
  if (value.includes('&#39;')) {
    value = value.replace(QUOTE_REGEX, "'");
  }

  return value;
}

export async function fetchManifest(): Promise<FileManifest[]> {
  const response = await fetch('./manifest.json');
  if (!response.ok) throw new Error('Failed to fetch manifest');
  const manifest: FileManifest[] = await response.json();
  return manifest.map(m => ({
    ...m,
    type: scrubValue(m.type || ''),
    location: scrubValue(m.location || ''),
    zip: scrubValue(m.zip || ''),
    category: scrubValue(m.category || '')
  }));
}

export interface PendingJob {
  filename: string;
  headers: string[];
  added_at: number;
}

export interface JobStatus {
  filename: string;
  progress: number;
  total: number;
  current_name: string;
  status: string;
  errors: string[];
  start_time: string;
  results?: any[];
}

export interface GithubConfig {
  token: string;
  owner: string;
  repo: string;
  branch: string;
}

export async function fetchPendingJobs(): Promise<PendingJob[]> {
  try {
    const response = await fetch('./Uploads/pending_jobs.json?t=' + Date.now());
    if (!response.ok) return [];
    return await response.json();
  } catch {
    return [];
  }
}

const getBridgeUrl = (path: string) => {
  // PAUSED: Only allow bridge calls if explicitly on localhost to prevent security popups on hosted sites
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  if (!isLocalhost) return null;

  const baseUrl = './api/bridge';
  return `${baseUrl}${path}`;
};

export async function uploadCsv(file: File): Promise<{ success: boolean; error?: string }> {
  try {
    const url = getBridgeUrl('/upload');
    if (!url) return { success: false, error: "Bridge unavailable on hosted versions" };

    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(url, {
      method: 'POST',
      body: formData
    });

    if (response.ok) {
      return { success: true };
    } else {
      const data = await response.json().catch(() => ({}));
      return { success: false, error: data.error || `Server responded with ${response.status}` };
    }
  } catch (err) {
    console.error('Upload failed:', err);
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function fetchJobStatus(jobId: string): Promise<JobStatus | null> {
  try {
    const response = await fetch(`./Uploads/status/${jobId}.json?t=` + Date.now());
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

export async function triggerManualSearch(names: string | string[], mode: string = 'standard'): Promise<string | null> {
  try {
    const url = getBridgeUrl('/manual');
    if (!url) return null;

    const jobId = `manual_${Date.now()}`;
    const payload = Array.isArray(names)
      ? { names, job_id: jobId, mode }
      : { name: names, job_id: jobId, mode };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      const data = await response.json();
      return data.job_id || jobId;
    }
    return null;
  } catch (err) {
    console.error('Failed to trigger manual search:', err);
    return null;
  }
}

export async function startScrape(filename: string, column: string, threshold: number, mode: string = 'standard'): Promise<string | null> {
  try {
    const url = getBridgeUrl('/command');
    if (!url) return null;

    const jobId = `job_${Date.now()}`;
    const command = {
      action: "start_scrape",
      filename,
      column,
      threshold,
      job_id: jobId,
      mode
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(command)
    });

    if (response.ok) return jobId;
    return null;
  } catch (err) {
    console.error('Failed to send command to scraper bridge:', err);
    return null;
  }
}

export async function fetchSystemStatus(): Promise<{ bridge: string; watcher: string; worker?: string } | null> {
  try {
    const url = getBridgeUrl('/system/status');
    if (!url) return null;
    const response = await fetch(url);
    if (response.ok) return await response.json();
    return null;
  } catch {
    return null;
  }
}

export async function restartSystem(): Promise<boolean> {
  try {
    const url = getBridgeUrl('/system/restart');
    if (!url) return false;
    const response = await fetch(url, { method: 'POST' });
    return response.ok;
  } catch {
    return false;
  }
}

export async function stopAllScrapes(): Promise<boolean> {
  try {
    const url = getBridgeUrl('/stop');
    if (!url) return false;
    const response = await fetch(url, { method: 'POST' });
    return response.ok;
  } catch {
    return false;
  }
}

export async function deletePendingJob(filename: string): Promise<boolean> {
  try {
    const url = getBridgeUrl('/delete_pending');
    if (!url) return false;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename })
    });
    return response.ok;
  } catch {
    return false;
  }
}

export function saveGithubConfig(config: GithubConfig) {
  localStorage.setItem('github_config', JSON.stringify(config));
}

export function getGithubConfig(): GithubConfig | null {
  const data = localStorage.getItem('github_config');
  return data ? JSON.parse(data) : null;
}

export async function dispatchUccAction(names: string[], mode: string, threshold: number): Promise<boolean> {
  const config = getGithubConfig();
  if (!config || !config.token || !config.owner || !config.repo) {
    throw new Error('GitHub configuration missing');
  }

  const url = `https://api.github.com/repos/${config.owner}/${config.repo}/actions/workflows/ucc_automation.yml/dispatches`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `token ${config.token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ref: config.branch || 'main',
        inputs: {
          names: names.join('|'),
          mode: mode,
          threshold: threshold.toString()
        }
      })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      console.error('GitHub Action dispatch failed:', err);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Error dispatching GitHub Action:', err);
    return false;
  }
}

export async function loadCsv(file: FileManifest): Promise<DataRow[]> {
  // Construct absolute URL relative to the current page's directory
  // This ensures Web Workers can correctly fetch the data files
  const baseUrl = typeof window !== 'undefined'
    ? new URL('.', window.location.href).href
    : 'http://localhost/';
  const cleanPath = file.path.replace(/^\.\//, '');
  const url = new URL(cleanPath, baseUrl).href;

  console.log(`[DataService] Loading: ${url}`);

  return new Promise((resolve, reject) => {
    Papa.parse(url, {
      download: true,
      worker: true,
      header: false, // Detecting headers manually for flexibility
      skipEmptyLines: 'greedy',
      complete: (results) => {
        const data = results.data as string[][];
        if (!data || data.length === 0) {
          console.warn(`[DataService] No data found in ${file.filename}`);
          resolve([]);
          return;
        }

        let headers: string[] = [];
        let startIndex = 0;

        // 1. Skip leading empty rows
        while (startIndex < data.length && data[startIndex].every(cell => !cell || cell.trim() === '')) {
          startIndex++;
        }

        if (startIndex >= data.length) {
          resolve([]);
          return;
        }

        const firstRow = data[startIndex];
        const colCount = firstRow.length;
        const m: Record<number, string> = {};

        // 2. Tri-Schema Detection & Mapping

        // PRIORITY 0: 56-Column UCC/SB Master Format
        if (colCount === 56) {
          m[0] = 'businessName';
          m[1] = 'Document Number';
          m[2] = 'Sunbiz Status';
          m[3] = 'Zip';
          m[4] = 'Sunbiz Link';
          m[6] = 'Entity Type';
          m[9] = 'FEI/EIN Number';
          m[41] = 'UCC Status';
          m[42] = 'Date Filed';
          m[43] = 'Expires';
          m[44] = 'Filings Completed Through';
          m[45] = 'Summary For Filing';
          m[55] = 'Florida UCC Link';
        }
        // PRIORITY 1: SUNBIZ (SB) Hub Detection
        else if (file.type.includes('SB')) {
          m[0] = 'businessName';
          m[1] = 'Document Number';
          m[2] = 'Sunbiz Status';
          m[6] = 'Entity Type';
          m[9] = 'FEI/EIN Number';

          if (colCount >= 50) {
            m[41] = 'UCC Status';
            m[42] = 'Date Filed';
            m[43] = 'Expires';
            m[44] = 'Filings Completed Through';
            m[45] = 'Summary For Filing';
            m[55] = 'Florida UCC Link';
          }
        }
        // PRIORITY 2: LARGE UCC EXPORT Detection
        else if (file.type.includes('UCC') && colCount >= 50) {
          m[0] = 'businessName';
          m[2] = 'Sunbiz Status';
          m[6] = 'Entity Type';
          m[9] = 'FEI/EIN Number';
          m[41] = 'UCC Status';
          m[42] = 'Date Filed';
          m[43] = 'Expires';
          m[44] = 'Filings Completed Through';
          m[45] = 'Summary For Filing';
          m[55] = 'Florida UCC Link';
        }
        // PRIORITY 3.4: 5. OR HUB (Matches original CSV exactly)
        else if (file.type === '5. OR') {
          // Use exact headers from the CSV
          headers = firstRow.map(h => scrubValue(h));
          startIndex++;
        }
        // PRIORITY 3: UCC LAST 90 DAYS (26 Columns)
        else if (colCount >= 25 && colCount < 30) {
          m[0] = 'UCC Status';
          m[1] = 'businessName';
          m[2] = 'Reverse Name';
          m[3] = 'Record Date';
          m[4] = 'Location';
          m[5] = 'Doc Type';
          m[9] = 'Instrument Number';
          m[11] = 'Legal Description';
          startIndex++;
        }
        // PRIORITY 3.6: SEARCH RESULTS HUB & B UCC
        else if (file.type === 'Search Results' || file.type === 'B UCC') {
          m[0] = 'DirectName';
          m[1] = 'IndirectName';
          m[2] = 'RecordDate';
          m[3] = 'DocTypeDescription';
          m[4] = 'InstrumentNumber';
          m[5] = 'BookType';
          m[6] = 'BookPage';
          m[7] = 'DocLegalDescription';
          m[8] = 'Consideration';
          m[9] = 'CaseNumber';
          startIndex++;
        }
        // PRIORITY 3.3: SCRAPED UCC RESULTS
        else if (file.type === 'UCC Results' || file.type === '4. Test') {
          m[0] = 'businessName'; // Search Term
          m[1] = 'Match Score';
          m[2] = 'UCC Status'; // Status
          m[3] = 'Date Filed';
          m[4] = 'Expires';
          m[5] = 'Filings Completed Through';
          m[6] = 'UCC Number';
          m[7] = 'Filing Events';
          m[8] = 'Secured Parties Count';
          // Standard Table.tsx might not show all 5 secured parties by default,
          // but they'll be in the row object for the sidebar.
          for (let i = 1; i <= 5; i++) {
            m[9 + (i - 1) * 2] = `Secured Party ${i} Name`;
            m[10 + (i - 1) * 2] = `Secured Party ${i} Address`;
          }
          m[19] = 'Debtor Parties Count';
          m[20] = 'Debtor Name';
          m[21] = 'Debtor Address';
          m[22] = 'Document Type';
          m[23] = 'Document Pages';
          startIndex++;
        }
        // PRIORITY 3.5: ENRICHED ZIP HUB (8 Columns)
        else if (colCount === 8) {
          m[0] = 'businessName';
          // Detect schema by looking at typical content
          const hasSunbiz = firstRow.some(cell => String(cell).toLowerCase().includes('sunbiz.org'));
          const hasPhone = firstRow.some(cell => isPhoneNumber(String(cell)));

          if (hasSunbiz) {
            // Schema A: Sunbiz & FEI/EIN
            m[1] = 'Sunbiz Status';
            m[2] = 'FEI/EIN Number';
            m[3] = 'Sunbiz Link';
            m[4] = 'UCC Status';
            m[5] = 'Date Filed';
            m[6] = 'Expires';
            m[7] = 'Florida UCC Link';
          } else if (hasPhone) {
            // Schema B: Phone & Website
            m[1] = 'Phone';
            m[2] = 'Website';
            m[3] = 'UCC Status';
            m[4] = 'Date Filed';
            m[5] = 'Expires';
            m[6] = 'Florida UCC Link';
            m[7] = 'Category';
          }
        }
        // PRIORITY 4: YELLOW PAGES (YP) Schema
        else if (colCount >= 5) {
          m[0] = 'Category';
          m[2] = 'businessName';
          m[3] = 'Phone';
          m[4] = 'Website';
          const isHeader = !firstRow.some(cell => /\d{3}\D\d{3}\D\d{4}|http|www\./.test(cell));
          if (isHeader) startIndex++;
        }
        // FALLBACK: Generic Header Detection
        else {
          headers = firstRow.map((h, i) => scrubValue(h && h.trim() !== '' ? h.trim() : `Column ${i + 1}`));
          const isHeader = !firstRow.some(cell =>
            /\d{3}\D\d{3}\D\d{4}|http|www\./.test(cell) ||
            (cell && cell.length > 5 && /^\d+$/.test(cell.trim()))
          );
          if (isHeader) startIndex++;
        }

        // 3. Dynamic Pattern Matching for remaining gaps
        if (Object.keys(m).length > 0 && headers.length === 0) {
          firstRow.forEach((cell, idx) => {
            const val = String(cell || '').trim();
            if (!val || m[idx]) return;

            // Date Filed
            if (/\d{1,2}\/\d{1,2}\/\d{2,4}/.test(val)) {
              if (!Object.values(m).includes('Date Filed')) {
                m[idx] = 'Date Filed';
              }
            }
            // Sunbiz Link
            else if (val.toLowerCase().includes('sunbiz.org')) {
              m[idx] = 'Sunbiz Link';
            }
            // UCC Status
            else if (/^(FILED|LAPSED)/i.test(val)) {
              if (!Object.values(m).includes('UCC Status')) {
                m[idx] = 'UCC Status';
              }
            }
            // Sunbiz Status
            else if (/^(ACTIVE|INACT|DISS|DELQ|UA)/i.test(val)) {
              if (!Object.values(m).includes('Sunbiz Status')) {
                m[idx] = 'Sunbiz Status';
              }
            }
            // Document Number
            else if (isDocumentNumber(val)) {
              if (!Object.values(m).includes('Document Number')) {
                m[idx] = 'Document Number';
              }
            }
            // Phone
            else if (isPhoneNumber(val)) {
              if (!Object.values(m).includes('Phone')) {
                m[idx] = 'Phone';
              }
            }
            // FEI/EIN
            else if (/^\d{2}-\d{7}$|^\d{9}$/.test(val) && val !== '000000000') {
              if (!Object.values(m).includes('FEI/EIN Number')) {
                m[idx] = 'FEI/EIN Number';
              }
            }
            // Category
            else if (idx === 1 && val.length > 5 && !/\d/.test(val) && !val.includes(',')) {
              if (!Object.values(m).includes('Category')) {
                m[idx] = 'Category';
              }
            }
          });
          headers = firstRow.map((_, i) => m[i] || `Column ${i + 1}`);
        }

        // 4. Row Mapping
        const fileZip = scrubValue(file.zip || '');
        const fileLoc = scrubValue(file.location || '');
        const fileSource = file.filename;
        const fileType = file.type;

        let rows: DataRow[] = data.slice(startIndex).map(row => {
          const obj: DataRow = {};
          headers.forEach((h, i) => {
            obj[h] = scrubValue(row[i] || '');
          });
          
          // Compat mapping for 5. OR hub to ensure sidebar and scoring work
          if (file.type === '5. OR' && obj['Corporate Name (Search)']) {
            obj.businessName = obj['Corporate Name (Search)'];
          }

          obj._source = fileSource;
          obj._type = fileType;
          obj._zip = fileZip || scrubValue(obj['Zip'] || obj['ZIP'] || '');
          obj._location = fileLoc || scrubValue(obj['Location'] || '');
          obj.Score = calculateScore(obj);
          
          return obj;
        });

        // 5. Post-processing Filter for Sunbiz
        if (file.type.includes('SB')) {
          rows = rows.filter(row => {
            const name = row['businessName'] || row['Document Number'] || row['Column 1'];
            return !!name; 
          });
        }

        console.log(`[DataService] Completed: ${file.filename} (${rows.length} rows)`);
        resolve(rows);
      },
      error: (err) => {
        console.error(`[DataService] PapaParse Error for ${url}:`, err);
        reject(err);
      },
    });
  });
}
