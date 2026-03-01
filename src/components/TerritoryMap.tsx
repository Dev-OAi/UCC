import React, { useMemo, useState, useEffect, useRef } from 'react';
import { MapPin, TrendingUp, Users, Target, ChevronRight, Layers, Maximize2, Filter, Search, Plus, Minus, Navigation, Lock, Unlock } from 'lucide-react';

interface TerritoryMapProps {
  data: any[];
  onSelectZip: (zip: string) => void;
}

export const TerritoryMap: React.FC<TerritoryMapProps> = ({ data, onSelectZip }) => {
  const [viewMode, setViewMode] = useState<'volume' | 'growth'>('volume');
  const [hoveredZip, setHoveredZip] = useState<string | null>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1.1);
  const [isDragging, setIsDragging] = useState(false);
  const [isLocked, setIsLocked] = useState(true);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isIntelligenceOpen, setIsIntelligenceOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const centerMap = () => {
    if (containerRef.current) {
      const { width, height } = containerRef.current.getBoundingClientRect();
      // Center on Boca Raton (755, 410)
      const targetX = 755;
      const targetY = 410;
      setPan({
        x: (width / 2) - (targetX * scale),
        y: (height / 2) - (targetY * scale)
      });
    }
  };

  useEffect(() => {
    centerMap();
    window.addEventListener('resize', centerMap);
    return () => window.removeEventListener('resize', centerMap);
  }, [scale]);

  // Key Zip Codes from the data
  const ZIP_CODES = ['33408', '33027', '33301', '33401', '33480', '33431', '33444', '33020', '33131'];

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
      id: '33408',
      name: 'PGA (North Palm Beach)',
      path: 'M 702 15 L 812 10 C 815 40, 818 70, 815 100 L 705 105 L 702 15',
      x: 758, y: 55
    },
    {
      id: '33480',
      name: 'Palm Beach',
      path: 'M 822 95 C 830 95, 835 150, 842 245 C 838 255, 830 252, 825 248 L 822 95',
      x: 832, y: 175
    },
    {
      id: '33401',
      name: 'West Palm Beach',
      path: 'M 705 105 L 815 100 C 818 150, 815 200, 812 245 L 708 248 L 705 105',
      x: 760, y: 175
    },
    {
      id: '33444',
      name: 'Delray Beach',
      path: 'M 698 265 L 802 262 C 805 300, 808 330, 802 345 L 692 342 L 698 265',
      x: 750, y: 300
    },
    {
      id: '33431',
      name: 'Boca Raton',
      path: 'M 702 365 L 808 362 C 812 400, 815 440, 805 465 L 695 462 L 702 365',
      x: 755, y: 410
    },
    {
      id: '33301',
      name: 'Fort Lauderdale',
      path: 'M 712 485 L 818 482 C 822 530, 825 560, 815 585 L 705 582 L 712 485',
      x: 765, y: 530
    },
    {
      id: '33020',
      name: 'Hollywood',
      path: 'M 695 605 L 805 602 C 808 650, 810 700, 802 725 L 690 722 L 695 605',
      x: 750, y: 660
    },
    {
      id: '33027',
      name: 'Miramar',
      path: 'M 575 755 L 705 752 C 708 810, 712 860, 702 885 L 570 882 L 575 755',
      x: 640, y: 815
    },
    {
      id: '33131',
      name: 'Miami (Brickell)',
      path: 'M 645 925 L 755 922 C 758 980, 762 1030, 752 1055 L 640 1052 L 645 925',
      x: 700, y: 985
    },
  ];

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isLocked) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || isLocked) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isLocked) return;
    setIsDragging(true);
    const touch = e.touches[0];
    setDragStart({ x: touch.clientX - pan.x, y: touch.clientY - pan.y });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || isLocked) return;
    if (e.cancelable) e.preventDefault();
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
      {/* Search & Filter (Top Left) */}
      <div className="absolute top-4 md:top-6 left-4 md:left-6 z-20">
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-1.5 rounded-2xl shadow-xl border border-gray-200 dark:border-slate-800 flex items-center space-x-2 w-44 md:w-56 lg:w-72 transition-all duration-300">
           <div className="p-2 text-gray-400 shrink-0">
             <Search className="w-4 h-4" />
           </div>
           <input
             type="text"
             placeholder="Search territory or zip..."
             className="bg-transparent text-sm font-medium outline-none w-full dark:text-white"
           />
           <div className="p-2 text-blue-600 bg-blue-50 dark:bg-blue-900/30 rounded-xl cursor-pointer shrink-0">
             <Filter className="w-4 h-4" />
           </div>
        </div>
      </div>

      {/* Header Toggles (Top Right) */}
      <div className="absolute top-4 md:top-6 right-4 md:right-6 z-20">
        <div className="flex items-center space-x-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-1 rounded-2xl shadow-xl border border-gray-200 dark:border-slate-800 transition-all duration-300">
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
        ref={containerRef}
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
          className="relative transition-transform duration-75"
          style={{
            width: '1000px',
            height: '1200px',
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
            transformOrigin: '0 0'
          }}
        >
          <svg viewBox="0 0 1000 1200" className="w-full h-full drop-shadow-2xl pointer-events-auto">
            {/* Intra-coastal Waterway (Background) */}
            <path
              d="M 820 0 L 840 300 L 825 600 L 835 1200 L 1000 1200 L 1000 0 Z"
              className="fill-[#e3f2fd] dark:fill-blue-900/20"
            />

            {/* Main Land Mass with straight-line boundaries */}
            <path
              d="M 0 0 L 820 0 L 840 300 L 825 600 L 835 1200 L 0 1200 Z"
              className="fill-[#f5f5f1] dark:fill-slate-900 stroke-slate-300 dark:stroke-slate-800 stroke-1"
            />

            {/* Detailed Ocean / Water Texture */}
            <path
              d="M 850 0 L 870 400 L 855 800 L 865 1200 L 1000 1200 L 1000 0 Z"
              className="fill-[#aadaff] dark:fill-blue-800/40 stroke-blue-300/30 dark:stroke-blue-700/30 stroke-2"
            />

            {/* Major Highways (I-95) - Double line style */}
            <path
              d="M 780 0 L 805 300 L 790 600 L 800 1200"
              className="stroke-[#ffffff] dark:stroke-slate-800 stroke-[6] opacity-80"
              fill="none"
            />
            <path
              d="M 780 0 L 805 300 L 790 600 L 800 1200"
              className="stroke-[#f9d89c] dark:stroke-amber-900/40 stroke-[3]"
              fill="none"
            />

            {/* Florida Turnpike - Dashed primary road */}
            <path
              d="M 650 0 L 680 400 L 610 800 L 620 1200"
              className="stroke-[#ffffff] dark:stroke-slate-700 stroke-[4] opacity-60"
              fill="none"
            />
            <path
              d="M 650 0 L 680 400 L 610 800 L 620 1200"
              className="stroke-[#d1d1d1] dark:stroke-slate-600 stroke-[1.5]"
              fill="none"
              strokeDasharray="8 4"
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

        </div>

        {/* Hover Tooltip Overlay (Map Style) - Moved outside scaled div to stay centered in viewport */}
        {hoveredZip && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[120%] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-3 md:p-4 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-800 w-56 md:w-64 animate-in zoom-in-95 duration-200 z-30 pointer-events-auto">
            <div className="absolute bottom-[-8px] left-1/2 -translate-x-1/2 w-4 h-4 bg-white dark:bg-slate-900 border-r border-b border-gray-100 dark:border-slate-800 rotate-45"></div>

            <div className="flex items-center justify-between mb-2 md:mb-3">
              <div className="flex items-center">
                <div className="w-7 h-7 md:w-8 md:h-8 bg-blue-600 rounded-xl flex items-center justify-center text-white mr-3 shadow-lg shadow-blue-500/20">
                  <Navigation className="w-3.5 h-3.5 md:w-4 md:h-4" />
                </div>
                <div>
                  <span className="text-[11px] md:text-xs font-black text-gray-900 dark:text-white block">{ZIP_PATHS.find(z => z.id === hoveredZip)?.name}</span>
                  <span className="text-[9px] md:text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">{hoveredZip}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-1.5 md:gap-2 mb-3 md:mb-4">
              <div className="p-1.5 md:p-2 bg-gray-50 dark:bg-slate-800 rounded-xl">
                <span className="text-[8px] md:text-[9px] text-gray-400 uppercase font-bold block mb-0.5 md:mb-1">Vol</span>
                <span className="text-xs md:text-sm font-black text-gray-900 dark:text-white">{stats[hoveredZip]?.volume.toLocaleString()}</span>
              </div>
              <div className="p-1.5 md:p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                <span className="text-[8px] md:text-[9px] text-emerald-600 uppercase font-bold block mb-0.5 md:mb-1">New</span>
                <span className="text-xs md:text-sm font-black text-emerald-600">+{stats[hoveredZip]?.growth}</span>
              </div>
              <div className="p-1.5 md:p-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                <span className="text-[8px] md:text-[9px] text-blue-600 uppercase font-bold block mb-0.5 md:mb-1">Score</span>
                <span className="text-xs md:text-sm font-black text-blue-600">{stats[hoveredZip]?.avgScore}</span>
              </div>
            </div>

            <button
              onClick={() => onSelectZip(hoveredZip)}
              className="w-full py-1.5 md:py-2 bg-gray-900 dark:bg-blue-600 text-white rounded-xl text-[11px] md:text-xs font-bold hover:bg-gray-800 dark:hover:bg-blue-700 transition-colors flex items-center justify-center"
            >
              Go to Hub <ChevronRight className="w-2.5 h-2.5 md:w-3 md:h-3 ml-1" />
            </button>
          </div>
        )}
      </div>

      {/* Map Control Cluster (Bottom Right) */}
      <div className="absolute bottom-6 right-6 z-20 flex flex-col items-end space-y-4">
        {/* Zoom Controls */}
        <div className="flex flex-col space-y-2">
           <button
             onClick={() => setIsLocked(!isLocked)}
             className={`p-3 backdrop-blur-md rounded-xl shadow-lg border transition-all ${
               isLocked
                 ? 'bg-blue-600 text-white border-blue-500 shadow-blue-500/20'
                 : 'bg-white/90 dark:bg-slate-900/90 text-gray-600 dark:text-slate-400 border-gray-100 dark:border-slate-800'
             }`}
             title={isLocked ? "Unlock Panning" : "Lock Panning"}
           >
             {isLocked ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
           </button>
           <button
             onClick={() => setScale(s => Math.min(s + 0.2, 3))}
             className="p-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-xl shadow-lg border border-gray-100 dark:border-slate-800 text-gray-600 dark:text-slate-400 hover:text-blue-600 transition-all"
           >
             <Plus className="w-5 h-5" />
           </button>
           <button
             onClick={() => setScale(s => Math.max(s - 0.2, 0.5))}
             className="p-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-xl shadow-lg border border-gray-100 dark:border-slate-800 text-gray-600 dark:text-slate-400 hover:text-blue-600 transition-all"
           >
             <Minus className="w-5 h-5" />
           </button>
           <button
             onClick={() => {
               setScale(1.1);
               centerMap();
             }}
             className="p-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-xl shadow-lg border border-gray-100 dark:border-slate-800 text-gray-600 dark:text-slate-400 hover:text-blue-600 transition-all"
           >
             <Navigation className="w-5 h-5" />
           </button>
        </div>

        {/* Floating Insights Panel (Collapsible) */}
        <div className={`w-72 md:w-80 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-3xl shadow-2xl border border-gray-100 dark:border-slate-800 transition-all duration-500 overflow-hidden ${isIntelligenceOpen ? 'max-h-[500px] p-6' : 'max-h-14 p-4'}`}>
            <div
              className="flex items-center justify-between cursor-pointer group"
              onClick={() => setIsIntelligenceOpen(!isIntelligenceOpen)}
            >
              <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400">
                  <Target className="w-5 h-5" />
                  <h4 className="text-xs font-black uppercase tracking-[0.2em]">Market Intelligence</h4>
              </div>
              <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${isIntelligenceOpen ? 'rotate-90' : ''}`} />
            </div>

            <div className={`mt-6 transition-opacity duration-500 ${isIntelligenceOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
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
        </div>
      </div>

      {/* Map Legend (Bottom Left) */}
      <div className="absolute bottom-6 left-6 z-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-2 md:p-3 rounded-2xl border border-gray-100 dark:border-slate-800">
         <div className="flex items-center space-x-3 md:space-x-4">
            <div className="flex items-center space-x-1 md:space-x-1.5">
               <div className="w-2 h-2 md:w-2.5 md:h-2.5 bg-blue-600 rounded-sm" />
               <span className="text-[8px] md:text-[9px] font-bold text-gray-500 uppercase">High</span>
            </div>
            <div className="flex items-center space-x-1 md:space-x-1.5">
               <div className="w-2 h-2 md:w-2.5 md:h-2.5 bg-blue-400 rounded-sm" />
               <span className="text-[8px] md:text-[9px] font-bold text-gray-500 uppercase">Mid</span>
            </div>
            <div className="flex items-center space-x-1 md:space-x-1.5">
               <div className="w-2 h-2 md:w-2.5 md:h-2.5 bg-blue-200 rounded-sm" />
               <span className="text-[8px] md:text-[9px] font-bold text-gray-500 uppercase">Low</span>
            </div>
         </div>
      </div>
    </div>
  );
};
