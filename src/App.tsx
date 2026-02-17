import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  fetchManifest, 
  loadCsv, 
  FileManifest, 
  DataRow, 
  isZipCode, 
  isPhoneNumber 
} from './lib/dataService';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import DataTable from './components/DataTable';
import ProductsModal from './components/ProductsModal';

function App() {
  const [allData, setAllData] = useState<DataRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Home');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isProductsUnlocked, setIsProductsUnlocked] = useState(false);
  const [isProductsModalOpen, setIsProductsModalOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(true);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);
  const [columnFilters, setColumnFilters] = useState<Record<string, string[]>>({});
  
  // Progress tracking for the Blue Bar
  const [loadProgress, setLoadProgress] = useState({ current: 0, total: 0 });

  // Jules' Custom Column Configurations
  const customColumnOrders: Record<string, string[]> = {
    '3. UCC': [
      "businessName", "Document Number", "Phone", "Sunbiz Link", "Florida UCC Link", 
      "Location", "Zip", "Status", "Date Filed", "Expires", "Filings Completed Through", "Summary For Filing"
    ],
    '1. SB': [
      "businessName", "Document Number", "Column 14", "Column 4", "FEI/EIN Number", 
      "Sunbiz Link", "Entity Type", "Location", "Status", "Column 41", "Date Filed", 
      "Expires", "Filings Completed Through", "Summary For Filing", "Column 54", 
      "Column 55", "Florida UCC Link", "Category", "Phone", "Website"
    ],
    '2. YP': ["businessName", "Category", "Phone", "Website", "Location", "Zip"],
    'Last 90 Days': ["Status", "Direct Name", "Reverse Name", "Record Date", "Doc Type", "Instrument Number", "Legal Description"]
  };

  // 1. Load Data with Progress Tracking
  useEffect(() => {
    const initData = async () => {
      try {
        const manifest = await fetchManifest();
        setLoadProgress({ current: 0, total: manifest.length });
        
        const allRows: DataRow[] = [];
        for (let i = 0; i < manifest.length; i++) {
          const rows = await loadCsv(manifest[i]);
          allRows.push(...rows);
          setLoadProgress(prev => ({ ...prev, current: i + 1 }));
        }
        
        setAllData(allRows);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };
    initData();
  }, []);

  // 2. Data Memoization
  const types = useMemo(() => Array.from(new Set(allData.map(d => d._type || 'Unknown'))), [allData]);
  const zips = useMemo(() => Array.from(new Set(allData.map(d => d._zip).filter(Boolean))), [allData]);
  const locations = useMemo(() => Array.from(new Set(allData.map(d => d._location).filter(Boolean))), [allData]);

  // 3. Filtering Logic
  const filteredData = useMemo(() => {
    let data = allData;
    if (activeTab !== 'Home' && activeTab !== 'Products') {
      data = data.filter(d => d._type === activeTab);
    }
    
    Object.entries(columnFilters).forEach(([col, values]) => {
      if (values.length > 0) {
        data = data.filter(d => values.includes(d[col] || d[`_${col.toLowerCase()}`]));
      }
    });

    if (searchTerm) {
      const lowTerm = searchTerm.toLowerCase();
      data = data.filter(d => Object.values(d).some(v => String(v).toLowerCase().includes(lowTerm)));
    }
    return data;
  }, [allData, activeTab, searchTerm, columnFilters]);

  // 4. Helper to find the right column order based on the tab name
  const getColumnsForTab = (tab: string) => {
    if (tab.includes('SB')) return customColumnOrders['1. SB'];
    if (tab.includes('UCC')) return customColumnOrders['3. UCC'];
    if (tab.includes('YP')) return customColumnOrders['2. YP'];
    if (tab.includes('90')) return customColumnOrders['Last 90 Days'];
    return []; 
  };

  const handleQuickLinkClick = (type: string) => {
    setActiveTab(type);
    setIsSearchOpen(false);
  };

  const onFilterChange = (column: string, values: string[]) => {
    setColumnFilters(prev => ({ ...prev, [column]: values }));
  };

  return (
    <div className={`${isDarkMode ? 'dark' : ''} h-screen flex flex-col`}>
      <div className="flex flex-col h-screen bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-slate-100 transition-colors">
        
        {/* BLUE PROGRESS BAR */}
        {loadProgress.current < loadProgress.total && (
          <div className="w-full shrink-0 z-50">
            <div className="h-1 bg-blue-100 dark:bg-blue-900/30 w-full overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-500 ease-out"
                style={{ width: `${(loadProgress.current / loadProgress.total) * 100}%` }}
              />
            </div>
            <div className="bg-blue-50/50 dark:bg-blue-900/10 px-4 py-1 flex justify-between items-center border-b border-blue-100/50 dark:border-blue-900/20">
              <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                System Sync: {loadProgress.current} / {loadProgress.total} Data Streams Loaded
              </span>
              <span className="text-[9px] text-blue-400 animate-pulse font-bold italic">Optimizing Tables...</span>
            </div>
          </div>
        )}

        <Header
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          isSearchOpen={isSearchOpen}
          setIsSearchOpen={setIsSearchOpen}
          searchResults={[]} 
          onResultClick={() => {}}
          onQuickLinkClick={handleQuickLinkClick}
          isProductsUnlocked={isProductsUnlocked}
          isDarkMode={isDarkMode}
          onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
          onToggleLeftSidebar={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)}
          onToggleRightSidebar={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
          isRightSidebarOpen={isRightSidebarOpen}
        />

        <div className="flex-1 flex overflow-hidden">
          <Sidebar
            types={types}
            activeTab={activeTab}
            setActiveTab={(tab) => {
              if (tab === 'Products' && !isProductsUnlocked) setIsProductsModalOpen(true);
              else setActiveTab(tab);
            }}
            isProductsUnlocked={isProductsUnlocked}
            onToggleProductsLock={() => setIsProductsUnlocked(!isProductsUnlocked)}
            zips={zips}
            selectedZip={columnFilters['Zip']?.[0] || 'All'}
            setSelectedZip={(z) => onFilterChange('Zip', z === 'All' ? [] : [z])}
            locations={locations}
            selectedLocation={columnFilters['Location']?.[0] || 'All'}
            setSelectedLocation={(l) => onFilterChange('Location', l === 'All' ? [] : [l])}
            isOpen={isLeftSidebarOpen}
            onClose={() => setIsLeftSidebarOpen(false)}
            onGoHome={() => setActiveTab('Home')}
            allDataCount={allData.length}
            isSyncing={loadProgress.current < loadProgress.total}
          />

          <main className="flex-1 flex flex-col min-w-0 bg-white dark:bg-slate-900 md:rounded-tl-2xl border-l dark:border-slate-800">
            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-600 dark:text-slate-400 font-medium tracking-tight">Initializing Workspace...</p>
              </div>
            ) : activeTab === 'Home' && !searchTerm ? (
              <Dashboard types={types} onSelectCategory={setActiveTab} rowCount={allData.length} />
            ) : (
              <div className="flex-1 flex flex-col overflow-hidden">
                <DataTable 
                  data={filteredData} 
                  title={searchTerm ? `Search Results: ${searchTerm}` : activeTab}
                  customColumnOrder={getColumnsForTab(activeTab)}
                />
              </div>
            )}
          </main>
        </div>

        <ProductsModal 
          isOpen={isProductsModalOpen} 
          onClose={() => setIsProductsModalOpen(false)}
          onUnlock={() => {
            setIsProductsUnlocked(true);
            setIsProductsModalOpen(false);
            setActiveTab('Products');
          }}
        />
      </div>
    </div>
  );
}

export default App;
