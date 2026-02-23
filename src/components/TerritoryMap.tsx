import React, { useMemo, useState } from 'react';
import { MapPin, TrendingUp, Users, Target, ChevronRight, Layers, Maximize2, Filter, Search, Plus, Minus, Navigation } from 'lucide-react';

interface TerritoryMapProps {
  data: any[];
  onSelectZip: (zip: string) => void;
}

export const TerritoryMap: React.FC<TerritoryMapProps> = ({ data, onSelectZip }) => {
  const [viewMode, setViewMode] = useState<'volume' | 'growth'>('volume');
  const [hoveredZip, setHoveredZip] = useState<string | null>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Key Zip Codes from the data
  const ZIP_CODES = ['33027', '33301', '33401', '33480', '33431', '33444', '33020', '33131'];

  const stats = useMemo(() => {
    const counts: Record<string, { volume: number, growth: number, avgScore: number, totalScore: number }> = {};

    ZIP_CODES.forEach(zip => {
      counts[zip] = { volume: 0, growth: 0, avgScore: 0, totalScore: 0 };
    });

    data.forEach(row => {
      const zip = row._zip || row.Zip || row.ZIP;
      if (counts[zip]) {
        counts[zip].volume++;
        counts[zip].totalScore += (row.Score || 0);
        if (row._type === 'Last 90 Days' || row['Record Date'] || row['Date Filed']) {
          counts[zip].growth++;
        }
      }
    });

    ZIP_CODES.forEach(zip => {
      if (counts[zip].volume > 0) {
        counts[zip].avgScore = Math.round(counts[zip].totalScore / counts[zip].volume);
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

    if (ratio > 0.8) return 'fill-blue-600/80 dark:fill-blue-500/80';
    if (ratio > 0.5) return 'fill-blue-400/80 dark:fill-blue-400/80';
    if (ratio > 0.2) return 'fill-blue-200/80 dark:fill-blue-300/80';
    return 'fill-blue-100/80 dark:fill-blue-900/30';
  };

  // Geometric boundaries using straight lines (Polygons)
  // Zoomed out coordinate space: 0-1000 width, 0-1200 height
  const ZIP_PATHS = [
    {
      id: '33480',
      name: 'Palm Beach',
      path: 'M 820 100 L 835 100 L 845 250 L 830 250 Z',
      x: 832, y: 175
    },
    {
      id: '33401',
      name: 'West Palm Beach',
      path: 'M 710 110 L 810 105 L 810 240 L 710 240 Z',
      x: 760, y: 175
    },
    {
      id: '33444',
      name: 'Delray Beach',
      path: 'M 700 260 L 800 260 L 805 340 L 695 340 Z',
      x: 750, y: 300
    },
    {
      id: '33431',
      name: 'Boca Raton',
      path: 'M 705 360 L 805 360 L 810 460 L 700 460 Z',
      x: 755, y: 410
    },
    {
      id: '33301',
      name: 'Fort Lauderdale',
      path: 'M 715 480 L 815 480 L 820 580 L 710 580 Z',
      x: 765, y: 530
    },
    {
      id: '33020',
      name: 'Hollywood',
      path: 'M 700 600 L 800 600 L 805 720 L 695 720 Z',
      x: 750, y: 660
    },
    {
      id: '33027',
      name: 'Miramar',
      path: 'M 580 750 L 700 750 L 705 880 L 575 880 Z',
      x: 640, y: 815
    },
    {
      id: '33131',
      name: 'Miami (Brickell)',
      path: 'M 650 920 L 750 920 L 755 1050 L 645 1050 Z',
      x: 700, y: 985
    },
  ];

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    const touch = e.touches[0];
    setDragStart({ x: touch.clientX - pan.x, y: touch.clientY - pan.y });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    setPan({
      x: touch.clientX - dragStart.x,
      y: touch.clientY - dragStart.y
    });
  };

  return (
    <div
      className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-950 overflow-hidden relative"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleMouseUp}
    >
      {/* Map Control Overlay */}
      <div className="absolute top-6 left-6 z-20 space-y-4">
        <div className="bg-white dark:bg-slate-900 p-1.5 rounded-2xl shadow-xl border border-gray-200 dark:border-slate-800 flex items-center space-x-2 w-72">
           <div className="p-2 text-gray-400">
             <Search className="w-4 h-4" />
           </div>
           <input
             type="text"
             placeholder="Search territory or zip..."
             className="bg-transparent text-sm font-medium outline-none w-full dark:text-white"
           />
           <div className="p-2 text-blue-600 bg-blue-50 dark:bg-blue-900/30 rounded-xl cursor-pointer">
             <Filter className="w-4 h-4" />
           </div>
        </div>

        <div className="flex flex-col space-y-2">
           <button className="p-3 bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-gray-100 dark:border-slate-800 text-gray-600 dark:text-slate-400 hover:text-blue-600 transition-all">
             <Plus className="w-5 h-5" />
           </button>
           <button className="p-3 bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-gray-100 dark:border-slate-800 text-gray-600 dark:text-slate-400 hover:text-blue-600 transition-all">
             <Minus className="w-5 h-5" />
           </button>
           <button className="p-3 bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-gray-100 dark:border-slate-800 text-gray-600 dark:text-slate-400 hover:text-blue-600 transition-all">
             <Navigation className="w-5 h-5" />
           </button>
        </div>
      </div>

      {/* Header Overlay (Right) */}
      <div className="absolute top-6 right-6 z-20 flex flex-col items-end space-y-4">
        <div className="flex items-center space-x-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-1 rounded-2xl shadow-xl border border-gray-200 dark:border-slate-800">
          <button
            onClick={() => setViewMode('volume')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center ${
              viewMode === 'volume'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                : 'text-gray-500 hover:text-gray-700 dark:text-slate-500'
            }`}
          >
            <Users className="w-3.5 h-3.5 mr-2" />
            Total Volume
          </button>
          <button
            onClick={() => setViewMode('growth')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center ${
              viewMode === 'growth'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                : 'text-gray-500 hover:text-gray-700 dark:text-slate-500'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 mr-2" />
            Growth Index
          </button>
        </div>
      </div>

      {/* Main Map Content */}
      <div
        className="flex-1 relative bg-[#f8f5f0] dark:bg-slate-950 overflow-hidden cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        {/* Background Street Grid Style */}
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none" style={{
          backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          backgroundPosition: `${pan.x}px ${pan.y}px`
        }}></div>

        <div
          className="relative w-full h-full flex items-center justify-center transition-transform duration-75"
          style={{ transform: `translate(${pan.x}px, ${pan.y}px)` }}
        >
          <svg viewBox="0 0 1000 1200" className="w-full h-full max-h-[95vh] drop-shadow-2xl">
            {/* Intra-coastal Waterway (Background) */}
            <path
              d="M 820 0 L 840 300 L 825 600 L 835 1200 L 1000 1200 L 1000 0 Z"
              className="fill-blue-50/80 dark:fill-blue-900/10"
            />

            {/* Main Land Mass with straight-line boundaries */}
            <path
              d="M 0 0 L 820 0 L 840 300 L 825 600 L 835 1200 L 0 1200 Z"
              className="fill-white dark:fill-slate-900 stroke-slate-200 dark:stroke-slate-800 stroke-1"
            />

            {/* Detailed Ocean / Water Texture */}
            <path
              d="M 850 0 L 870 400 L 855 800 L 865 1200 L 1000 1200 L 1000 0 Z"
              className="fill-blue-100/40 dark:fill-blue-900/20 stroke-blue-200/20 dark:stroke-blue-800/20 stroke-2"
            />

            {/* Major Highways (I-95) - Double line style */}
            <path
              d="M 780 0 L 805 300 L 790 600 L 800 1200"
              className="stroke-slate-200 dark:stroke-slate-800 stroke-[5] opacity-50"
              fill="none"
            />
            <path
              d="M 780 0 L 805 300 L 790 600 L 800 1200"
              className="stroke-amber-400/40 dark:stroke-amber-500/20 stroke-[2.5]"
              fill="none"
            />

            {/* Florida Turnpike - Dashed primary road */}
            <path
              d="M 650 0 L 680 400 L 610 800 L 620 1200"
              className="stroke-slate-300 dark:stroke-slate-700 stroke-[1.5]"
              fill="none"
              strokeDasharray="6 3"
            />

            {/* City POI Markers & Labels */}
            <g className="opacity-40">
              <circle cx="700" cy="175" r="4" className="fill-slate-400 dark:fill-slate-600" />
              <text x="690" y="180" textAnchor="end" className="fill-slate-500 dark:fill-slate-500 text-[10px] font-black uppercase tracking-widest">W. Palm Beach</text>

              <circle cx="690" cy="300" r="4" className="fill-slate-400 dark:fill-slate-600" />
              <text x="680" y="305" textAnchor="end" className="fill-slate-500 dark:fill-slate-500 text-[10px] font-black uppercase tracking-widest">Delray Beach</text>

              <circle cx="695" cy="410" r="4" className="fill-slate-400 dark:fill-slate-600" />
              <text x="685" y="415" textAnchor="end" className="fill-slate-500 dark:fill-slate-500 text-[10px] font-black uppercase tracking-widest">Boca Raton</text>

              <circle cx="700" cy="530" r="4" className="fill-slate-400 dark:fill-slate-600" />
              <text x="690" y="535" textAnchor="end" className="fill-slate-500 dark:fill-slate-500 text-[10px] font-black uppercase tracking-widest">Ft. Lauderdale</text>

              <circle cx="685" cy="660" r="4" className="fill-slate-400 dark:fill-slate-600" />
              <text x="675" y="665" textAnchor="end" className="fill-slate-500 dark:fill-slate-500 text-[10px] font-black uppercase tracking-widest">Hollywood</text>

              <circle cx="570" cy="815" r="4" className="fill-slate-400 dark:fill-slate-600" />
              <text x="560" y="820" textAnchor="end" className="fill-slate-500 dark:fill-slate-500 text-[10px] font-black uppercase tracking-widest">Miramar</text>

              <circle cx="630" cy="985" r="4" className="fill-slate-400 dark:fill-slate-600" />
              <text x="620" y="990" textAnchor="end" className="fill-slate-500 dark:fill-slate-500 text-[10px] font-black uppercase tracking-widest">Miami</text>
            </g>

            {/* Zip Polygons with high-fidelity paths */}
            {ZIP_PATHS.map((zip) => (
              <g
                key={zip.id}
                onMouseEnter={() => setHoveredZip(zip.id)}
                onMouseLeave={() => setHoveredZip(null)}
                onClick={() => onSelectZip(zip.id)}
                className="cursor-pointer transition-all duration-500 group"
              >
                {/* Glow/Shadow effect for active/hovered */}
                <path
                  d={zip.path}
                  className={`transition-all duration-500 ${hoveredZip === zip.id ? 'fill-blue-500/20 blur-sm' : 'fill-transparent'}`}
                />

                {/* Main Polygon */}
                <path
                  d={zip.path}
                  className={`${getZipColor(zip.id)} stroke-blue-600/40 dark:stroke-blue-400/40 stroke-2 group-hover:stroke-blue-600 group-hover:stroke-[3] transition-all duration-300 drop-shadow-md`}
                />

                {/* Zip Label Badge Style */}
                <g className={`transition-all duration-300 ${hoveredZip === zip.id ? 'translate-y-[-2px]' : ''}`}>
                  <rect
                    x={zip.x - 22}
                    y={zip.y - 12}
                    width="44"
                    height="18"
                    rx="9"
                    className="fill-white/90 dark:fill-slate-800/90 stroke-slate-200 dark:stroke-slate-700 stroke-1 shadow-sm"
                  />
                  <text
                    x={zip.x}
                    y={zip.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="fill-slate-900 dark:fill-slate-100 font-black text-[10px] pointer-events-none"
                  >
                    {zip.id}
                  </text>
                </g>
              </g>
            ))}
          </svg>

          {/* Hover Tooltip Overlay (Map Style) */}
          {hoveredZip && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[120%] bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-800 w-64 animate-in zoom-in-95 duration-200 z-30">
              <div className="absolute bottom-[-8px] left-1/2 -translate-x-1/2 w-4 h-4 bg-white dark:bg-slate-900 border-r border-b border-gray-100 dark:border-slate-800 rotate-45"></div>

              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center text-white mr-3 shadow-lg shadow-blue-500/20">
                    <Navigation className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-gray-900 dark:text-white block">{ZIP_PATHS.find(z => z.id === hoveredZip)?.name}</span>
                    <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">{hoveredZip}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="p-2 bg-gray-50 dark:bg-slate-800 rounded-xl">
                  <span className="text-[9px] text-gray-400 uppercase font-bold block mb-1">Vol</span>
                  <span className="text-sm font-black text-gray-900 dark:text-white">{stats[hoveredZip]?.volume.toLocaleString()}</span>
                </div>
                <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                  <span className="text-[9px] text-emerald-600 uppercase font-bold block mb-1">New</span>
                  <span className="text-sm font-black text-emerald-600">+{stats[hoveredZip]?.growth}</span>
                </div>
                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                  <span className="text-[9px] text-blue-600 uppercase font-bold block mb-1">Score</span>
                  <span className="text-sm font-black text-blue-600">{stats[hoveredZip]?.avgScore}</span>
                </div>
              </div>

              <button
                onClick={() => onSelectZip(hoveredZip)}
                className="w-full py-2 bg-gray-900 dark:bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-gray-800 dark:hover:bg-blue-700 transition-colors flex items-center justify-center"
              >
                Go to Hub <ChevronRight className="w-3 h-3 ml-1" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Floating Insights Panel */}
      <div className="absolute bottom-6 right-6 z-20 w-80 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-3xl shadow-2xl border border-gray-100 dark:border-slate-800 p-6 hidden lg:block">
          <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400 mb-4">
              <Target className="w-5 h-5" />
              <h4 className="text-xs font-black uppercase tracking-[0.2em]">Market Intelligence</h4>
          </div>

          <div className="space-y-3 mb-6 max-h-48 overflow-y-auto pr-2 no-scrollbar">
            {ZIP_PATHS.map(zip => (
              <div
                key={zip.id}
                onClick={() => onSelectZip(zip.id)}
                className="flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center">
                  <div className={`w-2 h-2 rounded-full mr-3 ${stats[zip.id]?.volume > maxVolume * 0.7 ? 'bg-blue-600' : 'bg-slate-300'}`} />
                  <span className="text-[11px] font-bold text-gray-600 dark:text-slate-400 group-hover:text-blue-600 transition-colors">{zip.name}</span>
                </div>
                <span className="text-[11px] font-black text-gray-900 dark:text-white">{stats[zip.id]?.volume || 0}</span>
              </div>
            ))}
          </div>

          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-900/30">
            <div className="flex items-center space-x-2 text-blue-800 dark:text-blue-400 mb-1">
              <Layers className="w-3.5 h-3.5" />
              <span className="text-[10px] font-black uppercase tracking-widest">Active Territory</span>
            </div>
            <p className="text-[10px] leading-relaxed text-blue-700 dark:text-blue-400 font-medium">
              Zip code <b>33480 (Palm Beach)</b> is showing significant high-intent growth in the last 30 days.
            </p>
          </div>
      </div>

      {/* Map Legend (Bottom Left) */}
      <div className="absolute bottom-6 left-6 z-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-3 rounded-2xl border border-gray-100 dark:border-slate-800">
         <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1.5">
               <div className="w-2.5 h-2.5 bg-blue-600 rounded-sm" />
               <span className="text-[9px] font-bold text-gray-500 uppercase">High</span>
            </div>
            <div className="flex items-center space-x-1.5">
               <div className="w-2.5 h-2.5 bg-blue-400 rounded-sm" />
               <span className="text-[9px] font-bold text-gray-500 uppercase">Mid</span>
            </div>
            <div className="flex items-center space-x-1.5">
               <div className="w-2.5 h-2.5 bg-blue-200 rounded-sm" />
               <span className="text-[9px] font-bold text-gray-500 uppercase">Low</span>
            </div>
         </div>
      </div>
    </div>
  );
};
