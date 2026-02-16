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

  // --- State Management ---
  const [activeTab, setActiveTab] = useState<string>('Home');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [highlightedProductId, setHighlightedProductId] = useState<string | null>(null);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [columnFilters, setColumnFilters] = useState<Record<string, string[]>>({});
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);
  const [visibleColumns, setVisibleColumns] = useState<string[]>([]);
  
  // Custom Hub Layouts: Defines exact order and visibility for specific tabs
  const [customColumnOrders, setCustomColumnOrders] = useState<Record<string, string[]>>({
    '3. UCC': [
      "businessName", 
      "Status",                    // From Image: Column AP
      "Date Filed",                // From Image: Column AQ
      "Expires",                   // From Image: Column AR
      "Filings Completed Through", // From Image: Column AS
      "Summary For Filing",        // From Image: Column AT
      "Sunbiz Link", 
      "Florida UCC Link", 
      "Location", 
      "Zip"
    ],
    'SB Hub': ["businessName", "Location", "Zip"], // Configure these as needed
    'YP Hub': ["businessName", "Zip", "Location"]
  });

  const [selectedRow, setSelectedRow] = useState<DataRow | null>(null);
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(window.innerWidth >= 1024);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(window.innerWidth >= 1024);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [isProductsUnlocked, setIsProductsUnlocked] = useState(false);
  const [isProductsModalOpen, setIsProductsModalOpen] = useState(false);
  const [pendingSearchAction, setPendingSearchAction] = useState<(() => void) | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');

  // --- Effects ---

  // Auto-lock Products
  useEffect(() => {
    let timer: any;
    if (isProductsUnlocked) {
      timer = setTimeout(() => setIsProductsUnlocked(false), 60000);
    }
    return () => clearTimeout(timer);
  }, [isProductsUnlocked]);

  // Search Debounce
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchTerm(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Dark Mode
  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem('darkMode', String(isDarkMode));
  }, [isDarkMode]);

  // LocalStorage Sync
  useEffect(() => {
    if (productGuides.length > 0) {
      localStorage.setItem('productGuides', JSON.stringify(productGuides));
    }
  }, [productGuides]);

  // Data Debounce for performance
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedAllData(allData), 100);
    return () => clearTimeout(timer);
  }, [allData]);

  // Reset selection on tab change
  useEffect(() => {
    setSelectedRow(null);
  }, [activeTab]);

  // Auto-open detail view
  useEffect(() => {
    if (selectedRow) setIsRightSidebarOpen(true);
  }, [selectedRow]);

  // Data Loading Lifecycle
  useEffect(() => {
    async function init() {
      try {
        const m = await fetchManifest();
        setManifest(m);

        const savedGuides = localStorage.getItem('productGuides');
        if (!savedGuides) {
          const guideFile = m.find(f => f.path.includes('initial.json'));
          if (guideFile) {
            const response = await fetch(`./${guideFile.path}`);
            if (response.ok) {
              const initialGuides = await response.json();
              setProductGuides(initialGuides);
            }
          }
        }

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
        setError('Failed to load data. Please check manifest.json.');
        setLoading(false);
      }
    }
    init();
  }, []);

  // --- Memos ---

  const allColumns = useMemo(() => {
    if (allData.length === 0) return [];
    const keys = new Set<string>();
    const samples = new Map<string, DataRow>();
    const expectedTypesCount = new Set(manifest.filter(m => !['PDF', 'JSON'].includes(m.type)).map(m => m.type)).size;

    for (let i = 0; i < allData.length; i++) {
      const row = allData[i];
      if (row._type && !samples.has(row._type)) {
        samples.set(row._type, row);
        if (samples.size === expectedTypesCount) break;
      }
    }

    samples.forEach(sample => {
      Object.keys(sample).forEach(key => {
        if (!key.startsWith('_') && key !== 'Zip' && key !== 'Location') keys.add(key);
      });
    });

    return [...Array.from(keys), 'Location', 'Zip'];
  }, [allData, manifest]);

  // Set visible columns based on tab selection
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
  }, [activeTab, allColumns, allData, customColumnOrders]);

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

  const filteredData = useMemo(() => {
    const s = debouncedSearchTerm.toLowerCase();
    const activeFilters = Object.entries(columnFilters).filter(([_, values]) => values && values.length > 0);

    const categoryData = (activeTab === 'All' || activeTab === 'Home' || activeTab === 'Insights') 
      ? allData 
      : allData.filter(row => row._type === activeTab);

    let data = categoryData.filter(row => {
      for (const [col, values] of activeFilters) {
        const val = col === 'Location' ? row._location : col === 'Zip' ? row._zip : row[col];
        if (!values.includes(String(val || ''))) return false;
      }
      if (!s) return true;
      return Object.entries(row).some(([k, v]) => !k.startsWith('_') && String(v).toLowerCase().includes(s)) ||
             String(row._location).toLowerCase().includes(s) || String(row._zip).toLowerCase().includes(s);
    });

    if (sortConfig) {
      const { key, direction } = sortConfig;
      const dateRegex = /^\d{1,2}\/\d{1,2}\/\d{4}$/;
      data = [...data].sort((a, b) => {
        const aVal = String(key === 'Location' ? a._location : key === 'Zip' ? a._zip : a[key] || '');
        const bVal = String(key === 'Location' ? b._location : key === 'Zip' ? b._zip : b[key] || '');
        if (dateRegex.test(aVal) && dateRegex.test(bVal)) {
          return direction === 'asc' ? new Date(aVal).getTime() - new Date(bVal).getTime() : new Date(bVal).getTime() - new Date(aVal).getTime();
        }
        return direction === 'asc' ? collator.compare(aVal, bVal) : collator.compare(bVal, aVal);
      });
    }
    return data;
  }, [allData, activeTab, debouncedSearchTerm, columnFilters, sortConfig]);

  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const query = searchTerm.toLowerCase();
    const results: SearchResult[] = [];
    productData.forEach((section, sIdx) => {
      section.categories.forEach((category, cIdx) => {
        category.subCategories.forEach((sub, subIdx) => {
          sub.products.forEach((product, pIdx) => {
            if (product.name.toLowerCase().includes(query)) {
              results.push({
                id: `${sIdx}-${cIdx}-${subIdx}-${pIdx}`,
                name: product.name,
                context: `${section.title} > ${category.title}`,
                page: 'Products'
              });
            }
          });
        });
      });
    });
    return results.slice(0, 10);
  }, [searchTerm]);

  // --- Handlers ---

  const handleResultClick = (result: SearchResult) => {
    const action = () => {
      setActiveTab(result.page);
      setHighlightedProductId(result.id);
      setIsSearchOpen(false);
      setSearchTerm('');
      setTimeout(() => setHighlightedProductId(null), 3000);
    };
    if (result.page === 'Products' && !isProductsUnlocked) {
      setPendingSearchAction(() => action);
      setIsProductsModalOpen(true);
    } else {
      action();
    }
  };

  const handleProductsUnlockSuccess = () => {
    setIsProductsUnlocked(true);
    setIsProductsModalOpen(false);
    if (pendingSearchAction) {
      pendingSearchAction();
      setPendingSearchAction(null);
    }
  };

  const downloadCSV = () => {
    const dataToExport = filteredData.map(row => {
      const exportRow: any = {};
      visibleColumns.forEach(col => {
        exportRow[col] = col === 'Location' ? row._location : col === 'Zip' ? row._zip : row[col];
      });
      return exportRow;
    });
    const csv = Papa.unparse(dataToExport);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${activeTab}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (error) return <div className="p-8 text-red-500 font-bold">{error}</div>;

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-slate-100 transition-colors">
      {loadProgress.current < loadProgress.total && (
        <div className="w-full shrink-0">
          <div className="h-1 bg-blue-100 dark:bg-blue-900/30 w-full overflow-hidden">
            <div className="h-full bg-blue-600 transition-all duration-500" style={{ width: `${(loadProgress.current / loadProgress.total) * 100}%` }} />
          </div>
          <div className="bg-blue-50/50 dark:bg-blue-900/10 px-4 py-0.5 flex justify-between items-center border-b border-blue-100/50">
             <span className="text-[10px] font-medium text-blue-600">Syncing: {loadProgress.current} / {loadProgress.total}</span>
          </div>
        </div>
      )}

      <Header
        searchTerm={searchTerm} onSearchChange={setSearchTerm}
        isSearchOpen={isSearchOpen} setIsSearchOpen={setIsSearchOpen}
        searchResults={searchResults} onResultClick={handleResultClick}
        isProductsUnlocked={isProductsUnlocked}
        isDarkMode={isDarkMode} onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        onToggleLeftSidebar={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)}
        onToggleRightSidebar={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
        isRightSidebarOpen={isRightSidebarOpen}
        onQuickLinkClick={() => {}}
      />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          types={Array.from(new Set(debouncedAllData.map(d => d._type).filter(Boolean) as string[])).sort()}
          activeTab={activeTab} setActiveTab={(tab) => {
             if (tab === 'Products' && !isProductsUnlocked) setIsProductsModalOpen(true);
             else setActiveTab(tab);
          }}
          isProductsUnlocked={isProductsUnlocked}
          onToggleProductsLock={() => setIsProductsUnlocked(!isProductsUnlocked)}
          zips={Array.from(new Set(debouncedAllData.map(d => d._zip).filter(Boolean) as string[])).sort()}
          selectedZip={columnFilters['Zip']?.[0] || 'All'}
          setSelectedZip={(z) => onFilterChange('Zip', z === 'All' ? [] : [z])}
          locations={Array.from(new Set(debouncedAllData.map(d => d._location).filter(Boolean) as string[])).sort()}
          selectedLocation={columnFilters['Location']?.[0] || 'All'}
          setSelectedLocation={(l) => onFilterChange('Location', l === 'All' ? [] : [l])}
          isOpen={isLeftSidebarOpen} onClose={() => setIsLeftSidebarOpen(false)}
          onGoHome={() => setActiveTab('Home')}
          allDataCount={allData.length}
          isSyncing={loadProgress.current < loadProgress.total}
        />

        <main className="flex-1 flex flex-col min-w-0 bg-white dark:bg-slate-900 md:rounded-tl-2xl border-l dark:border-slate-800">
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="w-12 h-12 border-4 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
          ) : activeTab === 'Home' && !searchTerm ? (
            <Dashboard types={[]} onSelectCategory={setActiveTab} rowCount={allData.length} />
          ) : activeTab === 'Insights' ? (
            <Insights data={allData} types={[]} />
          ) : activeTab === 'SMB Selector' ? (
            <SmbCheckingSelector setActivePage={setActiveTab} />
          ) : activeTab === 'Product Guide' ? (
            <ProductGuideRenderer guide={productGuides[0]} setProductGuides={setProductGuides} />
          ) : activeTab === 'Products' ? (
            <Products highlightedProductId={highlightedProductId} />
          ) : activeTab === 'treasury-guide' ? (
            <TreasuryGuide />
          ) : activeTab === 'Activity Log' ? (
            <ActivityLog />
          ) : (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="px-6 py-4 flex items-center justify-between shrink-0">
                <div>
                  <h2 className="text-lg font-bold">{activeTab} Hub</h2>
                  <p className="text-xs text-gray-500">{filteredData.length.toLocaleString()} records found</p>
                </div>
                <div className="flex items-center space-x-3">
                  <button onClick={() => setIsSecurityModalOpen(true)} className="flex items-center space-x-2 px-3 py-1.5 bg-blue-600 text-white rounded-md text-xs font-semibold">
                    <Download className="w-3.5 h-3.5" /> <span>Download</span>
                  </button>
                  <ColumnToggle
                    columns={currentColumnOrder} visibleColumns={visibleColumns}
                    onToggle={(col) => setVisibleColumns(prev => prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col])}
                    onReorder={(col, dir) => {
                      const order = [...currentColumnOrder];
                      const idx = order.indexOf(col);
                      const target = dir === 'up' ? idx - 1 : idx + 1;
                      if (target >= 0 && target < order.length) {
                        [order[idx], order[target]] = [order[target], order[idx]];
                        setCustomColumnOrders(prev => ({ ...prev, [activeTab]: order }));
                      }
                    }}
                  />
                  {(searchTerm || Object.values(columnFilters).some(v => v.length > 0)) && (
                    <button onClick={() => {setSearchTerm(''); setColumnFilters({});}} className="text-xs font-semibold text-red-600 flex items-center">
                      <FilterX className="w-3.5 h-3.5 mr-1" /> Clear
                    </button>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-hidden">
                <Table
                  data={filteredData} allData={debouncedAllData} visibleColumns={sortedVisibleColumns}
                  selectedRow={selectedRow} onRowSelect={setSelectedRow}
                  columnFilters={columnFilters} onFilterChange={onFilterChange}
                  sortConfig={sortConfig} onSortChange={setSortConfig}
                />
              </div>
            </div>
          )}
        </main>

        <RightSidebar
          selectedRow={selectedRow}
          onClose={() => setSelectedRow(null)}
          manifest={manifest}
          activeTab={activeTab}
          productGuide={productGuides[0]}
          isOpen={isRightSidebarOpen}
        />
      </div>

      <DownloadSecurityModal isOpen={isSecurityModalOpen} onClose={() => setIsSecurityModalOpen(false)} onSuccess={() => { setIsSecurityModalOpen(false); downloadCSV(); }} />
      <ProductsSecurityModal isOpen={isProductsModalOpen} onClose={() => setIsProductsModalOpen(false)} onSuccess={handleProductsUnlockSuccess} />
    </div>
  );
}

export default App;
