import React, { useState, useMemo, useEffect } from 'react';
import {
  Zap, Mail, Phone, MessageSquare, Plus, ChevronRight, Target, Clock,
  CheckCircle2, AlertCircle, Sparkles, FileText, Edit3,
  BookOpen, Package, MessageCircle, ArrowLeft,
  Building2, HardHat, TrendingUp, Calendar, Info
} from 'lucide-react';
import { BusinessLead, LeadStatus, LeadType, LeadActivity } from '../types';
import { Modal, Input } from './ui';
import { OutreachTemplate, getStoredTemplates, replacePlaceholders } from '../lib/outreachUtils';
import { generateLeadIntelligence, refineOutreachTone, OutreachTone } from '../lib/aiUtils';
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

export const ActionHub: React.FC<ActionHubProps> = ({ leads, onSelectLead, onUpdateLeads, onAddCallLog, onAddEmailLog, onAddMeetingLog }) => {
  const [templates, setTemplates] = useState<OutreachTemplate[]>(() => getStoredTemplates());
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<OutreachTemplate | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(templates[0]?.id || '');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isTablet, setIsTablet] = useState(window.innerWidth >= 768 && window.innerWidth < 1280);
  const [activeHubTab, setActiveHubTab] = useState<'strategy' | 'outreach'>('strategy');
  const [activeStrategyTab, setActiveStrategyTab] = useState<'focus' | 'solutions' | 'starters' | 'history'>('focus');
  const [outreachChannel, setOutreachChannel] = useState<'Email' | 'SMS' | 'LinkedIn'>('Email');
  const [activeTone, setActiveTone] = useState<OutreachTone>('professional');
  const [customDraft, setCustomDraft] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      setIsTablet(window.innerWidth >= 768 && window.innerWidth < 1280);
    };
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
    const intel = generateLeadIntelligence(selectedLead, (selectedLead.preferredTheme as any) || 'growth');
    if (activeTone !== 'professional') {
      intel.email = refineOutreachTone(intel.email, activeTone);
    }
    return intel;
  }, [selectedLead, activeTone]);

  const scoreDetails = useMemo(() => {
    if (!selectedLead) return null;
    return getScoreDetails(selectedLead);
  }, [selectedLead]);

  const industryInsight = useMemo(() => {
    if (!selectedLead) return null;
    return getInsightForCategory(selectedLead.industry || '');
  }, [selectedLead]);

  const combinedTemplates = useMemo(() => {
    const baseTemplates = templates.filter(t => t.category === outreachChannel);
    if (selectedLead?.savedScripts && outreachChannel === 'Email') {
      const savedAsTemplates: OutreachTemplate[] = selectedLead.savedScripts.map(script => ({
        id: script.id,
        name: `⭐ ${script.name}`,
        subject: script.content?.split('\n')[0].replace('Subject: ', '') || 'No Subject',
        body: script.content || script.email || '',
        category: 'Email'
      }));
      return [...savedAsTemplates, ...baseTemplates];
    }
    return baseTemplates;
  }, [templates, selectedLead, outreachChannel]);

  useEffect(() => {
    if (combinedTemplates.length > 0) {
      setSelectedTemplateId(combinedTemplates[0].id);
      setCustomDraft(null);
    } else {
      setSelectedTemplateId('');
      setCustomDraft('');
    }
  }, [combinedTemplates]);

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
    if (!selectedLead) return;
    const text = customDraft || (currentTemplate ? replacePlaceholders(currentTemplate.body, selectedLead) : '');
    if (!text) return;

    navigator.clipboard.writeText(text);

    const newActivity: LeadActivity = {
      id: `act-${Date.now()}`,
      type: outreachChannel === 'Email' ? 'Email' : 'Note',
      date: new Date().toISOString(),
      notes: `Outreach ${outreachChannel} sent${currentTemplate ? ` using template: ${currentTemplate.name}` : ''}`
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

    if (outreachChannel === 'Email') {
      onAddEmailLog?.({
        timeSent: newActivity.date,
        client: selectedLead.businessName,
        subject: currentTemplate ? replacePlaceholders(currentTemplate.subject, selectedLead) : 'N/A',
        emailType: 'Outreach',
        responseReceived: false,
        nextStep: 'Wait for response'
      });
    }
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
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-50 dark:bg-slate-950 overflow-hidden h-full">
      {/* Header */}
      <div className="p-3 md:p-4 border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
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
            <div className="p-2 bg-blue-600 rounded-xl shadow-lg shadow-blue-500/20">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight leading-tight">
                Action Hub
              </h2>
              <p className="text-xs text-gray-500 dark:text-slate-400">Transform leads into appointments</p>
            </div>
          </div>
          {!isMobile && (
            <button
              onClick={() => {
                setEditingTemplate(null);
                setIsTemplateModalOpen(true);
              }}
              className="flex items-center space-x-2 px-3 py-1.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-[10px] font-bold text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-750 transition-all shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Template</span>
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        {/* Hot Leads Queue */}
        <div className={`${isMobile && selectedLeadId ? 'hidden' : 'flex'} w-full md:w-64 lg:w-72 xl:w-80 border-r border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col overflow-hidden shrink-0 transition-all`}>
          <div className="p-3 border-b border-gray-50 dark:border-slate-800 flex items-center justify-between bg-gray-50/50 dark:bg-slate-800/50">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center">
              <Clock className="w-3 h-3 mr-1.5" />
              Hot Leads Queue
            </span>
            <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full">
              {hotLeads.length} NEW
            </span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-gray-50 dark:divide-slate-800">
            {hotLeads.map((lead) => (
              <button
                key={lead.id}
                onClick={() => {
                  setSelectedLeadId(lead.id);
                  onSelectLead(lead);
                }}
                className={`w-full p-4 text-left transition-all ${
                  selectedLeadId === lead.id
                    ? 'bg-blue-50/50 dark:bg-blue-900/10 border-l-2 border-blue-600'
                    : 'hover:bg-gray-50 dark:hover:bg-slate-800/50 border-l-2 border-transparent'
                }`}
              >
                <div className="flex items-start justify-between mb-0.5">
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate pr-2">
                    {lead.businessName}
                  </h4>
                  <span className="text-[10px] font-medium text-gray-400 shrink-0">
                    {new Date(lead.lastUpdated).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-[9px] text-gray-500 dark:text-slate-400">{lead.industry}</span>
                  <span className="text-[9px] text-gray-300 dark:text-slate-600">•</span>
                  <span className={`text-[8px] font-bold px-1 py-0.5 rounded uppercase ${
                    lead.status === LeadStatus.NEW ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {lead.status}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Command Center */}
        <div className={`${isMobile && !selectedLeadId ? 'hidden' : 'flex'} flex-1 flex flex-col bg-gray-50 dark:bg-slate-950 overflow-hidden`}>
          {selectedLead ? (
            <div className="flex-1 flex flex-col xl:flex-row overflow-hidden">
              {(isMobile || isTablet) && (
                <div className="flex bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 shrink-0 sticky top-0 z-20">
                  <button
                    onClick={() => setActiveHubTab('strategy')}
                    className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 ${
                      activeHubTab === 'strategy'
                        ? 'text-blue-600 border-blue-600 bg-blue-50/50 dark:bg-blue-900/10'
                        : 'text-gray-400 border-transparent hover:text-gray-600 dark:hover:text-slate-300'
                    }`}
                  >
                    1. Strategy & Intel
                  </button>
                  <button
                    onClick={() => setActiveHubTab('outreach')}
                    className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 ${
                      activeHubTab === 'outreach'
                        ? 'text-blue-600 border-blue-600 bg-blue-50/50 dark:bg-blue-900/10'
                        : 'text-gray-400 border-transparent hover:text-gray-600 dark:hover:text-slate-300'
                    }`}
                  >
                    2. Outreach Composer
                  </button>
                </div>
              )}

              {/* Left Panel: Strategy */}
              <div className={`${(isMobile || isTablet) && activeHubTab !== 'strategy' ? 'hidden' : 'flex'} w-full xl:w-1/2 flex flex-col border-r border-gray-200 dark:border-slate-800 overflow-hidden`}>
                <div className="flex bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 shrink-0 px-4">
                  {(['focus', 'solutions', 'starters', 'history'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveStrategyTab(tab)}
                      className={`py-3 px-3 text-[10px] font-black uppercase tracking-tight transition-all border-b-2 ${
                        activeStrategyTab === tab
                          ? 'text-blue-600 border-blue-600'
                          : 'text-gray-400 border-transparent hover:text-gray-600 dark:hover:text-slate-300'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
                  {activeStrategyTab === 'focus' && (
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-2 opacity-5">
                        <BookOpen className="w-12 h-12" />
                      </div>
                      <div className="flex items-center justify-between mb-4 relative z-10">
                        <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center">
                          <Target className="w-3.5 h-3.5 mr-2 text-blue-600" />
                          Strategic Focus
                        </h3>
                        <div className="flex bg-gray-100 dark:bg-slate-800 p-0.5 rounded-lg border border-gray-200 dark:border-slate-700">
                          {(['growth', 'efficiency', 'security'] as const).map((theme) => (
                            <button
                              key={theme}
                              onClick={() => handleThemeChange(theme)}
                              className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-tight transition-all ${
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
                      <div className="text-sm md:text-base text-gray-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed relative z-10">
                        {intelligence?.strategy.split('**1. Strategic Focus:**')[1]?.split('**2. Product Bundle:**')[0]?.trim()}
                      </div>
                      {scoreDetails && scoreDetails.insights.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-slate-800">
                          <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Priority Insights</label>
                          <div className="flex flex-wrap gap-1.5">
                            {scoreDetails.insights.map((insight, i) => (
                              <span key={i} className="px-1.5 py-0.5 bg-gray-50 dark:bg-slate-800 text-[8px] font-bold text-gray-500 dark:text-slate-400 rounded-md border border-gray-100 dark:border-slate-700">
                                {insight.label} (+{insight.points})
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {activeStrategyTab === 'solutions' && (
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm">
                      <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center mb-3">
                        <Package className="w-3 h-3 mr-2 text-blue-500" />
                        Recommended Solutions
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {intelligence?.strategy.split('**2. Product Bundle:**')[1]?.split('**3. Discussion Starters:**')[0]?.trim().split('\n').filter(s => s.trim()).map((item, i) => {
                          const productName = item.replace('- ', '').split(':')[0].trim();
                          const masterProduct = getAllProducts().find(p => p.name === productName || productName.includes(p.name));
                          return (
                            <button
                              key={i}
                              onClick={() => setSelectedProduct(masterProduct || { name: productName, summary: 'Recommendation based on industry needs.' })}
                              className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800/50 rounded-lg border border-gray-100 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-900 transition-colors text-left"
                            >
                              <div className="flex items-center space-x-2">
                                <CheckCircle2 className="w-3 h-3 text-green-500 shrink-0" />
                                <span className="text-[10px] font-bold text-gray-700 dark:text-slate-300">{productName}</span>
                              </div>
                              <ChevronRight className="w-2.5 h-2.5 text-gray-400" />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {activeStrategyTab === 'starters' && (
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm">
                      <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center mb-3">
                        <MessageCircle className="w-3 h-3 mr-2 text-blue-500" />
                        Discussion Starters
                      </h3>
                      <div className="space-y-3">
                        {intelligence?.strategy.split('**3. Discussion Starters:**')[1]?.trim().split('\n').filter(s => s.trim().startsWith('-')).slice(0, 5).map((starter, i) => (
                          <div key={i} className="p-4 bg-blue-50/30 dark:bg-blue-900/10 rounded-lg text-sm font-medium text-gray-600 dark:text-slate-400 italic border border-blue-100/30 dark:border-blue-900/20">
                            "{starter.replace('- ', '').replace(/"/g, '')}"
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeStrategyTab === 'history' && (
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm">
                      <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center mb-3">
                        <Clock className="w-3 h-3 mr-2 text-blue-500" />
                        Recent History
                      </h3>
                      <div className="space-y-3">
                        {selectedLead.activities?.slice(0, 5).map((activity) => (
                          <div key={activity.id} className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-slate-800/50 rounded-lg border border-gray-100 dark:border-slate-800">
                            <div className={`p-1.5 rounded-lg shrink-0 ${
                              activity.type === 'Call' ? 'bg-blue-100 text-blue-600' :
                              activity.type === 'Email' ? 'bg-purple-100 text-purple-600' :
                              activity.type === 'Appointment' ? 'bg-amber-100 text-amber-600' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              {activity.type === 'Call' ? <Phone className="w-3 h-3" /> :
                               activity.type === 'Email' ? <Mail className="w-3 h-3" /> :
                               activity.type === 'Appointment' ? <Calendar className="w-3 h-3" /> :
                               <FileText className="w-3 h-3" />}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between mb-0.5">
                                <span className="text-[10px] font-black uppercase tracking-tight text-gray-900 dark:text-white">{activity.type}</span>
                                <span className="text-[8px] font-bold text-gray-400">{new Date(activity.date).toLocaleDateString()}</span>
                              </div>
                              <p className="text-[10px] text-gray-500 dark:text-slate-400 line-clamp-2">{activity.notes}</p>
                            </div>
                          </div>
                        )) || (
                          <div className="text-center py-6 text-gray-400 text-[10px] font-bold uppercase tracking-widest">No activities yet</div>
                        )}
                      </div>
                    </div>
                  )}

                  {industryInsight && (
                    <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white p-4 rounded-xl shadow-xl shadow-blue-500/10 relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-3 opacity-10">
                        {selectedLead.industry?.includes('Construction') ? <HardHat className="w-10 h-10" /> : <Building2 className="w-10 h-10" />}
                      </div>
                      <div className="flex items-center space-x-2 mb-3">
                        <div className="p-1 bg-white/20 rounded-md">
                          <Info className="w-3 h-3" />
                        </div>
                        <h3 className="text-[10px] font-black uppercase tracking-widest opacity-90">
                          {selectedLead.industry} Intel
                        </h3>
                      </div>
                      <div className="space-y-3 relative z-10">
                        <p className="text-[10px] font-medium leading-relaxed opacity-90">
                          {industryInsight.overview}
                        </p>
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {industryInsight.quickFacts?.slice(0, 2).map((fact, i) => (
                            <div key={i} className="flex items-center space-x-1.5 px-2 py-1 bg-white/10 rounded-lg text-[9px] font-bold backdrop-blur-sm border border-white/5">
                              <TrendingUp className="w-2.5 h-2.5 text-blue-200" />
                              <span>{fact}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Panel: Outreach */}
              <div className={`${(isMobile || isTablet) && activeHubTab !== 'outreach' ? 'hidden' : 'flex'} w-full xl:w-1/2 flex flex-col overflow-y-auto p-4 md:p-6 space-y-4`}>
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-xl overflow-hidden flex flex-col">
                  <div className="flex bg-gray-50 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-800">
                    {(['Email', 'SMS', 'LinkedIn'] as const).map((channel) => (
                      <button
                        key={channel}
                        onClick={() => setOutreachChannel(channel)}
                        className={`flex-1 py-3 text-[9px] font-black uppercase tracking-widest transition-all border-b-2 ${
                          outreachChannel === channel
                            ? 'text-blue-600 border-blue-600 bg-white dark:bg-slate-900'
                            : 'text-gray-400 border-transparent hover:text-gray-600 dark:hover:text-slate-300'
                        }`}
                      >
                        {channel}
                      </button>
                    ))}
                  </div>

                  <div className="p-3 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="p-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        {outreachChannel === 'Email' ? <Mail className="w-3.5 h-3.5 text-blue-600" /> :
                         outreachChannel === 'SMS' ? <MessageSquare className="w-3.5 h-3.5 text-blue-600" /> :
                         <Zap className="w-3.5 h-3.5 text-blue-600" />}
                      </div>
                      <select
                        value={selectedTemplateId}
                        onChange={(e) => setSelectedTemplateId(e.target.value)}
                        className="bg-transparent border-none text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-wider focus:ring-0 cursor-pointer p-0"
                      >
                        <option value="">Manual Draft</option>
                        {combinedTemplates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                    </div>
                    {currentTemplate && (
                      <button onClick={() => setEditingTemplate(currentTemplate)} className="p-1 text-gray-400 hover:text-blue-600">
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="px-4 py-2 border-b border-gray-50 dark:border-slate-800/50 flex items-center justify-between">
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Modify Tone</span>
                    <div className="flex bg-gray-100 dark:bg-slate-800 p-0.5 rounded-lg border border-gray-200 dark:border-slate-700">
                      {(['professional', 'friendly', 'urgent'] as const).map((tone) => (
                        <button
                          key={tone}
                          onClick={() => setActiveTone(tone)}
                          className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-tight transition-all ${
                            activeTone === tone
                              ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm'
                              : 'text-gray-400 hover:text-gray-600 dark:hover:text-slate-300'
                          }`}
                        >
                          {tone}
                        </button>
                      ))}
                    </div>
                  </div>

                  {outreachChannel === 'Email' && (
                    <div className="p-4 border-b border-gray-50 dark:border-slate-800/50">
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Subject Line</label>
                      <div className="text-xs font-bold text-gray-900 dark:text-white bg-gray-50 dark:bg-slate-800/50 p-2 rounded-lg border border-gray-100 dark:border-slate-800">
                        {currentTemplate ? replacePlaceholders(currentTemplate.subject, selectedLead) : 'N/A'}
                      </div>
                    </div>
                  )}

                  <div className="p-6 font-serif text-sm text-gray-700 dark:text-slate-300 min-h-[300px]">
                    <textarea
                      value={customDraft !== null ? customDraft : (currentTemplate ? replacePlaceholders(currentTemplate.body, selectedLead) : '')}
                      onChange={(e) => setCustomDraft(e.target.value)}
                      className="w-full h-full min-h-[300px] bg-transparent border-none focus:ring-0 resize-none p-0"
                      placeholder="Template body will appear here..."
                    />
                  </div>

                  <div className="p-3 bg-gray-50 dark:bg-slate-800/50 border-t border-gray-100 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3">
                    <div className="flex items-center space-x-4 w-full md:w-auto justify-around md:justify-start">
                      <button onClick={handleLogCall} className="flex flex-col items-center group">
                        <div className="p-1.5 bg-white dark:bg-slate-800 rounded-full border group-hover:border-blue-500 shadow-sm transition-colors">
                          <Phone className="w-3.5 h-3.5 text-gray-500 group-hover:text-blue-600" />
                        </div>
                        <span className="text-[8px] font-bold text-gray-500 mt-0.5">Log Call</span>
                      </button>
                      <button onClick={handleLogMeeting} className="flex flex-col items-center group">
                        <div className="p-1.5 bg-white dark:bg-slate-800 rounded-full border group-hover:border-amber-500 shadow-sm transition-colors">
                          <Calendar className="w-3.5 h-3.5 text-gray-500 group-hover:text-amber-600" />
                        </div>
                        <span className="text-[8px] font-bold text-gray-500 mt-0.5">Schedule</span>
                      </button>
                    </div>
                    <button
                      onClick={handleCopyAndLog}
                      className="w-full md:w-auto px-6 py-2 bg-blue-600 text-white rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-blue-700 transition-all flex items-center justify-center"
                    >
                      <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                      Copy Outreach
                    </button>
                  </div>
                </div>

                <div className="bg-amber-50 dark:bg-amber-900/10 rounded-xl p-3 border border-amber-100 dark:border-amber-900/20 flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1.5">
                    <h4 className="text-[10px] font-black text-amber-800 dark:text-amber-400 uppercase tracking-tight">Banker Tip</h4>
                    <p className="text-[9px] text-amber-700/80 dark:text-amber-400/80 font-medium">
                      {selectedLead.industry?.includes('Construction')
                        ? 'Construction clients prioritize speed. Mention our SBA process to secure the appointment.'
                        : 'Focus on relationship building and product bundles for this sector.'}
                    </p>
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

      <Modal isOpen={!!selectedProduct} onClose={() => setSelectedProduct(null)} title="Product Details">
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
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
          <p className="text-sm text-gray-600 dark:text-slate-400 leading-relaxed">
            {selectedProduct?.summary || selectedProduct?.details || 'Strategic recommendation based on industry needs.'}
          </p>
          <div className="flex justify-end pt-4">
            <button onClick={() => setSelectedProduct(null)} className="px-6 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold">Got it</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isTemplateModalOpen} onClose={() => setIsTemplateModalOpen(false)} title={editingTemplate ? "Edit Template" : "New Template"}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Template Name"
              value={editingTemplate?.name || ''}
              onChange={(e) => setEditingTemplate(prev => ({ ...prev!, name: e.target.value }))}
            />
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-500 uppercase">Channel</label>
              <select
                value={editingTemplate?.category || 'Email'}
                onChange={(e) => setEditingTemplate(prev => ({ ...prev!, category: e.target.value as any }))}
                className="w-full p-2 bg-gray-50 dark:bg-slate-800 border rounded-xl text-sm"
              >
                <option value="Email">Email</option>
                <option value="SMS">SMS</option>
                <option value="LinkedIn">LinkedIn</option>
              </select>
            </div>
          </div>
          <Input
            label="Subject (Optional)"
            value={editingTemplate?.subject || ''}
            onChange={(e) => setEditingTemplate(prev => ({ ...prev!, subject: e.target.value }))}
          />
          <textarea
            value={editingTemplate?.body || ''}
            onChange={(e) => setEditingTemplate(prev => ({ ...prev!, body: e.target.value }))}
            className="w-full h-48 p-4 bg-gray-50 dark:bg-slate-800 border rounded-xl text-sm"
            placeholder="Template body..."
          />
          <div className="flex justify-end space-x-3 pt-4">
            <button onClick={() => setIsTemplateModalOpen(false)} className="px-4 py-2 text-xs font-bold text-gray-500">Cancel</button>
            <button onClick={() => editingTemplate && saveTemplate(editingTemplate)} className="px-6 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold">Save Template</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
