export async function loadCsv(file: FileManifest): Promise<DataRow[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file.path, {
      download: true,
      header: false, 
      skipEmptyLines: 'greedy',
      complete: (results) => {
        const data = results.data as string[][];
        if (!data || data.length === 0) {
          resolve([]);
          return;
        }

        let headers: string[] = [];
        let startIndex = 0;

        // Skip leading empty rows
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

        // 1. SB Hub Mapping
        if (file.type.includes('SB')) {
          m[0] = 'businessName';
          m[1] = 'Document Number';
          m[6] = 'Entity Type';
          m[9] = 'FEI/EIN Number';
          
          if (colCount >= 50) {
            m[41] = 'Status';
            m[42] = 'Date Filed';
            m[43] = 'Expires';
            m[44] = 'Filings Completed Through';
            m[45] = 'Summary For Filing';
            m[55] = 'Florida UCC Link';
          }
        } 
        // 2. UCC Hub Mapping
        else if (file.type.includes('UCC') && colCount >= 50) {
          m[0] = 'businessName';
          m[6] = 'Entity Type';
          m[9] = 'FEI/EIN Number';
          m[41] = 'Status';
          m[42] = 'Date Filed';
          m[43] = 'Expires';
          m[55] = 'Florida UCC Link';
        }
        // 3. Last 90 Days Mapping (UCC specific)
        else if (colCount >= 25 && colCount < 30) {
          m[0] = 'Status';
          m[1] = 'Direct Name';
          m[2] = 'Reverse Name';
          m[3] = 'Record Date';
          m[4] = 'Location';
          m[5] = 'Doc Type';
          m[9] = 'Instrument Number';
          m[11] = 'Legal Description';
          startIndex++; 
        }
        // 4. YP Mapping
        else if (colCount >= 5) {
          m[0] = 'Category';
          m[2] = 'businessName';
          m[3] = 'Phone';
          m[4] = 'Website';
          const isHeader = !firstRow.some(cell => /\d{3}\D\d{3}\D\d{4}|http|www\./.test(cell));
          if (isHeader) startIndex++;
        }
        // Fallback: Generic Header Detection
        else {
          headers = firstRow.map((h, i) => scrubValue(h && h.trim() !== '' ? h.trim() : `Column ${i + 1}`));
          const isHeader = !firstRow.some(cell =>
            /\d{3}\D\d{3}\D\d{4}|http|www\./.test(cell) ||
            (cell && cell.length > 5 && /^\d+$/.test(cell.trim()))
          );
          if (isHeader) startIndex++;
        }

        // Apply Pattern Matching for remaining gaps (Links/Dates)
        if (Object.keys(m).length > 0) {
          firstRow.forEach((cell, idx) => {
            const val = String(cell || '').trim();
            if (!val || m[idx]) return; 
            if (val.toLowerCase().includes('sunbiz.org')) m[idx] = 'Sunbiz Link';
            else if (/\d{1,2}\/\d{1,2}\/\d{2,4}/.test(val)) {
                if (!Object.values(m).includes('Date Filed')) m[idx] = 'Date Filed';
            }
          });
          headers = firstRow.map((_, i) => m[i] || `Column ${i + 1}`);
        }

        // Final Row Generation
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

        // Filter out empty rows specifically for Sunbiz files
        if (file.type.includes('SB')) {
          rows = rows.filter(row => !!(row['businessName'] || row['Document Number'] || row['Column 1']));
        }

        resolve(rows);
      },
      error: (err) => reject(err),
    });
  });
}