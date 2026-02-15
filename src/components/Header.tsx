import React from 'react';
import { Search, Database, Bell, Settings, Menu, Sun, Moon, X, PanelRight } from 'lucide-react';
import { SearchDropdown, SearchResult } from './SearchDropdown';

interface HeaderProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;
  searchResults: SearchResult[];
  onResultClick: (result: SearchResult) => void;
  onQuickLinkClick: (title: string) => void;
  isProductsUnlocked?: boolean;
  onToggleLeftSidebar: () => void;
  onToggleRightSidebar: () => void;
  isRightSidebarOpen: boolean;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  searchTerm,
  onSearchChange,
  isSearchOpen,
  setIsSearchOpen,
  searchResults,
  onResultClick,
  onQuickLinkClick,
  isProductsUnlocked = false,
  onToggleLeftSidebar,
  onToggleRightSidebar,
  isRightSidebarOpen,
  isDarkMode,
  onToggleDarkMode
}) => {
  return (
    <header className="h-14 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between px-4 sticky top-0 z-30 transition-colors duration-200">
      <div className="flex items-center space-x-2 w-auto md:w-64 shrink-0">
        <button
          onClick={onToggleLeftSidebar}
          className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg text-gray-500 dark:text-slate-400 mr-1"
          aria-label="Toggle left sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>
        <Database className="w-6 h-6 text-blue-600 dark:text-blue-500 shrink-0" />
        <span className="font-bold text-lg hidden md:block text-gray-800 dark:text-slate-100 tracking-tight">Data Explorer</span>
      </div>

      <div className="flex-1 max-w-2xl px-2 md:px-4">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-slate-500 group-focus-within:text-blue-500 transition-colors" />
          <input
            type="text"
            placeholder="Search products and services..."
            className="w-full pl-10 pr-10 py-1.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 rounded-md transition-all outline-none text-sm text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500"
            value={searchTerm}
            onChange={(e) => {
              onSearchChange(e.target.value);
              setIsSearchOpen(true);
            }}
            onFocus={() => setIsSearchOpen(true)}
          />
          {searchTerm && (
            <button
              onClick={() => {
                onSearchChange('');
                setIsSearchOpen(false);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full text-gray-400 transition-colors"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          <SearchDropdown
            isOpen={isSearchOpen}
            onClose={() => setIsSearchOpen(false)}
            query={searchTerm}
            results={searchResults}
            onResultClick={onResultClick}
            onQuickLinkClick={onQuickLinkClick}
            isProductsUnlocked={isProductsUnlocked}
          />
        </div>
      </div>

      <div className="flex items-center space-x-1 md:space-x-3 w-auto md:w-64 justify-end shrink-0">
        <button
          onClick={onToggleDarkMode}
          className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full text-gray-500 dark:text-slate-400 transition-all active:scale-95"
          aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDarkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
        </button>

        <button
          className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full text-gray-500 dark:text-slate-400 transition-colors hidden md:block"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5" />
        </button>
        <button
          className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full text-gray-500 dark:text-slate-400 transition-colors hidden md:block"
          aria-label="Settings"
        >
          <Settings className="w-5 h-5" />
        </button>

        <button
          onClick={onToggleRightSidebar}
          className={`p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-all active:scale-95 ${
            isRightSidebarOpen ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20' : 'text-gray-500 dark:text-slate-400'
          }`}
          aria-label="Toggle right sidebar"
        >
          <PanelRight className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};
