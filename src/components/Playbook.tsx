import React, { useMemo, useState } from 'react';
import {
  Zap, Clock, AlertCircle, Calendar, ArrowRight,
  Target, TrendingUp, Building2, Phone, Globe, Plus, ChevronDown
} from 'lucide-react';
import { DataRow } from '../lib/dataService';
import { BusinessLead } from '../types';

interface PlaybookProps {
  allData: DataRow[];
  hubTypes: string[];
  scorecardLeads: BusinessLead[];
  onSelectLead: (lead: BusinessLead) => void;
  onSelectRow: (row: DataRow) => void;
  onAddToScorecard: (row: DataRow) => void;
}

export const Playbook: React.FC<PlaybookProps> = ({
  allData,
  hubTypes,
  scorecardLeads,
  onSelectLead,
  onSelectRow,
  onAddToScorecard
}) => {
  const [selectedHub, setSelectedHub] = useState('All');

  const { now, sixtyDaysFromNow, sevenDaysAgo } = useMemo(() => {
    const n = new Date();
    const s60 = new Date();
    s60.setDate(n.getDate() + 60);
    const s7 = new Date();
    s7.setDate(n.getDate() - 7);
    return { now: n, sixtyDaysFromNow: s60, sevenDaysAgo: s7 };
  }, []);

  const urgentUcc = useMemo(() => {
    return allData
      .filter(row => {
        if (selectedHub !== 'All' && row._type !== selectedHub) return false;
        const expiryStr = row['Expires'];
        if (!expiryStr || expiryStr === 'N/A') return false;
        const expiryDate = new Date(expiryStr);
        return !isNaN(expiryDate.getTime()) && expiryDate <= sixtyDaysFromNow && expiryDate >= now;
      })
      .sort((a, b) => (b.Score || 0) - (a.Score || 0))
      .slice(0, 10);
  }, [allData, sixtyDaysFromNow, now, selectedHub]);

  const stagnantLeads = useMemo(() => {
    return scorecardLeads
      .filter(lead => {
        const lastUpdated = new Date(lead.lastUpdated);
        return !isNaN(lastUpdated.getTime()) && lastUpdated <= sevenDaysAgo;
      })
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, 10);
  }, [scorecardLeads, sevenDaysAgo]);

  const freshProspects = useMemo(() => {
    const leadNames = new Set(scorecardLeads.map(l => l.businessName.toLowerCase()));
    return allData
      .filter(row => {
        if (selectedHub !== 'All' && row._type !== selectedHub) return false;
        const name = (row['businessName'] || row['Entity Name'] || '').toLowerCase();

        // When 'All' is selected, we include everything to give a true aggregated view
        return name && !leadNames.has(name);
      })
      .sort((a, b) => (b.Score || 0) - (a.Score || 0))
      .slice(0, 10);
  }, [allData, scorecardLeads, selectedHub]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-gray-50 dark:bg-slate-950">
      <div className="px-8 py-6 bg-gradient-to-r from-amber-500 to-orange-600 text-white flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight uppercase">Banker's Playbook</h1>
              <p className="text-[10px] font-bold text-amber-100 uppercase tracking-widest">Automated Next Actions & Priority Opportunities</p>
            </div>
          </div>

          <div className="h-10 w-px bg-white/20" />

          <div className="relative group">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Target className="w-4 h-4 text-amber-100/60" />
            </div>
            <select
              value={selectedHub}
              onChange={(e) => setSelectedHub(e.target.value)}
              className="pl-9 pr-10 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-xl text-sm font-bold text-white appearance-none cursor-pointer transition-all outline-none focus:ring-2 focus:ring-white/30"
            >
              <option value="All" className="text-slate-900 font-medium">All Hubs (Aggregated)</option>
              {hubTypes.filter(t => t !== 'All').map(type => (
                <option key={type} value={type} className="text-slate-900 font-medium">
                  {type} Hub
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
              <ChevronDown className="w-4 h-4 text-amber-100/60" />
            </div>
          </div>
        </div>

        <div className="text-right">
          <p className="text-[10px] font-bold text-amber-100 uppercase tracking-widest">Today's Focus</p>
          <p className="text-sm font-black text-white">{urgentUcc.length + stagnantLeads.length + freshProspects.length} Actions</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 space-y-8">
        {/* Urgent UCC Expirations */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-red-500" />
              <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">Urgent UCC Expirations</h2>
              <span className="px-2 py-0.5 bg-red-100 text-red-600 rounded-full text-[10px] font-bold">Expires Within 60 Days</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {urgentUcc.map((row, i) => (
              <div key={i} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex flex-col">
                    <div className="w-10 h-10 bg-red-50 dark:bg-red-900/20 rounded-xl flex items-center justify-center text-red-600 font-bold text-xs mb-2 relative">
                      {String(row['businessName'] || 'U').charAt(0).toUpperCase()}
                      <div className="absolute -bottom-1 -right-1 px-1 bg-white dark:bg-slate-900 rounded text-[7px] font-black border border-red-100 dark:border-red-900/30 text-red-500">
                        {row._type?.includes('SB') ? 'SB' : row._type?.includes('YP') ? 'YP' : 'UCC'}
                      </div>
                    </div>
                    <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded uppercase">
                      Score: {row.Score}
                    </span>
                  </div>
                  <span className="text-[10px] font-black text-red-500 bg-red-50 px-2 py-1 rounded-lg uppercase tracking-tighter">
                    Exp: {row['Expires']}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate mb-1">{row['businessName']}</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-4">UCC Filing Review Needed</p>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => onSelectRow(row)}
                    className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 text-[10px] font-black text-slate-600 dark:text-slate-400 rounded-lg uppercase tracking-wider hover:bg-slate-100 transition-colors"
                  >
                    Review Details
                  </button>
                  <button
                    onClick={() => onAddToScorecard(row)}
                    className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    title="Add to Scorecard"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            {urgentUcc.length === 0 && (
              <div className="col-span-full py-8 text-center bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                <p className="text-xs text-slate-400 font-medium italic">No urgent UCC expirations found at this time.</p>
              </div>
            )}
          </div>
        </section>

        {/* Stagnant Pipeline Leads */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-amber-500" />
              <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">Follow-Up Required</h2>
              <span className="px-2 py-0.5 bg-amber-100 text-amber-600 rounded-full text-[10px] font-bold">No Activity in 7+ Days</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stagnantLeads.map((lead, i) => (
              <div key={i} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex flex-col">
                    <div className="w-10 h-10 bg-amber-50 dark:bg-amber-900/20 rounded-xl flex items-center justify-center text-amber-600 font-bold text-xs mb-2">
                      {lead.businessName.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded uppercase">
                      Score: {lead.score}
                    </span>
                  </div>
                  <span className="text-[10px] font-black text-amber-500 bg-amber-50 px-2 py-1 rounded-lg uppercase tracking-tighter">
                    Status: {lead.status}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate mb-1">{lead.businessName}</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-4">Last Updated: {new Date(lead.lastUpdated).toLocaleDateString()}</p>
                <button
                  onClick={() => onSelectLead(lead)}
                  className="w-full px-3 py-2 bg-amber-500 text-white text-[10px] font-black rounded-lg uppercase tracking-wider hover:bg-amber-600 transition-colors flex items-center justify-center"
                >
                  Resume Outreach <ArrowRight className="w-3 h-3 ml-2" />
                </button>
              </div>
            ))}
            {stagnantLeads.length === 0 && (
              <div className="col-span-full py-8 text-center bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                <p className="text-xs text-slate-400 font-medium italic">Your pipeline is looking fresh! No stagnant leads.</p>
              </div>
            )}
          </div>
        </section>

        {/* Fresh Prospects */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">New Market Entries</h2>
              <span className="px-2 py-0.5 bg-blue-100 text-blue-600 rounded-full text-[10px] font-bold">Unclaimed Prospects</span>
            </div>
          </div>
          <div className="space-y-3">
            {freshProspects.map((row, i) => (
              <div key={i} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between group hover:border-blue-500 transition-all">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center text-blue-600 text-[10px] font-black shrink-0 uppercase tracking-tighter">
                    {row._type?.includes('SB') ? 'SB' : row._type?.includes('YP') ? 'YP' : 'UCC'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">{row['businessName']}</h3>
                      <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded uppercase shrink-0">
                        {row.Score}
                      </span>
                    </div>
                    <div className="flex items-center space-x-3 mt-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center">
                        <Building2 className="w-3 h-3 mr-1" /> {row['Category'] || 'General'}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center">
                        <Calendar className="w-3 h-3 mr-1" /> Filed: {row['Record Date'] || row['Date Filed'] || 'Recent'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => onSelectRow(row)}
                    className="p-2 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-all"
                    title="View Details"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onAddToScorecard(row)}
                    className="px-4 py-2 bg-blue-600 text-white text-[10px] font-black rounded-lg uppercase tracking-wider shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all"
                  >
                    Claim Lead
                  </button>
                </div>
              </div>
            ))}
            {freshProspects.length === 0 && (
              <div className="py-8 text-center bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                <p className="text-xs text-slate-400 font-medium italic">No new market entries found in the last 90 days.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
