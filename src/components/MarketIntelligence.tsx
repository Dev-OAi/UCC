import React, { useState, useEffect, useMemo } from 'react';
import { BarChart3, TrendingUp, Users, Database, Globe, ArrowUpRight, ArrowDownRight, Activity, MapPin, Zap, Lock, Share2, AlertCircle, AreaChart as AreaIcon, BarChart as BarIcon, Sparkles, ArrowRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, AreaChart, Area } from 'recharts';
import { Search, Filter, FileText } from 'lucide-react';
import { getBridgeBaseUrl, isLocalhost } from '../lib/dataService';
import { getInsightForCategory } from '../lib/industryKnowledge';

interface MarketData {
  summary: string;
  top_industries: { code: string; count: number }[];
  growth_signals: number;
  recent_findings: any[];
  lender_activity?: { name: string; count: number }[];
  value_chain_ops?: { source: string; target: string; count: number }[];
  filing_velocity?: { date: string; count: number }[];
  zip_hotspots?: { name: string; value: number }[];
}

interface MarketIntelligenceProps {
  allData?: any[];
}

export const MarketIntelligence: React.FC<MarketIntelligenceProps> = ({ allData = [] }) => {
  const [data, setData] = useState<MarketData | null>(null);
  const [marketGraph, setMarketGraph] = useState<any>(null);
  const [learnedTrends, setLearnedTrends] = useState<any>(null);
  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'velocity' | 'hotspots' | 'industries' | 'competitors'>('velocity');

  useEffect(() => {
    fetch('./Data/Intelligence/Market_Graph.json')
      .then(res => res.json())
      .then(graph => setMarketGraph(graph))
      .catch(() => {});

    fetch('./Data/Intelligence/learned_trends.json')
      .then(res => res.json())
      .then(trends => setLearnedTrends(trends))
      .catch(() => {});

    const fetchData = async () => {
      const baseUrl = getBridgeBaseUrl();

      try {
        const response = await fetch(`${baseUrl}/market-intelligence`);
        if (!response.ok) throw new Error('Failed to fetch market intelligence');
        const json = await response.json();
        setData(json);
        setError(null);
      } catch (err) {
        if (allData && allData.length > 0) {
          // Fallback logic for hosted mode: read from allData
          const topIndustriesMap: Record<string, number> = {};
          const recentFindings: any[] = [];

          const lenderMap: Record<string, number> = {};
          let growthSignalsCount = 0;
          const growthKeywords = /hiring|expansion|new site|opening soon|grand opening|growth/i;

          allData.forEach(row => {
            // 1. Industry Mapping
            const industry = row.Category || row['Category '] || 'Other';
            if (industry !== 'Other') {
              topIndustriesMap[industry] = (topIndustriesMap[industry] || 0) + 1;
            }

            // 2. Lender Activity Mapping
            const lender = row['Reverse Name'] || row['Secured Party 1 Name'];
            if (lender && lender !== 'N/A') {
              lenderMap[lender] = (lenderMap[lender] || 0) + 1;
            }

            // 3. Growth Signal Detection
            const rowStr = JSON.stringify(row);
            if (growthKeywords.test(rowStr) || row.Score > 60) {
              growthSignalsCount++;
              if (recentFindings.length < 50 && row.businessName) {
                recentFindings.push({
                  'Business Name': row.businessName,
                  'NAICS_Code': row['FEI/EIN Number'] || 'N/A',
                  'Industry_Pain_Point': `Active growth detected. Record scores high on expansion markers in ${row._location || 'territory'}.`,
                  'Suppliers_Customers': row.Category || 'Strategic Focus'
                });
              }
            }
          });

          const topIndustries = Object.entries(topIndustriesMap)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 8)
            .map(([code, count]) => ({ code, count }));

          const topLenders = Object.entries(lenderMap)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name, count]) => ({ name, count }));

          // 4. Filing Velocity & Zip Hotspots (Missing from earlier)
          const velocityMap: Record<string, number> = {};
          const zipMap: Record<string, number> = {};

          allData.forEach(row => {
            const dateStr = row['Record Date'] || row['Date Filed'] || row['RecordDate'];
            if (dateStr && dateStr !== 'N/A') {
              velocityMap[dateStr] = (velocityMap[dateStr] || 0) + 1;
            }
            const zip = row._zip || row.Zip;
            if (zip && zip.length >= 5) {
              zipMap[zip] = (zipMap[zip] || 0) + 1;
            }
          });

          const filingVelocity = Object.entries(velocityMap)
            .map(([date, count]) => ({ date, count }))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .slice(-30);

          const zipHotspots = Object.entries(zipMap)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([name, value]) => ({ name, value }));

          setData({
            summary: `Scanning ${allData.length.toLocaleString()} local records for market shifts.`,
            top_industries: topIndustries,
            growth_signals: growthSignalsCount,
            recent_findings: recentFindings,
            lender_activity: topLenders,
            value_chain_ops: marketGraph?.connections?.slice(0, 5).map((c: any) => ({
              source: c.source_cat,
              target: c.target_cat,
              count: 1
            })),
            filing_velocity: filingVelocity,
            zip_hotspots: zipHotspots
          });
          setError(null);
        } else if (isLocalhost()) {
          setError('Intelligence Bridge not connected. Start the bridge to view real-time market signals.');
        } else {
          setError('Live Intelligence Bridge is local-only. Loading hub data...');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [allData]);

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
      {!isLocalhost() && !data && (
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
        {/* Learned Trends Bar */}
        {data && (
          <div className="flex overflow-x-auto pb-4 space-x-4 hide-scrollbar">
            {data.top_industries.map((industry, i) => (
              <div key={i} className="flex-none bg-blue-600/10 border border-blue-600/20 px-4 py-2 rounded-xl flex items-center space-x-3">
                <div className="p-1.5 bg-blue-600 rounded-lg">
                  <TrendingUp className="w-3 h-3 text-white" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-blue-600 uppercase tracking-tighter">Learned Trend</p>
                  <p className="text-xs font-bold text-gray-900 dark:text-white truncate max-w-[120px]">{industry.code}</p>
                </div>
              </div>
            ))}
          </div>
        )}

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
            <div className="px-6 py-2 flex flex-col items-center border-r border-gray-100 dark:border-slate-800">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Value Hubs</span>
              <span className="text-xl font-black text-purple-600">{marketGraph?.connections?.length || 0}</span>
            </div>
            <div className="px-6 py-2 flex flex-col items-center">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active Leads</span>
              <span className="text-xl font-black text-blue-600">{data?.recent_findings.length || 0}</span>
            </div>
          </div>
        </div>

        {error && !data ? (
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
                <p className="text-2xl font-black text-gray-900 dark:text-white">{data?.top_industries?.[0]?.code || 'Detecting...'}</p>
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  {data?.top_industries?.[0]?.code} shows the highest volume of activity in your territory with {data?.top_industries?.[0]?.count} identified records.
                </p>
              </div>

              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Competitive Shift</span>
                  <Zap className="w-4 h-4 text-amber-500" />
                </div>
                <p className="text-2xl font-black text-gray-900 dark:text-white">{data?.lender_activity?.[0]?.name || 'Lender Scan'}</p>
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  {data?.lender_activity?.[0]?.name} is aggressively positioning in this territory, followed by {data?.lender_activity?.[1]?.name}.
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden">
               <div className="flex border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/30">
                  {[
                    { id: 'velocity', label: 'Market Velocity', icon: AreaIcon },
                    { id: 'hotspots', label: 'Zip Hotspots', icon: MapPin },
                    { id: 'industries', label: 'Top Sectors', icon: TrendingUp },
                    { id: 'competitors', label: 'Lender Activity', icon: Zap }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex-1 flex items-center justify-center space-x-2 py-4 px-4 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 ${
                        activeTab === tab.id
                          ? 'text-blue-600 border-blue-600 bg-white dark:bg-slate-900'
                          : 'text-gray-400 border-transparent hover:text-gray-600 dark:hover:text-slate-300'
                      }`}
                    >
                      <tab.icon className="w-3.5 h-3.5" />
                      <span className="hidden md:inline">{tab.label}</span>
                    </button>
                  ))}
               </div>

               <div className="p-8">
                  {activeTab === 'velocity' && (
                    <div className="space-y-6 animate-in fade-in duration-500">
                      <div className="flex items-center justify-between">
                        <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center">
                          Territory Filing Velocity (Last 30 Days)
                        </h3>
                        <div className="flex items-center space-x-2">
                          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                          <span className="text-[10px] font-bold text-emerald-600 uppercase">Live Momentum</span>
                        </div>
                      </div>
                      <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={data?.filing_velocity}>
                            <defs>
                              <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                            <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 9 }} hide />
                            <YAxis tick={{ fill: '#64748b', fontSize: 9 }} />
                            <Tooltip />
                            <Area type="monotone" dataKey="count" stroke="#10b981" fillOpacity={1} fill="url(#colorCount)" strokeWidth={3} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}

                  {activeTab === 'hotspots' && (
                    <div className="space-y-6 animate-in fade-in duration-500">
                      <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest">
                        Market Hotspots (Zip Code Density)
                      </h3>
                      <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={data?.zip_hotspots}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                            <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 9 }} />
                            <YAxis tick={{ fill: '#64748b', fontSize: 9 }} />
                            <Tooltip />
                            <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={35}>
                              {data?.zip_hotspots?.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}

                  {activeTab === 'industries' && (
                    <div className="space-y-6 animate-in fade-in duration-500">
                      <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest">
                        Top Industries by Signal Volume
                      </h3>
                      <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={data?.top_industries}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                            <XAxis dataKey="code" tick={{ fill: '#64748b', fontSize: 9 }} />
                            <YAxis tick={{ fill: '#64748b', fontSize: 9 }} />
                            <Tooltip />
                            <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={35}>
                              {data?.top_industries.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}

                  {activeTab === 'competitors' && (
                    <div className="space-y-6 animate-in fade-in duration-500">
                       <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest">
                        Territory Competitive Shifts (Lenders)
                      </h3>
                      <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={data?.lender_activity} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                            <XAxis type="number" hide />
                            <YAxis dataKey="name" type="category" width={150} tick={{ fill: '#64748b', fontSize: 9 }} axisLine={false} tickLine={false} />
                            <Tooltip />
                            <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={25}>
                              {data?.lender_activity?.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} opacity={0.8} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
                         <p className="text-xs text-blue-700 dark:text-blue-300 font-bold">
                           <Zap className="w-3.5 h-3.5 inline mr-1.5" />
                           {data?.lender_activity?.[0]?.name} is the most active competitor in this territory.
                         </p>
                      </div>
                    </div>
                  )}
               </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

              {/* Territory Value Chain */}
              <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm flex flex-col lg:col-span-2">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center">
                    <Share2 className="w-4 h-4 mr-2 text-purple-600" />
                    Territory Value Chain (B2B Opportunities)
                  </h3>
                  <span className="text-[10px] font-bold text-purple-600 bg-purple-50 dark:bg-purple-900/20 px-2 py-1 rounded">Recursive Discovery</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {marketGraph?.connections?.slice(0, 6).map((conn: any, i: number) => (
                    <div key={i} className="p-4 bg-purple-50/30 dark:bg-purple-900/10 rounded-xl border border-purple-100 dark:border-purple-900/20">
                      <div className="flex items-center justify-between mb-2">
                         <span className="text-[9px] font-black text-purple-600 uppercase tracking-tighter">Chain Link</span>
                         <Share2 className="w-3 h-3 text-purple-400" />
                      </div>
                      <div className="flex items-center space-x-2 mb-3">
                        <div className="text-[10px] font-bold text-gray-900 dark:text-white truncate max-w-[80px]">{conn.source_cat}</div>
                        <ArrowRight className="w-3 h-3 text-gray-400" />
                        <div className="text-[10px] font-bold text-gray-900 dark:text-white truncate max-w-[80px]">{conn.target_cat}</div>
                      </div>
                      <p className="text-[9px] text-gray-500 dark:text-slate-400 leading-relaxed italic">
                        "High probability of partnership between these sectors in your territory."
                      </p>
                    </div>
                  ))}
                  {(!marketGraph || !marketGraph.connections) && (
                    <div className="col-span-3 text-center py-8">
                       <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Building value chain mapping...</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Industry Distribution Chart */}
              <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm flex flex-col">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center">
                    <TrendingUp className="w-4 h-4 mr-2 text-blue-600" />
                    Territory Competitive Shifts (Lenders)
                  </h3>
                </div>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data?.lender_activity} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" width={120} tick={{ fill: '#64748b', fontSize: 9 }} axisLine={false} tickLine={false} />
                      <Tooltip />
                      <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={25}>
                        {data?.lender_activity?.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} opacity={0.8} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                   <p className="text-[10px] text-blue-700 dark:text-blue-300 font-medium">
                     <Zap className="w-3 h-3 inline mr-1" />
                     {data?.lender_activity?.[0]?.name} is the most active competitor in this territory.
                   </p>
                </div>
              </div>

              {/* Market Alerts & Learned Logic (Recursive restored) */}
              <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm flex flex-col lg:col-span-2">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center">
                    <AlertCircle className="w-4 h-4 mr-2 text-amber-500" />
                    Recursive Market Alerts (Learned Patterns)
                  </h3>
                  <div className="px-2 py-1 bg-amber-50 dark:bg-amber-900/20 rounded text-[9px] font-black text-amber-600 uppercase border border-amber-100">
                    Updated Nightly
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {learnedTrends?.market_alerts?.map((alert: any, i: number) => (
                    <div key={i} className="flex items-start space-x-4 p-4 bg-amber-50/30 dark:bg-amber-900/10 rounded-xl border border-amber-100 dark:border-amber-900/20">
                      <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                        <Zap className="w-4 h-4 text-amber-500" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-tight">{alert.business}</p>
                        <p className="text-[10px] text-amber-700 dark:text-amber-400 font-bold mb-1">{alert.type}</p>
                        <p className="text-[10px] text-gray-500 dark:text-slate-400 italic">"{alert.detail}"</p>
                      </div>
                    </div>
                  ))}
                  {(!learnedTrends || !learnedTrends.market_alerts) && (
                    <p className="col-span-2 text-center py-6 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                       Listening for market shifts...
                    </p>
                  )}
                </div>
              </div>

              {/* Territory Value Chain */}
              <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm flex flex-col lg:col-span-2">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center">
                    <Share2 className="w-4 h-4 mr-2 text-purple-600" />
                    Territory Value Chain (B2B Opportunities)
                  </h3>
                  <span className="text-[10px] font-bold text-purple-600 bg-purple-50 dark:bg-purple-900/20 px-2 py-1 rounded">Recursive Discovery</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {marketGraph?.connections?.slice(0, 6).map((conn: any, i: number) => (
                    <div key={i} className="p-4 bg-purple-50/30 dark:bg-purple-900/10 rounded-xl border border-purple-100 dark:border-purple-900/20">
                      <div className="flex items-center justify-between mb-2">
                         <span className="text-[9px] font-black text-purple-600 uppercase tracking-tighter">Chain Link</span>
                         <Share2 className="w-3 h-3 text-purple-400" />
                      </div>
                      <div className="flex items-center space-x-2 mb-3">
                        <div className="text-[10px] font-bold text-gray-900 dark:text-white truncate max-w-[80px]">{conn.source_cat}</div>
                        <ArrowRight className="w-3 h-3 text-gray-400" />
                        <div className="text-[10px] font-bold text-gray-900 dark:text-white truncate max-w-[80px]">{conn.target_cat}</div>
                      </div>
                      <p className="text-[9px] text-gray-500 dark:text-slate-400 leading-relaxed italic">
                        "High probability of partnership between these sectors in your territory."
                      </p>
                    </div>
                  ))}
                  {(!marketGraph || !marketGraph.connections) && (
                    <div className="col-span-3 text-center py-8">
                       <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Building value chain mapping...</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Industry Distribution Chart */}
              <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm flex flex-col">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center">
                    <TrendingUp className="w-4 h-4 mr-2 text-blue-600" />
                    Territory Competitive Shifts (Lenders)
                  </h3>
                </div>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data?.lender_activity} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" width={120} tick={{ fill: '#64748b', fontSize: 9 }} axisLine={false} tickLine={false} />
                      <Tooltip />
                      <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={25}>
                        {data?.lender_activity?.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} opacity={0.8} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                   <p className="text-[10px] text-blue-700 dark:text-blue-300 font-medium">
                     <Zap className="w-3 h-3 inline mr-1" />
                     {data?.lender_activity?.[0]?.name} is the most active competitor in this territory.
                   </p>
                </div>
              </div>

              {/* Market Alerts & Learned Logic (Recursive restored) */}
              <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm flex flex-col lg:col-span-2">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center">
                    <AlertCircle className="w-4 h-4 mr-2 text-amber-500" />
                    Recursive Market Alerts (Learned Patterns)
                  </h3>
                  <div className="px-2 py-1 bg-amber-50 dark:bg-amber-900/20 rounded text-[9px] font-black text-amber-600 uppercase border border-amber-100">
                    Updated Nightly
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {learnedTrends?.market_alerts?.map((alert: any, i: number) => (
                    <div key={i} className="flex items-start space-x-4 p-4 bg-amber-50/30 dark:bg-amber-900/10 rounded-xl border border-amber-100 dark:border-amber-900/20">
                      <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                        <Zap className="w-4 h-4 text-amber-500" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-tight">{alert.business}</p>
                        <p className="text-[10px] text-amber-700 dark:text-amber-400 font-bold mb-1">{alert.type}</p>
                        <p className="text-[10px] text-gray-500 dark:text-slate-400 italic">"{alert.detail}"</p>
                      </div>
                    </div>
                  ))}
                  {(!learnedTrends || !learnedTrends.market_alerts) && (
                    <p className="col-span-2 text-center py-6 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                       Listening for market shifts...
                    </p>
                  )}
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
                          <p className="text-[10px] font-bold text-blue-500 uppercase tracking-tight mt-0.5">NAICS: {item['NAICS_Code']}</p>
                        </div>
                        <div className="flex items-center space-x-1">
                           <MapPin className="w-3 h-3 text-gray-400" />
                           <span className="text-[10px] font-bold text-gray-400 uppercase">FL Intelligence</span>
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
