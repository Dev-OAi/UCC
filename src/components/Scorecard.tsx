import React, { useState, useMemo } from 'react';
import {
  Target, TrendingUp, Users, Phone, Mail, Calendar,
  ArrowUpRight, Search, Filter, MoreHorizontal,
  ChevronRight, Building2, BadgeCheck, AlertCircle,
  Briefcase, Clock, CheckCircle2, XCircle
} from 'lucide-react';
import { BusinessLead, LeadStatus, LeadType } from '../types';

interface ScorecardProps {
  leads: BusinessLead[];
  setLeads: React.Dispatch<React.SetStateAction<BusinessLead[]>>;
  onSelectLead: (lead: BusinessLead) => void;
  selectedLeadId: string | null;
}

export const Scorecard: React.FC<ScorecardProps> = ({ leads, setLeads, onSelectLead, selectedLeadId }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const metrics = useMemo(() => {
    const meetingsCount = leads.reduce((acc, lead) =>
      acc + lead.activities.filter(a => a.type === 'Appointment').length, 0);

    const outreachCount = leads.reduce((acc, lead) =>
      acc + lead.activities.filter(a => a.type === 'Call' || a.type === 'Email').length, 0);

    return {
      newAccts: leads.filter(l => l.status === LeadStatus.CONVERTED).length,
      cardsSold: leads.filter(l => l.productsSold?.includes('Credit Card')).length,
      meetings: meetingsCount,
      pipelineTotal: leads.length,
      emailsCollected: leads.filter(l => l.email && l.email !== 'N/A').length,
      outreach: outreachCount
    };
  }, [leads]);

  const filteredLeads = leads.filter(lead =>
    lead.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.industry?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const calculateResearchProgress = (lead: BusinessLead) => {
    let score = 0;
    let total = 4;
    if (lead.phone && lead.phone !== 'N/A') score++;
    if (lead.email && lead.email !== 'N/A') score++;
    if (lead.website && lead.website !== 'N/A') score++;
    if (lead.keyPrincipal && lead.keyPrincipal !== 'N/A') score++;
    return (score / total) * 100;
  };

  const updateLeadStatus = (id: string, status: LeadStatus) => {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status, lastUpdated: new Date().toISOString() } : l));
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-gray-50 dark:bg-slate-950">
      {/* Header */}
      <div className="px-8 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Target className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight uppercase">BankerPro <span className="text-blue-400">|</span> Scorecard</h1>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Pipeline</p>
            <p className="text-sm font-black text-blue-400">{leads.length} Businesses</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 space-y-8">
        {/* Goals & Pipeline Section */}
        <section className="space-y-6">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">Q1 2026 Pipeline & Goals</h2>
              <p className="text-slate-500 dark:text-slate-400 font-medium">Focus: Small Business Onboarding & Bundle Solutions.</p>
            </div>
            <button className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center space-x-2">
              <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
              <span>All Leads</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <BadgeCheck className="w-16 h-16 text-blue-600" />
              </div>
              <div className="flex justify-between items-start mb-4">
                <span className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">New Accts</span>
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-full">Target: 50</span>
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-4xl font-black text-slate-900 dark:text-white">{metrics.newAccts}</span>
                <span className="text-slate-400 dark:text-slate-600 font-bold">/ 50</span>
              </div>
              <div className="mt-4 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 transition-all duration-1000" style={{ width: `${(metrics.newAccts / 50) * 100}%` }} />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Briefcase className="w-16 h-16 text-indigo-600" />
              </div>
              <div className="flex justify-between items-start mb-4">
                <span className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Cards Sold</span>
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-0.5 rounded-full">Target: 100</span>
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-4xl font-black text-slate-900 dark:text-white">{metrics.cardsSold}</span>
                <span className="text-slate-400 dark:text-slate-600 font-bold">/ 100</span>
              </div>
              <div className="mt-4 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-600 transition-all duration-1000" style={{ width: `${(metrics.cardsSold / 100) * 100}%` }} />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Users className="w-16 h-16 text-purple-600" />
              </div>
              <div className="flex justify-between items-start mb-4">
                <span className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Meetings (Completed)</span>
                <span className="text-xs font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 px-2 py-0.5 rounded-full">Target: 150</span>
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-4xl font-black text-slate-900 dark:text-white">{metrics.meetings}</span>
                <span className="text-slate-400 dark:text-slate-600 font-bold">/ 150</span>
              </div>
              <div className="mt-4 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-purple-600 transition-all duration-1000" style={{ width: `${(metrics.meetings / 150) * 100}%` }} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center space-x-4">
              <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 dark:text-slate-500">
                <Target className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pipeline Total</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white">{metrics.pipelineTotal}</p>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center space-x-4">
              <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-500">
                <Mail className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Emails Collected</p>
                <p className="text-2xl font-black text-emerald-600 dark:text-emerald-500">{metrics.emailsCollected}</p>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center space-x-4">
              <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/10 rounded-xl flex items-center justify-center text-amber-600 dark:text-amber-500">
                <Phone className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Outreach</p>
                <p className="text-2xl font-black text-amber-600 dark:text-amber-500">{metrics.outreach}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Table Section */}
        <section className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="px-8 py-6 border-b border-slate-50 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">Prospect Pipeline</h3>
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search prospects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500/20 outline-none w-64"
                />
              </div>
              <button className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                <Filter className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-800/30">
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Business Name</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact & Research</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {filteredLeads.map(lead => (
                  <tr
                    key={lead.id}
                    onClick={() => onSelectLead(lead)}
                    className={`group hover:bg-slate-50/80 dark:hover:bg-slate-800/40 cursor-pointer transition-colors ${selectedLeadId === lead.id ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                  >
                    <td className="px-8 py-5">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-xs">
                          {lead.businessName.split(' ').map(n => n[0]).join('').substr(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900 dark:text-white">{lead.businessName}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{lead.industry || 'Unknown Sector'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <select
                        value={lead.status}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => updateLeadStatus(lead.id, e.target.value as LeadStatus)}
                        className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border-none outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer ${
                          lead.status === LeadStatus.NEW ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' :
                          lead.status === LeadStatus.CONTACTED ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400' :
                          lead.status === LeadStatus.CONVERTED ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' :
                          'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                      >
                        {Object.values(LeadStatus).map(status => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-8 py-5">
                      <div className="space-y-2 max-w-[200px]">
                        <div className="flex justify-between text-[10px] font-bold">
                          <span className="text-slate-400 uppercase tracking-widest">
                            {lead.phone && lead.phone !== 'N/A' ? '' : 'No Phone, '}
                            {lead.email && lead.email !== 'N/A' ? '' : 'No Email, '}
                            {calculateResearchProgress(lead) === 100 ? 'Fully Enriched' : 'Missing Info'}
                          </span>
                          <span className="text-slate-600 dark:text-slate-400">{Math.round(calculateResearchProgress(lead))}%</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-500 ${calculateResearchProgress(lead) === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                            style={{ width: `${calculateResearchProgress(lead)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <button className="p-2 text-slate-300 group-hover:text-slate-500 dark:text-slate-600 dark:group-hover:text-slate-400 transition-colors">
                        <MoreHorizontal className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredLeads.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-8 py-12 text-center">
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <AlertCircle className="w-8 h-8 text-slate-300" />
                        <p className="text-sm font-bold text-slate-400">No prospects found in your pipeline.</p>
                        <p className="text-xs text-slate-400">Add businesses from the other hubs to get started.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
};
