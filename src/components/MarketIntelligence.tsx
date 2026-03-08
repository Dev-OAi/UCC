import React, { useState, useEffect, useMemo } from 'react';
import { BarChart3, TrendingUp, Users, Database, Globe, ArrowUpRight, ArrowDownRight, Activity, MapPin, Zap, Lock, Search } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Filter } from 'lucide-react';
import { getBridgeBaseUrl } from '../lib/dataService';

interface MarketData {
  summary: string;
  top_industries: { code: string; count: number }[];
  growth_signals: number;
  recent_findings: any[];
}

export const MarketIntelligence: React.FC = () => {
  const [data, setData] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const baseUrl = getBridgeBaseUrl();
      if (!baseUrl) {
        setLoading(false);
        return;
      }
      try {
        const response = await fetch(`${baseUrl}/market-intelligence`);
        if (!response.ok) throw new Error('Failed to fetch market intelligence');
        const json = await response.json();
        setData(json);
      } catch (err) {
        setError('Intelligence Bridge not connected. Start the bridge to view real-time market signals.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
  const [searchTerm, setSearchTerm] = useState('');

  const filteredFindings = useMemo(() => {
    if (!data) return [];
    if (!searchTerm) return data.recent_findings;
    const query = searchTerm.toLowerCase();
    return data.recent_findings.filter(item =>
      item['Business Name'].toLowerCase().includes(query) ||
      item['NAICS_Code'].toString().includes(query) ||
      item['Industry_Pain_Point'].toLowerCase().includes(query)
    );
  }, [data, searchTerm]);

  if (loading) return (
    <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-slate-950">
      <div className="flex flex-col items-center space-y-4">
        <div className="w-10 h-10 border-4 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Compiling Market Intelligence...</p>
      </div>
    </div>
  );

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-slate-950 p-6 md:p-10 space-y-8 relative">
      {!getBridgeBaseUrl() && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-gray-50/80 dark:bg-slate-950/80 backdrop-blur-[2px]">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-800 text-center max-w-md animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <Lock className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-4">Local Access Only</h2>
            <p className="text-gray-600 dark:text-slate-400 text-sm leading-relaxed mb-6">
              To protect lead privacy and banking strategy, the Market Intelligence dashboard is only available when running the application locally.
            </p>
            <div className="space-y-3">
              <div className="p-3 bg-gray-50 dark:bg-slate-800 rounded-lg text-[10px] font-bold text-gray-500 dark:text-slate-500 uppercase tracking-widest border border-gray-100 dark:border-slate-700">
                Connection Status: <span className="text-red-500">Restricted</span>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-200 dark:border-slate-800 pb-8">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase rounded">Manager View</span>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Real-Time</span>
            </div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center">
              <Globe className="w-8 h-8 mr-3 text-blue-600" />
              Market Intelligence
            </h1>
            <p className="text-gray-500 dark:text-slate-400 mt-2">
              Strategic overview of territory signals, growth patterns, and competitive shifts.
            </p>
          </div>
          <div className="flex bg-white dark:bg-slate-900 p-1 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm">
            <div className="px-6 py-2 flex flex-col items-center border-r border-gray-100 dark:border-slate-800">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Growth Signals</span>
              <span className="text-xl font-black text-emerald-600">{data?.growth_signals || 0}</span>
            </div>
            <div className="px-6 py-2 flex flex-col items-center">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active Leads</span>
              <span className="text-xl font-black text-blue-600">{data?.recent_findings.length || 0}</span>
            </div>
          </div>
        </div>

        {error ? (
          <div className="bg-amber-50 dark:bg-amber-900/10 p-10 rounded-2xl border-2 border-dashed border-amber-200 dark:border-amber-900/30 text-center space-y-4">
            <div className="p-4 bg-amber-100 dark:bg-amber-900/20 rounded-full w-fit mx-auto">
              <Database className="w-8 h-8 text-amber-600" />
            </div>
            <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Intelligence Bridge Offline</h3>
            <p className="text-gray-500 dark:text-slate-400 max-w-md mx-auto">{error}</p>
          </div>
        ) : (
          <>
            {/* Top Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Territory Momentum</span>
                  <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                </div>
                <p className="text-2xl font-black text-gray-900 dark:text-white">Active Growth</p>
                <p className="text-xs text-gray-500 dark:text-slate-400 line-clamp-2">{data?.summary}</p>
              </div>

              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">High-Value Concentration</span>
                  <Activity className="w-4 h-4 text-blue-500" />
                </div>
                <p className="text-2xl font-black text-gray-900 dark:text-white">Professional Services</p>
                <p className="text-xs text-gray-500 dark:text-slate-400">NAICS 541110 (Law Firms) shows 15% increase in UCC filings this month.</p>
              </div>

              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Competitive Shift</span>
                  <Zap className="w-4 h-4 text-amber-500" />
                </div>
                <p className="text-2xl font-black text-gray-900 dark:text-white">Lender Expansion</p>
                <p className="text-xs text-gray-500 dark:text-slate-400">Chase and Wells Fargo are aggressively targeting retail in Zip 33401.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Industry Distribution Chart */}
              <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center">
                    <TrendingUp className="w-4 h-4 mr-2 text-blue-600" />
                    Top Industries by Signal Volume
                  </h3>
                </div>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data?.top_industries}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                      <XAxis dataKey="code" tick={{ fill: '#64748b', fontSize: 10 }} />
                      <YAxis tick={{ fill: '#64748b', fontSize: 10 }} />
                      <Tooltip />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={40}>
                        {data?.top_industries.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Recent Findings Feed */}
              <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm flex flex-col">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                  <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center">
                    <Users className="w-4 h-4 mr-2 text-blue-600" />
                    Strategic Intelligence Log
                  </h3>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search intelligence..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8 pr-4 py-1.5 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-lg text-[10px] focus:ring-2 focus:ring-blue-500/20 outline-none w-full sm:w-48"
                    />
                  </div>
                </div>
                <div className="flex-1 space-y-4 overflow-y-auto max-h-[400px] pr-2">
                  {filteredFindings.map((item, i) => (
                    <div key={i} className="p-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-gray-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-900 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-sm font-black text-gray-900 dark:text-white leading-tight">{item['Business Name']}</p>
                          <div className="flex items-center space-x-2 mt-0.5">
                            <p className="text-[10px] font-bold text-blue-500 uppercase tracking-tight">NAICS: {item['NAICS_Code']}</p>
                            {item['Growth_Score'] >= 70 && (
                              <span className="px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[8px] font-black uppercase rounded flex items-center">
                                <Zap className="w-2 h-2 mr-1" />
                                High Growth
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                           <div className="flex items-center space-x-1">
                              <MapPin className="w-3 h-3 text-gray-400" />
                              <span className="text-[10px] font-bold text-gray-400 uppercase">FL Intelligence</span>
                           </div>
                           {item['Growth_Score'] > 0 && (
                             <div className="mt-1 flex items-center space-x-1">
                               <div className="w-12 h-1 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                 <div
                                   className={`h-full ${item['Growth_Score'] >= 70 ? 'bg-emerald-500' : item['Growth_Score'] >= 40 ? 'bg-amber-500' : 'bg-blue-500'}`}
                                   style={{ width: `${item['Growth_Score']}%` }}
                                 />
                               </div>
                               <span className="text-[8px] font-black text-gray-400">{item['Growth_Score']}%</span>
                             </div>
                           )}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-xs text-gray-600 dark:text-slate-400 leading-relaxed italic border-l-2 border-blue-500 pl-3">
                          "{item['Industry_Pain_Point']}"
                        </p>
                        {item['Suppliers_Customers'] && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {item['Suppliers_Customers'].split(',').map((sig: string, idx: number) => (
                              <span key={idx} className="px-1.5 py-0.5 bg-blue-100/50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-[8px] font-black uppercase rounded">
                                {sig.trim()}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {filteredFindings.length === 0 && (
                    <div className="text-center py-12">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">No matching findings</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
