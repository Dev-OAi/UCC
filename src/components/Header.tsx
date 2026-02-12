import React from 'react';
import { Search, Database, Bell, Settings, Menu } from 'lucide-react';

interface HeaderProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onToggleMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ searchTerm, onSearchChange, onToggleMobileMenu }) => {
  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 sticky top-0 z-30">
      <div className="flex items-center space-x-2 w-auto md:w-64 shrink-0">
        <button
          onClick={onToggleMobileMenu}
          className="p-1.5 hover:bg-gray-100 rounded-lg md:hidden text-gray-500 mr-1"
        >
          <Menu className="w-5 h-5" />
        </button>
        <Database className="w-6 h-6 text-blue-600 shrink-0" />
        <span className="font-bold text-lg hidden md:block text-gray-800 tracking-tight">Data Explorer</span>
      </div>

      <div className="flex-1 max-w-2xl px-2 md:px-4">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
          <input
            type="text"
            placeholder="Search products and services..."
            className="w-full pl-10 pr-4 py-1.5 bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 rounded-md transition-all outline-none text-sm"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>

      <div className="flex items-center space-x-3 w-auto md:w-64 justify-end shrink-0">
        <button className="p-1.5 hover:bg-gray-100 rounded-full text-gray-500 transition-colors hidden md:block">
          <Bell className="w-5 h-5" />
        </button>
        <button className="p-1.5 hover:bg-gray-100 rounded-full text-gray-500 transition-colors hidden md:block">
          <Settings className="w-5 h-5" />
        </button>
        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold text-xs border border-blue-200 shrink-0">
          JD
        </div>
      </div>
    </header>
  );
};
