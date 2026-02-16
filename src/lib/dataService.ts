// ... (FileManifest, DataRow interfaces and scrubValue/fetchManifest remain the same)

export async function loadCsv(file: FileManifest): Promise<DataRow[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file.path, {
      download: true,
      header: false,
      skipEmptyLines: 'greedy',
      complete: (results) => {
        const data = results.data as string[][];
        if (data.length === 0) {
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

        // 2. Enhanced Header Detection
        const firstRow = data[startIndex];
        const isHeader = (row: string[]) => {
          if (!row) return false;
          return !row.some(cell => 
            /\d{3}\D\d{3}\D\d{4}|http|www\./.test(cell) ||
            (cell && cell.length > 5 && /^\d+$/.test(cell.trim()))
          );
        };

        if (isHeader(firstRow) && firstRow.some(c => c && c.trim() !== '')) {
          headers = firstRow.map(h => h.trim() || 'Untitled');
          startIndex++;
        } else {
          // Generate default headers based on known schemas
          if (file.type.includes('YP') || file.filename.startsWith('YP ')) {
            headers = ['Category', 'Page-Ref', 'Business Name', 'Phone', 'Website'];
          } else if (file.type.includes('SB')) {
            headers = ['Entity Name', 'Registration Number', 'Status', 'Zip', 'Sunbiz Link'];
          } else if (file.type === '3. UCC') {
            // RESOLVED CONFLICT: Unified UCC mapping
            const m: Record<number, string> = {
              0: 'Industry',
              1: 'Category',
              2: 'Page-Ref',
              3: 'Business Name',
              4: 'Phone',
              5: 'Website',
              7: 'Phone Number',
              10: "Company's website",
              38: 'UCC Number',
              41: 'Filing Status',
              42: 'Filing Date',
              43: 'Expiry Date',
              44: 'Expiration Date', // Preferring 'Expiration Date' over 'Column 45'
              50: 'Full Address',
              55: 'Florida UCC Link'
            };
            headers = firstRow.map((_, i) => m[i] || `Column ${i + 1}`);
          } else {
            headers = firstRow.map((_, i) => `Column ${i + 1}`);
          }
        }

        // 3. Row Mapping
        let rows: DataRow[] = data.slice(startIndex).map(row => {
          const obj: DataRow = {};
          headers.forEach((h, i) => {
            obj[h] = scrubValue(row[i]);
          });
          
          obj._source = file.filename;
          obj._type = file.type;
          
          obj._zip = scrubValue(file.zip || obj['Zip'] || obj['ZIP'] || '');
          obj._location = scrubValue(file.location || obj['Location'] || '');
          
          return obj;
        });

        // 4. Post-processing for Sunbiz data
        if (file.type === 'SB') {
          rows = rows.filter(row => {
            const name = row['Entity Name'];
            const regNo = row['Registration Number'];
            const link = row['Sunbiz Link'];
            return name && regNo && link && /^[A-Z]\d+/.test(regNo) && link.includes('sunbiz.org');
          });
        }

        resolve(rows);
      },
      error: (err) => reject(err),
    });
  });
}