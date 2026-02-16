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

  // State Management
  const [activeTab, setActiveTab] = useState<string>('Home');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [highlightedProductId, setHighlightedProductId] = useState<string | null>(null);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [columnFilters, setColumnFilters] = useState<Record<string, string[]>>({});
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);
  const [visibleColumns, setVisibleColumns] = useState<string[]>([]);
  
  // UCC HUB ORDER: Locked layout as requested
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

  // Auto-lock Products
  useEffect(() => {
    let timer: any;
    if (isProductsUnlocked) {
      timer = setTimeout(() => setIsProductsUnlocked(false), 60000);
    }
    return () => clearTimeout(timer);
  }, [isProductsUnlocked]);

  // Dark Mode
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');

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
    if (productGuides.length > 0) {
      localStorage.setItem('productGuides', JSON.stringify(productGuides));
    }
  }, [productGuides]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedAllData(allData), 100);
    return () => clearTimeout(timer);
  }, [allData]);

  useEffect(() => { setSelectedRow(null); }, [activeTab]);

  useEffect(() => {
    if (selectedRow) setIsRightSidebarOpen(true);
  }, [selectedRow]);

  // Data Loading
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
        console.error(err);
        setError('Failed to load data.');
        setLoading(false);
      }
    }
    init();
  }, []);

  // Column Management
  const allColumns = useMemo(() => {
    if (allData.length === 0) return [];
    const keys = new Set<string>();
    
    // Scan all data once to collect every unique scrubbed header
    allData.forEach(row => {
      Object.keys(row).forEach(key => {
        if (!key.startsWith('_') && key !== 'Zip' && key !== 'Location') {
          keys.add(key);
        }
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

  // APPLYING THE AUDIT INSTRUCTIONS: Default visibility
  useEffect(() => {
    if (allData.length === 0) return;
    
    if (['Home', 'All', 'Insights'].includes(activeTab)) {
      setVisibleColumns(allColumns);
    } else if (activeTab === '3. UCC') {
      // PRESERVE SPECIFIC ORDER FOR UCC HUB
      setVisibleColumns(["businessName", "Sunbiz Link", "Florida UCC Link", "Expiration Date", "Location", "Zip"]);
    } else {
      const sample = allData.find(d => d._type === activeTab);
      if (sample) {
        // Default View: Scrub 'Column X' so UI looks clean, but they exist in 'All Columns' toggle
        const keys = Object.keys(sample).filter(k => 
          !k.startsWith('_') && 
          k !== 'Zip' && 
          k !== 'Location' && 
          !k.startsWith('Column ')
        );
        setVisibleColumns([...keys, 'Location', 'Zip']);
      }
    }
  }, [activeTab, allColumns, allData]);

  const toggleColumn = (col: string) => {
    setVisibleColumns(prev => prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col]);
  };

  const handleColumnReorder = (col: string, direction: 'up' | 'down') => {
    const currentOrder = currentColumnOrder;
    const index = currentOrder.indexOf(col);
    if (index === -1) return;
    const newOrder = [...currentOrder];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newOrder.length) return;
    [newOrder[index], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[index]];
    setCustomColumnOrders(prev => ({ ...prev, [activeTab]: newOrder }));
  };

  const copyLayoutConfig = () => {
    const config = { tab: activeTab, visibleColumns: sortedVisibleColumns, allColumnsOrder: currentColumnOrder };
    navigator.clipboard.writeText(JSON.stringify(config, null, 2));
    alert('Layout configuration copied!');
  };

  const clearFilters = () => {
    setSearchTerm('');
    setColumnFilters({});
    setSortConfig(null);
    setActiveTab('Home');
  };

  const isFiltered = searchTerm !== '' || Object.values(columnFilters).some(v => v.length > 0) || !['All', 'Home', 'Insights'].includes(activeTab);

  const types = useMemo(() => ['All', ...Array.from(new Set(debouncedAllData.map(d => d._type).filter(Boolean)))].sort(), [debouncedAllData]);
  const zips = useMemo(() => ['All', ...Array.from(new Set(debouncedAllData.map(d => d._zip).filter(Boolean)))].sort(), [debouncedAllData]);
  const locations = useMemo(() => ['All', ...Array.from(new Set(debouncedAllData.map(d => d._location).filter(Boolean)))].sort(), [debouncedAllData]);

  const onFilterChange = (col: string, val: string[]) => setColumnFilters(p => ({ ...p, [col]: val }));

  const categoryData = useMemo(() => {
    if (['All', 'Home', 'Insights'].includes(activeTab)) return allData;
    return allData.filter(row => row._type === activeTab);
  }, [allData, activeTab]);

  const filteredData = useMemo(() => {
    const s = debouncedSearchTerm.toLowerCase();
    const activeFilters = Object.entries(columnFilters).filter(([_, values]) => values && values.length > 0);

    let data = categoryData.filter(row => {
      for (const [col, values] of activeFilters) {
        const rowValue = col === 'Location' ? row._location : col === 'Zip' ? row._zip : row[col];
        if (!values.includes(String(rowValue || ''))) return false;
      }
      if (!s) return true;
      for (const key in row) {
        if (key[0] === '_') continue;
        if (String(row[key] || '').toLowerCase().includes(s)) return true;
      }
      return String(row._location || '').toLowerCase().includes(s) || String(row._zip || '').toLowerCase().includes(s);
    });

    if (sortConfig) {
      const { key, direction } = sortConfig;
      data = [...data].sort((a, b) => {
        const aVal = key === 'Location' ? a._location : key === 'Zip' ? a._zip : a[key];
        const bVal = key === 'Location' ? b._location : key === 'Zip' ? b._zip : b[key];
        const comp = collator.compare(String(aVal || ''), String(bVal || ''));
        return direction === 'asc' ? comp : -comp;
      });
    }
    return data;
  }, [categoryData, debouncedSearchTerm, columnFilters, sortConfig]);

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
    } else { action(); }
  };

  const handleQuickLinkClick = (sectionTitle: string) => {
    const action = () => {
      setActiveTab('Products');
      setIsSearchOpen(false);
      setSearchTerm('');
      setTimeout(() => {
        const sectionElement = Array.from(document.querySelectorAll('h2')).find(h => h.textContent === sectionTitle);
        if (sectionElement) sectionElement.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    };
    if (!isProductsUnlocked) {
      setPendingSearchAction(() => action);
      setIsProductsModalOpen(true);
    } else { action(); }
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
    link.download = `export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (error) return <div className="p-8 text-red-500">{error}</div>;

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-slate-100 transition-colors">
      {loadProgress.current < loadProgress.total && (
        <div className="w-full shrink-0">
          <div className="h-1 bg-blue-100 dark:bg-blue-900/30 w-full overflow-hidden">
            <div className="h-full bg-blue-600 transition-all duration-500" style={{ width: `${(loadProgress.current / loadProgress.total) * 100}%` }} />
          </div>
        </div>
      )}
      <Header
        searchTerm={searchTerm} onSearchChange={setSearchTerm}
        isSearchOpen={isSearchOpen} setIsSearchOpen={setIsSearchOpen}
        searchResults={searchResults} onResultClick={handleResultClick}
        onQuickLinkClick={handleQuickLinkClick} isProductsUnlocked={isProductsUnlocked}
        isDarkMode={isDarkMode} onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        onToggleLeftSidebar={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)}
        onToggleRightSidebar={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
        isRightSidebarOpen={isRightSidebarOpen}
      />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          types={types} activeTab={activeTab} setActiveTab={(tab) => {
            if (tab === 'Products' && !isProductsUnlocked) setIsProductsModalOpen(true);
            else setActiveTab(tab);
          }}
          isProductsUnlocked={isProductsUnlocked} onToggleProductsLock={() => setIsProductsUnlocked(!isProductsUnlocked)}
          zips={zips} selectedZip={columnFilters['Zip']?.[0] || 'All'}
          setSelectedZip={(z) => onFilterChange('Zip', z === 'All' ? [] : [z])}
          locations={locations} selectedLocation={columnFilters['Location']?.[0] || 'All'}
          setSelectedLocation={(l) => onFilterChange('Location', l === 'All' ? [] : [l])}
          isOpen={isLeftSidebarOpen} onClose={() => setIsLeftSidebarOpen(false)}
          onGoHome={() => setActiveTab('Home')} allDataCount={allData.length}
          isSyncing={loadProgress.current < loadProgress.total}
        />
        <main className="flex-1 flex flex-col min-w-0 bg-white dark:bg-slate-900 md:rounded-tl-2xl border-l dark:border-slate-800">
          {loading ? (
            <div className="flex-1 flex items-center justify-center animate-pulse">Loading Workspace...</div>
          ) : activeTab === 'Home' && !searchTerm ? (
            <Dashboard types={types} onSelectCategory={setActiveTab} rowCount={allData.length} />
          ) : activeTab === 'Insights' ? (
            <Insights data={allData} types={types} />
          ) : activeTab === 'SMB Selector' ? (
            <SmbCheckingSelector setActivePage={setActiveTab} />
          ) : activeTab === 'Products' ? (
            isProductsUnlocked ? <Products highlightedProductId={highlightedProductId} /> : (
              <div className="flex-1 flex flex-col items-center justify-center">
                <Database className="w-12 h-12 mb-4 text-blue-600" />
                <button onClick={() => setIsProductsModalOpen(true)} className="px-6 py-2 bg-blue-600 text-white rounded-lg">Unlock Access</button>
              </div>
            )
          ) : (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="px-6 py-4 flex items-center justify-between shrink-0">
                <div>
                  <h2 className="text-lg font-bold">{activeTab} Hub</h2>
                  <p className="text-xs text-gray-500">{filteredData.length.toLocaleString()} records</p>
                </div>
                <div className="flex items-center space-x-3">
                  <button onClick={() => setIsSecurityModalOpen(true)} className="flex items-center space-x-2 px-3 py-1.5 bg-blue-600 text-white rounded-md text-xs">
                    <Download className="w-3.5 h-3.5" /><span>Download</span>
                  </button>
                  <ColumnToggle
                    columns={currentColumnOrder} visibleColumns={visibleColumns}
                    onToggle={toggleColumn} onReorder={handleColumnReorder}
                  />
                  {activeTab === '3. UCC' && (
                    <button onClick={copyLayoutConfig} className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg">
                      <Copy className="w-4 h-4" />
                    </button>
                  )}
                  {isFiltered && (
                    <button onClick={clearFilters} className="text-xs text-red-600 flex items-center">
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
          selectedRow={selectedRow} onClose={() => setSelectedRow(null)}
          manifest={manifest} activeTab={activeTab} productGuide={productGuides[0]}
          isOpen={isRightSidebarOpen}
        />
      </div>
      <DownloadSecurityModal isOpen={isSecurityModalOpen} onClose={() => setIsSecurityModalOpen(false)} onSuccess={() => { setIsSecurityModalOpen(false); downloadCSV(); }} />
      <ProductsSecurityModal isOpen={isProductsModalOpen} onClose={() => setIsProductsModalOpen(false)} onSuccess={() => { setIsProductsUnlocked(true); setIsProductsModalOpen(false); pendingSearchAction?.(); }} />
    </div>
  );
}

export default App;
