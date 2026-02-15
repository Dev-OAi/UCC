import React from 'react';
import {
  Info, X, Share2, Edit3, ChevronUp, Phone, Globe, MapPin,
  Fingerprint, Calendar, Activity, ShieldCheck, HelpCircle,
  ExternalLink, FileText, Lightbulb, ChevronDown, ChevronRight,
  Copy, Check
} from 'lucide-react';
import { DataRow, FileManifest } from '../lib/dataService';
import { getInsightForCategory } from '../lib/industryKnowledge';
import { productData } from '../lib/productData';
import { ProductGuide } from '../types';

interface RightSidebarProps {
  selectedRow: DataRow | null;
  onClose: () => void;
  manifest?: FileManifest[];
  activeTab?: string;
  productGuide?: ProductGuide;
  isOpen: boolean;
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

export const RightSidebar: React.FC<RightSidebarProps> = ({ selectedRow, onClose, manifest = [], activeTab, productGuide, isOpen }) => {
  const [isOverviewExpanded, setIsOverviewExpanded] = React.useState(true);
  const [activeSectionId, setActiveSectionId] = React.useState<string | null>(null);
  const [copiedKey, setCopiedKey] = React.useState<string | null>(null);

  const handleCopy = (key: string, value: any) => {
    if (value === null || value === undefined) return;
    navigator.clipboard.writeText(String(value));
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  React.useEffect(() => {
    if (activeTab !== 'Product Guide' || !productGuide) {
      setActiveSectionId(null);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSectionId(entry.target.id);
          }
        });
      },
      { threshold: 0.2, rootMargin: '-10% 0px -60% 0px' }
    );

