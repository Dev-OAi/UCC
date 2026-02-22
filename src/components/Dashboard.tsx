import React from 'react';
import { Layers, Zap, Database, ArrowRight } from 'lucide-react';

interface DashboardProps {
  types: string[];
  onSelectCategory: (type: string) => void;
  rowCount: number;
}

export const Dashboard: React.FC<DashboardProps> = ({ types, onSelectCategory, rowCount }) => {
  const displayTypes = types.filter(t => t !== 'All' && t !== 'Home');

  return (
    <div className="flex-1 overflow-y-auto bg-white dark:bg-slate-900 transition-colors duration-200">
      <div className="max-w-5xl mx-auto px-8 py-16 flex flex-col items-center text-center">
        <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase tracking-widest mb-6 border border-blue-100 dark:border-blue-900/50 shadow-sm">
          Internal Resource Hub
        </div>

        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-6 tracking-tight">
          Welcome to <span className="text-blue-600 dark:text-blue-500">Data Explorer</span>
        </h1>

        <p className="text-lg text-gray-500 dark:text-slate-400 max-w-2xl mb-12 leading-relaxed">
          Your central repository for business intelligence and data insights.
          Empowering your team with information that drives informed decisions.
          <span className="block mt-4 text-sm font-medium text-gray-400 dark:text-slate-500 italic">
            Currently indexing {rowCount.toLocaleString()} records across {displayTypes.length} categories.
          </span>
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full mb-16">
          <div className="group relative bg-blue-600 dark:bg-blue-700 rounded-2xl p-8 text-left text-white shadow-xl shadow-blue-200 dark:shadow-none transition-all hover:-translate-y-1 overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
              <Zap className="w-24 h-24" />
            </div>
            <div className="bg-white/20 w-10 h-10 rounded-lg flex items-center justify-center mb-6">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-white text-blue-600 dark:text-blue-700 uppercase mb-4">New Feature</span>
            <h3 className="text-2xl font-bold mb-2">Advanced Filtering</h3>
            <p className="text-blue-100 text-sm mb-6 leading-relaxed max-w-xs">
              Filter through thousands of records instantly using our new dynamic header selectors.
            </p>
            <button className="flex items-center font-bold text-sm group-hover:underline transition-all">
              Get Started <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          </div>

          <div className="group relative bg-white dark:bg-slate-800 rounded-2xl p-8 text-left border border-gray-100 dark:border-slate-700 shadow-sm transition-all hover:shadow-md dark:hover:shadow-blue-900/10 hover:border-blue-100 dark:hover:border-blue-900 hover:-translate-y-1 overflow-hidden">
             <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
              <Database className="w-24 h-24" />
            </div>
            <div className="bg-gray-50 dark:bg-slate-900 w-10 h-10 rounded-lg flex items-center justify-center mb-6 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30 transition-colors">
              <Database className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">Data Integrity</h3>
            <p className="text-gray-500 dark:text-slate-400 text-sm mb-6 leading-relaxed max-w-xs">
              CSV data is parsed and indexed client-side to ensure maximum performance and privacy.
            </p>
            <button className="flex items-center font-bold text-sm text-blue-600 dark:text-blue-400 group-hover:underline transition-all">
              Learn More <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          </div>
        </div>

        <div className="w-full text-left">
          <h2 className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-8">Quick Navigation</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {displayTypes.map(type => (
              <button
                key={type}
                onClick={() => onSelectCategory(type)}
                className="group p-6 rounded-xl border border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 hover:border-blue-200 dark:hover:border-blue-900 hover:shadow-md transition-all text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-700 flex items-center justify-center mb-4 group-hover:border-blue-100 dark:group-hover:border-blue-900 transition-colors">
                  <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <h4 className="font-bold text-gray-900 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{type} Hub</h4>
                <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed">
                  Explore business listings and details specific to {type} data.
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
