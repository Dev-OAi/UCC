import React from 'react';
import { Settings2, Check, ChevronUp, ChevronDown } from 'lucide-react';

interface ColumnToggleProps {
  columns: string[];
  visibleColumns: string[];
  onToggle: (column: string) => void;
  onReorder?: (column: string, direction: 'up' | 'down') => void;
}

export const ColumnToggle: React.FC<ColumnToggleProps> = ({ columns, visibleColumns, onToggle, onReorder }) => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="Toggle column visibility"
        className="flex items-center space-x-2 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
      >
        <Settings2 className="w-3.5 h-3.5" />
        <span>Columns</span>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          
          <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-xl z-20 py-2 max-h-96 overflow-y-auto">
            {columns.map((col, index) => (
              <div
                key={col}
                className="group flex items-center px-4 py-1.5 hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors"
              >
                <button
                  onClick={() => onToggle(col)}
                  className="flex-1 flex items-center text-sm text-gray-700 dark:text-slate-300 text-left min-w-0"
                >
                  <div className={`w-4 h-4 shrink-0 border rounded mr-3 flex items-center justify-center transition-colors ${
                    visibleColumns.includes(col)
                      ? 'bg-blue-500 border-blue-500'
                      : 'bg-white border-gray-300 dark:bg-slate-900 dark:border-slate-600'
                  }`}>
                    {visibleColumns.includes(col) && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <span className="truncate">{col}</span>
                </button>

                {onReorder && (
                  <div className="flex items-center space-x-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => { e.stopPropagation(); onReorder(col, 'up'); }}
                      disabled={index === 0}
                      className="p-1 hover:bg-gray-200 dark:hover:bg-slate-600 rounded disabled:opacity-30"
                      title="Move Up"
                    >
                      <ChevronUp className="w-3.5 h-3.5 text-gray-500 dark:text-slate-400" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onReorder(col, 'down'); }}
                      disabled={index === columns.length - 1}
                      className="p-1 hover:bg-gray-200 dark:hover:bg-slate-600 rounded disabled:opacity-30"
                      title="Move Down"
                    >
                      <ChevronDown className="w-3.5 h-3.5 text-gray-500 dark:text-slate-400" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};