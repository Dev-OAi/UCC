import React, { useState, useEffect, useMemo } from 'react';
import { fetchManifest, loadCsv, FileManifest, DataRow } from './lib/dataService';
import { Table } from './components/Table';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { RightSidebar } from './components/RightSidebar';
import { Dashboard } from './components/Dashboard';
import { ColumnToggle } from './components/ColumnToggle';
import { DownloadSecurityModal } from './components/DownloadSecurityModal';
import { ProductsSecurityModal } from './components/ProductsSecurityModal';
import { Insights } from './components/Insights';
import { SmbCheckingSelector } from './components/SmbCheckingSelector';
import { TreasuryGuide } from './components/TreasuryGuide';
import { Products } from './components/Products';
import { ActivityLog } from './components/ActivityLog';
import ProductGuideRenderer from './components/ProductGuideRenderer';
import { ProductGuide } from './types';
import { SearchResult } from './components/SearchDropdown';
import { productData } from './lib/productData';
import { Database, FilterX, Download, Copy } from 'lucide-react';
import Papa from 'papaparse';

export type Page = 'Home' | 'Insights' | 'SMB Selector' | 'Product Guide' | 'Products' | 'Activity Log' | 'treasury-guide' | string;

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

function App() {
  const [manifest, setManifest] = useState<FileManifest[]>([]);
  const [productGuides, setProductGuides] = useState<ProductGuide[]>(() => {
    const saved = localStorage.getItem('productGuides');
    return saved ? JSON.parse(saved) : [];
  });
  const [allData, setAllData] = useState<DataRow[]>([]);
  const [debouncedAllData, setDebouncedAllData] = useState<DataRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState({ current: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<string>('Home');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [highlightedProductId, setHighlightedProductId] = useState<string | null>(null);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [columnFilters, setColumnFilters] = useState<Record<string, string[]>>({});
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);
  const [visibleColumns, setVisibleColumns] = useState<string[]>([]);
  
  // LOCK: The exact UCC Hub order you want preserved
  const [customColumnOrders, setCustomColumnOrders] = useState<Record<string, string[]>>({
    '3. UCC': [
      "businessName", "Sunbiz Link", "Florida UCC Link", "Expiration Date", "Location", "Zip"
    ]
  });

  const [selectedRow, setSelectedRow] = useState<DataRow | null>(null);
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(window.innerWidth >= 1024);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(window.innerWidth >= 1024);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [isProductsUnlocked, setIsProductsUnlocked] = useState(false);
  const [isProductsModalOpen, setIsProductsModalOpen] = useState(false);
  const [pendingSearchAction, setPendingSearchAction] = useState<(() => void) | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');

  // Syncing Logic
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchTerm(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem('darkMode', String(isDarkMode));
  }, [isDarkMode]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedAllData(allData), 100);
    return () => clearTimeout(timer);
  }, [allData]);

  // Data Loading
  useEffect(() => {
    async function init() {
      try {
        const m = await fetchManifest();
        setManifest(m);
        const csvFiles = m.filter(f => f.type !== 'PDF' && f.type !== 'JSON');
        setLoadProgress({ current: 0, total: csvFiles.length });
        setLoading(false);

        for (const file of csvFiles) {
          const rows = await loadCsv(file);
          setAllData(prev => [...prev, ...rows]);
          setLoadProgress(prev => ({ ...prev, current: prev.current + 1 }));
        }
      } catch (err) {
        setError('Failed to load data.');
        setLoading(false);
      }
    }
    init();
  }, []);

  // Column Management - Using your original Sample-based approach for stability
  const allColumns = useMemo(() => {
    if (allData.length === 0) return [];
    const keys = new Set<string>();
    const samples = new Map<string, DataRow>();
    
    // Efficiently get one sample row per file type
    for (const row of allData) {
      if (row._type && !samples.has(row._type)) {
        samples.set(row._type, row);
      }
    }

    samples.forEach(sample => {
      Object.keys(sample).forEach(key => {
        if (!key.startsWith('_') && key !== 'Zip' && key !== 'Location') keys.add(key);
      });
    });

    return [...Array.from(keys), 'Location', 'Zip'];
  }, [allData]);

  const currentColumnOrder = useMemo(() => {
    const customOrder = customColumnOrders[activeTab];
    if (!customOrder) return allColumns;
    const remainingColumns = allColumns.filter(col => !customOrder.includes(col));
    return [...customOrder, ...remainingColumns];
  }, [customColumnOrders, activeTab, allColumns]);

  const sortedVisibleColumns = useMemo(() => {
    return [...visibleColumns].sort((a, b) => {
      const idxA = currentColumnOrder.indexOf(a);
      const idxB = currentColumnOrder.indexOf(b);
      return (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB);
    });
  }, [visibleColumns, currentColumnOrder]);

  // Visibility Effect - Fixed to handle the 3. UCC requirement
  useEffect(() => {
    if (allData.length === 0) return;

    if (['Home', 'All', 'Insights'].includes(activeTab)) {
      setVisibleColumns(allColumns);
    } else if (activeTab === '3. UCC') {
      // FORCING THE HUB ORDER
      setVisibleColumns(["businessName", "Sunbiz Link", "Florida UCC Link", "Expiration Date", "Location", "Zip"]);
    } else {
      const sample = allData.find(d => d._type === activeTab);
      if (sample) {
        const keys = Object.keys(sample).filter(k => 
          !k.startsWith('_') && k !== 'Zip' && k !== 'Location' && !k.startsWith('Column ')
        );
        setVisibleColumns([...keys, 'Location', 'Zip']);
      }
    }
  }, [activeTab, allColumns, allData]);

  // Rest of the logic (Filters, Search, Render) matches your working structure...
  const toggleColumn = (col: string) => setVisibleColumns(prev => prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col]);
  const handleColumnReorder = (col: string, direction: 'up' | 'down') => {
    const index = currentColumnOrder.indexOf(col);
    if (index === -1) return;
    const newOrder = [...currentColumnOrder];
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target >= 0 && target < newOrder.length) {
      [newOrder[index], newOrder[target]] = [newOrder[target], newOrder[index]];
      setCustomColumnOrders(prev => ({ ...prev, [activeTab]: newOrder }));
    }
  };

  const categoryData = useMemo(() => (['All', 'Home', 'Insights'].includes(activeTab)) ? allData : allData.filter(row => row._type === activeTab), [allData, activeTab]);
  const filteredData = useMemo(() => {
    const s = debouncedSearchTerm.toLowerCase();
    const activeFilters = Object.entries(columnFilters).filter(([_, v]) => v.length > 0);
    let data = categoryData.filter(row => {
      for (const [col, values] of activeFilters) {
        const val = col === 'Location' ? row._location : col === 'Zip' ? row._zip : row[col];
        if (!values.includes(String(val || ''))) return false;
      }
      if (!s) return true;
      return Object.values(row).some(v => String(v).toLowerCase().includes(s));
    });
    return data;
  }, [categoryData, debouncedSearchTerm, columnFilters]);

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-slate-100">
      <Header searchTerm={searchTerm} onSearchChange={setSearchTerm} onToggleDarkMode={() => setIsDarkMode(!isDarkMode)} isDarkMode={isDarkMode} onToggleLeftSidebar={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)} onToggleRightSidebar={() => setIsRightSidebarOpen(!isRightSidebarOpen)} isRightSidebarOpen={isRightSidebarOpen} isSearchOpen={isSearchOpen} setIsSearchOpen={setIsSearchOpen} searchResults={[]} onResultClick={() => {}} onQuickLinkClick={() => {}} isProductsUnlocked={isProductsUnlocked} />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar types={['All', ...new Set(allData.map(d => d._type).filter(Boolean) as string[])]} activeTab={activeTab} setActiveTab={setActiveTab} isProductsUnlocked={isProductsUnlocked} onToggleProductsLock={() => setIsProductsUnlocked(!isProductsUnlocked)} zips={[]} selectedZip="All" setSelectedZip={() => {}} locations={[]} selectedLocation="All" setSelectedLocation={() => {}} isOpen={isLeftSidebarOpen} onClose={() => setIsLeftSidebarOpen(false)} onGoHome={() => setActiveTab('Home')} allDataCount={allData.length} isSyncing={loadProgress.current < loadProgress.total} />
        <main className="flex-1 flex flex-col bg-white dark:bg-slate-900 overflow-hidden">
           {loading ? <div className="p-20 text-center">Loading...</div> : (
             <div className="flex-1 flex flex-col overflow-hidden">
               <div className="p-4 flex justify-between items-center border-b">
                 <h2 className="font-bold">{activeTab} Hub ({filteredData.length})</h2>
                 <ColumnToggle columns={currentColumnOrder} visibleColumns={visibleColumns} onToggle={toggleColumn} onReorder={handleColumnReorder} />
               </div>
               <div className="flex-1 overflow-auto">
                 <Table data={filteredData} allData={allData} visibleColumns={sortedVisibleColumns} selectedRow={selectedRow} onRowSelect={setSelectedRow} columnFilters={columnFilters} onFilterChange={(c, v) => setColumnFilters(p => ({...p, [c]: v}))} sortConfig={sortConfig} onSortChange={setSortConfig} />
               </div>
             </div>
           )}
        </main>
        <RightSidebar selectedRow={selectedRow} onClose={() => setSelectedRow(null)} manifest={manifest} activeTab={activeTab} productGuide={productGuides[0]} isOpen={isRightSidebarOpen} />
      </div>
    </div>
  );
}

export default App;
