import Papa from 'papaparse';

export interface FileManifest {
  path: string;
  type: string;
  zip: string;
  location: string;
  filename: string;
}

export interface DataRow {
  [key: string]: any;
  _source?: string;
  _type?: string;
  _zip?: string;
  _location?: string;
}

export async function fetchManifest(): Promise<FileManifest[]> {
  const response = await fetch('./manifest.json');
  if (!response.ok) throw new Error('Failed to fetch manifest');
  return response.json();
}

export async function loadCsv(file: FileManifest): Promise<DataRow[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file.path, {
      download: true,
      header: false, // We will detect headers manually
      skipEmptyLines: 'greedy',
      complete: (results) => {
        const data = results.data as string[][];
        if (data.length === 0) {
          resolve([]);
          return;
        }

        let headers: string[] = [];
        let startIndex = 0;

        // Simple header detection
        const firstRow = data[0];
        const secondRow = data[1];

        const isHeader = (row: string[]) => {
          if (!row) return false;
          // If any cell contains "(772)" or "http", it's probably data, not header
          return !row.some(cell => /\d{3}\D\d{3}\D\d{4}|http|www\./.test(cell));
        };

        if (isHeader(firstRow) && firstRow.some(c => c.trim() !== '')) {
          headers = firstRow.map(h => h.trim() || 'Untitled');
          startIndex = 1;
        } else {
          // No header found, generate default ones based on type if possible
          if (file.type === 'YP') {
            headers = ['Category', 'Page-Ref', 'Business Name', 'Phone', 'Website'];
          } else {
            headers = firstRow.map((_, i) => `Column ${i + 1}`);
          }
          startIndex = 0;
        }

        const rows: DataRow[] = data.slice(startIndex).map(row => {
          const obj: DataRow = {};
          headers.forEach((h, i) => {
            obj[h] = row[i];
          });
          obj._source = file.filename;
          obj._type = file.type;
          obj._zip = file.zip;
          obj._location = file.location;
          return obj;
        });

        resolve(rows);
      },
      error: (err) => reject(err),
    });
  });
}
