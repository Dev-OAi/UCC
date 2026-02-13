import React, { useMemo } from 'react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend
} from 'recharts';
import { PieChart as PieIcon, BarChart3, TrendingUp, Users, Database } from 'lucide-react';

interface InsightsProps {
  data: any[];
  types: string[];
}

export const Insights: React.FC<InsightsProps> = ({ data, types }) => {
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

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Status Breakdown Pie Chart */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center justify-between mb-8">
              <h3 className="font-bold text-gray-900 dark:text-white flex items-center">
                <PieIcon className="w-4 h-4 mr-2 text-blue-500" />
                Status Distribution
              </h3>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 dark:bg-slate-800 px-2 py-1 rounded">Entity Status</span>
            </div>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={120}
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
                    height={36}
                    iconType="circle"
                    formatter={(value) => <span className="text-xs text-gray-600 dark:text-slate-400 font-medium">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Category Distribution Bar Chart */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm transition-all hover:shadow-md">
             <div className="flex items-center justify-between mb-8">
              <h3 className="font-bold text-gray-900 dark:text-white flex items-center">
                <BarChart3 className="w-4 h-4 mr-2 text-emerald-500" />
                Records per Category
              </h3>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 dark:bg-slate-800 px-2 py-1 rounded">Data Source</span>
            </div>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} layout="vertical" margin={{ left: 40, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={80}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }}
                  />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="value"
                    fill="#10b981"
                    radius={[0, 4, 4, 0]}
                    barSize={24}
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
