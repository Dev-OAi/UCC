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
import { Search, Filter, Database, MapPin, Download, FilterX } from 'lucide-react';
import Papa from 'papaparse';

export type Page = 'Home' | 'Insights' | 'SMB Selector' | 'Product Guide' | 'Products' | 'Activity Log' | 'treasury-guide' | string;

function App() {
  const [manifest, setManifest] = useState<FileManifest[]>([]);
  const [productGuides, setProductGuides] = useState<ProductGuide[]>(() => {
    const saved = localStorage.getItem('productGuides');
    return saved ? JSON.parse(saved) : [];
  });
  const [allData, setAllData] = useState<DataRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State Management (Unified from main)
  const [activeTab, setActiveTab] = useState<string>('Home');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [highlightedProductId, setHighlightedProductId] = useState<string | null>(null);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [columnFilters, setColumnFilters] = useState<Record<string, string[]>>({});
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);
  const [visibleColumns, setVisibleColumns] = useState<string[]>([]);
  const [selectedRow, setSelectedRow] = useState<DataRow | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [isProductsUnlocked, setIsProductsUnlocked] = useState(false);
  const [isProductsModalOpen, setIsProductsModalOpen] = useState(false);
  const [pendingSearchAction, setPendingSearchAction] = useState<(() => void) | null>(null);

  // Auto-lock Products after 1 minute
  useEffect(() => {
    let timer: any;
    if (isProductsUnlocked) {
      timer = setTimeout(() => {
        setIsProductsUnlocked(false);
      }, 60000); // 1 minute
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
    setSelectedRow(null);
  }, [activeTab]);

  // Data Loading
  useEffect(() => {
    async function init() {
      try {
        const m = await fetchManifest();
        setManifest(m);

        // Load Product Guide if not in localStorage
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

        // Exclude PDFs and JSON from CSV loading
        const csvFiles = m.filter(f => f.type !== 'PDF' && f.type !== 'JSON');
        const dataPromises = csvFiles.map(file => loadCsv(file));
        const results = await Promise.all(dataPromises);
        setAllData(results.flat());
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError('Failed to load data. Please check manifest.json.');
        setLoading(false);
      }
    }
    init();
  }, []);

  // Column Management
  const allColumns = useMemo(() => {
    if (allData.length === 0) return [];
    const keys = new Set<string>();
    const types = Array.from(new Set(allData.slice(0, 1000).map(d => d._type)));
    types.forEach(t => {
      const sample = allData.find(d => d._type === t);
      if (sample) {
        Object.keys(sample).forEach(key => {
          if (!key.startsWith('_') && key !== 'Zip' && key !== 'Location') keys.add(key);
        });
      }
    });
    return [...Array.from(keys), 'Location', 'Zip'];
  }, [allData]);

  useEffect(() => {
    if (allData.length === 0) return;
    if (['Home', 'All', 'Insights'].includes(activeTab)) {
      setVisibleColumns(allColumns);
    } else {
      const sample = allData.find(d => d._type === activeTab);
      if (sample) {
        const keys = Object.keys(sample).filter(k => !k.startsWith('_') && k !== 'Zip' && k !== 'Location');
        setVisibleColumns([...keys, 'Location', 'Zip']);
      }
    }
  }, [activeTab, allColumns, allData]);

  const toggleColumn = (col: string) => {
    setVisibleColumns(prev => prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col]);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setColumnFilters({});
    setSortConfig(null);
    setActiveTab('Home');
  };

  const isFiltered = searchTerm !== '' || Object.values(columnFilters).some(v => v.length > 0) || !['All', 'Home', 'Insights'].includes(activeTab);

  // Filters setup
  const types = useMemo(() => ['All', ...Array.from(new Set(manifest.filter(m => !['PDF', 'JSON'].includes(m.type)).map(m => m.type))).sort()], [manifest]);
  const zips = useMemo(() => ['All', ...Array.from(new Set(manifest.filter(m => !['PDF', 'JSON'].includes(m.type)).map(m => m.zip).filter(Boolean) as string[])).sort()], [manifest]);
  const locations = useMemo(() => ['All', ...Array.from(new Set(manifest.filter(m => !['PDF', 'JSON'].includes(m.type)).map(m => m.location).filter(Boolean) as string[])).sort()], [manifest]);

  // High-performance filtering logic
  const filteredData = useMemo(() => {
    const categoryData = (activeTab === 'All' || activeTab === 'Home' || activeTab === 'Insights') 
      ? allData 
      : allData.filter(row => row._type === activeTab);

    const s = debouncedSearchTerm.toLowerCase();
    const activeFilters = Object.entries(columnFilters).filter(([_, values]) => values && values.length > 0);

    let data = categoryData.filter(row => {
      for (let i = 0; i < activeFilters.length; i++) {
        const [col, values] = activeFilters[i];
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
        const comp = String(aVal || '').localeCompare(String(bVal || ''), undefined, { numeric: true });
        return direction === 'asc' ? comp : -comp;
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
                context: `${section.title} > ${category.title}${sub.title ? ` > ${sub.title}` : ''}`,
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

      // Reset highlight after a delay so it can be re-triggered
      setTimeout(() => setHighlightedProductId(null), 3000);
    };

    if (result.page === 'Products' && !isProductsUnlocked) {
      setPendingSearchAction(() => action);
      setIsProductsModalOpen(true);
    } else {
      action();
    }
  };

  const handleQuickLinkClick = (sectionTitle: string) => {
    const action = () => {
      setActiveTab('Products');
      setIsSearchOpen(false);
      setSearchTerm('');

      setTimeout(() => {
        const sections = document.querySelectorAll('h2');
        const sectionElement = Array.from(sections).find(h => h.textContent === sectionTitle);
        if (sectionElement) {
          sectionElement.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    };

    if (!isProductsUnlocked) {
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
    link.download = `export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (error) return <div className="p-8 text-red-500">{error}</div>;

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-slate-100 transition-colors">
      <Header 
        searchTerm={searchTerm} 
        onSearchChange={setSearchTerm} 
        isSearchOpen={isSearchOpen}
        setIsSearchOpen={setIsSearchOpen}
        searchResults={searchResults}
        onResultClick={handleResultClick}
        onQuickLinkClick={handleQuickLinkClick}
        isProductsUnlocked={isProductsUnlocked}
        isDarkMode={isDarkMode} 
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar 
          types={types} activeTab={activeTab} setActiveTab={(tab) => {
            if (tab === 'Products' && !isProductsUnlocked) {
              setIsProductsModalOpen(true);
            } else {
              setActiveTab(tab);
            }
          }}
          isProductsUnlocked={isProductsUnlocked}
          onToggleProductsLock={() => setIsProductsUnlocked(!isProductsUnlocked)}
          zips={zips} selectedZip={columnFilters['Zip']?.[0] || 'All'}
          setSelectedZip={(z) => setColumnFilters(p => ({...p, Zip: z === 'All' ? [] : [z]}))}
          locations={locations} selectedLocation={columnFilters['Location']?.[0] || 'All'}
          setSelectedLocation={(l) => setColumnFilters(p => ({...p, Location: l === 'All' ? [] : [l]}))}
          isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)}
          onGoHome={() => setActiveTab('Home')}
        />

        <main className="flex-1 flex flex-col min-w-0 bg-white dark:bg-slate-900 md:rounded-tl-2xl border-l dark:border-slate-800">
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="w-12 h-12 border-4 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
          ) : activeTab === 'Home' && !searchTerm ? (
            <Dashboard types={types} onSelectCategory={setActiveTab} rowCount={allData.length} />
          ) : activeTab === 'Insights' ? (
            <Insights data={allData} types={types} />
          ) : activeTab === 'SMB Selector' ? (
            <SmbCheckingSelector setActivePage={setActiveTab} />
          ) : activeTab === 'Product Guide' ? (
            productGuides.length > 0 ? (
              <ProductGuideRenderer
                guide={productGuides[0]}
                setProductGuides={setProductGuides}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-t-blue-600 rounded-full animate-spin"></div>
              </div>
            )
          ) : activeTab === 'Products' ? (
            isProductsUnlocked ? (
              <Products highlightedProductId={highlightedProductId} />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-4">
                <div className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-full text-blue-600 dark:text-blue-400">
                  <Database className="w-12 h-12" />
                </div>
                <div className="max-w-md space-y-2">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Products Tool Locked</h2>
                  <p className="text-gray-500 dark:text-slate-400">
                    This section contains sensitive product and service data. Please use the authorization code to gain access.
                  </p>
                </div>
                <button
                  onClick={() => setIsProductsModalOpen(true)}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-colors shadow-lg shadow-blue-500/20"
                >
                  Unlock Access
                </button>
              </div>
            )
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
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>
                  <ColumnToggle columns={allColumns} visibleColumns={visibleColumns} onChange={toggleColumn} />
                  {isFiltered && (
                    <button onClick={clearFilters} className="text-xs font-semibold text-red-600 flex items-center">
                      <FilterX className="w-3.5 h-3.5 mr-1" /> Clear
                    </button>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-hidden">
                <Table 
                  data={filteredData} allData={allData} visibleColumns={visibleColumns} 
                  selectedRow={selectedRow} onRowSelect={setSelectedRow}
                  columnFilters={columnFilters} onFilterChange={(col, val) => setColumnFilters(p => ({...p, [col]: val}))}
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
        />
      </div>

      <DownloadSecurityModal isOpen={isSecurityModalOpen} onClose={() => setIsSecurityModalOpen(false)} onSuccess={() => { setIsSecurityModalOpen(false); downloadCSV(); }} />
      <ProductsSecurityModal isOpen={isProductsModalOpen} onClose={() => setIsProductsModalOpen(false)} onSuccess={handleProductsUnlockSuccess} />
    </div>
  );
}

export default App;