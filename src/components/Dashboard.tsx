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
    <div className="flex-1 overflow-y-auto bg-white">
      <div className="max-w-5xl mx-auto px-8 py-16 flex flex-col items-center text-center">
        <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-widest mb-6 border border-blue-100 shadow-sm">
          Internal Resource Hub
        </div>

        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6 tracking-tight">
          Welcome to <span className="text-blue-600">Data Explorer</span>
        </h1>

        <p className="text-lg text-gray-500 max-w-2xl mb-12 leading-relaxed">
          Your central repository for business intelligence and data insights.
          Empowering your team with information that drives informed decisions.
          <span className="block mt-4 text-sm font-medium text-gray-400 italic">
            Currently indexing {rowCount.toLocaleString()} records across {displayTypes.length} categories.
          </span>
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full mb-16">
          <div className="group relative bg-blue-600 rounded-2xl p-8 text-left text-white shadow-xl shadow-blue-200 transition-all hover:-translate-y-1 overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
              <Zap className="w-24 h-24" />
            </div>
            <div className="bg-white/20 w-10 h-10 rounded-lg flex items-center justify-center mb-6 backdrop-blur-sm">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-white text-blue-600 uppercase mb-4">New Feature</span>
            <h3 className="text-2xl font-bold mb-2">Advanced Filtering</h3>
            <p className="text-blue-100 text-sm mb-6 leading-relaxed max-w-xs">
              Filter through thousands of records instantly using our new ZIP and Location specific selectors.
            </p>
            <button className="flex items-center font-bold text-sm group-hover:underline">
              Get Started <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          </div>

          <div className="group relative bg-white rounded-2xl p-8 text-left border border-gray-100 shadow-sm transition-all hover:shadow-md hover:border-blue-100 hover:-translate-y-1 overflow-hidden">
             <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
              <Database className="w-24 h-24" />
            </div>
            <div className="bg-gray-50 w-10 h-10 rounded-lg flex items-center justify-center mb-6 group-hover:bg-blue-50 transition-colors">
              <Database className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold mb-2 text-gray-900">Data Integrity</h3>
            <p className="text-gray-500 text-sm mb-6 leading-relaxed max-w-xs">
              CSV data is parsed and indexed client-side to ensure maximum performance and privacy.
            </p>
            <button className="flex items-center font-bold text-sm text-blue-600 group-hover:underline">
              Learn More <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          </div>
        </div>

        <div className="w-full text-left">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em] mb-8">Quick Navigation</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {displayTypes.map(type => (
              <button
                key={type}
                onClick={() => onSelectCategory(type)}
                className="group p-6 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-white hover:border-blue-200 hover:shadow-md transition-all text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-white border border-gray-100 flex items-center justify-center mb-4 group-hover:border-blue-100 transition-colors">
                  <Layers className="w-4 h-4 text-blue-600" />
                </div>
                <h4 className="font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">{type} Hub</h4>
                <p className="text-xs text-gray-500 leading-relaxed">
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
