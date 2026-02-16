// ... (imports remain the same)

function App() {
  // ... (previous state variables)

  // RESOLVED CONFLICT: Merged UCC Column Order
  // We keep the descriptive names at the front and generic "Columns" at the end
  const [customColumnOrders, setCustomColumnOrders] = useState<Record<string, string[]>>({
    '3. UCC': [
      "Industry", "Category", "Page-Ref", "Business Name", "Filing Status", 
      "Filing Date", "Expiry Date", "Expiration Date", "UCC Number", "Phone", 
      "Website", "Phone Number", "Company's website", "Full Address", 
      "Florida UCC Link", "Location", "Zip",
      "Column 4", "Column 7", "Column 8", "Column 9", "Column 10", "Column 11", 
      "Column 12", "Column 13", "Column 14", "Column 15", "Column 16", "Column 17", 
      "Column 18", "Column 19", "Column 20", "Column 21", "Column 22", "Column 23", 
      "Column 24", "Column 25", "Column 26", "Column 27", "Column 28", "Column 29", 
      "Column 30", "Column 31", "Column 32", "Column 33", "Column 34", "Column 35", 
      "Column 36", "Column 37", "Column 38", "Column 40", "Column 41", "Column 45", 
      "Column 46", "Column 47", "Column 48", "Column 49", "Column 50", "Column 52", 
      "Column 53", "Column 54", "Column 55"
    ]
  });

  // ... (useEffect for auto-lock, dark mode, etc.)

  // RESOLVED CONFLICT: Merged currentColumnOrder Logic
  const currentColumnOrder = useMemo(() => {
    const customOrder = customColumnOrders[activeTab];
    if (!customOrder) return allColumns;

    // Merge custom order with any new columns found in data to ensure nothing is lost
    const remainingColumns = allColumns.filter(col => !customOrder.includes(col));
    return [...customOrder, ...remainingColumns];
  }, [customColumnOrders, activeTab, allColumns]);

  // ... (sortedVisibleColumns memo)

  useEffect(() => {
    if (allData.length === 0) return;
    if (['Home', 'All', 'Insights'].includes(activeTab)) {
      setVisibleColumns(allColumns);
    } else if (activeTab === '3. UCC') {
      // RESOLVED CONFLICT: Setting the default visible columns for the UCC Hub
      // This focuses on the most important business info first
      setVisibleColumns([
        "Business Name", "Filing Status", "Filing Date", "Expiry Date", 
        "Phone", "Website", "Full Address", "Florida UCC Link", "Location"
      ]);
    } else {
      const sample = allData.find(d => d._type === activeTab);
      if (sample) {
        const keys = Object.keys(sample).filter(k => !k.startsWith('_') && k !== 'Zip' && k !== 'Location');
        setVisibleColumns([...keys, 'Location', 'Zip']);
      }
    }
  }, [activeTab, allColumns, allData]);

  // ... (rest of the component logic: toggleColumn, handleColumnReorder, downloadCSV, and JSX return)
}

export default App;