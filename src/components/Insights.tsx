import React, { useMemo, useState } from 'react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
  AreaChart, Area, Treemap
} from 'recharts';
import { PieChart as PieIcon, BarChart3, TrendingUp, Users, Database, ShieldCheck, Activity, FileText, Building2, MapPin, Settings2 } from 'lucide-react';

interface InsightsProps {
  data: any[];
  types: string[];
}

type VisualType = 'territory' | 'status' | 'categories' | 'market-share' | 'trends' | 'docs' | 'structure';

export const Insights: React.FC<InsightsProps> = ({ data, types }) => {
  const [activeVisual, setActiveVisual] = useState<VisualType>('territory');
  const [marketShareChartType, setMarketShareChartType] = useState<'bar' | 'pie'>('pie');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const displayTypes = types.filter(t => t !== 'All' && t !== 'Home');

  const statusData = useMemo(() => {
    const counts: Record<string, number> = {};
    data.forEach(row => {
      const status = row.Status || row.STATUS || 'Unknown';
      counts[status] = (counts[status] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8); // Top 8 statuses
  }, [data]);

  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {};
    data.forEach(row => {
      const type = row._type || 'Unknown';
      counts[type] = (counts[type] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [data]);

  const marketShareData = useMemo(() => {
    const last90DaysData = data.filter(row => row._type === 'Last 90 Days');
    const counts: Record<string, number> = {};
    last90DaysData.forEach(row => {
      const name = row['Reverse Name'] || 'Unknown';
      counts[name] = (counts[name] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10)
      .sort((a, b) => a.value - b.value); // Largest on the right
  }, [data]);

  const uniqueReverseNames = useMemo(() => {
    const names = new Set(
      data
        .filter(row => row._type === 'Last 90 Days')
        .map(row => row['Reverse Name'])
        .filter(Boolean)
    );
    return names.size;
  }, [data]);

  const filingVelocityData = useMemo(() => {
    const last90DaysData = data.filter(row => row._type === 'Last 90 Days');
    const counts: Record<string, number> = {};
    last90DaysData.forEach(row => {
      const dateStr = row['Record Date'];
      if (!dateStr) return;
      counts[dateStr] = (counts[dateStr] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [data]);

  const docTypeData = useMemo(() => {
    const last90DaysData = data.filter(row => row._type === 'Last 90 Days');
    const counts: Record<string, number> = {};
    last90DaysData.forEach(row => {
      const type = row['Doc Type'] || 'Unknown';
      counts[type] = (counts[type] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [data]);

  const entityTypeData = useMemo(() => {
    const counts: Record<string, number> = {};
    data.forEach(row => {
      const type = row['Entity Type'] || 'Unknown';
      counts[type] = (counts[type] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .filter(entry => entry.name !== 'Unknown')
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [data]);

  const zipData = useMemo(() => {
    const counts: Record<string, number> = {};
    data.forEach(row => {
      const zip = row._zip || row.Zip || row.ZIP || 'Unknown';
      if (zip && zip !== 'Unknown' && zip.length >= 5) {
        counts[zip] = (counts[zip] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 15);
  }, [data]);

  const cityData = useMemo(() => {
    const counts: Record<string, number> = {};
    data.forEach(row => {
      const city = row._location || row.Location || row.City || 'Unknown';
      if (city && city !== 'Unknown' && city !== 'Link' && city.length > 2) {
        counts[city] = (counts[city] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [data]);

  const visuals = [
    { id: 'territory', label: 'Territory & Market', icon: MapPin, color: 'text-amber-500' },
    { id: 'status', label: 'Status Distribution', icon: PieIcon, color: 'text-blue-500' },
    { id: 'categories', label: 'Records per Category', icon: BarChart3, color: 'text-emerald-500' },
    { id: 'market-share', label: 'UCC Market Share', icon: ShieldCheck, color: 'text-blue-600' },
    { id: 'trends', label: 'Filing Activity', icon: Activity, color: 'text-emerald-600' },
    { id: 'docs', label: 'Document Types', icon: FileText, color: 'text-blue-500' },
    { id: 'structure', label: 'Corporate Structure', icon: Building2, color: 'text-emerald-500' },
  ] as const;

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

  const AdjustHint = () => (
    <div className="flex items-center space-x-2 opacity-20 hover:opacity-100 transition-opacity duration-300 cursor-help group/hint">
      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest hidden group-hover/hint:block animate-in fade-in slide-in-from-right-2">Configure View</span>
      <Settings2 className="w-4 h-4 text-gray-400 group-hover/hint:text-blue-500 transition-colors" />
    </div>
  );

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-800 p-3 border border-gray-200 dark:border-slate-700 shadow-lg rounded-lg">
          <p className="text-sm font-bold text-gray-900 dark:text-white">{label || payload[0].name}</p>
          <p className="text-sm text-blue-600 dark:text-blue-400">
            {payload[0].value.toLocaleString()} records
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-slate-950 p-6 md:p-10 space-y-10 transition-colors duration-200">
      <div className="max-w-6xl mx-auto space-y-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-200 dark:border-slate-800 pb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center">
              <BarChart3 className="w-8 h-8 mr-3 text-blue-600 dark:text-blue-500" />
              Data Insights
            </h1>
            <p className="text-gray-500 dark:text-slate-400 mt-2">
              Visual analytics and distribution breakdown for your indexed data.
            </p>
          </div>
          <div className="flex items-center space-x-2 bg-white dark:bg-slate-900 p-1.5 rounded-lg border border-gray-200 dark:border-slate-800 shadow-sm">
             <div className="px-3 py-1.5 flex flex-col items-center border-r border-gray-100 dark:border-slate-800">
                <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">Total Records</span>
                <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{data.length.toLocaleString()}</span>
             </div>
             <div className="px-3 py-1.5 flex flex-col items-center">
                <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">Categories</span>
                <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{displayTypes.length}</span>
             </div>
          </div>
        </div>

        {/* Gallery Navigation Toolbar */}
        <div className="flex items-center space-x-1 p-1.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl overflow-x-auto no-scrollbar shadow-sm scrollbar-hide">
          {visuals.map((v) => {
            const Icon = v.icon;
            const isActive = activeVisual === v.id;
            return (
              <button
                key={v.id}
                onClick={() => setActiveVisual(v.id)}
                className={`flex items-center space-x-2.5 px-4 py-2.5 rounded-xl transition-all duration-300 whitespace-nowrap group ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                    : 'text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-gray-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <Icon className={`w-4 h-4 transition-transform duration-300 ${
                  isActive ? 'scale-110' : 'opacity-40 group-hover:opacity-100'
                }`} />
                <span className={`text-xs font-bold tracking-tight ${isActive ? '' : 'opacity-70 group-hover:opacity-100'}`}>
                  {v.label}
                </span>
              </button>
            );
          })}
        </div>

        <div className="space-y-10 min-h-[500px]">
          {/* Territory & Market Analysis */}
          {activeVisual === 'territory' && (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm transition-all animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-hidden">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                    <MapPin className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">Territory & Market Analysis</h3>
                    <p className="text-xs text-gray-500 dark:text-slate-400">Prospect density and geographic opportunity mapping</p>
                  </div>
                </div>
                <AdjustHint />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">Top Prospect Hotspots (Zip)</h4>
                    <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-[9px] font-bold rounded">Active Markets</span>
                  </div>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={zipData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                        <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} />
                        <YAxis tick={{ fill: '#64748b', fontSize: 10 }} hide />
                        <RechartsTooltip content={<CustomTooltip />} />
                        <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20}>
                          {zipData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} opacity={0.8} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">Market Density (City)</h4>
                    <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-[9px] font-bold rounded">Concentration Index</span>
                  </div>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <Treemap
                        data={cityData}
                        dataKey="value"
                        aspectRatio={4 / 3}
                        stroke="#fff"
                        fill="#10b981"
                        animationDuration={1500}
                      >
                        <RechartsTooltip content={<CustomTooltip />} />
                      </Treemap>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-50 dark:border-slate-800 grid grid-cols-2 md:grid-cols-4 gap-4">
                 {zipData.slice(0, 4).map((zip, i) => (
                   <div key={i} className="bg-gray-50 dark:bg-slate-800/50 p-3 rounded-xl border border-gray-100 dark:border-slate-800">
                     <p className="text-[9px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1">Priority Zip</p>
                     <div className="flex items-baseline justify-between">
                        <span className="text-sm font-black text-gray-900 dark:text-white">{zip.name}</span>
                        <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">+{zip.value}</span>
                     </div>
                   </div>
                 ))}
              </div>
            </div>
          )}

          {/* Status Distribution */}
          {activeVisual === 'status' && (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm transition-all animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <PieIcon className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">Status Distribution</h3>
                    <p className="text-xs text-gray-500 dark:text-slate-400">Entity status breakdown across all records</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <AdjustHint />
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 dark:bg-slate-800 px-2 py-1 rounded">Entity Status</span>
                </div>
              </div>
              <div className="h-[450px] md:h-[500px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={isMobile ? 60 : 120}
                      outerRadius={isMobile ? 100 : 180}
                      paddingAngle={5}
                      dataKey="value"
                      animationBegin={0}
                      animationDuration={1500}
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Legend
                      verticalAlign="bottom"
                      iconType="circle"
                      formatter={(value) => <span className="text-sm text-gray-600 dark:text-slate-400 font-medium">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Records per Category */}
          {activeVisual === 'categories' && (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm transition-all animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                    <BarChart3 className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">Records per Category</h3>
                    <p className="text-xs text-gray-500 dark:text-slate-400">Data source volume distribution</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <AdjustHint />
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 dark:bg-slate-800 px-2 py-1 rounded">Data Source</span>
                </div>
              </div>
              <div className="h-[500px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryData} layout="vertical" margin={{ left: 60, right: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                    <XAxis type="number" hide />
                    <YAxis
                      dataKey="name"
                      type="category"
                      width={120}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#64748b', fontSize: 13, fontWeight: 500 }}
                    />
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Bar
                      dataKey="value"
                      fill="#10b981"
                      radius={[0, 6, 6, 0]}
                      barSize={32}
                      animationBegin={500}
                      animationDuration={1500}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 0 ? '#3b82f6' : '#10b981'} opacity={0.8} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Market Share Analysis Section */}
          {activeVisual === 'market-share' && (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm transition-all animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div className="flex items-center space-x-3 flex-1">
                  <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">UCC Market Share Analysis</h3>
                    <p className="text-xs text-gray-500 dark:text-slate-400">Top Reverse Entities (Banks/Lenders) from Last 90 Days</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <AdjustHint />
                  <div className="flex bg-gray-100 dark:bg-slate-800 p-1 rounded-lg">
                    <button
                      onClick={() => setMarketShareChartType('bar')}
                      className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                        marketShareChartType === 'bar'
                          ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                          : 'text-gray-500 hover:text-gray-700 dark:text-slate-500 dark:hover:text-slate-300'
                      }`}
                    >
                      <BarChart3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setMarketShareChartType('pie')}
                      className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                        marketShareChartType === 'pie'
                          ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                          : 'text-gray-500 hover:text-gray-700 dark:text-slate-500 dark:hover:text-slate-300'
                      }`}
                    >
                      <PieIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                    <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mr-2">Unique Entities:</span>
                    <span className="text-sm font-black text-blue-700 dark:text-blue-300">{uniqueReverseNames.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="h-[550px] md:h-[500px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  {marketShareChartType === 'bar' ? (
                    <BarChart data={marketShareData} margin={{ top: 20, right: 30, left: 20, bottom: isMobile ? 120 : 100 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                      <XAxis
                        dataKey="name"
                        angle={-45}
                        textAnchor="end"
                        interval={0}
                        height={isMobile ? 120 : 100}
                        tick={{ fill: '#64748b', fontSize: isMobile ? 10 : 12, fontWeight: 500 }}
                      />
                      <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                      <RechartsTooltip content={<CustomTooltip />} />
                      <Bar
                        dataKey="value"
                        fill="#3b82f6"
                        radius={[4, 4, 0, 0]}
                        animationBegin={0}
                        animationDuration={1500}
                      >
                        {marketShareData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} opacity={0.9} />
                        ))}
                      </Bar>
                    </BarChart>
                  ) : (
                    <PieChart>
                      <Pie
                        data={marketShareData}
                        cx="50%"
                        cy="45%"
                        innerRadius={isMobile ? 60 : 120}
                        outerRadius={isMobile ? 100 : 200}
                        paddingAngle={5}
                        dataKey="value"
                        animationBegin={0}
                        animationDuration={1500}
                        label={isMobile ? false : ({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {marketShareData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip content={<CustomTooltip />} />
                      <Legend
                        verticalAlign="bottom"
                        iconType="circle"
                        formatter={(value) => <span className="text-xs text-gray-600 dark:text-slate-400 font-medium">{value}</span>}
                      />
                    </PieChart>
                  )}
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Filing Activity Trends */}
          {activeVisual === 'trends' && (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm transition-all animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                    <Activity className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">UCC Filing Activity Trends</h3>
                    <p className="text-xs text-gray-500 dark:text-slate-400">Daily filing volume over the last 90 days</p>
                  </div>
                </div>
                <AdjustHint />
              </div>
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={filingVelocityData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: '#64748b', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: '#64748b', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="count" stroke="#10b981" fillOpacity={1} fill="url(#colorCount)" strokeWidth={3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Document Type Distribution */}
          {activeVisual === 'docs' && (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm transition-all animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <FileText className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">Document Type Distribution</h3>
                    <p className="text-xs text-gray-500 dark:text-slate-400">Common filing types breakdown</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <AdjustHint />
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 dark:bg-slate-800 px-2 py-1 rounded">Filing Types</span>
                </div>
              </div>
              <div className="h-[500px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={docTypeData} layout="vertical" margin={{ left: 60, right: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                    <XAxis type="number" hide />
                    <YAxis
                      dataKey="name"
                      type="category"
                      width={180}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#64748b', fontSize: 13, fontWeight: 500 }}
                    />
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" fill="#3b82f6" radius={[0, 6, 6, 0]} barSize={32}>
                      {docTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} opacity={0.8} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Corporate Structure Analysis */}
          {activeVisual === 'structure' && (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm transition-all animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                    <Building2 className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">Corporate Structure Analysis</h3>
                    <p className="text-xs text-gray-500 dark:text-slate-400">Entity types and organizational breakdown</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <AdjustHint />
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 dark:bg-slate-800 px-2 py-1 rounded">Entity Types</span>
                </div>
              </div>
              <div className="h-[500px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={entityTypeData}
                      cx="50%"
                      cy="50%"
                      innerRadius={isMobile ? 60 : 120}
                      outerRadius={isMobile ? 100 : 180}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {entityTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Legend
                      verticalAlign="bottom"
                      iconType="circle"
                      formatter={(value) => <span className="text-sm text-gray-600 dark:text-slate-400 font-medium">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-gray-100 dark:border-slate-800 flex items-start space-x-4">
             <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg text-blue-600 dark:text-blue-400">
                <Database className="w-6 h-6" />
             </div>
             <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-1">Data Density</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">High</p>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">Optimal client-side indexing active.</p>
             </div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-gray-100 dark:border-slate-800 flex items-start space-x-4">
             <div className="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-lg text-emerald-600 dark:text-emerald-400">
                <TrendingUp className="w-6 h-6" />
             </div>
             <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-1">Analysis Mode</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">Active</p>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">Real-time data synchronization.</p>
             </div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-gray-100 dark:border-slate-800 flex items-start space-x-4">
             <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg text-amber-600 dark:text-amber-400">
                <Users className="w-6 h-6" />
             </div>
             <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-1">Coverage</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">100%</p>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">Full dataset indexed for search.</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
