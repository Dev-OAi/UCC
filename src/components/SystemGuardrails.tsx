import React, { useState, useEffect } from 'react';
import { Shield, RotateCcw, Brain, Activity, CheckCircle2, AlertTriangle, Zap, Terminal, RefreshCw } from 'lucide-react';
import { SecurityModal } from './SecurityModal';
import { getBridgeBaseUrl } from '../lib/dataService';

interface SystemGuardrailsProps {
  isOriginalDesign: boolean;
  onToggleDesign: (val: boolean) => void;
}

export const SystemGuardrails: React.FC<SystemGuardrailsProps> = ({ isOriginalDesign, onToggleDesign }) => {
  const [learnedTrends, setLearnedTrends] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [learnedInsights, setLearnedInsights] = useState<any>(null);
  const [isPurgeModalOpen, setIsPurgeModalOpen] = useState(false);

  useEffect(() => {
    fetch('./Data/Intelligence/learned_trends.json')
      .then(res => res.json())
      .then(data => setLearnedTrends(data))
      .catch(() => {});

    fetch('./Data/Intelligence/Learning_History.json')
      .then(res => res.json())
      .then(data => setHistory(data))
      .catch(() => {});

    fetch('./Data/Intelligence/Learned_Insights.json')
      .then(res => res.json())
      .then(data => setLearnedInsights(data))
      .catch(() => {});
  }, []);

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-slate-950 p-6 md:p-10 space-y-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-slate-800 pb-6">
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight flex items-center">
              <Shield className="w-6 h-6 mr-3 text-blue-600" />
              System Status & Guardrails
            </h1>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
              Monitor recursive learning progress and manage application baselines.
            </p>
          </div>
          <div className="flex items-center bg-white dark:bg-slate-900 p-1 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm">
             <button
               onClick={() => onToggleDesign(false)}
               className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${!isOriginalDesign ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-slate-800'}`}
             >
               AI Enhanced
             </button>
             <button
               onClick={() => onToggleDesign(true)}
               className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${isOriginalDesign ? 'bg-amber-600 text-white shadow-lg shadow-amber-500/20' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-slate-800'}`}
             >
               Original Design
             </button>
          </div>
        </div>

        {isOriginalDesign && (
          <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 p-4 rounded-xl flex items-start space-x-4 animate-in fade-in zoom-in-95">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/20 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-amber-800 dark:text-amber-400 uppercase tracking-tight">Safemode Active</p>
              <p className="text-xs text-amber-700 dark:text-amber-500 mt-1">
                The application is running on its original concept baseline. Recursive UI shifts and learned product prioritizations are currently disabled.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Learning Engine Stats */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm space-y-6">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center">
              <Brain className="w-4 h-4 mr-2 text-purple-500" />
              Learning Accuracy Engine
            </h3>

            <div className="space-y-4">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-3xl font-black text-gray-900 dark:text-white">{(learnedTrends?.learning_accuracy * 100 || 0).toFixed(0)}%</p>
                  <p className="text-[10px] font-bold text-gray-500 uppercase">Self-Correction Score</p>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-black text-emerald-500 uppercase tracking-tighter bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded">Optimized</span>
                  <p className="text-[9px] text-gray-400 mt-1 italic">Last audit: {learnedTrends?.last_updated ? new Date(learnedTrends.last_updated).toLocaleDateString() : 'Pending'}</p>
                </div>
              </div>

              <div className="h-2 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all duration-1000"
                  style={{ width: `${(learnedTrends?.learning_accuracy || 0) * 100}%` }}
                />
              </div>

              <div className="p-3 bg-gray-50 dark:bg-slate-800/50 rounded-lg border border-gray-100 dark:border-slate-800">
                <p className="text-[10px] text-gray-500 dark:text-slate-400 leading-relaxed">
                  The system audits its previous industry predictions against new filings every 24 hours to ensure strategic recommendations remain accurate.
                </p>
              </div>
            </div>
          </div>

          {/* Outcome Learning Insights */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm space-y-6">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center">
              <Zap className="w-4 h-4 mr-2 text-amber-500 fill-amber-500" />
              Outcome Learning Insights
            </h3>

            <div className="space-y-4">
               {learnedInsights?.winning_industries?.length > 0 ? (
                 <div className="space-y-3">
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Winning Verticals</p>
                   {learnedInsights.winning_industries.slice(0, 3).map((ind: any, i: number) => (
                     <div key={i} className="flex items-center justify-between p-2 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-lg border border-emerald-100 dark:border-emerald-900/30">
                       <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">{ind.industry}</span>
                       <span className="text-[10px] font-black text-emerald-600">{(ind.weight * 100).toFixed(0)}% SR</span>
                     </div>
                   ))}

                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-4">Conversion Triggers</p>
                   <div className="flex flex-wrap gap-2">
                     {learnedInsights.conversion_triggers.map((t: string, i: number) => (
                       <span key={i} className="px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 text-[9px] font-black uppercase rounded border border-blue-100 dark:border-blue-800">
                         {t}
                       </span>
                     ))}
                   </div>
                 </div>
               ) : (
                 <div className="text-center py-10">
                   <Activity className="w-8 h-8 text-gray-300 mx-auto mb-2 animate-pulse" />
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Collecting Outcome Data...</p>
                 </div>
               )}
            </div>
          </div>

          {/* Terminal / History */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm space-y-4 md:col-span-2">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center">
              <Terminal className="w-4 h-4 mr-2 text-blue-500" />
              Learning History & System Events
            </h3>

            <div className="bg-slate-950 rounded-xl p-4 font-mono text-[10px] space-y-2 max-h-[300px] overflow-y-auto border border-slate-800 shadow-inner">
               {history.slice().reverse().map((entry, i) => (
                 <div key={i} className="flex space-x-4 border-l border-slate-800 pl-3">
                   <span className="text-slate-500">[{new Date(entry.timestamp).toLocaleTimeString()}]</span>
                   <span className="text-blue-400">INFO</span>
                   <span className="text-slate-300">
                     Learning cycle complete. Top industry: <span className="text-emerald-400">{entry.top_industry}</span>.
                     Accuracy: <span className="text-amber-400">{(entry.accuracy * 100).toFixed(0)}%</span>
                   </span>
                 </div>
               ))}
               <div className="flex space-x-4 border-l border-slate-800 pl-3">
                  <span className="text-slate-500">[{new Date().toLocaleTimeString()}]</span>
                  <span className="text-purple-400">WAIT</span>
                  <span className="text-slate-300 animate-pulse">Monitoring data streams for next upgrade cycle...</span>
               </div>
            </div>
          </div>

          {/* Reset / Backup Action */}
          <div className="md:col-span-2 border-2 border-dashed border-gray-200 dark:border-slate-800 rounded-2xl p-8 text-center space-y-4">
             <div className="w-12 h-12 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto">
               <RotateCcw className="w-6 h-6 text-gray-400" />
             </div>
             <div>
               <h4 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">Full System Rollback</h4>
               <p className="text-xs text-gray-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
                 Immediately clear all learned intelligence and return to the hard-coded baseline concept. Use this if AI-driven shifts become unstable.
               </p>
             </div>
             <button
               className="px-6 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-red-600 dark:text-red-400 text-xs font-black rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-all uppercase tracking-widest"
               onClick={() => setIsPurgeModalOpen(true)}
             >
               Purge Memory & Restore Baseline
             </button>
          </div>
        </div>
      </div>

      <SecurityModal
        isOpen={isPurgeModalOpen}
        onClose={() => setIsPurgeModalOpen(false)}
        onSuccess={async () => {
          try {
            const baseUrl = getBridgeBaseUrl();
            if (baseUrl) {
              await fetch(`${baseUrl}/system/purge`, { method: 'POST' });
            }
          } catch (e) {
            console.error('Remote purge failed', e);
          }

          // Clear all local state
          localStorage.removeItem('isOriginalDesign');
          localStorage.removeItem('scorecardLeads');
          localStorage.removeItem('scorecardMetrics');
          localStorage.removeItem('productGuides');
          localStorage.removeItem('sales_callEntries');
          localStorage.removeItem('sales_emailEntries');
          localStorage.removeItem('sales_meetingEntries');
          localStorage.removeItem('banker_roleplay_score');
          localStorage.removeItem('banker_roleplay_completed');

          onToggleDesign(true);
          window.location.reload();
        }}
        title="System Reset Authorization"
        description="Please enter the authorization code to purge system memory and restore the baseline."
        icon={<RefreshCw className="w-8 h-8 text-red-600" />}
        buttonText="Authorize Reset"
        variant="red"
      />
    </div>
  );
};
