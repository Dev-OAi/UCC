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

    // Get columns for the active tab only to keep it clean
    const tabData = activeTab === 'All' ? allData : allData.filter(r => r._type === activeTab);

    tabData.slice(0, 50).forEach(row => {
      Object.keys(row).forEach(key => {
        if (!key.startsWith('_')) keys.add(key);
      });
    });

    const baseCols = Array.from(keys);
    if (activeTab === 'Products') return baseCols;
    return [...baseCols, 'Location', 'Zip'];
  }, [allData, activeTab]);

  useEffect(() => {
    if (allColumns.length > 0) {
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
      <header className="bg-white border-b border-gray-200 px-6 py-2">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <Database className="w-6 h-6 text-blue-600" />
            <h1 className="text-xl font-bold">Data Explorer</h1>
          </div>
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search across all columns..."
              className="w-full pl-10 pr-4 py-2 bg-gray-100 border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500 rounded-lg transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center justify-between border-b border-gray-100">
          <div className="flex space-x-4">
            {types.map(type => (
              <button
                key={type}
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
              <label className="text-xs font-semibold text-gray-400 uppercase">Zip:</label>
              <select
                value={selectedZip}
                onChange={(e) => setSelectedZip(e.target.value)}
                className="text-xs bg-gray-50 border-none rounded md:pr-8 focus:ring-0 cursor-pointer"
              >
                {zips.map(z => <option key={z} value={z}>{z}</option>)}
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-xs font-semibold text-gray-400 uppercase">Location:</label>
              <select
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

      <main className="flex-1 overflow-hidden flex">
        {activeTab === 'Products' && (
          <aside className="w-64 bg-white border-r border-gray-200 overflow-y-auto p-4 flex flex-col space-y-6">
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Advisory Tools</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="hover:text-blue-600 cursor-pointer">Industry Advisory IQ</li>
                <li className="hover:text-blue-600 cursor-pointer">Industry Benchmark IQ</li>
                <li className="hover:text-blue-600 cursor-pointer">Relationship Builder</li>
              </ul>
            </div>
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Logging & Setup</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="text-blue-600 font-medium">Product/Service Grid</li>
                <li className="hover:text-blue-600 cursor-pointer">Business Review</li>
              </ul>
            </div>
          </aside>
        )}

        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 flex flex-col overflow-hidden">
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              <span className="ml-4 text-gray-600 font-medium">Loading {allData.length} rows...</span>
            </div>
          ) : (
            <div className="flex-1 overflow-hidden flex flex-col p-6">
              {activeTab === 'Products' && (
                <div className="mb-6">
                  <h2 className="text-2xl font-serif text-center text-gray-800">Retail Banking - Point Grid</h2>
                </div>
              )}
              <div className={`bg-white ${activeTab === 'Products' ? '' : 'rounded-xl shadow-sm border border-gray-200'} overflow-hidden flex-1 flex flex-col`}>
                <div className={`px-4 py-3 ${activeTab === 'Products' ? 'bg-white border-b border-gray-100' : 'bg-gray-50 border-b border-gray-200'} flex justify-between items-center text-xs text-gray-500 font-medium uppercase tracking-wider`}>
                  <span className={activeTab === 'Products' ? 'font-bold text-gray-800' : ''}>
                    {activeTab === 'Products' ? 'GROSS DEPOSITS' : `Displaying ${filteredData.length.toLocaleString()} rows`}
                  </span>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center text-[10px] font-bold">
                      {activeTab === 'Products' ? 'CONSUMER ACCOUNTS' : (
                        <>
                          <MapPin className="w-3 h-3 mr-1" />
                          Multi-Location
                        </>
                      )}
                    </div>
                  </div>
                </div>
                {activeTab === 'Products' && (
                  <div className="px-4 py-2 bg-white border-b border-gray-50 text-[10px] font-black text-gray-800 text-center tracking-[0.2em] uppercase">
                    Non-Interest Bearing Checking
                  </div>
                )}
                <Table data={filteredData} visibleColumns={visibleColumns} />
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
          </div>

          {activeTab === 'Products' && (
            <aside className="w-48 bg-white border-l border-gray-200 p-4 hidden lg:block overflow-y-auto">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">On This Page</h3>
              <ul className="space-y-3 text-xs text-gray-500 font-medium">
                <li className="text-blue-600">Retail Banking - Point Grid</li>
                <li className="hover:text-gray-800 cursor-pointer uppercase">Gross Deposits</li>
                <li className="hover:text-gray-800 cursor-pointer uppercase">Loan Referrals</li>
                <li className="hover:text-gray-800 cursor-pointer uppercase">New CIF Growth</li>
                <li className="hover:text-gray-800 cursor-pointer uppercase">New Digital Enrollments</li>
                <li className="hover:text-gray-800 cursor-pointer uppercase">Partner Referrals</li>
                <li className="hover:text-gray-800 cursor-pointer uppercase">Treasury Solutions Products/Services</li>
              </ul>

              <div className="mt-8 pt-8 border-t border-gray-100 space-y-4">
                <div className="flex items-center space-x-2 text-gray-400 hover:text-gray-600 cursor-pointer">
                  <span className="text-xs">Edit this page</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-400 hover:text-gray-600 cursor-pointer">
                  <span className="text-xs">Scroll to top</span>
                </div>
              </div>
            </aside>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
