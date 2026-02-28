import React, { useState, useMemo, useEffect } from 'react';
import {
  Zap, Mail, Phone, MessageSquare, Save, Trash2,
  Plus, ChevronRight, Target, Clock, Filter, Search,
  CheckCircle2, AlertCircle, Sparkles, FileText, Edit3,
  ChevronLeft, Layout, BookOpen, Lightbulb, Package, MessageCircle, ArrowLeft,
  Building2, HardHat, TrendingUp, Calendar, Info
} from 'lucide-react';
import { BusinessLead, LeadStatus, LeadType } from '../types';
import { Modal, Input } from './ui';
import { OutreachTemplate, getStoredTemplates, replacePlaceholders } from '../lib/outreachUtils';
import { generateLeadIntelligence, refineOutreachTone, OutreachTone, OutreachMode, getProductBenefitSnippet } from '../lib/aiUtils';
import { getInsightForCategory } from '../lib/industryKnowledge';
import { getAllProducts, getProductPoints } from '../lib/productData';
import { getScoreDetails } from '../lib/scoring';

interface ActionHubProps {
  leads: BusinessLead[];
  onSelectLead: (lead: BusinessLead) => void;
  onUpdateLeads: (leads: BusinessLead[]) => void;
  onAddCallLog?: (entry: any) => void;
  onAddEmailLog?: (entry: any) => void;
  onAddMeetingLog?: (entry: any) => void;
}

