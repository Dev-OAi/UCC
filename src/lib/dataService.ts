import Papa from 'papaparse';

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
  // Matches (555) 555-5555 or 555-555-5555
  return /\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/.test(val.trim());
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

        // 2. Tri-Schema Detection & Mapping with Scrubbed Headers
        if (colCount >= 50) {
          // 1. Set the "Unmovable" columns first
          const m: Record<number, string> = {
            0: 'businessName',
            41: 'Status',
            42: 'Date Filed',
            43: 'Expires',
            44: 'Filings Completed Through',
            45: 'Summary For Filing',
            55: 'Florida UCC Link'
          };

         // 2. Scan columns 1-10 for specific data patterns
          firstRow.forEach((cell, idx) => {
            if (idx > 0 && idx < 10) {
              const val = String(cell || '').trim();
              if (!val) return;

              // RULE A: Document Number (Must start with a Letter, then at least 5 numbers)
              // This targets L14000..., P06000..., etc.
              if (/^[A-Za-z]\d{5,}/.test(val)) {
                m[idx] = 'Document Number';
              }
              // RULE B: Website
              else if (val.toLowerCase().includes('http')) {
                m[idx] = 'Sunbiz Link';
              } 
              // RULE C: Zip Code (Exactly 5 digits only)
              else if (/^\d{5}$/.test(val)) {
                m[idx] = 'Zip';
              }
              // RULE D: Phone Number (Must have 7-10 digits AND symbols like - or ( ) )
              else if (/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/.test(val)) {
                m[idx] = 'Phone';
              }
            }
          });
          // 3. Finalize headers
          headers = firstRow.map((_, i) => scrubValue(m[i] || `Column ${i + 1}`));
        }
        else if (colCount >= 30) {
         // SB Schema - Dynamic Smart Detection
          const m: Record<number, string> = {
            0: 'businessName'
          };

          // Increased scan range to find data in the higher column indexes
          firstRow.forEach((cell, idx) => {
            if (idx > 0) {
              const val = String(cell || '').trim();
              if (!val) return;

              // 1. Sunbiz Link
              if (val.toLowerCase().includes('sunbiz.org')) {
                m[idx] = 'Sunbiz Link';
              } 
              // 2. FEI/EIN Number (9 digits, optional dash: XX-XXXXXXX or XXXXXXXXX)
              else if (/^\d{2}-?\d{7}$/.test(val)) {
                m[idx] = 'FEI/EIN Number';
              }
              // 3. Document Number (Letter + 6+ digits)
              else if (/^[A-Za-z]\d{6,}/.test(val)) {
                m[idx] = 'Document Number';
              }
              // 4. Status (Active, Inactive, etc.)
              else if (/^(ACTIVE|INACT|DISS|DELQ|UA)/i.test(val)) {
                m[idx] = 'Status';
              }
              // 5. Zip Code (Exactly 5 digits)
              else if (/^\d{5}$/.test(val)) {
                m[idx] = 'Zip';
              }
              // 6. Date Filed (Pattern: 00/00/0000)
              else if (/\d{1,2}\/\d{1,2}\/\d{2,4}/.test(val)) {
                m[idx] = 'Date Filed';
              }
              // 7. Phone Number
              else if (/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/.test(val)) {
                m[idx] = 'Phone';
              }
            }
          });
          // Fill in the rest as "Column X"
          headers = firstRow.map((_, i) => scrubValue(m[i] || `Column ${i + 1}`));
        }
        else if (colCount >= 5) {
          // YP Schema
          const m: Record<number, string> = {
            0: 'Category',
            2: 'businessName',
            3: 'Phone',
            4: 'Website'
          };
          headers = firstRow.map((_, i) => scrubValue(m[i] || `Column ${i + 1}`));

          // Check if first row is headers or data for YP
          const isHeader = !firstRow.some(cell => /\d{3}\D\d{3}\D\d{4}|http|www\./.test(cell));
          if (isHeader) startIndex++;
        }
        else {
          // Generic CSV: Scrub the actual text from the header row
          headers = firstRow.map((h, i) => scrubValue(h && h.trim() !== '' ? h.trim() : `Column ${i + 1}`));
          const isHeader = !firstRow.some(cell =>
            /\d{3}\D\d{3}\D\d{4}|http|www\./.test(cell) ||
            (cell && cell.length > 5 && /^\d+$/.test(cell.trim()))
          );
          if (isHeader) startIndex++;
        }

        // 3. Row Mapping
        let rows: DataRow[] = data.slice(startIndex).map(row => {
          const obj: DataRow = {};
          headers.forEach((h, i) => {
            // All data preserved, indexed by our scrubbed headers
            obj[h] = scrubValue(row[i] || '');
          });
          
          obj._source = file.filename;
          obj._type = file.type;
          
          // Hybrid metadata logic
          obj._zip = scrubValue(file.zip || obj['Zip'] || obj['ZIP'] || '');
          obj._location = scrubValue(file.location || obj['Location'] || '');
          
          return obj;
        });

        // 4. Post-processing for Sunbiz
        if (file.type === 'SB') {
          rows = rows.filter(row => {
            const name = row['businessName'] || row['Entity Name'];
            const link = row['Sunbiz Link'];
            // Basic validation to ensure the row is a valid Sunbiz record
            return name && link && link.includes('sunbiz.org');
          });
        }

        resolve(rows);
      },
      error: (err) => reject(err),
    });
  });
}
