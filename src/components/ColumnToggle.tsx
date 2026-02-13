import React from 'react';
import { Settings2, Check } from 'lucide-react';

interface ColumnToggleProps {
  columns: string[];
  visibleColumns: string[];
  onChange: (column: string) => void;
}

export const ColumnToggle: React.FC<ColumnToggleProps> = ({ columns, visibleColumns, onChange }) => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="Toggle column visibility"
        className="flex items-center space-x-2 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <Settings2 className="w-3.5 h-3.5" />
        <span>Columns</span>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-xl z-20 py-2 max-h-96 overflow-y-auto">
            {columns.map(col => (
              <button
                key={col}
                onClick={() => onChange(col)}
                className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 transition-colors"
              >
                <div className={`w-4 h-4 border rounded mr-3 flex items-center justify-center ${
                  visibleColumns.includes(col) ? 'bg-blue-500 border-blue-500' : 'bg-white border-gray-300'
                }`}>
                  {visibleColumns.includes(col) && <Check className="w-3 h-3 text-white" />}
                </div>
                <span className="truncate">{col}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
