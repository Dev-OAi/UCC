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
import { Search, Filter, Database, MapPin, Download, FilterX, Copy } from 'lucide-react';
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
  
  const [customColumnOrders, setCustomColumnOrders] = useState<Record<string, string[]>>({
    '3. UCC': [
      "businessName", 
      "Document Number", 
      "Phone", 
      "Sunbiz Link", 
      "Florida UCC Link", 
      "Location", 
      "Zip",
      "Status", 
      "Date Filed", 
      "Expires", 
      "Filings Completed Through", 
      "Summary For Filing"
    ],
    '1. SB': [
      "businessName",
      "Document Number",
      "Column 14",
      "Column 4",
      "FEI/EIN Number",
      "Sunbiz Link",
      "Entity Type",
      "Location",
      "Status",
      "Column 41",
      "Date Filed",
      "Expires",
      "Filings Completed Through",
      "Summary For Filing",
      "Column 54",
      "Column 55",
      "Florida UCC Link",
      "Category",
      "Phone",
      "Website"
    ],
    '2. YP': [
      "businessName",
      "Category",
      "Phone",
      "Website",
      "Location",
      "Zip"
    ],
    'Last 90 Days': [
      "Status",
      "Direct Name",
      "Reverse Name",
      "Record Date",
      "Doc Type",
      "Instrument Number",
      "Legal Description"
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

  useEffect(() => {
    let timer: any;
    if (isProductsUnlocked) {
      timer = setTimeout(() => setIsProductsUnlocked(false), 60000);
    }
    return () => clearTimeout(timer);
  }, [isProductsUnlocked]);

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

  useEffect(() => {
    async function init() {
      try {
        const m = await fetchManifest();
        setManifest(m);

        const csvFiles = m.filter(f => f.type !== 'PDF' && f.type !== 'JSON');
        setLoadProgress({ current: 0, total: csvFiles.length });
        setLoading(false);

        const batchSize = 2;
        for (let i = 0; i < csvFiles.length; i += batchSize) {
          const batch = csvFiles.slice(i, i + batchSize);
          const batchResults = await Promise.all(batch.map(file => loadCsv(file)));
          setAllData(prev => [...prev, ...batchResults.flat()]);
          setLoadProgress(prev => ({ ...prev, current: Math.min(csvFiles.length, i + batchSize) }));
        }
      } catch (err) {
        setError('Failed to load data.');
        setLoading(false);
      }
    }
    init();
  }, []);

  const allColumns = useMemo(() => {
    if (allData.length === 0) return [];
    const keys = new Set<string>();
    allData.slice(0, 100).forEach(row => {
      Object.keys(row).forEach(k => {
        if (!k.startsWith('_') && k !== 'Zip' && k !== 'Location') keys.add(k);
      });
    });
    return [...Array.from(keys), 'Location', 'Zip'];
  }, [allData]);

  const currentColumnOrder = useMemo(() => {
    const customOrder = customColumnOrders[activeTab];
    if (!customOrder) return allColumns;
    const remaining = allColumns.filter(col => !customOrder.includes(col));
    return [...customOrder, ...remaining];
  }, [customColumnOrders, activeTab, allColumns]);

  const sortedVisibleColumns = useMemo(() => {
    return [...visibleColumns].sort((a, b) => currentColumnOrder.indexOf(a) - currentColumnOrder.indexOf(b));
  }, [visibleColumns, currentColumnOrder]);

  useEffect(() => {
    if (allData.length === 0) return;
    if (['Home', 'All', 'Insights'].includes(activeTab)) {
      setVisibleColumns(allColumns);
    } else if (customColumnOrders[activeTab]) {
      setVisibleColumns(customColumnOrders[activeTab]);
    } else {
      const sample = allData.find(d => d._type === activeTab);
      if (sample) {
        const keys = Object.keys(sample).filter(k => !k.startsWith('_') && k !== 'Zip' && k !== 'Location');
        setVisibleColumns([...keys, 'Location', 'Zip']);
      }
    }
  }, [activeTab, allColumns, allData]);

  const toggleColumn = (col: string) => setVisibleColumns(prev => prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col]);

  const handleColumnReorder = (col: string, direction: 'up' | 'down') => {
    const order = currentColumnOrder;
    const idx = order.indexOf(col);
    const target = direction === 'up' ? idx - 1 : idx + 1;
    if (target < 0 || target >= order.length) return;
    const newOrder = [...order];
    [newOrder[idx], newOrder[target]] = [newOrder[target], newOrder[idx]];
    setCustomColumnOrders(prev => ({ ...prev, [activeTab]: newOrder }));
  };

  const copyLayoutConfig = () => {
    navigator.clipboard.writeText(JSON.stringify({ tab: activeTab, visibleColumns: sortedVisibleColumns }, null, 2));
    alert('Layout copied!');
  };

  const filteredData = useMemo(() => {
    let data = activeTab === 'Home' || activeTab === 'All' ? allData : allData.filter(r => r._type === activeTab);
    const s = debouncedSearchTerm.toLowerCase();
    
    if (s) {
      data = data.filter(r => Object.values(r).some(v => String(v).toLowerCase().includes(s)));
    }

    if (sortConfig) {
      data = [...data].sort((a, b) => {
        const aVal = String(a[sortConfig.key] || '');
        const bVal = String(b[sortConfig.key] || '');
        return sortConfig.direction === 'asc' ? collator.compare(aVal, bVal) : collator.compare(bVal, aVal);
      });
    }
    return data;
  }, [allData, activeTab, debouncedSearchTerm, sortConfig]);

  if (error) return <div className="p-8 text-red-500">{error}</div>;

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-slate-100">
      <Header 
        searchTerm={searchTerm} onSearchChange={setSearchTerm} 
        isSearchOpen={isSearchOpen} setIsSearchOpen={setIsSearchOpen}
        searchResults={[]} onResultClick={() => {}} onQuickLinkClick={() => {}}
        isProductsUnlocked={isProductsUnlocked} isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        onToggleLeftSidebar={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)}
        onToggleRightSidebar={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
        isRightSidebarOpen={isRightSidebarOpen}
      />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar 
          types={['All', ...Array.from(new Set(allData.map(d => d._type).filter(Boolean)))]} 
          activeTab={activeTab} setActiveTab={setActiveTab}
          isProductsUnlocked={isProductsUnlocked} onToggleProductsLock={() => setIsProductsUnlocked(!isProductsUnlocked)}
          zips={[]} selectedZip="All" setSelectedZip={() => {}}
          locations={[]} selectedLocation="All" setSelectedLocation={() => {}}
          isOpen={isLeftSidebarOpen} onClose={() => setIsLeftSidebarOpen(false)}
          onGoHome={() => setActiveTab('Home')} allDataCount={allData.length}
          isSyncing={loadProgress.current < loadProgress.total}
        />

        <main className="flex-1 flex flex-col min-w-0 bg-white dark:bg-slate-900 border-l dark:border-slate-800">
          {loading ? (
             <div className="flex-1 flex items-center justify-center">Loading...</div>
          ) : activeTab === 'Home' ? (
            <Dashboard types={[]} onSelectCategory={setActiveTab} rowCount={allData.length} />
          ) : (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="px-6 py-4 flex items-center justify-between">
                <h2 className="text-lg font-bold">{activeTab} Hub</h2>
                <div className="flex items-center space-x-2">
                  <ColumnToggle columns={currentColumnOrder} visibleColumns={visibleColumns} onToggle={toggleColumn} onReorder={handleColumnReorder} />
                  <button onClick={copyLayoutConfig} className="p-1.5"><Copy className="w-4 h-4" /></button>
                </div>
              </div>
              <Table 
                data={filteredData} allData={allData} visibleColumns={sortedVisibleColumns}
                selectedRow={selectedRow} onRowSelect={setSelectedRow}
                columnFilters={{}} onFilterChange={() => {}}
                sortConfig={sortConfig} onSortChange={setSortConfig}
              />
            </div>
          )}
        </main>

        <RightSidebar 
          selectedRow={selectedRow} onClose={() => setSelectedRow(null)}
          manifest={manifest} activeTab={activeTab} isOpen={isRightSidebarOpen}
        />
      </div>
    </div>
  );
}

export default App;
