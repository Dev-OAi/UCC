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

export function scrubValue(value: any): any {
  if (typeof value !== 'string') return value;

  const lowerValue = value.toLowerCase();

  // URL/Domain detection - if it contains valley and looks like a link or domain
  if (lowerValue.includes('valley') && (
    lowerValue.includes('http') ||
    lowerValue.includes('www.') ||
    lowerValue.includes('.com') ||
    lowerValue.includes('.org') ||
    lowerValue.includes('.net')
  )) {
    return 'https://www.google.com';
  }

  // Remove "Valley" (case-insensitive)
  let newValue = value.replace(/valley/gi, '');

  // Clean up spaces: remove double spaces, trim leading/trailing
  newValue = newValue.replace(/\s\s+/g, ' ').trim();

  // Decode common HTML entities
  newValue = newValue.replace(/&amp;/gi, '&');
  newValue = newValue.replace(/&#39;/g, "'");

  return newValue;
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

export async function uploadCsv(file: File): Promise<{ success: boolean; error?: string }> {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('./api/bridge/upload', {
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

export async function startScrape(filename: string, column: string, threshold: number): Promise<string | null> {
  try {
    const jobId = `job_${Date.now()}`;
    const command = {
      action: "start_scrape",
      filename,
      column,
      threshold,
      job_id: jobId
    };

    const response = await fetch('./api/bridge/command', {
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

export async function loadCsv(file: FileManifest): Promise<DataRow[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file.path, {
      download: true,
      header: false, // Detecting headers manually for flexibility
      skipEmptyLines: 'greedy',
      complete: (results) => {
        const data = results.data as string[][];
        if (!data || data.length === 0) {
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
        else if (file.type === 'UCC Results') {
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
        if (Object.keys(m).length > 0) {
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
        let rows: DataRow[] = data.slice(startIndex).map(row => {
          const obj: DataRow = {};
          headers.forEach((h, i) => {
            obj[h] = scrubValue(row[i] || '');
          });
          
          obj._source = file.filename;
          obj._type = file.type;
          obj._zip = scrubValue(file.zip || obj['Zip'] || obj['ZIP'] || '');
          obj._location = scrubValue(file.location || obj['Location'] || '');
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

        resolve(rows);
      },
      error: (err) => reject(err),
    });
  });
}
