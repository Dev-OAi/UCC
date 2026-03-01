# Manual Guide: Adding and Customizing Hubs

This guide explains how to manually add a new CSV-based Hub and customize its column display and mapping.

## 1. Prepare the CSV Data
Place your CSV file in a subdirectory under the `Data/` folder. The folder name will become the default "Category" or "Type" for the records.

Example: `Data/6. NewHub/my_data.csv`

## 2. Refresh the Manifest
The application discovers files via `public/manifest.json`. You must regenerate this file after adding new data.
Run the following command in the terminal:
```bash
python3 generate_manifest.py
```

## 3. Customize Column Mapping (Internal)
If your CSV uses non-standard header names, you should map them to internal fields to ensure features like the Right Sidebar, Lead Scoring, and Action Hub work correctly.

Edit `src/lib/dataService.ts`:

### A. Define Header Mapping (Optional but Recommended)
In the `loadCsv` function, find the `// 2. Tri-Schema Detection & Mapping` section. You can add a specific case for your hub type:

```typescript
else if (file.type === '6. NewHub') {
  m[0] = 'businessName'; // Maps the first column to the internal businessName field
  m[1] = 'Phone';        // Maps the second column to Phone
  // ... and so on
  startIndex++; // Skip the header row if it exists
}
```

### B. Use Original Headers with Compatibility Mapping
If you want to keep the original headers but still ensure compatibility, you can do this in the `loadCsv` function's `// 4. Row Mapping` loop:

```typescript
// PRIORITY 3.4: Example for using original headers
else if (file.type === '6. NewHub') {
  headers = firstRow.map(h => scrubValue(h));
  startIndex++;
}

// ... later in the Row Mapping loop ...
if (file.type === '6. NewHub' && obj['My Custom Header Name']) {
  obj.businessName = obj['My Custom Header Name'];
}
```

## 4. Customize Column Order and Visibility (Display)
To control which columns appear in the table by default and in what order, edit `src/App.tsx`.

Find the `customColumnOrders` state initialization and add your hub:

```typescript
'6. NewHub': [
  "My Custom Header Name",
  "Phone",
  "Status",
  // List all columns in the order you want them to appear
]
```

## 5. Verify Your Changes
1. Refresh the application in your browser.
2. Navigate to your new Hub via the Sidebar.
3. Check the table headers and column order.
4. Select a row to verify the Right Sidebar displays the mapped information correctly.