export const ActionHub: React.FC<ActionHubProps> = ({ leads, onSelectLead, onUpdateLeads }) => {
  const [templates, setTemplates] = useState<OutreachTemplate[]>(() => getStoredTemplates());
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<OutreachTemplate | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(templates[0]?.id || '');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [activeTone, setActiveTone] = useState<OutreachTone>('professional');
  const [activeMode, setActiveMode] = useState<OutreachMode>('intro');
  const [customDraft, setCustomDraft] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    localStorage.setItem('outreach_templates', JSON.stringify(templates));
  }, [templates]);

  const hotLeads = useMemo(() => {
    return leads
      .filter(l => l.status === LeadStatus.NEW || l.type === LeadType.PROSPECT)
      .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime())
      .slice(0, 10);
  }, [leads]);

  const selectedLead = useMemo(() =>
    hotLeads.find(l => l.id === selectedLeadId) || hotLeads[0] || null,
  [hotLeads, selectedLeadId]);

  const intelligence = useMemo(() => {
    if (!selectedLead) return null;
    const intel = generateLeadIntelligence(selectedLead, selectedLead.preferredTheme || 'growth', activeMode);
    if (activeTone !== 'professional') {
      intel.email = refineOutreachTone(intel.email, activeTone);
    }
    return intel;
  }, [selectedLead, activeTone, activeMode]);

  const scoreDetails = useMemo(() => {
    if (!selectedLead) return null;
    return getScoreDetails(selectedLead);
  }, [selectedLead]);

  const industryInsight = useMemo(() => {
    if (!selectedLead) return null;
    return getInsightForCategory(selectedLead.industry || '');
  }, [selectedLead]);

  const combinedTemplates = useMemo(() => {
    const baseTemplates = [...templates];
    if (selectedLead?.savedScripts) {
      const savedAsTemplates: OutreachTemplate[] = selectedLead.savedScripts.map(script => ({
        id: script.id,
        name: `⭐ ${script.name}`,
        subject: script.content.split('\n')[0].replace('Subject: ', ''),
        body: script.content,
        category: 'Email'
      }));
      return [...savedAsTemplates, ...baseTemplates];
    }
    return baseTemplates;
  }, [templates, selectedLead]);

  useEffect(() => {
    if (combinedTemplates.length > 0 && !combinedTemplates.find(t => t.id === selectedTemplateId)) {
      setSelectedTemplateId(combinedTemplates[0].id);
    }
  }, [combinedTemplates, selectedTemplateId]);

  const currentTemplate = useMemo(() =>
    combinedTemplates.find(t => t.id === selectedTemplateId),
  [combinedTemplates, selectedTemplateId]);

  const saveTemplate = (template: OutreachTemplate) => {
    if (editingTemplate?.id) {
      setTemplates(prev => prev.map(t => t.id === template.id ? template : t));
    } else {
      setTemplates(prev => [...prev, { ...template, id: `temp-${Date.now()}` }]);
    }
    setIsTemplateModalOpen(false);
    setEditingTemplate(null);
  };

  const handleCopyAndLog = () => {
    if (!selectedLead || !currentTemplate) return;
    const text = customDraft || replacePlaceholders(currentTemplate.body, selectedLead);
    navigator.clipboard.writeText(text);

    const newActivity: LeadActivity = {
      id: `act-${Date.now()}`,
      type: 'Email',
      date: new Date().toISOString(),
      notes: `Outreach email sent using template: ${currentTemplate.name}`
    };

    const updatedLeads = leads.map(l =>
      l.id === selectedLead.id
        ? {
            ...l,
            status: LeadStatus.CONTACTED,
            lastUpdated: new Date().toISOString(),
            activities: [newActivity, ...(l.activities || [])]
          }
        : l
    );
    onUpdateLeads(updatedLeads);

    onAddEmailLog?.({
      timeSent: newActivity.date,
      client: selectedLead.businessName,
      subject: replacePlaceholders(currentTemplate.subject, selectedLead),
      emailType: 'Outreach',
      responseReceived: false,
      nextStep: 'Wait for response'
    });
  };

  const handleLogCall = () => {
    if (!selectedLead) return;

    const newActivity: LeadActivity = {
      id: `act-${Date.now()}`,
      type: 'Call',
      date: new Date().toISOString(),
      notes: 'Outbound call logged from Action Hub'
    };

    const updatedLeads = leads.map(l =>
      l.id === selectedLead.id
        ? {
            ...l,
            lastUpdated: new Date().toISOString(),
            activities: [newActivity, ...(l.activities || [])]
          }
        : l
    );
    onUpdateLeads(updatedLeads);

    onAddCallLog?.({
      time: newActivity.date,
      client: selectedLead.businessName,
      contact: selectedLead.keyPrincipal || 'N/A',
      callType: 'Outbound',
      outcome: 'Logged',
      nextAction: 'Follow up',
      followUpDate: ''
    });
  };

  const handleLogMeeting = () => {
    if (!selectedLead) return;

    const newActivity: LeadActivity = {
      id: `act-${Date.now()}`,
      type: 'Appointment',
      date: new Date().toISOString(),
      notes: 'Appointment scheduled via Action Hub'
    };

    const updatedLeads = leads.map(l =>
      l.id === selectedLead.id
        ? {
            ...l,
            status: LeadStatus.APPOINTMENT_SET,
            lastUpdated: new Date().toISOString(),
            activities: [newActivity, ...(l.activities || [])]
          }
        : l
    );
    onUpdateLeads(updatedLeads);

    onAddMeetingLog?.({
      time: newActivity.date,
      client: selectedLead.businessName,
      attendees: selectedLead.keyPrincipal || 'Owner',
      meetingType: 'Intro Call',
      summary: 'Initial meeting scheduled',
      outcome: 'Scheduled',
      nextAction: 'Prepare materials',
      followUpDate: ''
    });
  };

  const handleThemeChange = (theme: 'growth' | 'efficiency' | 'security') => {
    if (!selectedLead) return;
    const updatedLeads = leads.map(l =>
      l.id === selectedLead.id
        ? { ...l, preferredTheme: theme, lastUpdated: new Date().toISOString() }
        : l
    );
    onUpdateLeads(updatedLeads);
    setCustomDraft(null); // Reset draft when strategy pivots
  };

  const injectProductBenefit = (productName: string) => {
    if (!selectedLead) return;
    const benefit = getProductBenefitSnippet(productName);
    const currentText = customDraft || (intelligence?.email || '');

    // Logic to inject before the closing or after the first paragraph
    const paragraphs = currentText.split('\n\n');
    if (paragraphs.length >= 2) {
      paragraphs.splice(2, 0, benefit);
      setCustomDraft(paragraphs.join('\n\n'));
    } else {
      setCustomDraft(currentText + '\n\n' + benefit);
    }
    setSelectedProduct(null);
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-50 dark:bg-slate-950 overflow-hidden h-full">
      {/* Header */}
      <div className="p-4 md:p-6 border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {isMobile && selectedLeadId && (
               <button
                 onClick={() => setSelectedLeadId(null)}
                 className="p-2 -ml-2 text-gray-400 hover:text-blue-600 transition-colors"
               >
                 <ArrowLeft className="w-5 h-5" />
               </button>
            )}
            <div className="p-2.5 bg-blue-600 rounded-xl shadow-lg shadow-blue-500/20">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-black text-gray-900 dark:text-white tracking-tight">
                Action Hub
              </h2>
              <p className="text-xs md:text-sm text-gray-500 dark:text-slate-400">Transform high-priority leads into active appointments</p>
            </div>
          </div>
          {!isMobile && (
            <button
              onClick={() => {
                setEditingTemplate(null);
                setIsTemplateModalOpen(true);
              }}
              className="flex items-center space-x-2 px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-bold text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-750 transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Create Template</span>
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Hot Leads Queue */}
        <div className={`${isMobile && selectedLeadId ? 'hidden' : 'flex'} w-full lg:w-80 xl:w-96 border-r border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col overflow-hidden`}>
          <div className="p-4 border-b border-gray-50 dark:border-slate-800 flex items-center justify-between bg-gray-50/50 dark:bg-slate-800/50">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center">
              <Clock className="w-3 h-3 mr-1.5" />
              Hot Leads Queue
            </span>
            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full">
              {hotLeads.length} NEW
            </span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-gray-50 dark:divide-slate-800">
            {hotLeads.map((lead) => (
              <button
                key={lead.id}
                onClick={() => setSelectedLeadId(lead.id)}
                className={`w-full p-4 text-left transition-all ${
                  selectedLeadId === lead.id
                    ? 'bg-blue-50/50 dark:bg-blue-900/10 border-l-4 border-blue-600'
                    : 'hover:bg-gray-50 dark:hover:bg-slate-800/50 border-l-4 border-transparent'
                }`}
              >
                <div className="flex items-start justify-between mb-1">
                  <h4 className="text-xs font-bold text-gray-900 dark:text-white truncate pr-2">
                    {lead.businessName}
                  </h4>
                  <span className="text-[9px] font-medium text-gray-400 shrink-0">
                    {new Date(lead.lastUpdated).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] text-gray-500 dark:text-slate-400">{lead.industry}</span>
                  <span className="text-[10px] text-gray-300 dark:text-slate-600">•</span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                    lead.status === LeadStatus.NEW ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {lead.status}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Command Center - Side-by-Side on Desktop, Stacked on Mobile/Tablet */}
        <div className={`${isMobile && !selectedLeadId ? 'hidden' : 'flex'} flex-1 flex flex-col bg-gray-50 dark:bg-slate-950 overflow-hidden`}>
          {selectedLead ? (
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
              {/* Left Panel: Strategic Focus & Intelligence */}
              <div className="w-full lg:w-1/2 flex flex-col border-r border-gray-200 dark:border-slate-800 overflow-y-auto p-4 md:p-6 space-y-6">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-3 opacity-5">
                    <BookOpen className="w-16 h-16" />
                  </div>
                  <div className="flex items-center justify-between mb-4 relative z-10">
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center">
                      <Target className="w-4 h-4 mr-2 text-blue-600" />
                      Strategic Focus
                    </h3>
                    <div className="flex bg-gray-100 dark:bg-slate-800 p-1 rounded-xl border border-gray-200 dark:border-slate-700">
                      {(['growth', 'efficiency', 'security'] as const).map((theme) => (
                        <button
                          key={theme}
                          onClick={() => handleThemeChange(theme)}
                          className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-tight transition-all ${
                            (selectedLead.preferredTheme || 'growth') === theme
                              ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm'
                              : 'text-gray-400 hover:text-gray-600 dark:hover:text-slate-300'
                          }`}
                        >
                          {theme}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="prose prose-sm dark:prose-invert max-w-none relative z-10">
                    <div className="text-sm text-gray-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                      {intelligence?.strategy.split('**1. Strategic Focus:**')[1]?.split('**2. Product Bundle:**')[0]?.trim()}
                    </div>
                  </div>

                    {scoreDetails && scoreDetails.insights.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-800">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Priority Insights</label>
                        <div className="flex flex-wrap gap-2">
                          {scoreDetails.insights.map((insight, i) => (
                            <span key={i} className="px-2 py-1 bg-gray-50 dark:bg-slate-800 text-[9px] font-bold text-gray-500 dark:text-slate-400 rounded-lg border border-gray-100 dark:border-slate-700">
                              {insight.label} (+{insight.points})
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                </div>

                  {industryInsight?.authorityBenchmarks && (
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm">
                      <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center mb-4">
                        <TrendingUp className="w-4 h-4 mr-2 text-emerald-500" />
                        Authority Benchmarks
                      </h3>
                      <div className="space-y-4">
                        {industryInsight.authorityBenchmarks.map((bench, i) => (
                          <div key={i} className="flex items-start space-x-3">
                            <div className="mt-1 p-1 bg-emerald-50 dark:bg-emerald-900/20 rounded text-emerald-600">
                              <CheckCircle2 className="w-3 h-3" />
                            </div>
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="text-[10px] font-black text-gray-400 uppercase">{bench.label}</span>
                                <span className="px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold rounded">
                                  {bench.value}
                                </span>
                              </div>
                              <p className="text-xs font-medium text-gray-600 dark:text-slate-400 mt-0.5 leading-relaxed italic">
                                "{bench.insight}"
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4">
                  <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm">
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center mb-3">
                      <Package className="w-3.5 h-3.5 mr-2 text-blue-500" />
                      Recommended Solutions
                    </h3>
                    <div className="space-y-2">
                      {intelligence?.strategy.split('**2. Product Bundle:**')[1]?.split('**3. Discussion Starters:**')[0]?.trim().split('\n').filter(s => s.trim()).map((item, i) => {
                        const productName = item.replace('- ', '').split(':')[0].trim();
                        const masterProduct = getAllProducts().find(p => p.name === productName || productName.includes(p.name));

                        return (
                          <button
                            key={i}
                            onClick={() => setSelectedProduct(masterProduct || { name: productName, summary: 'Recommendation based on industry needs.' })}
                            className="w-full flex items-center justify-between p-2 bg-gray-50 dark:bg-slate-800/50 rounded-lg border border-gray-100 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-900 transition-colors text-left"
                          >
                            <div className="flex items-center space-x-2">
                              <CheckCircle2 className="w-3 h-3 text-green-500 shrink-0" />
                              <span className="text-[11px] font-bold text-gray-700 dark:text-slate-300">{productName}</span>
                            </div>
                            <ChevronRight className="w-3 h-3 text-gray-400" />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm">
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center mb-3">
                      <MessageCircle className="w-3.5 h-3.5 mr-2 text-blue-500" />
                      Discussion Starters
                    </h3>
                    <div className="space-y-2">
                      {intelligence?.strategy.split('**3. Discussion Starters:**')[1]?.trim().split('\n').filter(s => s.trim().startsWith('-')).slice(0, 3).map((starter, i) => (
                        <div key={i} className="p-2.5 bg-blue-50/30 dark:bg-blue-900/10 rounded-lg text-[10px] font-medium text-gray-600 dark:text-slate-400 italic border border-blue-100/30 dark:border-blue-900/20">
                          "{starter.replace('- ', '').replace(/"/g, '')}"
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {industryInsight && (
                  <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white p-6 rounded-2xl shadow-xl shadow-blue-500/10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                      {selectedLead.industry?.includes('Construction') ? <HardHat className="w-12 h-12" /> : <Building2 className="w-12 h-12" />}
                    </div>
                    <div className="flex items-center space-x-2 mb-4">
                      <div className="p-1.5 bg-white/20 rounded-lg">
                        <Info className="w-4 h-4" />
                      </div>
                      <h3 className="text-xs font-black uppercase tracking-widest opacity-90">
                        {selectedLead.industry} Intel
                      </h3>
                    </div>
                    <div className="space-y-4 relative z-10">
                      <p className="text-xs font-medium leading-relaxed opacity-90">
                        {industryInsight.overview}
                      </p>
                      <div className="flex flex-wrap gap-2 pt-2">
                        {industryInsight.quickFacts?.slice(0, 2).map((fact, i) => (
                          <div key={i} className="flex items-center space-x-2 px-3 py-1.5 bg-white/10 rounded-xl text-[10px] font-bold backdrop-blur-sm border border-white/5">
                            <TrendingUp className="w-3 h-3 text-blue-200" />
                            <span>{fact}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Panel: Outreach Composer */}
              <div className="w-full lg:w-1/2 flex flex-col overflow-y-auto p-4 md:p-6 space-y-6">
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-xl overflow-hidden flex flex-col">
                  <div className="p-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between bg-gray-50/50 dark:bg-slate-800/50">
                    <div className="flex flex-col space-y-2">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <Mail className="w-4 h-4 text-blue-600" />
                        </div>
                        <select
                          value={selectedTemplateId}
                          onChange={(e) => setSelectedTemplateId(e.target.value)}
                          className="bg-transparent border-none text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider focus:ring-0 cursor-pointer p-0"
                        >
                          {combinedTemplates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                      </div>
                      <div className="flex bg-gray-100/50 dark:bg-slate-800/50 p-0.5 rounded-lg border border-gray-200 dark:border-slate-700 w-fit">
                        {(['intro', 'discovery', 'followup'] as OutreachMode[]).map((mode) => (
                          <button
                            key={mode}
                            onClick={() => { setActiveMode(mode); setCustomDraft(null); }}
                            className={`px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-tight transition-all ${
                              activeMode === mode
                                ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm'
                                : 'text-gray-400 hover:text-gray-600'
                            }`}
                          >
                            {mode}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => currentTemplate && setEditingTemplate(currentTemplate)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="p-6 border-b border-gray-50 dark:border-slate-800/50">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Subject Line</label>
                    <div className="text-sm font-bold text-gray-900 dark:text-white bg-gray-50 dark:bg-slate-800/50 p-3 rounded-xl border border-gray-100 dark:border-slate-800">
                      {currentTemplate ? replacePlaceholders(currentTemplate.subject, selectedLead) : 'Select a template'}
                    </div>
                  </div>

                  <div className="p-6 md:p-8 font-serif text-sm text-gray-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap min-h-[400px]">
                    {currentTemplate ? (
                      <textarea
                        value={customDraft !== null ? customDraft : replacePlaceholders(currentTemplate.body, selectedLead)}
                        onChange={(e) => setCustomDraft(e.target.value)}
                        className="w-full h-full min-h-[350px] bg-transparent border-none focus:ring-0 p-0 resize-none"
                      />
                    ) : 'Template body will appear here...'}
                  </div>

                  <div className="px-6 py-3 border-t border-gray-50 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Modify Tone</span>
                    <div className="flex space-x-2">
                      {(['professional', 'friendly', 'urgent'] as OutreachTone[]).map((tone) => (
                        <button
                          key={tone}
                          onClick={() => setActiveTone(tone)}
                          className={`px-2 py-1 rounded-md text-[9px] font-bold uppercase transition-all ${
                            activeTone === tone
                              ? 'bg-blue-600 text-white shadow-sm'
                              : 'bg-gray-100 dark:bg-slate-800 text-gray-500 hover:text-gray-700 dark:hover:text-slate-300'
                          }`}
                        >
                          {tone}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 dark:bg-slate-800/50 border-t border-gray-100 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center space-x-6 w-full md:w-auto justify-around md:justify-start">
                      <button
                        onClick={handleLogCall}
                        className="flex flex-col items-center space-y-1 group"
                      >
                        <div className="p-2 bg-white dark:bg-slate-800 rounded-full border border-gray-200 dark:border-slate-700 group-hover:border-blue-500 transition-colors shadow-sm">
                          <Phone className="w-4 h-4 text-gray-500 group-hover:text-blue-600" />
                        </div>
                        <span className="text-[10px] font-bold text-gray-500 group-hover:text-blue-600">Log Call</span>
                      </button>
                      <button
                        onClick={handleLogMeeting}
                        className="flex flex-col items-center space-y-1 group"
                      >
                        <div className="p-2 bg-white dark:bg-slate-800 rounded-full border border-gray-200 dark:border-slate-700 group-hover:border-amber-500 transition-colors shadow-sm">
                          <Calendar className="w-4 h-4 text-gray-500 group-hover:text-amber-600" />
                        </div>
                        <span className="text-[10px] font-bold text-gray-500 group-hover:text-amber-600">Schedule</span>
                      </button>
                    </div>
                    <button
                      onClick={handleCopyAndLog}
                      className="w-full md:w-auto px-8 py-3 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-blue-500/20 hover:bg-blue-700 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Copy & Claim Lead
                    </button>
                  </div>
                </div>

                <div className="bg-amber-50 dark:bg-amber-900/10 rounded-2xl p-4 border border-amber-100 dark:border-amber-900/20 flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-2">
                    <div>
                      <h4 className="text-xs font-black text-amber-800 dark:text-amber-400 uppercase tracking-tight mb-1">Banker Tip</h4>
                      <p className="text-[11px] text-amber-700/80 dark:text-amber-400/80 leading-relaxed font-medium">
                        {selectedLead.industry?.includes('Construction')
                          ? 'Construction clients prioritize speed of funding. Mention our streamlined SBA process to secure the appointment.'
                          : 'Balance strategic relationship building with specific high-point product triggers like SMB Bundle 3 or ACH Positive Pay.'}
                      </p>
                    </div>
                    <div className="pt-2 border-t border-amber-200/50 dark:border-amber-900/30">
                      <p className="text-[10px] text-amber-600 dark:text-amber-500 font-bold italic">
                        Tip: Use the theme selector to pivot the strategy, or 'Edit' to make manual changes to the script.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="p-6 bg-gray-100 dark:bg-slate-800 rounded-full mb-4">
                <Target className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">No Lead Selected</h3>
              <p className="text-sm text-gray-500 dark:text-slate-400 max-w-xs">Select a lead from the queue to start your outreach strategy.</p>
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        title="Product Details"
      >
        <div className="space-y-4">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-600">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-gray-900 dark:text-white leading-tight">{selectedProduct?.name}</h3>
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">
                Potential Value: {getProductPoints(selectedProduct?.name || '')} Points
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Product Summary</label>
              <p className="text-sm text-gray-600 dark:text-slate-400 leading-relaxed">
                {selectedProduct?.summary || selectedProduct?.details || 'Strategically recommended based on business needs and industry benchmarks.'}
              </p>
            </div>

            {selectedProduct?.tiers && (
              <div className="pt-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Benefit Tiers</label>
                <div className="grid grid-cols-1 gap-2">
                  {selectedProduct.tiers.map((tier: any, i: number) => (
                    <div key={i} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-slate-800 rounded-lg text-xs">
                      <span className="font-medium text-gray-600 dark:text-slate-400">{tier.tier}</span>
                      <span className="font-bold text-blue-600">+{tier.points} PTS</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={() => setSelectedProduct(null)}
              className="px-4 py-2 text-xs font-bold text-gray-500 uppercase tracking-widest"
            >
              Cancel
            </button>
            <button
              onClick={() => injectProductBenefit(selectedProduct?.name)}
              className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Smart Inject into Email</span>
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        title={editingTemplate ? "Edit Template" : "New Template"}
      >
        <div className="space-y-4">
          <Input
            label="Template Name"
            value={editingTemplate?.name || ''}
            onChange={(e) => setEditingTemplate(prev => ({ ...prev!, name: e.target.value }))}
            placeholder="e.g. Intro Call Script"
          />
          <Input
            label="Subject (Optional)"
            value={editingTemplate?.subject || ''}
            onChange={(e) => setEditingTemplate(prev => ({ ...prev!, subject: e.target.value }))}
            placeholder="Email subject line..."
          />
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-tight">Body Content</label>
            <textarea
              value={editingTemplate?.body || ''}
              onChange={(e) => setEditingTemplate(prev => ({ ...prev!, body: e.target.value }))}
              className="w-full h-48 p-4 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
              placeholder="Use {{businessName}}, {{contactName}}, {{industry}} for placeholders..."
            />
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button onClick={() => setIsTemplateModalOpen(false)} className="px-4 py-2 text-xs font-bold text-gray-500 uppercase">Cancel</button>
            <button
              onClick={() => editingTemplate && saveTemplate(editingTemplate)}
              className="px-6 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-500/20"
            >
              Save Template
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
