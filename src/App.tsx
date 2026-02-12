import React, { useState, useEffect, useMemo } from 'react';
import { fetchManifest, loadCsv, FileManifest, DataRow } from './lib/dataService';
import { Table } from './components/Table';
import { ColumnToggle } from './components/ColumnToggle';
import { Search, Filter, Database, MapPin } from 'lucide-react';

function App() {
  const [manifest, setManifest] = useState<FileManifest[]>([]);
  const [allData, setAllData] = useState<DataRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedZip, setSelectedZip] = useState<string>('All');
  const [selectedLocation, setSelectedLocation] = useState<string>('All');
  const [visibleColumns, setVisibleColumns] = useState<string[]>([]);

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
    allData.slice(0, 50).forEach(row => {
      Object.keys(row).forEach(key => {
        if (!key.startsWith('_')) keys.add(key);
      });
    });
    return [...Array.from(keys), 'Location', 'Zip'];
  }, [allData]);

  useEffect(() => {
    if (allColumns.length > 0 && visibleColumns.length === 0) {
      setVisibleColumns(allColumns);
    }
  }, [allColumns]);

  const toggleColumn = (col: string) => {
    setVisibleColumns(prev =>
      prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col]
    );
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedZip('All');
    setSelectedLocation('All');
    setActiveTab('All');
  };

  const isFiltered = searchTerm !== '' || selectedZip !== 'All' || selectedLocation !== 'All' || activeTab !== 'All';

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

  const filteredData = useMemo(() => {
    return allData.filter(row => {
      const matchesTab = activeTab === 'All' || row._type === activeTab;
      if (!matchesTab) return false;

      const matchesZip = selectedZip === 'All' || row._zip === selectedZip;
      if (!matchesZip) return false;

      const matchesLoc = selectedLocation === 'All' || row._location === selectedLocation;
      if (!matchesLoc) return false;

      if (!searchTerm) return true;
      const s = searchTerm.toLowerCase();
      // Search only in displayed data, not metadata prefixed with _
      return Object.entries(row).some(([key, val]) =>
        !key.startsWith('_') && val && String(val).toLowerCase().includes(s)
      );
    });
  }, [allData, activeTab, searchTerm, selectedZip, selectedLocation]);

  if (error) {
    return <div className="p-8 text-red-500">{error}</div>;
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 text-gray-900">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Database className="w-6 h-6 text-blue-600" />
            <h1 className="text-xl font-bold">Data Explorer</h1>
          </div>
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              aria-label="Search data"
              placeholder="Search across all columns..."
              className="w-full pl-10 pr-4 py-2 bg-gray-100 border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500 rounded-lg transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center justify-between border-b border-gray-100">
          <div className="flex space-x-4" role="tablist">
            {types.map(type => (
              <button
                key={type}
                role="tab"
                aria-selected={activeTab === type}
                onClick={() => setActiveTab(type)}
                className={`pb-2 px-1 text-sm font-medium transition-colors border-b-2 ${
                  activeTab === type
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-4 pb-2">
            <div className="flex items-center space-x-2">
              <label htmlFor="zip-filter" className="text-xs font-semibold text-gray-400 uppercase">Zip:</label>
              <select
                id="zip-filter"
                value={selectedZip}
                onChange={(e) => setSelectedZip(e.target.value)}
                className="text-xs bg-gray-50 border-none rounded md:pr-8 focus:ring-0 cursor-pointer"
              >
                {zips.map(z => <option key={z} value={z}>{z}</option>)}
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <label htmlFor="location-filter" className="text-xs font-semibold text-gray-400 uppercase">Location:</label>
              <select
                id="location-filter"
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="text-xs bg-gray-50 border-none rounded md:pr-8 focus:ring-0 cursor-pointer"
              >
                {locations.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>

            <ColumnToggle
              columns={allColumns}
              visibleColumns={visibleColumns}
              onChange={toggleColumn}
            />
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-hidden flex flex-col">
        {loading ? (
          <div className="flex-1 flex items-center justify-center" aria-live="polite">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <span className="ml-4 text-gray-600 font-medium">
              {allData.length > 0 ? `Loading ${allData.length.toLocaleString()} rows...` : 'Initializing data explorer...'}
            </span>
          </div>
        ) : (
          <div className="flex-1 overflow-hidden flex flex-col p-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex-1 flex flex-col">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center text-xs text-gray-500 font-medium uppercase tracking-wider">
                <span>Displaying {filteredData.length.toLocaleString()} rows</span>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <MapPin className="w-3 h-3 mr-1" />
                    Multi-Location
                  </div>
                </div>
              </div>
              {filteredData.length > 0 ? (
                <Table data={filteredData} visibleColumns={visibleColumns} />
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-500 bg-gray-50/50">
                  <Filter className="w-12 h-12 mb-4 text-gray-300" />
                  <p className="text-lg font-medium text-gray-900">No results found</p>
                  <p className="text-sm">Try adjusting your filters or search term</p>
                  <button
                    onClick={clearFilters}
                    className="mt-4 px-4 py-2 text-sm font-medium text-blue-600 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    Clear all filters
                  </button>
                </div>
              )}
            </div>
            {isFiltered && (
              <div className="mt-4 flex justify-center">
                <button
                  onClick={clearFilters}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
