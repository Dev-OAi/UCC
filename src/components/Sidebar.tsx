import React, { useState } from 'react';
import { Home, ChevronDown, ChevronRight, MapPin, Hash, Layers } from 'lucide-react';
import { FileManifest } from '../lib/dataService';

interface SidebarProps {
  types: string[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
  zips: string[];
  selectedZip: string;
  setSelectedZip: (zip: string) => void;
  locations: string[];
  selectedLocation: string;
  setSelectedLocation: (loc: string) => void;
  onGoHome: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  types,
  activeTab,
  setActiveTab,
  zips,
  selectedZip,
  setSelectedZip,
  locations,
  selectedLocation,
  setSelectedLocation,
  onGoHome,
  isOpen,
  onClose,
}) => {
  const [expanded, setExpanded] = useState({
    categories: true,
    filters: true
  });

  const toggleSection = (section: keyof typeof expanded) => {
    setExpanded(prev => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 md:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed md:static inset-y-0 left-0 w-64 border-r border-gray-200 bg-white flex flex-col h-full overflow-y-auto shrink-0 z-50 transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
      <nav className="p-4 space-y-6">
        <div>
          <button
            onClick={onGoHome}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
              activeTab === 'Home' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <Home className="w-4 h-4" />
            <span className="text-sm font-medium">Home</span>
          </button>
        </div>

        <div>
          <button
            onClick={() => toggleSection('categories')}
            className="w-full flex items-center justify-between px-3 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2"
          >
            <span>Categories</span>
            {expanded.categories ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          </button>
          {expanded.categories && (
            <div className="space-y-1">
              {types.map(type => (
                <button
                  key={type}
                  onClick={() => setActiveTab(type)}
                  className={`w-full flex items-center px-3 py-1.5 rounded-md text-sm transition-colors ${
                    activeTab === type
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Layers className={`w-3.5 h-3.5 mr-2 ${activeTab === type ? 'text-blue-500' : 'text-gray-400'}`} />
                  {type}
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <button
            onClick={() => toggleSection('filters')}
            className="w-full flex items-center justify-between px-3 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2"
          >
            <span>Filters</span>
            {expanded.filters ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          </button>
          {expanded.filters && (
            <div className="px-3 space-y-4 pt-1">
              <div className="space-y-1.5">
                <label className="flex items-center text-[11px] font-bold text-gray-500 uppercase tracking-tight">
                  <Hash className="w-3 h-3 mr-1" />
                  ZIP Code
                </label>
                <select
                  value={selectedZip}
                  onChange={(e) => setSelectedZip(e.target.value)}
                  className="w-full text-sm bg-gray-50 border border-gray-200 rounded-md py-1.5 px-2 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all cursor-pointer"
                >
                  {zips.map(z => <option key={z} value={z}>{z}</option>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="flex items-center text-[11px] font-bold text-gray-500 uppercase tracking-tight">
                  <MapPin className="w-3 h-3 mr-1" />
                  Location
                </label>
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="w-full text-sm bg-gray-50 border border-gray-200 rounded-md py-1.5 px-2 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all cursor-pointer"
                >
                  {locations.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
            </div>
          )}
        </div>
      </nav>
      </aside>
    </>
  );
};
