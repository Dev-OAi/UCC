import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, ChevronDown, SortAsc, SortDesc, X, Check } from 'lucide-react';

interface FilterDropdownProps {
  column: string;
  allValues: string[];
  selectedValues: string[];
  onSelect: (values: string[]) => void;
  onSort: (direction: 'asc' | 'desc') => void;
  currentSort: 'asc' | 'desc' | null;
  onClear: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export const FilterDropdown: React.FC<FilterDropdownProps> = ({
  column,
  allValues,
  selectedValues,
  onSelect,
  onSort,
  currentSort,
  onClear,
  isOpen,
  onClose,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const filteredValues = useMemo(() => {
    return allValues.filter(v =>
      String(v).toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allValues, searchTerm]);

  if (!isOpen) return null;

  const toggleValue = (value: string) => {
    if (selectedValues.includes(value)) {
      onSelect(selectedValues.filter(v => v !== value));
    } else {
      onSelect([...selectedValues, value]);
    }
  };

  const isAllSelected = filteredValues.length > 0 && filteredValues.every(v => selectedValues.includes(v));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      onSelect(selectedValues.filter(v => !filteredValues.includes(v)));
    } else {
      const newSelected = Array.from(new Set([...selectedValues, ...filteredValues]));
      onSelect(newSelected);
    }
  };

  return (
    <div
      ref={dropdownRef}
      className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-gray-200 dark:border-slate-700 z-50 overflow-hidden animate-in fade-in zoom-in duration-100"
    >
      <div className="p-2 border-b border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-900/50">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder={`Search ${column}...`}
            className="w-full pl-8 pr-3 py-1.5 text-sm bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 dark:text-slate-200 rounded-md focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoFocus
          />
        </div>
      </div>

      <div className="py-1 border-b border-gray-100 dark:border-slate-700">
        <div className="px-3 py-1 text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Sort</div>
        <button
          onClick={() => onSort('asc')}
          className={`w-full flex items-center px-3 py-1.5 text-sm hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors ${currentSort === 'asc' ? 'text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/40' : 'text-gray-600 dark:text-slate-400'}`}
        >
          <SortAsc className="w-4 h-4 mr-2" />
          A to Z
        </button>
        <button
          onClick={() => onSort('desc')}
          className={`w-full flex items-center px-3 py-1.5 text-sm hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors ${currentSort === 'desc' ? 'text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/40' : 'text-gray-600 dark:text-slate-400'}`}
        >
          <SortDesc className="w-4 h-4 mr-2" />
          Z to A
        </button>
      </div>

      <div className="max-h-48 overflow-y-auto py-1 border-b border-gray-100 dark:border-slate-700 custom-scrollbar">
        <button
          onClick={toggleSelectAll}
          className="w-full flex items-center px-3 py-1.5 text-sm hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors text-gray-700 dark:text-slate-200 font-medium"
        >
          <div className={`w-4 h-4 rounded border mr-2 flex items-center justify-center transition-colors ${isAllSelected ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-600'}`}>
            {isAllSelected && <Check className="w-3 h-3" />}
          </div>
          All {column}
        </button>
        {filteredValues.map((val) => {
          const isSelected = selectedValues.includes(val);
          return (
            <button
              key={val}
              onClick={() => toggleValue(val)}
              className="w-full flex items-center px-3 py-1.5 text-sm hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors text-gray-600 dark:text-slate-400"
            >
              <div className={`w-4 h-4 rounded border mr-2 flex items-center justify-center transition-colors ${isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-600'}`}>
                {isSelected && <Check className="w-3 h-3" />}
              </div>
              <span className="truncate">{val || '(Empty)'}</span>
            </button>
          );
        })}
      </div>

      <div className="p-1">
        <button
          onClick={() => {
            onClear();
            onClose();
          }}
          className="w-full text-left px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-md transition-colors font-medium"
        >
          Clear
        </button>
      </div>
    </div>
  );
};
