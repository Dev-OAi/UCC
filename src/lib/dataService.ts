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
        // PRIORITY 3.6: SEARCH RESULTS HUB
        else if (file.type === 'Search Results') {
          m[0] = 'businessName';
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
