import React from 'react';
import {
  Info, X, Share2, Edit3, ChevronUp, Phone, Globe, MapPin,
  Fingerprint, Calendar, Activity, ShieldCheck, HelpCircle,
  ExternalLink
} from 'lucide-react';
import { DataRow } from '../lib/dataService';

interface RightSidebarProps {
  selectedRow: DataRow | null;
  onClose: () => void;
}

const FIELD_INFO: Record<string, { icon: any, color: string, description: string }> = {
  'Entity Name': { icon: Activity, color: 'text-blue-500', description: 'The legal name of the registered business or organization.' },
  'Registration Number': { icon: Fingerprint, color: 'text-amber-500', description: 'A unique identifier assigned to the entity by regulatory authorities.' },
  'Status': { icon: ShieldCheck, color: 'text-emerald-500', description: 'Current standing of the business (e.g., Active, Inactive).' },
  'Phone': { icon: Phone, color: 'text-blue-500', description: 'Primary contact number for this entity.' },
  'Website': { icon: Globe, color: 'text-indigo-500', description: 'Official online presence of the business.' },
  'Location': { icon: MapPin, color: 'text-red-500', description: 'Geographic region where the entity is registered.' },
  'Zip': { icon: MapPin, color: 'text-red-400', description: 'Postal code associated with the main registration address.' },
  'Sunbiz Link': { icon: ExternalLink, color: 'text-cyan-500', description: 'Direct link to the official state business registry.' },
};

export const RightSidebar: React.FC<RightSidebarProps> = ({ selectedRow, onClose }) => {
  const renderValue = (key: string, value: any) => {
    if (!value) return <span className="text-gray-400 italic">N/A</span>;

    if (key === 'Website' || key === 'Sunbiz Link' || (typeof value === 'string' && value.startsWith('http'))) {
      const url = String(value).startsWith('http') ? String(value) : `http://${value}`;
      return (
        <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline flex items-center group/link">
          {String(value)}
          <ExternalLink className="w-3 h-3 ml-1 opacity-0 group-hover/link:opacity-100 transition-opacity" />
        </a>
      );
    }

    if (key === 'Phone') {
      return (
        <a href={`tel:${value}`} className="text-blue-600 dark:text-blue-400 hover:underline">
          {String(value)}
        </a>
      );
    }

    return String(value);
  };

  return (
    <>
      {/* Mobile backdrop */}
      {selectedRow && (
        <div
          className="fixed inset-0 bg-black/40 dark:bg-black/60 z-40 md:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed md:static inset-y-0 right-0 w-80 border-l border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col h-full overflow-y-auto shrink-0 z-50 transition-all duration-300 ease-in-out
        ${selectedRow ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
      `}>
      {!selectedRow ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gray-50/50 dark:bg-slate-950/20">
          <div className="w-14 h-14 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-6 text-gray-300 dark:text-slate-600 shadow-sm border border-gray-100 dark:border-slate-800">
            <Info className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-2">Detailed Inspector</h3>
          <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed max-w-[200px]">
            Select any record from the table to view comprehensive details and metadata.
          </p>
        </div>
      ) : (
        <div className="flex flex-col h-full transition-all duration-300">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md z-10 transition-colors">
            <div className="flex items-center space-x-2">
               <div className="w-6 h-6 bg-blue-50 dark:bg-blue-900/20 rounded flex items-center justify-center">
                  <Activity className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
               </div>
               <h3 className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest">Detail View</h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg text-gray-400 dark:text-slate-500 transition-colors"
              aria-label="Close detail view"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-5 space-y-6">
            <div className="space-y-4">
              {Object.entries(selectedRow).map(([key, value]) => {
                if (key.startsWith('_')) return null;
                const info = FIELD_INFO[key] || { icon: HelpCircle, color: 'text-gray-400', description: 'System data field.' };
                const Icon = info.icon;

                return (
                  <div key={key} className="group/item relative">
                    <div className="flex items-center justify-between mb-1.5">
                       <div className="flex items-center">
                          <Icon className={`w-3.5 h-3.5 mr-2 ${info.color}`} />
                          <label className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">{key}</label>
                       </div>

                       <div className="group relative">
                          <HelpCircle className="w-3 h-3 text-gray-300 dark:text-slate-700 cursor-help" />
                          <div className="absolute right-0 bottom-full mb-2 w-48 p-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] rounded shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 pointer-events-none">
                             {info.description}
                          </div>
                       </div>
                    </div>
                    <div className="text-sm text-gray-800 dark:text-slate-200 font-semibold break-words bg-gray-50 dark:bg-slate-800/50 p-3 rounded-lg border border-gray-100/50 dark:border-slate-800 transition-colors">
                      {renderValue(key, value)}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-4 border-t border-gray-100 dark:border-slate-800 space-y-3">
              <h4 className="text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Operational Tools</h4>
              <div className="grid grid-cols-2 gap-2">
                <button className="flex flex-col items-center justify-center p-3 text-[10px] font-bold text-gray-600 dark:text-slate-400 bg-gray-50 dark:bg-slate-800/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 rounded-xl border border-gray-100 dark:border-slate-800 transition-all group">
                  <Edit3 className="w-4 h-4 mb-1.5 transition-transform group-hover:scale-110" />
                  Annotate
                </button>
                <button className="flex flex-col items-center justify-center p-3 text-[10px] font-bold text-gray-600 dark:text-slate-400 bg-gray-50 dark:bg-slate-800/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 rounded-xl border border-gray-100 dark:border-slate-800 transition-all group">
                  <Share2 className="w-4 h-4 mb-1.5 transition-transform group-hover:scale-110" />
                  Export
                </button>
              </div>
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="w-full flex items-center justify-center p-3 text-[10px] font-bold text-gray-500 dark:text-slate-500 hover:bg-gray-50 dark:hover:bg-slate-800/50 rounded-lg transition-all"
              >
                <ChevronUp className="w-3 h-3 mr-2" />
                Back to Top
              </button>
            </div>

            <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 p-4 rounded-xl">
               <p className="text-[10px] font-medium text-amber-800 dark:text-amber-500 leading-relaxed">
                  <strong className="block mb-1">💡 Educational Tip</strong>
                  Data shown here is extracted directly from official CSV sources. Use the 'Sunbiz Link' where available to verify current records on the state registry.
               </p>
            </div>
          </div>
        </div>
      )}
      </aside>
    </>
  );
};
