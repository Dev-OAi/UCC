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
import { Search, Filter, Database, MapPin, Download, FilterX } from 'lucide-react';
import Papa from 'papaparse';

function App() {
  const [manifest, setManifest] = useState<FileManifest[]>([]);
  const [allData, setAllData] = useState<DataRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<string>('Home');
  const [searchTerm, setSearchTerm] = useState('');
  const [columnFilters, setColumnFilters] = useState<Record<string, string[]>>({});
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);
  const [visibleColumns, setVisibleColumns] = useState<string[]>([]);
  const [selectedRow, setSelectedRow] = useState<DataRow | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);

  // Dark Mode Logic
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true';
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', String(isDarkMode));
  }, [isDarkMode]);

  useEffect(() => {
    async function init() {
      try {
        const m = await fetchManifest();
        setManifest(m);

        const csvFiles = m.filter(f => f.type !== 'PDF');
        const dataPromises = csvFiles.map(file => loadCsv(file));
        const results = await Promise.all(dataPromises);
        setAllData(results.flat());
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError('Failed to load data. Please make sure manifest.json exists.');
        setLoading(false);
      }
    }
    init();
  }, []);

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

    if (activeTab === 'Home' || activeTab === 'All' || activeTab === 'Insights') {
      setVisibleColumns(allColumns);
    } else {
      const sample = allData.find(d => d._type === activeTab);
      if (sample) {
        const keys = Object.keys(sample)
          .filter(key => !key.startsWith('_') && key !== 'Zip' && key !== 'Location');
        setVisibleColumns([...keys, 'Location', 'Zip']);
      }
    }
  }, [activeTab, allColumns, allData]);

  const toggleColumn = (col: string) => {
    setVisibleColumns(prev =>
      prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col]
    );
  };

  const clearFilters = () => {
    setSearchTerm('');
    setColumnFilters({});
    setSortConfig(null);
    setActiveTab('Home');
  };

  const isFiltered = searchTerm !== '' || 
    Object.values(columnFilters).some(v => v.length > 0) || 
    (activeTab !== 'All' && activeTab !== 'Home' && activeTab !== 'Insights');

  const types = useMemo(() => {
    const t = new Set(manifest.filter(m => m.type !== 'PDF').map(m => m.type));
    return ['All', ...Array.from(t).sort()];
  }, [manifest]);

  const zips = useMemo(() => {
    const z = new Set(manifest.filter(m => m.type !== 'PDF').map(m => m.zip).filter(Boolean) as string[]);
    return ['All', ...Array.from(z).sort()];
  }, [manifest]);

  const locations = useMemo(() => {
    const l = new Set(manifest.filter(m => m.type !== 'PDF').map(m => m.location).filter(Boolean) as string[]);
    return ['All', ...Array.from(l).sort()];
  }, [manifest]);

  const categoryData = useMemo(() => {
    if (activeTab === 'All' || activeTab === 'Home' || activeTab === 'Insights') return allData;
    return allData.filter(row => row._type === activeTab);
  }, [allData, activeTab]);

  const filteredData = useMemo(() => {
    let filtered = categoryData.filter(row => {
      const matchesColumnFilters = Object.entries(columnFilters).every(([col, values]) => {
        if (!values || values.length === 0) return true;
        const rowValue = col === 'Location' ? row._location : col === 'Zip' ? row._zip : row[col];
        return values.includes(String(rowValue || ''));
      });
      if (!matchesColumnFilters) return false;

      if (!searchTerm) return true;
      const s = searchTerm.toLowerCase();
      return Object.entries(row).some(([key, val]) =>
        !key.startsWith('_') && val && String(val).toLowerCase().includes(s)
      );
    });

    if (sortConfig) {
      filtered = [...filtered].sort((a, b) => {
        const aVal = sortConfig.key === 'Location' ? a._location : sortConfig.key === 'Zip' ? a._zip : a[sortConfig.key];
        const bVal = sortConfig.key === 'Location' ? b._location : sortConfig.key === 'Zip' ? b._zip : b[sortConfig.key];

        if (aVal === bVal) return 0;
        if (aVal === null || aVal === undefined) return 1;
        if (bVal === null || bVal === undefined) return -1;

        const comparison = String(aVal).localeCompare(String(bVal), undefined, { numeric: true, sensitivity: 'base' });
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      });
    }

    return filtered;
  }, [categoryData, searchTerm, columnFilters, sortConfig]);

  const downloadCSV = () => {
    const dataToExport = filteredData.map(row => {
      const exportRow: any = {};
      visibleColumns.forEach(col => {
        if (col === 'Location') exportRow[col] = row._location;
        else if (col === 'Zip') exportRow[col] = row._zip;
        else exportRow[col] = row[col];
      });
      return exportRow;
    });

    const csv = Papa.unparse(dataToExport);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `data_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (error) {
    return <div className="p-8 text-red-500 dark:text-red-400">{error}</div>;
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-slate-100 font-sans selection:bg-blue-100 dark:selection:bg-blue-900 selection:text-blue-900 dark:selection:text-blue-100 transition-colors duration-200">
      <Header
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
      />

      <div className="flex-1 flex overflow-hidden relative">
        <Sidebar
          types={types}
          activeTab={activeTab}
          setActiveTab={(tab) => {
            setActiveTab(tab);
            setIsMobileMenuOpen(false);
          }}
          zips={zips}
          selectedZip={columnFilters['Zip']?.[0] || 'All'}
          setSelectedZip={(zip) => {
            setColumnFilters(prev => ({
              ...prev,
              Zip: zip === 'All' ? [] : [zip]
            }));
          }}
          locations={locations}
          selectedLocation={columnFilters['Location']?.[0] || 'All'}
          setSelectedLocation={(loc) => {
            setColumnFilters(prev => ({
              ...prev,
              Location: loc === 'All' ? [] : [loc]
            }));
          }}
          onGoHome={() => {
            setActiveTab('Home');
            setIsMobileMenuOpen(false);
          }}
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
        />

        <main className="flex-1 flex flex-col min-w-0 bg-white dark:bg-slate-900 md:shadow-inner md:rounded-tl-2xl border-l border-t border-gray-200 dark:border-slate-800 md:ml-[-1px]">
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center space-y-4">
              <div className="relative">
                <div className="w-12 h-12 border-4 border-blue-100 dark:border-slate-800 border-t-blue-600 dark:border-t-blue-500 rounded-full animate-spin"></div>
              </div>
              <p className="text-gray-500 dark:text-slate-400 font-medium animate-pulse">Initializing data streams...</p>
            </div>
          ) : activeTab === 'Home' && !searchTerm ? (
            <Dashboard
              types={types}
              onSelectCategory={setActiveTab}
              rowCount={allData.length}
            />
          ) : activeTab === 'Insights' ? (
            <Insights data={allData} types={types} />
          ) : (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
                <div className="flex items-center space-x-4">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">
                      {activeTab === 'Home' ? 'Search Results' : `${activeTab} Data Hub`}
                    </h2>
                    <div className="flex items-center text-xs text-gray-500 dark:text-slate-400 font-medium">
                      <span>{filteredData.length.toLocaleString()} records found</span>
                      <span className="mx-2 text-gray-300 dark:text-slate-700">•</span>
                      <MapPin className="w-3 h-3 mr-1 text-gray-400 dark:text-slate-500" />
                      <span>{columnFilters['Location']?.[0] || 'Global View'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setIsSecurityModalOpen(true)}
                    disabled={loading || filteredData.length === 0}
                    className="flex items-center space-x-2 px-3 py-1.5 bg-blue-600 dark:bg-blue-600 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-500 transition-colors shadow-sm text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Download CSV"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span className="hidden lg:inline">Download CSV</span>
                  </button>

                  <ColumnToggle
                    columns={allColumns}
                    visibleColumns={visibleColumns}
                    onChange={toggleColumn}
                  />
                  {isFiltered && (
                    <button
                      onClick={clearFilters}
                      className="inline-flex items-center px-3 py-1.5 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-md transition-colors border border-transparent hover:border-red-100 dark:hover:border-red-900/50"
                    >
                      <FilterX className="w-3.5 h-3.5 mr-1.5" />
                      Clear Filters
                    </button>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-hidden relative group/table">
                {filteredData.length > 0 ? (
                  <Table
                    data={filteredData}
                    allData={categoryData}
                    visibleColumns={visibleColumns}
                    selectedRow={selectedRow}
                    onRowSelect={setSelectedRow}
                    columnFilters={columnFilters}
                    onFilterChange={(col, values) => {
                      setColumnFilters(prev => ({ ...prev, [col]: values }));
                    }}
                    sortConfig={sortConfig}
                    onSortChange={setSortConfig}
                  />
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-12 text-center animate-in fade-in duration-500 h-full">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-2xl mb-6 text-blue-500 dark:text-blue-400">
                      <FilterX className="w-12 h-12" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No records found</h3>
                    <p className="text-gray-500 dark:text-slate-400 max-w-xs mb-8 leading-relaxed">
                      We couldn't find anything matching your search. Try adjusting your filters or search terms.
                    </p>
                    <button
                      onClick={clearFilters}
                      className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all font-bold text-sm shadow-lg shadow-blue-200 dark:shadow-none active:scale-95"
                    >
                      <FilterX className="w-4 h-4 mr-2" />
                      Clear All Filters
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>

        <RightSidebar
          selectedRow={selectedRow}
          onClose={() => setSelectedRow(null)}
          manifest={manifest}
        />
      </div>

      <DownloadSecurityModal
        isOpen={isSecurityModalOpen}
        onClose={() => setIsSecurityModalOpen(false)}
        onSuccess={() => {
          setIsSecurityModalOpen(false);
          downloadCSV();
        }}
      />
    </div>
  );
}

export default App;