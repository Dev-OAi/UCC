import React, { useState, useEffect } from 'react';
import {
  X, Activity, Package, Phone, Building2, Lightbulb,
  Mail, ChevronRight, Copy, Check, Sparkles, ChevronDown,
  Edit3, Download, Upload, Trash2, Save, Linkedin, ExternalLink,
  CheckCircle2, Clock, ArrowUpRight, AlertCircle, Calendar, Plus,
  ChevronLeft, Loader2, Zap, TrendingUp
} from 'lucide-react';
import { BusinessLead, LeadActivity, LeadStatus, LeadType, ScorecardMetric } from '../types';
import { SalesHooks } from './SalesHooks';
import { getInsightForCategory } from '../lib/industryKnowledge';
import { Modal, Input } from './ui';
import { generateAiManifest, generateLeadIntelligence } from '../lib/aiUtils';
import { getStoredTemplates, replacePlaceholders, autoSelectTemplate } from '../lib/outreachUtils';
import { getScoreDetails } from '../lib/scoring';

interface ScorecardRightSidebarProps {
  selectedLead: BusinessLead | null;
  metrics: ScorecardMetric[];
  onClose: () => void;
  isOpen: boolean;
  onUpdateLead: (lead: BusinessLead) => void;
  onAddCallLog?: (client: string, contact: string) => void;
  onAddEmailLog?: (client: string, subject: string) => void;
  onAddMeetingLog?: (client: string, attendees: string) => void;
  width?: number;
  isResizing?: boolean;
  onResizeStart?: (e: React.MouseEvent | React.TouchEvent) => void;
  onToggle?: () => void;
}

type Tab = 'Activity' | 'Products' | 'Sales Hooks' | 'Intro Call' | 'Industry' | 'Strategy' | 'Email';

