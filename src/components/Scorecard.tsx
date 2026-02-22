import React, { useState, useMemo, useEffect } from 'react';
import {
  Target, TrendingUp, Users, Phone, Mail, Calendar,
  ArrowUpRight, Search, Filter, MoreHorizontal,
  ChevronRight, Building2, BadgeCheck, AlertCircle,
  Briefcase, Clock, CheckCircle2, XCircle, Download, ExternalLink,
  PieChart as PieIcon, BarChart3, FileText, Loader2, Edit2, Trash2,
  Lock, Unlock, Settings2, Plus, ChevronUp, ChevronDown, Eye, EyeOff,
  Package
} from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend
} from 'recharts';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { BusinessLead, LeadActivity, LeadStatus, LeadType, ScorecardMetric } from '../types';
import { getProductPoints, getAllProducts } from '../lib/productData';
import { SecurityModal } from './SecurityModal';
import { Modal } from './ui';

interface ScorecardProps {
  leads: BusinessLead[];
  setLeads: React.Dispatch<React.SetStateAction<BusinessLead[]>>;
  metrics: ScorecardMetric[];
  setMetrics: React.Dispatch<React.SetStateAction<ScorecardMetric[]>>;
  onSelectLead: (lead: BusinessLead | null) => void;
  selectedLeadId: string | null;
}

