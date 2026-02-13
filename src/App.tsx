import React, { useState, useEffect, useMemo } from 'react';
import { fetchManifest, loadCsv, FileManifest, DataRow } from './lib/dataService';
import { Table } from './components/Table';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { RightSidebar } from './components/RightSidebar';
import { Dashboard } from './components/Dashboard';
import { ColumnToggle } from './components/ColumnToggle';
import { DownloadSecurityModal } from './components/DownloadSecurityModal';
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

  useEffect(() => {
    async function init() {
      try {
        const m = await fetchManifest();
        setManifest(m);

        const dataPromises = m.map(file => loadCsv(file));
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
    // Collect columns from a sample of each data type to avoid performance issues
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

    if (activeTab === 'Home' || activeTab === 'All') {
      setVisibleColumns(allColumns);
    } else {
      // Auto-switch columns based on data type
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

  const isFiltered = searchTerm !== '' || Object.values(columnFilters).some(v => v.length > 0) || (activeTab !== 'All' && activeTab !== 'Home');

  const types = useMemo(() => {
    const t = new Set(manifest.map(m => m.type));
    return ['All', ...Array.from(t).sort()];
  }, [manifest]);

  const zips = useMemo(() => {
    const z = new Set(manifest.map(m => m.zip).filter(Boolean));
    return ['All', ...Array.from(z).sort()];
  }, [manifest]);

  const locations = useMemo(() => {
    const l = new Set(manifest.map(m => m.location).filter(Boolean));
    return ['All', ...Array.from(l).sort()];
  }, [manifest]);

  const categoryData = useMemo(() => {
    if (activeTab === 'All' || activeTab === 'Home') return allData;
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
  }, [allData, activeTab, searchTerm, columnFilters, sortConfig]);

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
    return <div className="p-8 text-red-500">{error}</div>;
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 text-gray-900 font-sans selection:bg-blue-100 selection:text-blue-900">
      <Header
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
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

        <main className="flex-1 flex flex-col min-w-0 bg-white md:shadow-inner md:rounded-tl-2xl border-l border-t border-gray-200 md:ml-[-1px]">
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center space-y-4">
              <div className="relative">
                <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
              </div>
              <p className="text-gray-500 font-medium animate-pulse">Initializing data streams...</p>
            </div>
          ) : activeTab === 'Home' && !searchTerm ? (
            <Dashboard
              types={types}
              onSelectCategory={setActiveTab}
              rowCount={allData.length}
            />
          ) : (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between shrink-0 bg-white/50 backdrop-blur-sm sticky top-0 z-10">
                <div className="flex items-center space-x-4">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 tracking-tight">
                      {activeTab === 'Home' ? 'Search Results' : `${activeTab} Data Hub`}
                    </h2>
                    <div className="flex items-center text-xs text-gray-500 font-medium">
                      <span>{filteredData.length.toLocaleString()} records found</span>
                      <span className="mx-2 text-gray-300">•</span>
                      <MapPin className="w-3 h-3 mr-1 text-gray-400" />
                      <span>{columnFilters['Location']?.[0] || 'Global View'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  {/* Download Button Integrated Here */}
                  <button
                    onClick={() => setIsSecurityModalOpen(true)}
                    disabled={loading || filteredData.length === 0}
                    className="flex items-center space-x-2 px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-sm text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
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
                      className="inline-flex items-center px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-md transition-colors border border-transparent hover:border-red-100"
                    >
                      <FilterX className="w-3.5 h-3.5 mr-1.5" />
                      Clear Filters
                    </button>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-hidden relative group/table">
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
              </div>
            </div>
          )}
        </main>

        <RightSidebar
          selectedRow={selectedRow}
          onClose={() => setSelectedRow(null)}
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