export const ScorecardRightSidebar: React.FC<ScorecardRightSidebarProps> = ({
  selectedLead, metrics, onClose, isOpen, onUpdateLead,
  onAddCallLog, onAddEmailLog, onAddMeetingLog,
  width, isResizing, onResizeStart, onToggle
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('Sales Hooks');
  const [isAiMenuOpen, setIsAiMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [editingActivityId, setEditingActivityId] = useState<string | null>(null);
  const [editingActivityText, setEditingActivityText] = useState('');
  const [aiCustomPrompt, setAiCustomPrompt] = useState<string | null>(null);
  const [isManifestCopied, setIsManifestCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');

  const templates = React.useMemo(() => getStoredTemplates(), []);

  useEffect(() => {
    if (selectedLead) {
      setSelectedTemplateId(autoSelectTemplate(selectedLead, templates));
    }
  }, [selectedLead, templates]);

  const currentTemplate = templates.find(t => t.id === selectedTemplateId);
  const personalizedBody = selectedLead && currentTemplate ? replacePlaceholders(currentTemplate.body, selectedLead) : '';
  const scoreDetails = selectedLead ? getScoreDetails(selectedLead) : null;

  // Script content states
  const [scripts, setScripts] = useState({
    introCall: '',
    strategy: '',
    email: ''
  });

  useEffect(() => {
    if (selectedLead) {
      setScripts({
        introCall: selectedLead.introScript || getDefaultIntroScript(selectedLead),
        strategy: selectedLead.bundleScript || getDefaultStrategyScript(selectedLead),
        email: selectedLead.emailScript || getDefaultEmailScript(selectedLead)
      });
    }
  }, [selectedLead]);

  if (!selectedLead) return null;

  const handleCopy = () => {
    const content = activeTab === 'Intro Call' ? scripts.introCall :
                    activeTab === 'Strategy' ? scripts.strategy :
                    activeTab === 'Email' ? scripts.email : '';
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openSearch = (type: 'google' | 'linkedin' | 'sunbiz') => {
    let url = '';
    if (type === 'google') url = `https://www.google.com/search?q=${encodeURIComponent(selectedLead.businessName)}`;
    if (type === 'linkedin') url = `https://www.linkedin.com/search/results/all/?keywords=${encodeURIComponent(selectedLead.businessName)}`;
    if (type === 'sunbiz') url = `https://search.sunbiz.org/Inquiry/CorporationSearch/ByName?SearchTerm=${encodeURIComponent(selectedLead.businessName)}`;
    window.open(url, '_blank');
  };

  const handleAiModify = (action: string) => {
    setIsAiMenuOpen(false);

    let modification = action;
    if (action === 'Custom...') {
      setAiCustomPrompt('');
      return;
    }

    applyAiModification(modification);
  };

  const applyAiModification = (modification: string) => {
    // Mocking AI modification
    const prefix = `[AI: ${modification}] `;
    if (activeTab === 'Intro Call') setScripts(s => ({ ...s, introCall: prefix + s.introCall }));
    if (activeTab === 'Strategy') setScripts(s => ({ ...s, strategy: prefix + s.strategy }));
    if (activeTab === 'Email') setScripts(s => ({ ...s, email: prefix + s.email }));
    setAiCustomPrompt(null);
  };

  const handleSave = () => {
    onUpdateLead({
      ...selectedLead,
      introScript: scripts.introCall,
      bundleScript: scripts.strategy,
      emailScript: scripts.email,
      lastUpdated: new Date().toISOString()
    });
    setIsEditing(false);
  };

  const toggleProduct = (productName: string) => {
    const currentProducts = selectedLead.productsSold || [];
    const newProducts = currentProducts.includes(productName)
      ? currentProducts.filter(p => p !== productName)
      : [...currentProducts, productName];

    onUpdateLead({
      ...selectedLead,
      productsSold: newProducts,
      lastUpdated: new Date().toISOString()
    });
  };

  const deleteActivity = (id: string) => {
    if (!selectedLead) return;
    onUpdateLead({
      ...selectedLead,
      activities: (selectedLead.activities || []).filter(a => a.id !== id),
      lastUpdated: new Date().toISOString()
    });
  };

  const startEditingActivity = (act: LeadActivity) => {
    setEditingActivityId(act.id);
    setEditingActivityText(act.notes);
  };

  const saveActivityEdit = () => {
    if (!selectedLead || !editingActivityId) return;
    onUpdateLead({
      ...selectedLead,
      activities: (selectedLead.activities || []).map(a =>
        a.id === editingActivityId ? { ...a, notes: editingActivityText } : a
      ),
      lastUpdated: new Date().toISOString()
    });
    setEditingActivityId(null);
  };

  const copyAiManifest = () => {
    if (!selectedLead) return;
    const manifest = generateAiManifest(selectedLead);
    navigator.clipboard.writeText(manifest);
    setIsManifestCopied(true);
    setTimeout(() => setIsManifestCopied(false), 3000);
  };

  const handleGenerateIntelligence = () => {
    if (!selectedLead) return;
    setIsGenerating(true);

    // Simulate generation delay
    setTimeout(() => {
      const { strategy, email } = generateLeadIntelligence(selectedLead);
      setScripts(prev => ({
        ...prev,
        strategy: strategy,
        email: email
      }));
      setIsGenerating(false);
    }, 800);
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 dark:bg-black/60 z-40 lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      <aside
        style={{ width: isOpen ? `${width}px` : '0px' }}
        className={`
          fixed inset-y-0 right-0 bg-white dark:bg-slate-900 flex flex-col h-full shrink-0 z-50 overflow-visible
          ${isResizing ? '' : 'transition-all duration-300 ease-in-out'}
          ${isOpen ? 'translate-x-0 border-l border-gray-200 dark:border-slate-800 shadow-2xl' : 'translate-x-0 border-none'}
        `}
      >
        {/* Resize Handle */}
        <div
          onMouseDown={onResizeStart}
          onTouchStart={onResizeStart}
          className={`absolute left-0 top-0 bottom-0 w-1.5 cursor-col-resize z-50 group hover:bg-blue-500/30 transition-colors ${isResizing ? 'bg-blue-500/30' : ''} pointer-events-auto`}
        >
           {/* Blue Node */}
           <button
             onClick={(e) => {
               e.stopPropagation();
               onToggle?.();
             }}
             className="absolute left-[-12px] top-24 w-6 h-12 bg-blue-600 hover:bg-blue-700 rounded-l-xl shadow-lg flex items-center justify-center text-white transition-transform hover:scale-105"
             aria-label={isOpen ? "Close Sidebar" : "Open Sidebar"}
           >
             {isOpen ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
           </button>
        </div>

        <div className={`flex-1 flex flex-col h-full overflow-hidden transition-opacity duration-300 ${!isOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        {/* Header */}
        <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{selectedLead.businessName}</h2>
            <div className="flex items-center space-x-2 mt-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{selectedLead.industry || 'Unknown Sector'}</span>
              <span className="text-slate-300">|</span>
              <div className="flex items-center text-blue-600 dark:text-blue-400">
                <span className="text-[10px] font-black uppercase tracking-widest">{selectedLead.type}</span>
                <ChevronDown className="w-3 h-3 ml-1" />
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => openSearch('linkedin')}
              className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 transition-colors"
              title="Search LinkedIn"
            >
               <Linkedin className="w-4 h-4" />
            </button>
            <button
              onClick={() => openSearch('sunbiz')}
              className="p-2 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-lg hover:bg-amber-100 transition-colors"
              title="Search Sunbiz"
            >
               <Building2 className="w-4 h-4" />
            </button>
            <button
              onClick={copyAiManifest}
              className={`p-2 rounded-lg transition-all flex items-center space-x-2 ${
                isManifestCopied
                  ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20'
                  : 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 hover:bg-purple-100'
              }`}
              title="Export Context for AI Agent"
            >
               {isManifestCopied ? <Check className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
               <span className="text-[10px] font-black uppercase tracking-wider hidden sm:inline">
                 {isManifestCopied ? 'Manifest Copied' : 'AI Agent Ready'}
               </span>
            </button>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-800">
          <div className="flex items-center space-x-1 overflow-x-auto no-scrollbar">
            {(['Activity', 'Products', 'Sales Hooks', 'Intro Call', 'Industry', 'Strategy', 'Email'] as Tab[]).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                  activeTab === tab
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Priority Insights */}
          {scoreDetails && (
            <section className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-4 border border-blue-100 dark:border-blue-900/30 mb-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-900 dark:text-blue-100">Priority Insights</h4>
                </div>
                <span className="px-2 py-1 bg-blue-600 text-white text-[10px] font-black rounded-lg">
                  {scoreDetails.total} PTS
                </span>
              </div>
              <div className="space-y-2">
                {scoreDetails.insights.map((insight, i) => (
                  <div key={i} className="flex items-center justify-between text-[11px]">
                    <span className="text-blue-800 dark:text-blue-300 font-medium tracking-tight">• {insight.label}</span>
                    <span className="text-blue-600 dark:text-blue-400 font-bold">+{insight.points}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {activeTab === 'Sales Hooks' ? (
            <SalesHooks leadData={selectedLead} />
          ) : ['Intro Call', 'Strategy', 'Email'].includes(activeTab) ? (
            <div className="space-y-4 h-full flex flex-col">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleGenerateIntelligence}
                    disabled={isGenerating}
                    className="flex items-center space-x-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-blue-700 transition-all disabled:opacity-50"
                  >
                    {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                    <span>{isGenerating ? 'Generating...' : 'Generate Intelligence'}</span>
                  </button>

                  <div className="relative">
                    <button
                      onClick={() => setIsAiMenuOpen(!isAiMenuOpen)}
                      className="flex items-center space-x-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-blue-100 transition-all border border-blue-100 dark:border-blue-900/30"
                    >
                      <Zap className="w-3 h-3" />
                      <span>Refine</span>
                      <ChevronDown className="w-3 h-3" />
                    </button>

                  {isAiMenuOpen && (
                    <div className="absolute left-0 top-full mt-2 w-40 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 z-50 py-1">
                      {['Rephrase', 'Shorten', 'Elaborate', 'More Formal', 'More Casual', 'Custom...'].map(opt => (
                        <button
                          key={opt}
                          onClick={() => handleAiModify(opt)}
                          className="w-full text-left px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}
                  </div>
                </div>

                <div className="flex items-center space-x-1">
                  <button onClick={handleCopy} className="p-2 text-slate-400 hover:text-blue-600 transition-colors" title="Copy">
                    {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <button className="p-2 text-slate-400 hover:text-blue-600 transition-colors" title="Download">
                    <Download className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-slate-400 hover:text-blue-600 transition-colors" title="Share">
                    <Upload className="w-4 h-4" />
                  </button>
                  <button onClick={() => setIsEditing(!isEditing)} className={`p-2 transition-colors ${isEditing ? 'text-blue-600' : 'text-slate-400 hover:text-blue-600'}`} title="Edit">
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex-1 min-h-[300px] relative">
                {isEditing ? (
                  <textarea
                    value={activeTab === 'Intro Call' ? scripts.introCall : activeTab === 'Strategy' ? scripts.strategy : scripts.email}
                    onChange={(e) => setScripts(s => ({
                      ...s,
                      [activeTab === 'Intro Call' ? 'introCall' : activeTab === 'Strategy' ? 'strategy' : 'email']: e.target.value
                    }))}
                    className="w-full h-full p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 font-serif text-sm text-slate-800 dark:text-slate-200 resize-none focus:ring-2 focus:ring-blue-500/20 outline-none"
                  />
                ) : (
                  <div className="w-full h-full p-8 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700 font-serif text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {activeTab === 'Intro Call' ? scripts.introCall : activeTab === 'Strategy' ? scripts.strategy : scripts.email}
                  </div>
                )}

                {isEditing && (
                  <button
                    onClick={handleSave}
                    className="absolute bottom-4 right-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold shadow-lg shadow-blue-500/20 flex items-center space-x-2"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Template</span>
                  </button>
                )}
              </div>
              <p className="text-[10px] text-center text-slate-400 italic">
                Tip: Use 'Edit' to make manual changes or 'Modify with AI' to change tone.
              </p>
            </div>
          ) : activeTab === 'Industry' ? (
            <div className="space-y-6">
              {getInsightForCategory(selectedLead.industry || '') ? (
                <>
                  <div className="bg-blue-50 dark:bg-blue-900/10 p-6 rounded-2xl border border-blue-100 dark:border-blue-900/30">
                    <div className="flex items-center justify-between mb-4">
                       <div className="flex items-center text-blue-800 dark:text-blue-400">
                          <Building2 className="w-5 h-5 mr-2" />
                          <span className="text-xs font-black uppercase tracking-wider">Industry Intelligence</span>
                       </div>
                       <span className="text-[9px] font-bold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded uppercase">VerticalIQ</span>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                       {getInsightForCategory(selectedLead.industry || '')?.overview}
                    </p>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Key Industry Facts</h4>
                    {getInsightForCategory(selectedLead.industry || '')?.quickFacts?.map((fact, i) => (
                      <div key={i} className="flex items-start space-x-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
                        <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                        <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">{fact}</p>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="bg-slate-50 dark:bg-slate-800/50 p-8 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 text-center">
                   <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                   <p className="text-xs font-bold text-slate-500 mb-1">No Industry Deep-Dive Available</p>
                   <p className="text-[10px] text-slate-400 uppercase tracking-widest">Searching VerticalIQ for {selectedLead.industry || 'this sector'}...</p>
                </div>
              )}
            </div>
          ) : activeTab === 'Activity' ? (
            <div className="space-y-6">
               {/* Instant Action Section */}
               <div className="bg-blue-50 dark:bg-blue-900/10 rounded-2xl p-5 border border-blue-100 dark:border-blue-900/20 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-blue-800 dark:text-blue-400">
                      <Zap className="w-4 h-4 mr-2 fill-blue-600" />
                      <span className="text-[11px] font-black uppercase tracking-wider">Instant Outreach</span>
                    </div>
                    <select
                      value={selectedTemplateId}
                      onChange={(e) => setSelectedTemplateId(e.target.value)}
                      className="bg-transparent text-[10px] font-bold text-blue-600 dark:text-blue-400 outline-none cursor-pointer"
                    >
                      {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed italic line-clamp-3">
                    "{personalizedBody}"
                  </p>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(personalizedBody);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);

                      const newActivity: LeadActivity = {
                        id: Math.random().toString(36).substr(2, 9),
                        type: 'Email',
                        date: new Date().toISOString(),
                        notes: `Sent outreach using template: ${currentTemplate?.name}`
                      };
                      onUpdateLead({
                        ...selectedLead,
                        status: LeadStatus.CONTACTED,
                        activities: [newActivity, ...(selectedLead.activities || [])],
                        lastUpdated: new Date().toISOString()
                      });
                      onAddEmailLog?.(selectedLead.businessName, currentTemplate?.subject || 'Outreach');
                    }}
                    className="w-full flex items-center justify-center py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-black rounded-xl shadow-lg shadow-blue-500/20 transition-all uppercase tracking-widest"
                  >
                    <Copy className="w-3.5 h-3.5 mr-2" />
                    {copied ? 'Copied & Logged!' : 'Copy & Log Outreach'}
                  </button>
               </div>

               <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recent Activities</h4>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => {
                        const newActivity: LeadActivity = {
                          id: (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : Math.random().toString(36).substr(2, 9),
                          type: 'Appointment',
                          date: new Date().toISOString(),
                          notes: 'Initial meeting scheduled via scorecard.'
                        };
                        onUpdateLead({
                          ...selectedLead,
                          status: LeadStatus.APPOINTMENT_SET,
                          activities: [newActivity, ...(selectedLead.activities || [])],
                          lastUpdated: new Date().toISOString()
                        });
                        onAddMeetingLog?.(selectedLead.businessName, selectedLead.keyPrincipal || 'TBD');
                        setEditingActivityId(newActivity.id);
                        setEditingActivityText(newActivity.notes);
                      }}
                      className="text-[10px] font-black text-emerald-600 uppercase tracking-widest hover:underline flex items-center"
                    >
                      <Calendar className="w-3 h-3 mr-1" />
                      Schedule Meeting
                    </button>
                    <button
                      onClick={() => {
                        const newActivity: LeadActivity = {
                          id: (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : Math.random().toString(36).substr(2, 9),
                          type: 'Call',
                          date: new Date().toISOString(),
                          notes: 'New call recorded.'
                        };
                        onUpdateLead({
                          ...selectedLead,
                          activities: [newActivity, ...(selectedLead.activities || [])],
                          lastUpdated: new Date().toISOString()
                        });
                        onAddCallLog?.(selectedLead.businessName, selectedLead.keyPrincipal || 'TBD');
                        setEditingActivityId(newActivity.id);
                        setEditingActivityText(newActivity.notes);
                      }}
                      className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline flex items-center"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Log Action
                    </button>
                  </div>
               </div>

               {(selectedLead.activities || []).length > 0 ? (
                 <div className="space-y-4">
                   {(selectedLead.activities || []).map(act => (
                     <div key={act.id} className="group p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700 transition-all hover:border-blue-200 dark:hover:border-blue-900/50">
                        <div className="flex justify-between mb-2">
                           <div className="flex items-center space-x-2">
                             <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${
                               act.type === 'Call' ? 'bg-blue-100 text-blue-700' :
                               act.type === 'Email' ? 'bg-amber-100 text-amber-700' :
                               'bg-emerald-100 text-emerald-700'
                             }`}>
                               {act.type}
                             </span>
                             <span className="text-[10px] text-slate-400">{new Date(act.date).toLocaleDateString()}</span>
                           </div>
                           <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                             {editingActivityId === act.id ? (
                               <button
                                 onClick={saveActivityEdit}
                                 className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                               >
                                 <Check className="w-3 h-3" />
                               </button>
                             ) : (
                               <button
                                 onClick={() => startEditingActivity(act)}
                                 className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                               >
                                 <Edit3 className="w-3 h-3" />
                               </button>
                             )}
                             <button
                               onClick={() => deleteActivity(act.id)}
                               className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                             >
                               <Trash2 className="w-3 h-3" />
                             </button>
                           </div>
                        </div>
                        {editingActivityId === act.id ? (
                          <textarea
                            autoFocus
                            value={editingActivityText}
                            onChange={(e) => setEditingActivityText(e.target.value)}
                            onBlur={saveActivityEdit}
                            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && saveActivityEdit()}
                            className="w-full p-2 text-xs bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-800 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none resize-none"
                            rows={3}
                          />
                        ) : (
                          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{act.notes}</p>
                        )}
                     </div>
                   ))}
                 </div>
               ) : (
                 <div className="text-center py-12">
                    <Clock className="w-8 h-8 text-slate-200 mx-auto mb-3" />
                    <p className="text-xs font-bold text-slate-400">No activity recorded yet.</p>
                 </div>
               )}
            </div>
          ) : (
            <div className="space-y-6">
               <div className="flex items-center justify-between">
                 <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Scorecard Tracked Products</h4>
                 <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full uppercase">
                   {selectedLead.productsSold?.length || 0} Assigned
                 </span>
               </div>
               <div className="space-y-3">
                  {metrics.filter(m => m.type === 'product').length > 0 ? (
                    metrics.filter(m => m.type === 'product').map((m, i) => {
                      const isAssigned = selectedLead.productsSold?.includes(m.name);
                      return (
                        <button
                          key={m.id}
                          onClick={() => toggleProduct(m.name)}
                          className={`w-full text-left p-4 rounded-2xl border transition-all group ${
                            isAssigned
                              ? 'bg-blue-600 border-blue-600 shadow-lg shadow-blue-500/20'
                              : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-blue-500'
                          }`}
                        >
                           <div className="flex items-center justify-between mb-1">
                              <p className={`text-xs font-black ${isAssigned ? 'text-white' : 'text-slate-900 dark:text-white'}`}>{m.name}</p>
                              {isAssigned ? (
                                <Check className="w-4 h-4 text-white" />
                              ) : (
                                <ArrowUpRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-500 transition-colors" />
                              )}
                           </div>
                           <p className={`text-[10px] ${isAssigned ? 'text-blue-100' : 'text-slate-500 dark:text-slate-400'}`}>
                             Tracked Metric: Target {m.target}
                           </p>
                        </button>
                      );
                    })
                  ) : (
                    <p className="text-[10px] text-slate-400 italic text-center py-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                      No custom products added to scorecard yet. Use the 'Customize' button in the main scorecard view.
                    </p>
                  )}
               </div>

               <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                 <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Recommended Solutions</h4>
                 <div className="space-y-3">
                    {[
                      { name: 'Business Platinum Checking', benefit: 'Higher transaction limits for growing firms.' },
                      { name: 'Treasury Management Bundle', benefit: 'Advanced fraud protection & ACH controls.' },
                      { name: 'Business Credit Card', benefit: '1.5% cash back on all operational spend.' }
                    ].map((prod, i) => {
                      const isAssigned = selectedLead.productsSold?.includes(prod.name);
                      if (metrics.some(m => m.name === prod.name)) return null; // Don't duplicate if already in scorecard

                      return (
                        <button
                          key={i}
                          onClick={() => toggleProduct(prod.name)}
                          className={`w-full text-left p-4 rounded-2xl border transition-all group ${
                            isAssigned
                              ? 'bg-blue-600 border-blue-600 shadow-lg shadow-blue-500/20'
                              : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-blue-500'
                          }`}
                        >
                           <div className="flex items-center justify-between mb-1">
                              <p className={`text-xs font-black ${isAssigned ? 'text-white' : 'text-slate-900 dark:text-white'}`}>{prod.name}</p>
                              {isAssigned ? (
                                <Check className="w-4 h-4 text-white" />
                              ) : (
                                <ArrowUpRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-500 transition-colors" />
                              )}
                           </div>
                           <p className={`text-[10px] ${isAssigned ? 'text-blue-100' : 'text-slate-500 dark:text-slate-400'}`}>{prod.benefit}</p>
                        </button>
                      );
                    })}
                 </div>
               </div>
               <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                  <p className="text-[10px] text-slate-400 text-center font-medium italic">
                    Cross-sell opportunities identified based on industry benchmarks.
                  </p>
               </div>
            </div>
          )}
        </div>
        </div>
      </aside>

      <Modal
        isOpen={aiCustomPrompt !== null}
        onClose={() => setAiCustomPrompt(null)}
        title="Custom AI Modification"
        footer={
          <div className="flex justify-end space-x-3">
            <button onClick={() => setAiCustomPrompt(null)} className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 uppercase tracking-widest transition-colors">Cancel</button>
            <button
              onClick={() => aiCustomPrompt && applyAiModification(aiCustomPrompt)}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all uppercase tracking-widest"
              disabled={!aiCustomPrompt}
            >
              Apply Changes
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">What would you like the AI to do?</p>
          <Input
            value={aiCustomPrompt || ''}
            onChange={(e) => setAiCustomPrompt(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-4 focus:ring-blue-500/10 outline-none transition-all dark:text-white"
            placeholder="e.g., 'Add more enthusiasm', 'Focus on fraud protection'"
            autoFocus
          />
        </div>
      </Modal>
    </>
  );
};

// Helper functions for default scripts
function getDefaultIntroScript(lead: BusinessLead) {
  return `### 📞 The Script: 5-Step Framework

**Objective:** Schedule a 'Business Financial Check-up' to discuss Efficiency & Protection.

#### Step 1: The "Expert" Introduction
"Good morning/afternoon, [Contact Name], my name is [My Name] and I'm a Business Banker with [Bank Name]. I work proactively with business owners like yourself, especially those in the ${lead.industry || 'local business'} space, to help them streamline operations and safeguard their finances. I was particularly impressed by the name '${lead.businessName}' – it speaks volumes about the quality and protection you offer."

#### Step 2: The Hook (Value/Efficiency)
"I'm reaching out because I work with a lot of ${lead.industry || 'similar'} firms, and I know that managing **inconsistent cash flow** and **protecting against payment fraud** are major headaches right now."`;
}

function getDefaultStrategyScript(lead: BusinessLead) {
  return `### 🎯 Pre-Call Strategy: Industry Expertise

*Assuming "${lead.businessName}" operates in the ${lead.industry || 'general business'} sector.*

1. **Fluctuating Project Cash Flow:** Managing the unpredictable nature of business cycles can create cash flow gaps, especially between milestone payments.
2. **Payment Fraud & Security:** Protecting against fraudulent checks, ACH debits, or credit card chargebacks is critical, given the potential for high-value transactions.
3. **Inefficient Payment Collection & Processing:** Delays or manual processes in collecting payments from customers can tie up working capital and reduce operational efficiency.`;
}

function getDefaultEmailScript(lead: BusinessLead) {
  return `Subject: Strategic Financial Efficiency for ${lead.businessName}

Dear [Contact Name],

As ${lead.businessName} continues to grow, navigating the complexities of operational efficiency and financial security becomes increasingly vital.

I've worked with many organizations in the ${lead.industry || 'same'} industry to optimize their cash flow and implement robust fraud protection measures. I'd love to share how [Bank Name]'s specialized business solutions could support your current goals.

Would you be open to a brief 5-minute conversation next week?

Best regards,

[My Name]
[Bank Name] | Business Banker`;
}