export const Scorecard: React.FC<ScorecardProps> = ({
  leads, setLeads, metrics, setMetrics, onSelectLead, selectedLeadId
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [isPointsUnlocked, setIsPointsUnlocked] = useState(false);
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [isResearchMode, setIsResearchMode] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [selectedChart, setSelectedChart] = useState<'funnel' | 'industries' | null>(null);
  const printContainerRef = React.useRef<HTMLDivElement>(null);

  // States for new UI-based dialogs
  const [confirmDeleteLead, setConfirmDeleteLead] = useState<string | null>(null);
  const [editLeadName, setEditLeadName] = useState<{id: string, name: string} | null>(null);
  const [bulkNoteText, setBulkNoteText] = useState<string | null>(null);
  const [confirmDeleteMetric, setConfirmDeleteMetric] = useState<string | null>(null);
  const [editMetricTarget, setEditMetricTarget] = useState<{id: string, name: string, target: string} | null>(null);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

  const statusDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    leads.forEach(lead => {
      counts[lead.status] = (counts[lead.status] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [leads]);

  const industryDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    leads.forEach(lead => {
      const industry = lead.industry || 'Unknown';
      counts[industry] = (counts[industry] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [leads]);

  useEffect(() => {
    let timer: any;
    if (isPointsUnlocked) {
      timer = setTimeout(() => {
        setIsPointsUnlocked(false);
      }, 60000);
    }
    return () => clearTimeout(timer);
  }, [isPointsUnlocked]);

  const handleUnlockPoints = () => {
    setIsSecurityModalOpen(true);
  };

  const scorecardData = useMemo(() => {
    const meetingsCount = leads.reduce((acc, lead) =>
      acc + (lead.activities || []).filter(a => a.type === 'Appointment').length, 0);

    const outreachCount = leads.reduce((acc, lead) =>
      acc + (lead.activities || []).filter(a => a.type === 'Call' || a.type === 'Email').length, 0);

    const productMetrics = metrics.filter(m => m.type === 'product');

    const results: Record<string, number> = {
      'new-accts': leads.filter(l => l.status === LeadStatus.CONVERTED).length,
      'cards-sold': leads.filter(l => l.productsSold?.some(p => p.toLowerCase().includes('credit card'))).length,
      'meetings': meetingsCount,
      'pipeline-total': leads.length,
      'emails-collected': leads.filter(l => l.email && l.email !== 'N/A').length,
      'outreach': outreachCount,
    };

    productMetrics.forEach(m => {
      results[m.id] = leads.filter(l => l.productsSold?.includes(m.name)).length;
    });

    let totalPoints = (outreachCount + (meetingsCount * 2));
    leads.forEach(lead => {
      (lead.productsSold || []).forEach(pName => {
        totalPoints += getProductPoints(pName);
      });
    });

    return {
      counts: results,
      impactScore: totalPoints
    };
  }, [leads, metrics]);

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

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedLeadIds(filteredLeads.map(l => l.id));
    } else {
      setSelectedLeadIds([]);
    }
  };

  const handleSelectLead = (e: React.ChangeEvent<HTMLInputElement>, id: string) => {
    e.stopPropagation();
    if (e.target.checked) {
      setSelectedLeadIds(prev => [...prev, id]);
    } else {
      setSelectedLeadIds(prev => prev.filter(i => i !== id));
    }
  };

  const handleBulkStatusUpdate = (status: LeadStatus) => {
    setLeads(prev => prev.map(l =>
      selectedLeadIds.includes(l.id) ? { ...l, status, lastUpdated: new Date().toISOString() } : l
    ));
    setSelectedLeadIds([]);
  };

  const exportToCSV = () => {
    if (leads.length === 0) return;

    const headers = ['Business Name', 'Industry', 'Status', 'Phone', 'Email', 'Website', 'Last Updated'];
    const rows = leads.map(l => [
      l.businessName,
      l.industry || '',
      l.status,
      l.phone || '',
      l.email || '',
      l.website || '',
      l.lastUpdated
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `BankerPro_Pipeline_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openSearch = (e: React.MouseEvent, businessName: string, type: 'google' | 'linkedin' | 'sunbiz') => {
    e.stopPropagation();
    let url = '';
    if (type === 'google') url = `https://www.google.com/search?q=${encodeURIComponent(businessName)}`;
    if (type === 'linkedin') url = `https://www.linkedin.com/search/results/all/?keywords=${encodeURIComponent(businessName)}`;
    if (type === 'sunbiz') url = `https://search.sunbiz.org/Inquiry/CorporationSearch/ByName?SearchTerm=${encodeURIComponent(businessName)}`;
    window.open(url, '_blank');
  };

  const handleDeleteLeadAction = (id: string) => {
    setLeads(prev => {
      const remaining = prev.filter(l => l.id !== id);
      if (selectedLeadId === id) {
        onSelectLead(remaining[0] || null);
      }
      return remaining;
    });
    setConfirmDeleteLead(null);
  };

  const handleEditLeadAction = () => {
    if (!editLeadName || editLeadName.name.trim() === '') return;
    setLeads(prev => prev.map(l => l.id === editLeadName.id ? { ...l, businessName: editLeadName.name.trim(), lastUpdated: new Date().toISOString() } : l));
    setEditLeadName(null);
  };

  const handleBulkNoteAction = () => {
    if (!bulkNoteText) return;

    setLeads(prev => prev.map(l => {
      if (selectedLeadIds.includes(l.id)) {
        const newActivity: LeadActivity = {
          id: (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : Math.random().toString(36).substr(2, 9),
          type: 'Note' as const,
          date: new Date().toISOString(),
          notes: bulkNoteText
        };
        return {
          ...l,
          activities: [newActivity, ...(l.activities || [])],
          lastUpdated: new Date().toISOString()
        };
      }
      return l;
    }));
    setSelectedLeadIds([]);
    setBulkNoteText(null);
  };

  const moveMetric = (id: string, direction: 'up' | 'down') => {
    const index = metrics.findIndex(m => m.id === id);
    if (index === -1) return;
    const newMetrics = [...metrics];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newMetrics.length) return;
    [newMetrics[index], newMetrics[targetIndex]] = [newMetrics[targetIndex], newMetrics[index]];
    setMetrics(newMetrics);
  };

  const toggleMetricVisibility = (id: string) => {
    setMetrics(prev => prev.map(m => m.id === id ? { ...m, isVisible: !m.isVisible } : m));
  };

  const deleteMetricAction = (id: string) => {
    setMetrics(prev => prev.filter(m => m.id !== id));
    setConfirmDeleteMetric(null);
  };

  const editTargetAction = () => {
    if (!editMetricTarget) return;
    const newTarget = parseInt(editMetricTarget.target);
    if (!isNaN(newTarget)) {
      setMetrics(prev => prev.map(m => m.id === editMetricTarget.id ? { ...m, target: newTarget } : m));
    }
    setEditMetricTarget(null);
  };

  const addProductToScorecard = (productName: string) => {
    const exists = metrics.find(m => m.name === productName);
    if (exists) {
      return;
    }

    const newMetric: ScorecardMetric = {
      id: `prod-${Date.now()}`,
      name: productName,
      target: 100,
      type: 'product',
      isVisible: true
    };
    setMetrics(prev => [...prev, newMetric]);
    setShowAddProductModal(false);
  };

  const exportToPDF = async () => {
    if (!printContainerRef.current) return;
    setIsExportingPDF(true);

    try {
      const canvas = await html2canvas(printContainerRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: null,
        onclone: (documentClone: Document) => {
          const printableArea = documentClone.getElementById('scorecard-report');
          if (printableArea) {
            printableArea.style.backgroundColor = 'white';
            printableArea.style.color = 'black';
            printableArea.style.padding = '40px';
          }

          documentClone.querySelectorAll('.no-print').forEach(el => {
            (el as HTMLElement).style.display = 'none';
          });

          documentClone.querySelectorAll('h1, h2, h3, h4, span, label, td, th, p').forEach(el => {
            (el as HTMLElement).style.color = 'black';
          });

          // Ensure dark mode backgrounds are removed for print
          documentClone.querySelectorAll('.bg-slate-900, .bg-slate-950, .dark\\:bg-slate-900, .dark\\:bg-slate-950').forEach(el => {
            (el as HTMLElement).style.backgroundColor = 'white';
          });

          documentClone.querySelectorAll('.border-slate-800, .dark\\:border-slate-800').forEach(el => {
            (el as HTMLElement).style.borderColor = '#e2e8f0';
          });
        }
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: 'a4' });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const ratio = canvas.width / pdfWidth;
      const imgHeight = canvas.height / ratio;

      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, imgHeight);
      pdf.save(`BankerPro_Scorecard_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('PDF export failed:', error);
    } finally {
      setIsExportingPDF(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-gray-50 dark:bg-slate-950" ref={printContainerRef} id="scorecard-report">
      {/* Header */}
      <div className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-white/20 backdrop-blur-md rounded-lg flex items-center justify-center">
            <Target className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight uppercase">Scorecard</h1>
          </div>
        </div>
        <div className="flex items-center space-x-6">
          <div className="text-right border-r border-white/20 pr-6">
            <div>
              <p className="text-[10px] font-bold text-blue-100 uppercase tracking-widest">Personal Impact</p>
              <p className="text-sm font-black text-white">{scorecardData.impactScore}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold text-blue-100 uppercase tracking-widest">Active Pipeline</p>
            <p className="text-sm font-black text-white">{leads.length} Businesses</p>
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
            <div className="flex items-center space-x-3">
              <button
                onClick={exportToPDF}
                disabled={isExportingPDF}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 transition-all flex items-center space-x-2 disabled:opacity-50"
              >
                {isExportingPDF ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
                <span>{isExportingPDF ? 'Generating...' : 'PDF Report'}</span>
              </button>
              <button
                onClick={exportToCSV}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all flex items-center space-x-2"
              >
                <Download className="w-3.5 h-3.5" />
                <span>CSV</span>
              </button>
              <button
                onClick={() => setIsResearchMode(!isResearchMode)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
                  isResearchMode
                    ? 'bg-amber-100 text-amber-700 border border-amber-200'
                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                }`}
              >
                <Search className={`w-3.5 h-3.5 ${isResearchMode ? 'text-amber-600' : 'text-slate-400'}`} />
                <span>Research Mode {isResearchMode ? 'ON' : 'OFF'}</span>
              </button>

              <div className="relative group">
                <button className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center space-x-2">
                  <BarChart3 className="w-3.5 h-3.5 text-blue-600" />
                  <span>{selectedChart === 'funnel' ? 'Pipeline Funnel' : selectedChart === 'industries' ? 'Top Industries' : 'View Analytics'}</span>
                </button>
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-1 z-20 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <button
                    onClick={() => setSelectedChart(selectedChart === 'funnel' ? null : 'funnel')}
                    className={`w-full text-left px-4 py-2 text-xs font-bold flex items-center space-x-2 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors ${selectedChart === 'funnel' ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' : 'text-slate-600 dark:text-slate-400'}`}
                  >
                    <PieIcon className="w-3.5 h-3.5" />
                    <span>Pipeline Funnel</span>
                  </button>
                  <button
                    onClick={() => setSelectedChart(selectedChart === 'industries' ? null : 'industries')}
                    className={`w-full text-left px-4 py-2 text-xs font-bold flex items-center space-x-2 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors ${selectedChart === 'industries' ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' : 'text-slate-600 dark:text-slate-400'}`}
                  >
                    <BarChart3 className="w-3.5 h-3.5" />
                    <span>Top Industries</span>
                  </button>
                </div>
              </div>

              <button
                onClick={() => setIsCustomizing(!isCustomizing)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
                  isCustomizing
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                }`}
              >
                <Settings2 className="w-3.5 h-3.5" />
                <span>{isCustomizing ? 'Done Customizing' : 'Customize Metrics'}</span>
              </button>

              <button className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center space-x-2">
                <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
                <span>All Leads</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {metrics.map((m, idx) => {
              if (!m.isVisible && !isCustomizing) return null;
              const count = scorecardData.counts[m.id] || 0;
              const progress = Math.min(100, (count / m.target) * 100);

              const isFirstRow = ['new-accts', 'cards-sold', 'meetings'].includes(m.id) || m.type === 'product';

              if (!isFirstRow) return null;

              return (
                <div key={m.id} className={`bg-white dark:bg-slate-900 p-6 rounded-3xl border shadow-sm relative overflow-hidden group transition-all ${!m.isVisible ? 'opacity-50 grayscale' : 'border-slate-100 dark:border-slate-800'}`}>
                  {isCustomizing && (
                    <div className="absolute top-2 right-2 flex items-center space-x-1 z-10">
                      <button onClick={() => moveMetric(m.id, 'up')} disabled={idx === 0} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors text-slate-400 hover:text-blue-500">
                        <ChevronUp className="w-3 h-3" />
                      </button>
                      <button onClick={() => moveMetric(m.id, 'down')} disabled={idx === metrics.length - 1} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors text-slate-400 hover:text-blue-500">
                        <ChevronDown className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => setEditMetricTarget({ id: m.id, name: m.name, target: String(m.target) })}
                        className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors text-slate-400 hover:text-blue-500"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button onClick={() => toggleMetricVisibility(m.id)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors text-slate-400 hover:text-blue-500">
                        {m.isVisible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3 text-amber-500" />}
                      </button>
                      {m.type === 'product' && (
                        <button
                          onClick={() => setConfirmDeleteMetric(m.id)}
                          className="p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors text-slate-400 hover:text-red-500"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  )}

                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    {m.id === 'new-accts' ? <BadgeCheck className="w-16 h-16 text-blue-600" /> :
                     m.id === 'cards-sold' ? <Briefcase className="w-16 h-16 text-indigo-600" /> :
                     m.id === 'meetings' ? <Users className="w-16 h-16 text-purple-600" /> :
                     <Package className="w-16 h-16 text-slate-600" />}
                  </div>

                  <div className="flex justify-between items-start mb-4">
                    <span className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{m.name}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      m.id === 'new-accts' ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20' :
                      m.id === 'cards-sold' ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20' :
                      m.id === 'meetings' ? 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20' :
                      'text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800'
                    }`}>Target: {m.target}</span>
                  </div>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-4xl font-black text-slate-900 dark:text-white">{count}</span>
                    <span className="text-slate-400 dark:text-slate-600 font-bold">/ {m.target}</span>
                  </div>
                  <div className="mt-4 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-1000 ${
                        m.id === 'new-accts' ? 'bg-blue-600' :
                        m.id === 'cards-sold' ? 'bg-indigo-600' :
                        m.id === 'meetings' ? 'bg-purple-600' :
                        'bg-slate-600'
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              );
            })}

            {isCustomizing && (
              <button
                onClick={() => {
                  if (isPointsUnlocked) {
                    setShowAddProductModal(true);
                  } else {
                    handleUnlockPoints();
                  }
                }}
                className="bg-white dark:bg-slate-900 p-6 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 transition-all flex flex-col items-center justify-center space-y-3 group"
              >
                <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                  <Plus className="w-6 h-6" />
                </div>
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Add Product to Scorecard</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {metrics.map((m) => {
              if (!m.isVisible && !isCustomizing) return null;
              const count = scorecardData.counts[m.id] || 0;
              const isFirstRow = ['new-accts', 'cards-sold', 'meetings'].includes(m.id) || m.type === 'product';
              if (isFirstRow) return null;

              return (
                <div key={m.id} className={`bg-white dark:bg-slate-900 p-6 rounded-2xl border flex items-center space-x-4 relative group transition-all ${!m.isVisible ? 'opacity-50 grayscale border-slate-100' : 'border-slate-100 dark:border-slate-800 shadow-sm'}`}>
                  {isCustomizing && (
                    <div className="absolute top-1 right-1 flex items-center space-x-1 z-10">
                      <button
                        onClick={() => setEditMetricTarget({ id: m.id, name: m.name, target: String(m.target) })}
                        className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors text-slate-400 hover:text-blue-500"
                      >
                        <Edit2 className="w-2.5 h-2.5" />
                      </button>
                      <button onClick={() => toggleMetricVisibility(m.id)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors text-slate-400 hover:text-blue-500">
                        {m.isVisible ? <Eye className="w-2.5 h-2.5" /> : <EyeOff className="w-2.5 h-2.5 text-amber-500" />}
                      </button>
                    </div>
                  )}
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    m.id === 'pipeline-total' ? 'bg-slate-50 dark:bg-slate-800 text-slate-400' :
                    m.id === 'emails-collected' ? 'bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600' :
                    'bg-amber-50 dark:bg-amber-900/10 text-amber-600'
                  }`}>
                    {m.id === 'pipeline-total' ? <Target className="w-6 h-6" /> :
                     m.id === 'emails-collected' ? <Mail className="w-6 h-6" /> :
                     <Phone className="w-6 h-6" />}
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{m.name}</p>
                    <p className={`text-2xl font-black ${
                      m.id === 'pipeline-total' ? 'text-slate-900 dark:text-white' :
                      m.id === 'emails-collected' ? 'text-emerald-600 dark:text-emerald-500' :
                      'text-amber-600 dark:text-amber-500'
                    }`}>{count}</p>
                    {isCustomizing && <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">Target: {m.target}</p>}
                  </div>
                </div>
              );
            })}

            {/* Personal Impact Score moved to header - keeping here for future use */}
            {/* <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-2xl shadow-lg shadow-blue-500/20 flex items-center space-x-4 text-white">
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-md">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-[10px] font-black text-blue-100 uppercase tracking-widest">Personal Impact Score</p>
                <p className="text-2xl font-black">{metrics.impactScore}</p>
              </div>
            </div> */}
          </div>

          {selectedChart && (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
              {selectedChart === 'funnel' ? (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center">
                      <PieIcon className="w-3.5 h-3.5 mr-2 text-blue-500" />
                      Pipeline Funnel Analysis
                    </h3>
                    <button
                      onClick={() => setSelectedChart(null)}
                      className="text-[10px] font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest"
                    >
                      Close Analysis
                    </button>
                  </div>
                  <div className="h-[300px] w-full">
                    {leads.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={statusDistribution}
                            innerRadius={80}
                            outerRadius={100}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {statusDistribution.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <RechartsTooltip
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                          />
                          <Legend verticalAlign="middle" align="right" layout="vertical" iconType="circle" />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-slate-300 italic text-xs">No data to display</div>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center">
                      <BarChart3 className="w-3.5 h-3.5 mr-2 text-emerald-500" />
                      Industry Distribution
                    </h3>
                    <button
                      onClick={() => setSelectedChart(null)}
                      className="text-[10px] font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest"
                    >
                      Close Analysis
                    </button>
                  </div>
                  <div className="h-[300px] w-full">
                    {leads.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={industryDistribution}
                            innerRadius={0}
                            outerRadius={100}
                            dataKey="value"
                            label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                          >
                            {industryDistribution.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                            ))}
                          </Pie>
                          <RechartsTooltip
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                          />
                          <Legend verticalAlign="middle" align="right" layout="vertical" iconType="circle" />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-slate-300 italic text-xs">No data to display</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Table Section */}
        <section className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden relative">
          {/* Bulk Actions Bar */}
          {selectedLeadIds.length > 0 && (
            <div className="absolute top-0 inset-x-0 z-10 bg-blue-600 px-8 py-3 flex items-center justify-between animate-in slide-in-from-top duration-300">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-bold text-white">{selectedLeadIds.length} Selected</span>
                <div className="h-4 w-px bg-blue-400" />
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-black text-blue-100 uppercase tracking-widest">Update Status:</span>
                  <div className="flex bg-blue-700/50 rounded-lg p-1">
                    {Object.values(LeadStatus).slice(0, 4).map(status => (
                      <button
                        key={status}
                        onClick={() => handleBulkStatusUpdate(status)}
                        className="px-2 py-1 text-[9px] font-black text-white hover:bg-blue-500 rounded transition-colors uppercase"
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setBulkNoteText('')}
                  className="flex items-center space-x-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-all"
                >
                  <MoreHorizontal className="w-3 h-3" />
                  <span>Bulk Note</span>
                </button>
                <button
                  onClick={() => setSelectedLeadIds([])}
                  className="p-1.5 text-blue-200 hover:text-white transition-colors"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

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
                  <th className="pl-8 pr-2 py-4 w-10">
                    <input
                      type="checkbox"
                      checked={selectedLeadIds.length === filteredLeads.length && filteredLeads.length > 0}
                      onChange={handleSelectAll}
                      className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Business Name</th>
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
                    className={`group hover:bg-slate-50/80 dark:hover:bg-slate-800/40 cursor-pointer transition-colors ${selectedLeadId === lead.id ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''} ${selectedLeadIds.includes(lead.id) ? 'bg-blue-50/30 dark:bg-blue-900/5' : ''}`}
                  >
                    <td className="pl-8 pr-2 py-5" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedLeadIds.includes(lead.id)}
                        onChange={(e) => handleSelectLead(e, lead.id)}
                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-xs shrink-0">
                          {lead.businessName.split(' ').map(n => n[0]).join('').substr(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <p className="text-sm font-black text-slate-900 dark:text-white">{lead.businessName}</p>
                            {isResearchMode && (
                              <div className="flex items-center space-x-1">
                                <button onClick={(e) => openSearch(e, lead.businessName, 'google')} className="p-1 text-slate-300 hover:text-blue-500 transition-colors">
                                  <ExternalLink className="w-3 h-3" />
                                </button>
                                <button onClick={(e) => openSearch(e, lead.businessName, 'sunbiz')} className="p-1 text-slate-300 hover:text-amber-500 transition-colors">
                                  <Building2 className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                          </div>
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
                          <span className={`uppercase tracking-widest ${isResearchMode && calculateResearchProgress(lead) < 100 ? 'text-amber-600 font-black animate-pulse' : 'text-slate-400'}`}>
                            {lead.phone && lead.phone !== 'N/A' ? '' : 'No Phone, '}
                            {lead.email && lead.email !== 'N/A' ? '' : 'No Email, '}
                            {calculateResearchProgress(lead) === 100 ? 'Fully Enriched' : 'Missing Info'}
                          </span>
                          <span className="text-slate-600 dark:text-slate-400">{Math.round(calculateResearchProgress(lead))}%</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-500 ${calculateResearchProgress(lead) === 100 ? 'bg-emerald-500' : (isResearchMode ? 'bg-amber-500' : 'bg-blue-500')}`}
                            style={{ width: `${calculateResearchProgress(lead)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditLeadName({ id: lead.id, name: lead.businessName });
                          }}
                          className="p-2 text-slate-400 hover:text-blue-500 transition-colors"
                          title="Edit Business"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmDeleteLead(lead.id);
                          }}
                          className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                          title="Delete Lead"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredLeads.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-8 py-12 text-center">
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

      {/* Add Product Modal */}
      <SecurityModal
        isOpen={isSecurityModalOpen}
        onClose={() => setIsSecurityModalOpen(false)}
        onSuccess={() => {
          setIsSecurityModalOpen(false);
          setIsPointsUnlocked(true);
          if (isCustomizing) {
            setShowAddProductModal(true);
          }
        }}
        title="Secure Product Customization"
        description="Please enter the authorization code to add products to the Scorecard."
        icon={<Package className="w-8 h-8" />}
        buttonText="Unlock Customization"
      />

      {/* Delete Lead Confirmation */}
      <Modal
        isOpen={!!confirmDeleteLead}
        onClose={() => setConfirmDeleteLead(null)}
        title="Remove Business from Pipeline?"
        footer={
          <div className="flex justify-end space-x-3">
            <button onClick={() => setConfirmDeleteLead(null)} className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 uppercase tracking-widest transition-colors">Cancel</button>
            <button onClick={() => confirmDeleteLead && handleDeleteLeadAction(confirmDeleteLead)} className="px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-red-500/20 hover:bg-red-700 transition-all uppercase tracking-widest">Remove Business</button>
          </div>
        }
      >
        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          Are you sure you want to remove this business from your pipeline? This action cannot be undone.
        </p>
      </Modal>

      {/* Edit Lead Name Modal */}
      <Modal
        isOpen={!!editLeadName}
        onClose={() => setEditLeadName(null)}
        title="Edit Business Name"
        footer={
          <div className="flex justify-end space-x-3">
            <button onClick={() => setEditLeadName(null)} className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 uppercase tracking-widest transition-colors">Cancel</button>
            <button onClick={handleEditLeadAction} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all uppercase tracking-widest">Save Changes</button>
          </div>
        }
      >
        <div className="space-y-4">
          <input
            type="text"
            value={editLeadName?.name || ''}
            onChange={(e) => setEditLeadName(prev => prev ? { ...prev, name: e.target.value } : null)}
            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-4 focus:ring-blue-500/10 outline-none transition-all dark:text-white"
            placeholder="Enter business name"
            autoFocus
          />
        </div>
      </Modal>

      {/* Bulk Note Modal */}
      <Modal
        isOpen={bulkNoteText !== null}
        onClose={() => setBulkNoteText(null)}
        title="Add Bulk Note"
        footer={
          <div className="flex justify-end space-x-3">
            <button onClick={() => setBulkNoteText(null)} className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 uppercase tracking-widest transition-colors">Cancel</button>
            <button onClick={handleBulkNoteAction} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all uppercase tracking-widest">Add Note to All</button>
          </div>
        }
      >
        <div className="space-y-4">
          <textarea
            value={bulkNoteText || ''}
            onChange={(e) => setBulkNoteText(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-4 focus:ring-blue-500/10 outline-none transition-all dark:text-white min-h-[100px] resize-none"
            placeholder="Enter note for selected leads..."
            autoFocus
          />
        </div>
      </Modal>

      {/* Delete Metric Confirmation */}
      <Modal
        isOpen={!!confirmDeleteMetric}
        onClose={() => setConfirmDeleteMetric(null)}
        title="Remove Metric?"
        footer={
          <div className="flex justify-end space-x-3">
            <button onClick={() => setConfirmDeleteMetric(null)} className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 uppercase tracking-widest transition-colors">Cancel</button>
            <button onClick={() => confirmDeleteMetric && deleteMetricAction(confirmDeleteMetric)} className="px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-red-500/20 hover:bg-red-700 transition-all uppercase tracking-widest">Remove Metric</button>
          </div>
        }
      >
        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          Are you sure you want to remove this metric from your scorecard?
        </p>
      </Modal>

      {/* Edit Metric Target Modal */}
      <Modal
        isOpen={!!editMetricTarget}
        onClose={() => setEditMetricTarget(null)}
        title={`Set Target: ${editMetricTarget?.name}`}
        footer={
          <div className="flex justify-end space-x-3">
            <button onClick={() => setEditMetricTarget(null)} className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 uppercase tracking-widest transition-colors">Cancel</button>
            <button onClick={editTargetAction} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all uppercase tracking-widest">Update Target</button>
          </div>
        }
      >
        <div className="space-y-4">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">New Goal Target</label>
          <input
            type="number"
            value={editMetricTarget?.target || ''}
            onChange={(e) => setEditMetricTarget(prev => prev ? { ...prev, target: e.target.value } : null)}
            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-4 focus:ring-blue-500/10 outline-none transition-all dark:text-white"
            placeholder="Enter target number"
            autoFocus
          />
        </div>
      </Modal>

      <SecurityModal
        isOpen={isSecurityModalOpen}
        onClose={() => setIsSecurityModalOpen(false)}
        onSuccess={() => {
          setIsSecurityModalOpen(false);
          setIsPointsUnlocked(true);
          if (isCustomizing) {
            setShowAddProductModal(true);
          }
        }}
        title="Secure Product Customization"
        description="Please enter the authorization code to add products to the Scorecard."
        icon={<Package className="w-8 h-8" />}
        buttonText="Unlock Customization"
      />

      {/* Delete Lead Confirmation */}
      <Modal
        isOpen={!!confirmDeleteLead}
        onClose={() => setConfirmDeleteLead(null)}
        title="Remove Business from Pipeline?"
        footer={
          <div className="flex justify-end space-x-3">
            <button onClick={() => setConfirmDeleteLead(null)} className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 uppercase tracking-widest transition-colors">Cancel</button>
            <button onClick={() => confirmDeleteLead && handleDeleteLeadAction(confirmDeleteLead)} className="px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-red-500/20 hover:bg-red-700 transition-all uppercase tracking-widest">Remove Business</button>
          </div>
        }
      >
        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          Are you sure you want to remove this business from your pipeline? This action cannot be undone.
        </p>
      </Modal>

      {/* Edit Lead Name Modal */}
      <Modal
        isOpen={!!editLeadName}
        onClose={() => setEditLeadName(null)}
        title="Edit Business Name"
        footer={
          <div className="flex justify-end space-x-3">
            <button onClick={() => setEditLeadName(null)} className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 uppercase tracking-widest transition-colors">Cancel</button>
            <button onClick={handleEditLeadAction} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all uppercase tracking-widest">Save Changes</button>
          </div>
        }
      >
        <div className="space-y-4">
          <input
            type="text"
            value={editLeadName?.name || ''}
            onChange={(e) => setEditLeadName(prev => prev ? { ...prev, name: e.target.value } : null)}
            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-4 focus:ring-blue-500/10 outline-none transition-all dark:text-white"
            placeholder="Enter business name"
            autoFocus
          />
        </div>
      </Modal>

      {/* Bulk Note Modal */}
      <Modal
        isOpen={bulkNoteText !== null}
        onClose={() => setBulkNoteText(null)}
        title="Add Bulk Note"
        footer={
          <div className="flex justify-end space-x-3">
            <button onClick={() => setBulkNoteText(null)} className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 uppercase tracking-widest transition-colors">Cancel</button>
            <button onClick={handleBulkNoteAction} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all uppercase tracking-widest">Add Note to All</button>
          </div>
        }
      >
        <div className="space-y-4">
          <textarea
            value={bulkNoteText || ''}
            onChange={(e) => setBulkNoteText(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-4 focus:ring-blue-500/10 outline-none transition-all dark:text-white min-h-[100px] resize-none"
            placeholder="Enter note for selected leads..."
            autoFocus
          />
        </div>
      </Modal>

      {/* Delete Metric Confirmation */}
      <Modal
        isOpen={!!confirmDeleteMetric}
        onClose={() => setConfirmDeleteMetric(null)}
        title="Remove Metric?"
        footer={
          <div className="flex justify-end space-x-3">
            <button onClick={() => setConfirmDeleteMetric(null)} className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 uppercase tracking-widest transition-colors">Cancel</button>
            <button onClick={() => confirmDeleteMetric && deleteMetricAction(confirmDeleteMetric)} className="px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-red-500/20 hover:bg-red-700 transition-all uppercase tracking-widest">Remove Metric</button>
          </div>
        }
      >
        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          Are you sure you want to remove this metric from your scorecard?
        </p>
      </Modal>

      {/* Edit Metric Target Modal */}
      <Modal
        isOpen={!!editMetricTarget}
        onClose={() => setEditMetricTarget(null)}
        title={`Set Target: ${editMetricTarget?.name}`}
        footer={
          <div className="flex justify-end space-x-3">
            <button onClick={() => setEditMetricTarget(null)} className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 uppercase tracking-widest transition-colors">Cancel</button>
            <button onClick={editTargetAction} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all uppercase tracking-widest">Update Target</button>
          </div>
        }
      >
        <div className="space-y-4">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">New Goal Target</label>
          <input
            type="number"
            value={editMetricTarget?.target || ''}
            onChange={(e) => setEditMetricTarget(prev => prev ? { ...prev, target: e.target.value } : null)}
            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-4 focus:ring-blue-500/10 outline-none transition-all dark:text-white"
            placeholder="Enter target number"
            autoFocus
          />
        </div>
      </Modal>

      {showAddProductModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden transform animate-in zoom-in-95 duration-300">
            <div className="px-8 py-6 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Add Product to Scorecard</h3>
                <p className="text-xs text-slate-500 font-medium">Select a product to track in your dashboard.</p>
              </div>
              <button
                onClick={() => setShowAddProductModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="p-8 max-h-[60vh] overflow-y-auto space-y-2">
              {getAllProducts().map((product, i) => {
                const isTracked = metrics.some(m => m.name === product.name);
                return (
                  <button
                    key={i}
                    disabled={isTracked}
                    onClick={() => addProductToScorecard(product.name)}
                    className={`w-full text-left p-4 rounded-2xl border flex items-center justify-between group transition-all ${
                      isTracked
                        ? 'bg-slate-50 border-slate-100 opacity-50 cursor-not-allowed'
                        : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:border-blue-500 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center text-blue-600">
                        <Package className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900 dark:text-white">{product.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                          Points: {getProductPoints(product.name)}
                        </p>
                      </div>
                    </div>
                    {isTracked ? (
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Already Tracked</span>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-700 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                        <Plus className="w-4 h-4" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="px-8 py-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setShowAddProductModal(false)}
                className="px-6 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
