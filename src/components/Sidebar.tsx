import React, { useState } from 'react';
import { Home, ChevronDown, ChevronRight, MapPin, Hash, Layers, BarChart3, Package, ClipboardList, Lock, Unlock, FileText, Target, Zap } from 'lucide-react';

interface SidebarProps {
  types: string[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isProductsUnlocked?: boolean;
  onToggleProductsLock?: () => void;
  zips: string[];
  selectedZip: string;
  setSelectedZip: (zip: string) => void;
  locations: string[];
  selectedLocation: string;
  setSelectedLocation: (loc: string) => void;
  onGoHome: () => void;
  isOpen?: boolean;
  onClose?: () => void;
  allDataCount?: number;
  isSyncing?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  types,
  activeTab,
  setActiveTab,
  isProductsUnlocked = false,
  onToggleProductsLock,
  zips,
  selectedZip,
  setSelectedZip,
  locations,
  selectedLocation,
  setSelectedLocation,
  onGoHome,
  isOpen,
  onClose,
  allDataCount = 0,
  isSyncing = false,
}) => {
  const [expanded, setExpanded] = useState({
    categories: true,
    filters: true
  });

  const toggleSection = (section: keyof typeof expanded) => {
    setExpanded(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleTabClick = (tab: string) => {
    setActiveTab(tab);
    if (window.innerWidth < 1024) {
      onClose?.();
    }
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 dark:bg-black/60 z-40 lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed lg:static inset-y-0 left-0 bg-white dark:bg-slate-900 flex flex-col h-full overflow-y-auto shrink-0 z-50 transition-all duration-300 ease-in-out
        ${isOpen ? 'translate-x-0 w-64 opacity-100 border-r border-gray-200 dark:border-slate-800' : '-translate-x-full lg:translate-x-0 w-0 opacity-0 pointer-events-none border-none'}
      `}>
      <nav className="p-4 space-y-6">
        <div className="space-y-1">
          <button
            onClick={() => {
              onGoHome();
              if (window.innerWidth < 1024) onClose?.();
            }}
            role="tab"
            aria-selected={activeTab === 'Home'}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
              activeTab === 'Home'
                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                : 'text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-slate-100'
            }`}
          >
            <Home className="w-4 h-4" />
            <span className="text-sm font-medium">Home</span>
          </button>

          <button
            onClick={() => handleTabClick('Action Hub')}
            role="tab"
            aria-selected={activeTab === 'Action Hub'}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
              activeTab === 'Action Hub'
                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                : 'text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-slate-100'
            }`}
          >
            <Zap className="w-4 h-4 text-emerald-500 fill-emerald-500" />
            <span className="text-sm font-medium font-bold">Action Hub</span>
          </button>

          <button
            onClick={() => handleTabClick('Territory Map')}
            role="tab"
            aria-selected={activeTab === 'Territory Map'}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
              activeTab === 'Territory Map'
                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                : 'text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-slate-100'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span className="text-sm font-medium">Territory Map</span>
          </button>

          <button
            onClick={() => handleTabClick('Insights')}
            role="tab"
            aria-selected={activeTab === 'Insights'}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
              activeTab === 'Insights'
                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                : 'text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-slate-100'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span className="text-sm font-medium">Insights</span>
          </button>

          <button
            onClick={() => handleTabClick('Playbook')}
            role="tab"
            aria-selected={activeTab === 'Playbook'}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
              activeTab === 'Playbook'
                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                : 'text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-slate-100'
            }`}
          >
            <Zap className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-medium font-bold">Playbook</span>
          </button>

          <button
            onClick={() => handleTabClick('SMB Selector')}
            role="tab"
            aria-selected={activeTab === 'SMB Selector'}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
              activeTab === 'SMB Selector'
                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                : 'text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-slate-100'
            }`}
          >
            <Package className="w-4 h-4" />
            <span className="text-sm font-medium">SMB Selector</span>
          </button>

          <button
            onClick={() => handleTabClick('Scorecard')}
            role="tab"
            aria-selected={activeTab === 'Scorecard'}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
              activeTab === 'Scorecard'
                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                : 'text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-slate-100'
            }`}
          >
            <Target className="w-4 h-4" />
            <span className="text-sm font-medium font-bold">Scorecard</span>
          </button>

          <button
            onClick={() => handleTabClick('Activity Log')}
            role="tab"
            aria-selected={activeTab === 'Activity Log'}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
              activeTab === 'Activity Log'
                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                : 'text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-slate-100'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span className="text-sm font-medium">Activity Log</span>
          </button>

          <div className="my-2 border-t border-gray-100 dark:border-slate-800" />

          <button
            onClick={() => handleTabClick('Product Guide')}
            role="tab"
            aria-selected={activeTab === 'Product Guide'}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
              activeTab === 'Product Guide'
                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                : 'text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-slate-100'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span className="text-sm font-medium">Product Guide</span>
          </button>

          <div className="my-2 border-t border-gray-100 dark:border-slate-800" />

          <div className="relative group">
            <button
              onClick={() => handleTabClick('Products')}
              role="tab"
              aria-selected={activeTab === 'Products'}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                activeTab === 'Products'
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                  : 'text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-slate-100'
              }`}
            >
              <div className="flex items-center space-x-3">
                <ClipboardList className="w-4 h-4" />
                <span className="text-sm font-medium">Products</span>
              </div>
              {isProductsUnlocked ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleProductsLock?.();
                  }}
                  className="p-1 hover:bg-blue-100 dark:hover:bg-blue-800 rounded transition-colors"
                  aria-label="Lock Products tool"
                >
                  <Unlock className="w-3 h-3 text-blue-500" />
                </button>
              ) : (
                <Lock className="w-3 h-3 text-gray-400" />
              )}
            </button>
          </div>
        </div>

        <div>
          <button
            onClick={() => toggleSection('categories')}
            className="w-full flex items-center justify-between px-3 py-1 text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-2 hover:text-gray-600 dark:hover:text-slate-300 transition-colors"
          >
            <span>Categories</span>
            {expanded.categories ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          </button>
          {expanded.categories && (
            <div className="space-y-1 animate-in fade-in slide-in-from-top-1 duration-200">
              {types.map(type => (
                <button
                  key={type}
                  onClick={() => handleTabClick(type)}
                  role="tab"
                  aria-selected={activeTab === type}
                  className={`w-full flex items-center px-3 py-1.5 rounded-md text-sm transition-colors ${
                    activeTab === type
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 font-medium'
                      : 'text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-slate-100'
                  }`}
                >
                  <Layers className={`w-3.5 h-3.5 mr-2 ${activeTab === type ? 'text-blue-500' : 'text-gray-400 dark:text-slate-600'}`} />
                  {type}
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <button
            onClick={() => toggleSection('filters')}
            className="w-full flex items-center justify-between px-3 py-1 text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-2 hover:text-gray-600 dark:hover:text-slate-300 transition-colors"
          >
            <span>Filters</span>
            {expanded.filters ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          </button>
          {expanded.filters && (
            <div className="px-3 space-y-4 pt-1 animate-in fade-in duration-200">
              <div className="space-y-1.5">
                <label className="flex items-center text-[11px] font-bold text-gray-500 dark:text-slate-500 uppercase tracking-tight">
                  <Hash className="w-3 h-3 mr-1" />
                  ZIP Code
                </label>
                <select
                  value={selectedZip}
                  onChange={(e) => setSelectedZip(e.target.value)}
                  className="w-full text-sm bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 dark:text-slate-200 rounded-md py-1.5 px-2 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all cursor-pointer"
                >
                  {zips.map(z => <option key={z} value={z} className="dark:bg-slate-900">{z}</option>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="flex items-center text-[11px] font-bold text-gray-500 dark:text-slate-500 uppercase tracking-tight">
                  <MapPin className="w-3 h-3 mr-1" />
                  Location
                </label>
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="w-full text-sm bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 dark:text-slate-200 rounded-md py-1.5 px-2 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all cursor-pointer"
                >
                  {locations.map(l => <option key={l} value={l} className="dark:bg-slate-900">{l}</option>)}
                </select>
              </div>
            </div>
          )}
        </div>
      </nav>

      {allDataCount > 0 && (
        <div className="px-6 py-4 mt-auto border-t border-gray-100 dark:border-slate-800">
          <div className="flex items-center justify-between text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">
            <span>Status</span>
            {isSyncing ? (
              <span className="text-blue-500 animate-pulse">Syncing</span>
            ) : (
              <span className="text-green-500">Ready</span>
            )}
          </div>
          <p className="mt-1 text-xs text-gray-500 dark:text-slate-400 font-medium">
            {allDataCount.toLocaleString()} records loaded
          </p>
        </div>
      )}
      </aside>
    </>
  );
};
