import React from 'react';
import { Info, X, Share2, Edit3, ChevronUp } from 'lucide-react';
import { DataRow } from '../lib/dataService';

interface RightSidebarProps {
  selectedRow: DataRow | null;
  onClose: () => void;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({ selectedRow, onClose }) => {
  return (
    <>
      {/* Mobile backdrop */}
      {selectedRow && (
        <div
          className="fixed inset-0 bg-black/20 z-40 md:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed md:static inset-y-0 right-0 w-80 border-l border-gray-200 bg-white flex flex-col h-full overflow-y-auto shrink-0 z-50 transition-transform duration-300 ease-in-out
        ${selectedRow ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
      `}>
      {!selectedRow ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-300">
            <Info className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-gray-900 mb-1">On This Page</h3>
          <p className="text-xs text-gray-500 leading-relaxed">Select a row from the table to view detailed information and actions.</p>
        </div>
      ) : (
        <div className="flex flex-col h-full">
          <div className="px-4 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">On This Page</h3>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded text-gray-400">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-6 space-y-8">
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-blue-600">Selected Row Details</h2>
              <div className="bg-blue-50/50 rounded-lg p-4 space-y-4 border border-blue-100">
                 {Object.entries(selectedRow).map(([key, value]) => {
                   if (key.startsWith('_')) return null;
                   return (
                     <div key={key}>
                       <label className="block text-[10px] font-bold text-blue-400 uppercase tracking-tighter mb-1">{key}</label>
                       <div className="text-sm text-gray-800 font-medium break-words leading-tight">{String(value || 'N/A')}</div>
                     </div>
                   );
                 })}
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Quick Actions</h4>
              <div className="flex flex-col space-y-2">
                <button className="flex items-center w-full px-3 py-2 text-xs text-gray-600 hover:bg-gray-50 rounded-md border border-gray-100 transition-colors group">
                  <Edit3 className="w-3.5 h-3.5 mr-2 text-gray-400 group-hover:text-blue-500" />
                  Edit this page
                </button>
                <button className="flex items-center w-full px-3 py-2 text-xs text-gray-600 hover:bg-gray-50 rounded-md border border-gray-100 transition-colors group">
                  <Share2 className="w-3.5 h-3.5 mr-2 text-gray-400 group-hover:text-blue-500" />
                  Share record
                </button>
                <button className="flex items-center w-full px-3 py-2 text-xs text-gray-600 hover:bg-gray-50 rounded-md border border-gray-100 transition-colors group">
                  <ChevronUp className="w-3.5 h-3.5 mr-2 text-gray-400 group-hover:text-blue-500" />
                  Scroll to top
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </aside>
    </>
  );
};
