import React, { useState, useEffect, useMemo } from 'react';
import { fetchManifest, loadCsv, FileManifest, DataRow } from './lib/dataService';
import { Table } from './components/Table';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { RightSidebar } from './components/RightSidebar';
import { Dashboard } from './components/Dashboard';
import { ColumnToggle } from './components/ColumnToggle';
import { DownloadSecurityModal } from './components/DownloadSecurityModal';
import { Insights } from './components/Insights';
import { SmbCheckingSelector } from './components/SmbCheckingSelector';
import { TreasuryGuide } from './components/TreasuryGuide';
import { Search, Filter, Database, MapPin, Download, FilterX } from 'lucide-react';
import Papa from 'papaparse';

export type Page = 'Home' | 'Insights' | 'SMB Selector' | 'treasury-guide' | string;

function App() {
  const [manifest, setManifest] = useState<FileManifest[]>([]);
  const [allData, setAllData] = useState<DataRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State Management (Unified from main)
  const [activeTab, setActiveTab] = useState<string>('Home');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [columnFilters, setColumnFilters] = useState<Record<string, string[]>>({});
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);
  const [visibleColumns, setVisibleColumns] = useState<string[]>([]);
  const [selectedRow, setSelectedRow] = useState<DataRow | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);

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

  // Data Loading
  useEffect(() => {
    async function init() {
      try {
        const m = await fetchManifest();
        setManifest(m);
        // Exclude PDFs from CSV loading
        const csvFiles = m.filter(f => f.type !== 'PDF');
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
  const types = useMemo(() => ['All', ...Array.from(new Set(manifest.filter(m => m.type !== 'PDF').map(m => m.type))).sort()], [manifest]);
  const zips = useMemo(() => ['All', ...Array.from(new Set(manifest.filter(m => m.type !== 'PDF').map(m => m.zip).filter(Boolean) as string[])).sort()], [manifest]);
  const locations = useMemo(() => ['All', ...Array.from(new Set(manifest.filter(m => m.type !== 'PDF').map(m => m.location).filter(Boolean) as string[])).sort()], [manifest]);

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
        isDarkMode={isDarkMode} 
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar 
          types={types} activeTab={activeTab} setActiveTab={setActiveTab}
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
          ) : activeTab === 'treasury-guide' ? (
            <TreasuryGuide />
          ) : (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Feature Branch Specific: The Retail Banking Header */}
              {activeTab === 'Products' && (
                <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-center">
                  <h2 className="text-2xl font-serif text-gray-800 dark:text-gray-100">Retail Banking - Point Grid</h2>
                  <div className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-1">Gross Deposits</div>
                </div>
              )}

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

        <RightSidebar selectedRow={selectedRow} onClose={() => setSelectedRow(null)} manifest={manifest} />
      </div>

      <DownloadSecurityModal isOpen={isSecurityModalOpen} onClose={() => setIsSecurityModalOpen(false)} onSuccess={() => { setIsSecurityModalOpen(false); downloadCSV(); }} />
    </div>
  );
}

export default App;