    productGuide.categories.forEach((cat) => {
      const el = document.getElementById(cat.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [activeTab, productGuide]);

  const scrollToSection = (index: number) => {
    const sections = document.querySelectorAll('h2');
    // Find the section that matches the title
    const targetTitle = productData[index].title;
    const sectionElement = Array.from(sections).find(h => h.textContent === targetTitle);
    if (sectionElement) {
        sectionElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToId = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const category = selectedRow ? (selectedRow['Category'] || selectedRow['Category '] || selectedRow['_type'] || '') : '';
  const insight = getInsightForCategory(category);

  const pdfReport = manifest.find(m =>
    m.type === 'PDF' &&
    (m.category?.toLowerCase() === category.toLowerCase() ||
     category.toLowerCase().includes(m.category?.toLowerCase() || 'nan'))
  );

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
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 dark:bg-black/60 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed lg:static inset-y-0 right-0 bg-white dark:bg-slate-900 flex flex-col h-full overflow-y-auto shrink-0 z-50 transition-all duration-300 ease-in-out
        ${isOpen ? 'translate-x-0 w-80 opacity-100 border-l border-gray-200 dark:border-slate-800' : 'translate-x-full lg:translate-x-0 w-0 opacity-0 pointer-events-none border-none'}
      `}>
      {!selectedRow ? (
        <div className="flex-1 flex flex-col p-5 overflow-y-auto">
          {activeTab === 'Product Guide' && productGuide ? (
            <div className="space-y-6">
              <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400">
                <Activity className="w-4 h-4" />
                <h3 className="text-[11px] font-bold uppercase tracking-widest">On This Page</h3>
              </div>
              <nav className="space-y-1">
                {productGuide.categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => scrollToId(category.id)}
                    className={`w-full text-left p-3 rounded-xl text-xs font-semibold transition-all border group ${
                      activeSectionId === category.id
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                        : 'text-gray-600 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 border-transparent hover:border-blue-100 dark:hover:border-blue-900/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="truncate">{category.name}</span>
                      <ChevronRight className={`w-3.5 h-3.5 transition-all ${activeSectionId === category.id ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0'}`} />
                    </div>
                  </button>
                ))}
              </nav>

              <div className="pt-6 border-t border-gray-100 dark:border-slate-800">
                 <div className="bg-blue-50 dark:bg-blue-900/10 rounded-xl p-4 border border-blue-100 dark:border-blue-900/20">
                    <div className="flex items-center space-x-2 mb-2">
                        <Lightbulb className="w-4 h-4 text-blue-600" />
                        <h4 className="text-[10px] font-bold text-blue-800 dark:text-blue-400 uppercase tracking-wider">Product Guide Tip</h4>
                    </div>
                    <p className="text-[10px] text-blue-700/70 dark:text-blue-400/70 leading-relaxed">
                        Use this guide to reference your favorite products. You can add, edit, or delete items directly from the main view.
                    </p>
                 </div>
              </div>
            </div>
          ) : activeTab === 'Products' ? (
            <div className="space-y-6">
              <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400">
                <Activity className="w-4 h-4" />
                <h3 className="text-[11px] font-bold uppercase tracking-widest">On This Page</h3>
              </div>
              <nav className="space-y-1">
                {productData.map((section, idx) => (
                  <button
                    key={idx}
                    onClick={() => scrollToSection(idx)}
                    className="w-full text-left p-3 rounded-xl text-xs font-semibold text-gray-600 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 transition-all border border-transparent hover:border-blue-100 dark:hover:border-blue-900/30 group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="truncate">{section.title}</span>
                      <ChevronRight className="w-3.5 h-3.5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                    </div>
                  </button>
                ))}
              </nav>

              <div className="pt-6 border-t border-gray-100 dark:border-slate-800">
                 <div className="bg-blue-50 dark:bg-blue-900/10 rounded-xl p-4 border border-blue-100 dark:border-blue-900/20">
                    <div className="flex items-center space-x-2 mb-2">
                        <Lightbulb className="w-4 h-4 text-blue-600" />
                        <h4 className="text-[10px] font-bold text-blue-800 dark:text-blue-400 uppercase tracking-wider">Navigation Tip</h4>
                    </div>
                    <p className="text-[10px] text-blue-700/70 dark:text-blue-400/70 leading-relaxed">
                        Click on any section above to quickly jump to its product listing. Use the search bar in the header for specific products.
                    </p>
                 </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gray-50/50 dark:bg-slate-950/20">
              <div className="w-14 h-14 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-6 text-gray-300 dark:text-slate-600 shadow-sm border border-gray-100 dark:border-slate-800">
                <Info className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-2">Detailed Inspector</h3>
              <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed max-w-[200px]">
                Select any record from the table to view comprehensive details and metadata.
              </p>
            </div>
          )}
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
                    <div className="relative group/value">
                      <div className="text-sm text-gray-800 dark:text-slate-200 font-semibold break-words bg-gray-50 dark:bg-slate-800/50 p-3 rounded-lg border border-gray-100/50 dark:border-slate-800 transition-colors pr-10">
                        {renderValue(key, value)}
                      </div>
                      {(value !== null && value !== undefined) && (
                        <button
                          onClick={() => handleCopy(key, value)}
                          className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md transition-all ${
                            copiedKey === key
                              ? 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 opacity-100'
                              : 'text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 opacity-0 group-hover/value:opacity-100 focus-visible:opacity-100 outline-none ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-slate-900 focus-visible:ring-opacity-100'
                          }`}
                          aria-label={`Copy ${key} to clipboard`}
                          title={`Copy ${key}`}
                        >
                          {copiedKey === key ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      )}
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

            <div className="space-y-4">
              {insight ? (
                <div className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl overflow-hidden">
                  <div className="p-4 border-b border-blue-100/50 dark:border-blue-900/20">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center text-blue-800 dark:text-blue-400">
                        <Lightbulb className="w-4 h-4 mr-2" />
                        <span className="text-[11px] font-bold uppercase tracking-wider">Industry Insights</span>
                      </div>
                      <span className="text-[9px] font-bold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded">VerticalIQ</span>
                    </div>

                    {insight.quickFacts && (
                      <ul className="space-y-2 mt-3">
                        {insight.quickFacts.map((fact, i) => (
                          <li key={i} className="flex items-start text-[10px] text-blue-800/80 dark:text-blue-400/80 leading-relaxed">
                            <span className="mr-1.5 mt-1 w-1 h-1 bg-blue-400 rounded-full shrink-0" />
                            {fact}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {insight.overview && (
                    <div className="bg-white/40 dark:bg-slate-900/40">
                      <button
                        onClick={() => setIsOverviewExpanded(!isOverviewExpanded)}
                        className="w-full flex items-center justify-between p-3 text-[10px] font-bold text-blue-700 dark:text-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-colors"
                      >
                        <span className="uppercase tracking-widest">Industry Overview</span>
                        {isOverviewExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                      </button>
                      {isOverviewExpanded && (
                        <div className="px-4 pb-4 pt-0 text-[10px] text-gray-600 dark:text-slate-400 leading-relaxed italic">
                          {insight.overview}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 p-4 rounded-xl">
                  <p className="text-[10px] font-medium text-amber-800 dark:text-amber-500 leading-relaxed">
                      <strong className="block mb-1 flex items-center">
                        <Lightbulb className="w-3 h-3 mr-1.5" />
                        Educational Tip
                      </strong>
                      Data shown here is extracted directly from official CSV sources. Use the 'Sunbiz Link' where available to verify current records on the state registry.
                  </p>
                </div>
              )}

              {pdfReport && (
                <a
                  href={`./${pdfReport.path}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center space-x-2 p-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all shadow-sm group"
                >
                  <FileText className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-bold">View Full Industry Report</span>
                  <ExternalLink className="w-3 h-3 opacity-50" />
                </a>
              )}
            </div>
          </div>
        </div>
      )}
      </aside>
    </>
  );
};
