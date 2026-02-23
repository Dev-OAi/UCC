import React, { useMemo, useState } from 'react';
import { TrendingUp, Users, Target, ChevronRight, Layers } from 'lucide-react';

interface TerritoryMapProps {
  data: any[];
  onSelectZip: (zip: string) => void;
}

export const TerritoryMap: React.FC<TerritoryMapProps> = ({ data, onSelectZip }) => {
  const [viewMode, setViewMode] = useState<'volume' | 'growth'>('volume');
  const [hoveredZip, setHoveredZip] = useState<string | null>(null);

  // Key Zip Codes from the data
  const ZIP_CODES = ['33027', '33301', '33401', '33480'];

  const stats = useMemo(() => {
    const counts: Record<string, { volume: number, growth: number }> = {};

    ZIP_CODES.forEach(zip => {
      counts[zip] = { volume: 0, growth: 0 };
    });

    data.forEach(row => {
      const zip = row._zip || row.Zip || row.ZIP;
      if (counts[zip]) {
        counts[zip].volume++;
        // Growth logic: if it's in "Last 90 Days" or has a recent date
        if (row._type === 'Last 90 Days' || row['Record Date'] || row['Date Filed']) {
          counts[zip].growth++;
        }
      }
    });

    return counts;
  }, [data]);

  const maxVolume = Math.max(...Object.values(stats).map(s => s.volume), 1);
  const maxGrowth = Math.max(...Object.values(stats).map(s => s.growth), 1);

  const getZipColor = (zip: string) => {
    const s = stats[zip];
    if (!s) return 'fill-gray-100 dark:fill-slate-800';

    const ratio = viewMode === 'volume' ? s.volume / maxVolume : s.growth / maxGrowth;

    if (ratio > 0.8) return 'fill-blue-600 dark:fill-blue-500';
    if (ratio > 0.5) return 'fill-blue-400 dark:fill-blue-400';
    if (ratio > 0.2) return 'fill-blue-200 dark:fill-blue-300';
    return 'fill-blue-100 dark:fill-blue-900/30';
  };

  // Mock SVG paths for the South Florida Zip Polygons
  // Positioned roughly North to South
  const ZIP_PATHS = [
    { id: '33480', name: 'Palm Beach', path: 'M 350 50 L 400 50 L 400 150 L 350 150 Z', x: 375, y: 100 },
    { id: '33401', name: 'West Palm Beach', path: 'M 250 50 L 350 50 L 350 150 L 250 150 Z', x: 300, y: 100 },
    { id: '33301', name: 'Fort Lauderdale', path: 'M 250 150 L 400 150 L 400 250 L 250 250 Z', x: 325, y: 200 },
    { id: '33027', name: 'Miramar', path: 'M 250 250 L 400 250 L 400 350 L 250 350 Z', x: 325, y: 300 },
  ];

  return (
    <div className="flex-1 flex flex-col bg-gray-50 dark:bg-slate-950 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center">
            <Target className="w-6 h-6 mr-2 text-blue-600" />
            Territory Intelligence
          </h2>
          <p className="text-sm text-gray-500 dark:text-slate-400">Interactive geographic heatmap of South Florida markets</p>
        </div>

        <div className="flex items-center space-x-2 bg-gray-100 dark:bg-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setViewMode('volume')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center ${
              viewMode === 'volume'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-500 hover:text-gray-700 dark:text-slate-500'
            }`}
          >
            <Users className="w-3.5 h-3.5 mr-2" />
            Total Volume
          </button>
          <button
            onClick={() => setViewMode('growth')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center ${
              viewMode === 'growth'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-500 hover:text-gray-700 dark:text-slate-500'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 mr-2" />
            Growth Index
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Map Visualization */}
        <div className="flex-1 relative bg-slate-200 dark:bg-slate-900/50 p-8 overflow-hidden">
          {/* Background Street Grid Effect */}
          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
            backgroundImage: 'radial-gradient(#94a3b8 1px, transparent 1px)',
            backgroundSize: '24px 24px'
          }}></div>

          <div className="relative w-full h-full flex items-center justify-center">
            <svg viewBox="0 0 600 450" className="w-full h-full max-w-2xl drop-shadow-2xl">
              {/* Landmass Background */}
              <path
                d="M 200 0 L 500 0 L 500 450 L 200 450 Z"
                className="fill-white dark:fill-slate-800 stroke-slate-300 dark:stroke-slate-700 stroke-2"
              />

              {/* Coastline Line */}
              <path d="M 500 0 L 500 450" className="stroke-blue-400 dark:stroke-blue-600 stroke-4 opacity-30" fill="none" />

              {/* Zip Polygons */}
              {ZIP_PATHS.map((zip) => (
                <g
                  key={zip.id}
                  onMouseEnter={() => setHoveredZip(zip.id)}
                  onMouseLeave={() => setHoveredZip(null)}
                  onClick={() => onSelectZip(zip.id)}
                  className="cursor-pointer transition-all duration-300 group"
                >
                  <path
                    d={zip.path}
                    className={`${getZipColor(zip.id)} stroke-white dark:stroke-slate-900 stroke-2 group-hover:stroke-blue-400 transition-colors`}
                  />
                  {hoveredZip === zip.id && (
                    <text
                      x={zip.x}
                      y={zip.y}
                      textAnchor="middle"
                      className="fill-white font-black text-[12px] pointer-events-none"
                      style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))' }}
                    >
                      {zip.id}
                    </text>
                  )}
                </g>
              ))}

              {/* Highway Indicators */}
              <path d="M 280 0 L 280 450" className="stroke-slate-400 dark:stroke-slate-600 stroke-[0.5] stroke-dash-2" fill="none" />
              <text x="275" y="20" className="fill-slate-400 text-[8px] font-bold">I-95 Corridor</text>
            </svg>

            {/* Hover Tooltip Overlay */}
            {hoveredZip && (
              <div className="absolute top-10 right-10 bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-200 dark:border-slate-700 shadow-xl w-64 animate-in fade-in slide-in-from-right-4 duration-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">{hoveredZip}</span>
                  <div className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 rounded text-[10px] font-bold text-blue-600">
                    {ZIP_PATHS.find(z => z.id === hoveredZip)?.name}
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-end">
                    <span className="text-[10px] text-gray-500 uppercase font-bold">Total Prospects</span>
                    <span className="text-xl font-black text-gray-900 dark:text-white">{stats[hoveredZip]?.volume.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-end">
                    <span className="text-[10px] text-gray-500 uppercase font-bold">Growth Velocity</span>
                    <span className="text-sm font-bold text-emerald-600">+{stats[hoveredZip]?.growth} new</span>
                  </div>
                  <button
                    onClick={() => onSelectZip(hoveredZip)}
                    className="w-full mt-2 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors flex items-center justify-center"
                  >
                    View Hub <ChevronRight className="w-3 h-3 ml-1" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Legend / Sidebar */}
        <div className="w-80 bg-white dark:bg-slate-900 border-l border-gray-200 dark:border-slate-800 p-6 space-y-8 hidden xl:block">
          <div>
            <h4 className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-4">Market Stats</h4>
            <div className="space-y-4">
              {ZIP_PATHS.map(zip => (
                <div
                  key={zip.id}
                  onClick={() => onSelectZip(zip.id)}
                  className="p-3 rounded-xl border border-gray-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-900 cursor-pointer transition-all hover:bg-blue-50/50 dark:hover:bg-blue-900/10 group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-black text-gray-900 dark:text-white">{zip.id}</span>
                    <span className="text-[10px] font-bold text-gray-400 group-hover:text-blue-600 transition-colors">{zip.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 h-1 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 transition-all"
                        style={{ width: `${(stats[zip.id]?.volume / maxVolume) * 100}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-slate-500">{stats[zip.id]?.volume}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-6 border-t border-gray-50 dark:border-slate-800">
            <h4 className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-4">Map Legend</h4>
            <div className="space-y-2">
              <div className="flex items-center text-[10px] font-bold text-gray-500">
                <div className="w-3 h-3 bg-blue-600 rounded mr-2" /> High Concentration
              </div>
              <div className="flex items-center text-[10px] font-bold text-gray-500">
                <div className="w-3 h-3 bg-blue-400 rounded mr-2" /> Moderate Activity
              </div>
              <div className="flex items-center text-[10px] font-bold text-gray-500">
                <div className="w-3 h-3 bg-blue-200 rounded mr-2" /> Emerging Market
              </div>
            </div>
          </div>

          <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-900/30">
            <div className="flex items-center space-x-2 text-amber-600 dark:text-amber-400 mb-2">
              <Layers className="w-4 h-4" />
              <span className="text-xs font-bold">Insights</span>
            </div>
            <p className="text-[10px] leading-relaxed text-amber-700 dark:text-amber-300 font-medium">
              Zip code <b>33480</b> currently shows the highest {viewMode} in the South Florida region.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
