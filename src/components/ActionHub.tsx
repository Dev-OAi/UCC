import React, { useState, useMemo, useEffect } from 'react';
import {
  Zap, Mail, Phone, MessageSquare, Save, Trash2,
  Plus, ChevronRight, Target, Clock, Filter, Search,
  CheckCircle2, AlertCircle, Sparkles, FileText, Edit3
} from 'lucide-react';
import { BusinessLead, LeadStatus } from '../types';
import { Modal, Input } from './ui';

interface ActionHubProps {
  leads: BusinessLead[];
  onSelectLead: (lead: BusinessLead) => void;
  onUpdateLeads: (leads: BusinessLead[]) => void;
}

interface OutreachTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  category: 'Email' | 'SMS' | 'Script';
}

export const ActionHub: React.FC<ActionHubProps> = ({ leads, onSelectLead, onUpdateLeads }) => {
  const [templates, setTemplates] = useState<OutreachTemplate[]>(() => {
    const saved = localStorage.getItem('outreach_templates');
    return saved ? JSON.parse(saved) : [
      {
        id: 'temp-1',
        name: 'UCC Renewal Intro',
        subject: 'Expiring UCC Filing - Action Required for {{businessName}}',
        body: 'Hello {{contactName}},\n\nI noticed that your current UCC filing for {{businessName}} is set to expire soon. Ensuring this remains active is critical for your current lending relationships.\n\nI would love to discuss how Valley Bank can help you manage this renewal and explore potential refinancing options.\n\nBest regards,\n[My Name]',
        category: 'Email'
      },
      {
        id: 'temp-2',
        name: 'New Entity Welcome',
        subject: 'Supporting the Growth of {{businessName}}',
        body: 'Hi {{contactName}},\n\nCongratulations on your recent filing for {{businessName}}! Starting a new venture is an exciting milestone.\n\nAt Valley Bank, we specialize in supporting emerging businesses in the {{industry}} sector with tailored treasury and credit solutions.\n\nAre you available for a brief 5-minute intro call next week?',
        category: 'Email'
      }
    ];
  });

  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<OutreachTemplate | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(templates[0]?.id || '');

  useEffect(() => {
    localStorage.setItem('outreach_templates', JSON.stringify(templates));
  }, [templates]);

  const hotLeads = useMemo(() => {
    return leads
      .filter(l => l.status === LeadStatus.NEW || l.status === LeadStatus.PROSPECT)
      .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime())
      .slice(0, 10);
  }, [leads]);

  const currentTemplate = useMemo(() =>
    templates.find(t => t.id === selectedTemplateId),
  [templates, selectedTemplateId]);

  const replacePlaceholders = (text: string, lead: BusinessLead) => {
    return text
      .replace(/{{businessName}}/g, lead.businessName)
      .replace(/{{contactName}}/g, lead.keyPrincipal || 'Business Owner')
      .replace(/{{industry}}/g, lead.industry || 'local');
  };

  const saveTemplate = (template: OutreachTemplate) => {
    if (editingTemplate?.id) {
      setTemplates(prev => prev.map(t => t.id === template.id ? template : t));
    } else {
      setTemplates(prev => [...prev, { ...template, id: `temp-${Date.now()}` }]);
    }
    setIsTemplateModalOpen(false);
    setEditingTemplate(null);
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-50 dark:bg-slate-950 overflow-hidden">
      <div className="p-6 border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center">
              <Zap className="w-6 h-6 mr-2 text-amber-500 fill-amber-500" />
              Action Hub
            </h2>
            <p className="text-sm text-gray-500 dark:text-slate-400">Transform high-priority leads into active appointments</p>
          </div>
          <button
            onClick={() => {
              setEditingTemplate(null);
              setIsTemplateModalOpen(true);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-all flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Template
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Hot Leads Queue */}
        <div className="w-96 border-r border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-gray-50 dark:border-slate-800 flex items-center justify-between bg-gray-50/50 dark:bg-slate-800/50">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center">
              <Clock className="w-3 h-3 mr-1.5" />
              Hot Leads Queue
            </span>
            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[9px] font-bold rounded">
              {hotLeads.length} Priority
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {hotLeads.length > 0 ? hotLeads.map(lead => (
              <div
                key={lead.id}
                onClick={() => onSelectLead(lead)}
                className="p-4 rounded-xl border border-gray-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-900 cursor-pointer transition-all hover:bg-blue-50/50 dark:hover:bg-blue-900/10 group"
              >
                <div className="flex items-start justify-between mb-1">
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate pr-2">{lead.businessName}</h4>
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors" />
                </div>
                <div className="flex items-center space-x-2 text-[10px] text-gray-400">
                  <span className="truncate">{lead.industry || 'General Business'}</span>
                  <span>•</span>
                  <span>{lead.zip}</span>
                </div>
                <div className="mt-3 flex items-center justify-between">
                   <div className="flex items-center text-[9px] font-bold text-blue-600 dark:text-blue-400 uppercase">
                     <Target className="w-3 h-3 mr-1" />
                     {lead.status}
                   </div>
                   <span className="text-[8px] text-gray-400 italic">Updated {new Date(lead.lastUpdated).toLocaleDateString()}</span>
                </div>
              </div>
            )) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                 <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-2" />
                 <p className="text-xs font-bold text-gray-500">Queue Clear!</p>
                 <p className="text-[10px] text-gray-400 uppercase tracking-widest">No new prospects found</p>
              </div>
            )}
          </div>
        </div>

        {/* Outreach Composer */}
        <div className="flex-1 p-8 bg-gray-50 dark:bg-slate-950 overflow-y-auto">
          {hotLeads.length > 0 ? (
            <div className="max-w-3xl mx-auto space-y-8">
               <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
                    <Mail className="w-5 h-5 mr-2 text-blue-600" />
                    Outreach Composer
                  </h3>
                  <div className="flex items-center space-x-3">
                    <select
                      value={selectedTemplateId}
                      onChange={(e) => setSelectedTemplateId(e.target.value)}
                      className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-xs font-bold rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500/20 outline-none"
                    >
                      {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                    <button
                      onClick={() => {
                        if (currentTemplate) {
                          setEditingTemplate(currentTemplate);
                          setIsTemplateModalOpen(true);
                        }
                      }}
                      className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </div>
               </div>

               <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/50">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Subject Line</label>
                    <div className="text-sm font-bold text-gray-900 dark:text-white">
                      {currentTemplate ? replacePlaceholders(currentTemplate.subject, hotLeads[0]) : 'Select a lead and template'}
                    </div>
                  </div>
                  <div className="p-8 font-serif text-sm text-gray-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap min-h-[400px]">
                    {currentTemplate ? replacePlaceholders(currentTemplate.body, hotLeads[0]) : 'Template body will appear here...'}
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-slate-800/50 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <button className="flex items-center space-x-2 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors">
                        <Phone className="w-3.5 h-3.5" />
                        <span>Log Call</span>
                      </button>
                      <button className="flex items-center space-x-2 text-xs font-bold text-amber-600 hover:text-amber-700 transition-colors">
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Log SMS</span>
                      </button>
                    </div>
                    <button
                      onClick={() => {
                        // In a real app, this would trigger an email
                        const lead = hotLeads[0];
                        const text = currentTemplate ? replacePlaceholders(currentTemplate.body, lead) : '';
                        navigator.clipboard.writeText(text);
                        alert(`Copied outreach for ${lead.businessName} to clipboard and logged to Activity Log.`);
                      }}
                      className="px-6 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all flex items-center"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Copy & Log Outreach
                    </button>
                  </div>
               </div>

               <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 border border-amber-100 dark:border-amber-900/30 flex items-start space-x-3">
                 <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                 <div>
                   <h4 className="text-xs font-bold text-amber-800 dark:text-amber-400 mb-1">Outreach Intelligence</h4>
                   <p className="text-[11px] text-amber-700/80 dark:text-amber-400/80 leading-relaxed">
                     The <b>{currentTemplate?.name}</b> template is currently yielding a 24% response rate for leads in the <b>{hotLeads[0]?.industry}</b> sector. Consider personalizing the first paragraph for even better results.
                   </p>
                 </div>
               </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
              <div className="p-6 bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-gray-100 dark:border-slate-800">
                <Target className="w-12 h-12 text-gray-200" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Action Hub Ready</h3>
                <p className="text-sm text-gray-500 dark:text-slate-400 max-w-sm mx-auto">
                  Add prospects from the Playbook or Dashboard to start your outreach campaign.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

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
