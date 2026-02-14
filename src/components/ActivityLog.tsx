import React, { useState, useEffect, useRef } from 'react';
import { CallEntry, EmailEntry, MeetingEntry, Metric } from '../types';
import { LogSection } from './LogSection';
import { PrintIcon, LoadingIcon, RefreshIcon, SparklesIcon } from './icons';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const initialCallEntries: CallEntry[] = [
  { id: 'call-1', time: '09:30', client: 'Innovate Inc.', contact: 'John Smith', callType: 'Follow-up', outcome: 'Confirmed interest, scheduled demo for Friday.', nextAction: 'Send demo confirmation email.', followUpDate: '2026-11-14' }
];
const initialEmailEntries: EmailEntry[] = [
  { id: 'email-1', timeSent: '11:00', client: 'Solutions LLC', subject: 'Re: Proposal', emailType: 'Proposal', responseReceived: true, nextStep: 'Follow up call tomorrow.' }
];
const initialMeetingEntries: MeetingEntry[] = [
  { id: 'meeting-1', time: '14:00', client: 'Global Tech', attendees: 'Sarah Brown, Mike Lee', meetingType: 'Closing', summary: 'Finalized contract terms. Positive outcome.', outcome: 'Deal closed.', nextAction: 'Send final contract for signature.', followUpDate: '2026-11-11' }
];

const initialMetricsState: Metric[] = [
    { metric: 'Total Calls', number: 0, comments: '' },
    { metric: 'Total Emails', number: 0, comments: '' },
    { metric: 'Total Meetings', number: 0, comments: '' },
    { metric: 'New Leads Generated', number: 0, comments: '' },
    { metric: 'Deals in Pipeline', number: 0, comments: '' },
    { metric: 'Deals Closed Today', number: 0, comments: '' },
    { metric: 'Revenue Closed', number: 0, comments: '' },
];


export const ActivityLog: React.FC = () => {
  const [callEntries, setCallEntries] = useState<CallEntry[]>(() => {
    const saved = localStorage.getItem('sales_callEntries');
    return saved ? JSON.parse(saved) : initialCallEntries;
  });
  const [emailEntries, setEmailEntries] = useState<EmailEntry[]>(() => {
    const saved = localStorage.getItem('sales_emailEntries');
    return saved ? JSON.parse(saved) : initialEmailEntries;
  });
  const [meetingEntries, setMeetingEntries] = useState<MeetingEntry[]>(() => {
    const saved = localStorage.getItem('sales_meetingEntries');
    return saved ? JSON.parse(saved) : initialMeetingEntries;
  });
  const [metrics, setMetrics] = useState<Metric[]>(() => {
    const saved = localStorage.getItem('sales_metrics');
    return saved ? JSON.parse(saved) : initialMetricsState;
  });
  const [headerInfo, setHeaderInfo] = useState(() => {
    const saved = localStorage.getItem('sales_headerInfo');
    return saved ? JSON.parse(saved) : {
        region: '',
        manager: '',
        date: new Date().toISOString().split('T')[0],
        dept: ''
    };
  });
  const [strategicBrief, setStrategicBrief] = useState(() => {
    return localStorage.getItem('sales_strategicBrief') || '';
  });

  const [isSaving, setIsSaving] = useState(false);
  const printContainerRef = useRef<HTMLDivElement>(null);

  // Persistence
  useEffect(() => { localStorage.setItem('sales_callEntries', JSON.stringify(callEntries)); }, [callEntries]);
  useEffect(() => { localStorage.setItem('sales_emailEntries', JSON.stringify(emailEntries)); }, [emailEntries]);
  useEffect(() => { localStorage.setItem('sales_meetingEntries', JSON.stringify(meetingEntries)); }, [meetingEntries]);
  useEffect(() => { localStorage.setItem('sales_metrics', JSON.stringify(metrics)); }, [metrics]);
  useEffect(() => { localStorage.setItem('sales_headerInfo', JSON.stringify(headerInfo)); }, [headerInfo]);
  useEffect(() => { localStorage.setItem('sales_strategicBrief', strategicBrief); }, [strategicBrief]);

  const callSummary = {
    total: callEntries.length,
    successful: callEntries.filter(c => c.outcome.toLowerCase().includes('confirm') || c.outcome.toLowerCase().includes('schedul')).length,
    appointments: callEntries.filter(c => c.outcome.toLowerCase().includes('schedul') || c.outcome.toLowerCase().includes('appoint')).length,
  };

  const emailSummary = {
    total: emailEntries.length,
    responses: emailEntries.filter(e => e.responseReceived).length,
    proposals: emailEntries.filter(e => e.emailType === 'Proposal').length,
  };

  const meetingSummary = {
    total: meetingEntries.length,
    closed: meetingEntries.filter(m => m.outcome.toLowerCase().includes('closed') || m.outcome.toLowerCase().includes('deal')).length,
  };

  useEffect(() => {
    setMetrics(prevMetrics => {
        const newMetrics = [...prevMetrics];
        newMetrics[0].number = callSummary.total;
        newMetrics[1].number = emailSummary.total;
        newMetrics[2].number = meetingSummary.total;
        newMetrics[5].number = meetingSummary.closed;
        return newMetrics;
    });
  }, [callSummary.total, emailSummary.total, meetingSummary.total, meetingSummary.closed]);


  const handleMetricChange = (index: number, field: 'number' | 'comments', value: string | number) => {
    setMetrics(prevMetrics => {
        const newMetrics = [...prevMetrics];
        (newMetrics[index] as any)[field] = value;
        return newMetrics;
    });
  };

  const handlePrintAndSave = async () => {
    if (!printContainerRef.current) return;
    setIsSaving(true);

    const canvas = await html2canvas(printContainerRef.current, {
      scale: 2,
      useCORS: true,
      onclone: (documentClone: Document) => {
        const printableArea = documentClone.getElementById('printable-report');
        if (printableArea) {
            printableArea.style.backgroundColor = 'white';
            printableArea.style.color = 'black';
            printableArea.style.boxShadow = 'none';
            printableArea.style.border = 'none';
            printableArea.style.borderRadius = '0';
        }

        documentClone.querySelectorAll('h1, h2, h3, h4, span, label, td, th, p').forEach(el => {
            (el as HTMLElement).style.color = 'black';
        });

        documentClone.querySelectorAll('input, textarea, select').forEach(el => {
            const input = el as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
            const staticEl = documentClone.createElement('div');
            staticEl.style.cssText = window.getComputedStyle(input).cssText;
            staticEl.style.color = 'black';
            staticEl.style.backgroundColor = 'white';
            staticEl.style.padding = '0.4rem 0.6rem';
            staticEl.style.border = '1px solid #eee';
            staticEl.style.borderRadius = '4px';
            staticEl.style.fontSize = '12px';
            staticEl.style.minHeight = `${input.offsetHeight}px`;
            staticEl.style.width = '100%';

            if (input.type === 'checkbox') {
                staticEl.textContent = (input as HTMLInputElement).checked ? '✓' : '';
                staticEl.style.textAlign = 'center';
            } else if (input.tagName.toLowerCase() === 'select') {
                staticEl.textContent = (input as HTMLSelectElement).value;
            } else {
                staticEl.textContent = input.value;
            }
            input.parentNode?.replaceChild(staticEl, input);
        });
        documentClone.querySelectorAll('.no-print').forEach(el => {
          (el as HTMLElement).style.display = 'none';
        });
      }
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: 'a4' });
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const ratio = canvas.width / pdfWidth;
    const imgHeight = canvas.height / ratio;

    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, imgHeight);
    pdf.save('Manager_Sales_Report.pdf');
    setIsSaving(false);
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to clear all entries?')) {
        setCallEntries([]);
        setEmailEntries([]);
        setMeetingEntries([]);
        setMetrics(initialMetricsState);
        setStrategicBrief('');
        setHeaderInfo({
            region: '',
            manager: '',
            date: new Date().toISOString().split('T')[0],
            dept: ''
        });
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-slate-950 transition-colors">
      <div className="max-w-6xl mx-auto space-y-6 pb-20 p-4 md:p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 no-print">
         <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Manager's Daily Brief</h1>
            <p className="text-sm text-gray-500 dark:text-slate-400 font-medium">Record and analyze daily performance benchmarks.</p>
         </div>
         <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
             <button onClick={handleReset} className="bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 px-6 py-2.5 rounded-xl text-sm font-bold border border-gray-200 dark:border-slate-700 flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm">
                 <RefreshIcon className="w-4 h-4" />
                 Reset Log
             </button>
             <button onClick={handlePrintAndSave} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50">
                 {isSaving ? <LoadingIcon className="w-4 h-4" /> : <PrintIcon className="w-4 h-4" />}
                 {isSaving ? 'Saving...' : 'Export Manager Report'}
             </button>
         </div>
      </div>

      <div id="printable-report" className="p-4 md:p-10 bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-gray-100 dark:border-slate-800 transition-colors" ref={printContainerRef}>
          <header className="flex flex-col lg:flex-row justify-between items-start mb-10 border-b-2 border-gray-900 dark:border-slate-700 pb-8 gap-8">
              <div className="flex-1 w-full">
                  <h1 id="daily-sales-activity-log" className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter mb-2">Daily Sales Activity Report</h1>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 mt-8 text-sm font-bold text-gray-600 dark:text-slate-400 w-full">
                      <div className="flex items-center gap-3 border-b border-gray-100 dark:border-slate-800 pb-1 min-w-0">
                          <span className="text-gray-400 dark:text-slate-500 uppercase text-[10px] tracking-widest whitespace-nowrap w-16">Region:</span>
                          <input type="text" aria-label="Region" value={headerInfo.region} onChange={e => setHeaderInfo(p => ({...p, region: e.target.value}))} className="bg-transparent focus:text-blue-600 dark:focus:text-blue-400 p-0 text-gray-900 dark:text-white outline-none flex-1 min-w-0" />
                      </div>
                      <div className="flex items-center gap-3 border-b border-gray-100 dark:border-slate-800 pb-1 min-w-0">
                          <span className="text-gray-400 dark:text-slate-500 uppercase text-[10px] tracking-widest whitespace-nowrap w-16">Manager:</span>
                          <input type="text" aria-label="Manager" placeholder="Enter name..." value={headerInfo.manager} onChange={e => setHeaderInfo(p => ({...p, manager: e.target.value}))} className="bg-transparent focus:text-blue-600 dark:focus:text-blue-400 p-0 text-gray-900 dark:text-white outline-none flex-1 min-w-0" />
                      </div>
                      <div className="flex items-center gap-3 border-b border-gray-100 dark:border-slate-800 pb-1 min-w-0">
                          <span className="text-gray-400 dark:text-slate-500 uppercase text-[10px] tracking-widest whitespace-nowrap w-16">Date:</span>
                          <input type="date" aria-label="Date" value={headerInfo.date} onChange={e => setHeaderInfo(p => ({...p, date: e.target.value}))} className="bg-transparent focus:text-blue-600 dark:focus:text-blue-400 p-0 text-gray-900 dark:text-white outline-none flex-1 min-w-0" />
                      </div>
                      <div className="flex items-center gap-3 border-b border-gray-100 dark:border-slate-800 pb-1 min-w-0">
                          <span className="text-gray-400 dark:text-slate-500 uppercase text-[10px] tracking-widest whitespace-nowrap w-16">Dept:</span>
                          <input type="text" aria-label="Dept" placeholder="Enter department..." value={headerInfo.dept} onChange={e => setHeaderInfo(p => ({...p, dept: e.target.value}))} className="bg-transparent focus:text-blue-600 dark:focus:text-blue-400 p-0 text-gray-900 dark:text-white outline-none flex-1 min-w-0" />
                      </div>
                  </div>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/10 p-4 md:p-6 rounded-2xl border border-blue-100 dark:border-blue-900/20 text-center min-w-[160px] self-center lg:self-start flex lg:flex-col items-center justify-between lg:justify-center gap-4 lg:gap-1 w-full lg:w-auto">
                  <div className="text-left lg:text-center">
                    <span className="text-[10px] font-black text-blue-400 dark:text-blue-500 uppercase tracking-widest block">Impact Score</span>
                    <span className="hidden lg:block text-[10px] font-bold text-blue-300 dark:text-blue-800 uppercase">Weighted Activity</span>
                  </div>
                  <div className="text-4xl md:text-5xl font-black text-blue-600 dark:text-blue-400">{(callSummary.total + emailSummary.total + meetingSummary.total * 2)}</div>
                  <span className="lg:hidden text-[10px] font-bold text-blue-300 dark:text-blue-800 uppercase">Weighted Activity</span>
              </div>
          </header>

          <div className="space-y-12">
              <LogSection<CallEntry>
                title="1. Outreach: Call Log"
                entries={callEntries}
                setEntries={setCallEntries}
                entryType="call"
                summaryItems={[
                  { label: 'Total Volume', value: callSummary.total },
                  { label: 'Successful Conversations', value: callSummary.successful },
                  { label: 'Appointments Scheduled', value: callSummary.appointments },
                ]}
              />

              <LogSection<EmailEntry>
                title="2. Outreach: Email Log"
                entries={emailEntries}
                setEntries={setEmailEntries}
                entryType="email"
                summaryItems={[
                  { label: 'Outbound Emails', value: emailSummary.total },
                  { label: 'Direct Responses', value: emailSummary.responses },
                  { label: 'Proposals Delivered', value: emailSummary.proposals },
                ]}
              />

              <LogSection<MeetingEntry>
                title="3. High-Value Engagements: Meetings"
                entries={meetingEntries}
                setEntries={setMeetingEntries}
                entryType="meeting"
                summaryItems={[
                  { label: 'Total Meetings', value: meetingSummary.total },
                  { label: 'Closing Discussions', value: meetingSummary.closed },
                ]}
              />

              <div className="pt-10 border-t-2 border-gray-900 dark:border-slate-700 print-break-inside-avoid">
                <div className="flex items-center gap-3 mb-6">
                    <SparklesIcon className="w-6 h-6 text-blue-600" />
                    <h2 id="daily-summary-and-metrics" className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">4. Key Metrics & Strategic Summary</h2>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-7 overflow-x-auto">
                        <table className="w-full text-sm text-left border-collapse min-w-[500px]">
                            <thead>
                                <tr className="bg-gray-50 dark:bg-slate-800/50">
                                    <th className="p-3 border border-gray-100 dark:border-slate-700 font-black text-gray-400 dark:text-slate-500 uppercase text-[10px] tracking-widest">Benchmark Metric</th>
                                    <th className="p-3 border border-gray-100 dark:border-slate-700 font-black text-gray-400 dark:text-slate-500 uppercase text-[10px] tracking-widest w-24 text-center">Actual</th>
                                    <th className="p-3 border border-gray-100 dark:border-slate-700 font-black text-gray-400 dark:text-slate-500 uppercase text-[10px] tracking-widest">Notes</th>
                                </tr>
                            </thead>
                            <tbody>
                                {metrics.map((metric, index) => (
                                    <tr key={metric.metric} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/30">
                                        <td className="p-3 border border-gray-100 dark:border-slate-700 font-bold text-gray-700 dark:text-slate-300">{metric.metric}</td>
                                        <td className="p-1 border border-gray-100 dark:border-slate-700">
                                            <input
                                                type="number"
                                                aria-label={metric.metric}
                                                value={metric.number}
                                                onChange={(e) => handleMetricChange(index, 'number', parseInt(e.target.value) || 0)}
                                                className="w-full p-2 bg-transparent font-black text-blue-600 dark:text-blue-400 text-center outline-none"
                                            />
                                        </td>
                                        <td className="p-1 border border-gray-100 dark:border-slate-700">
                                            <input
                                                type="text"
                                                aria-label={`${metric.metric} Notes`}
                                                value={metric.comments}
                                                onChange={(e) => handleMetricChange(index, 'comments', e.target.value)}
                                                className="w-full p-2 bg-transparent text-gray-600 dark:text-slate-400 outline-none italic text-xs"
                                                placeholder="Add notes..."
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="lg:col-span-5 flex flex-col h-full">
                        <label className="block text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-3">Strategic Briefing / Roadblocks</label>
                        <textarea
                            rows={10}
                            value={strategicBrief}
                            onChange={e => setStrategicBrief(e.target.value)}
                            className="flex-grow w-full p-4 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border border-gray-100 dark:border-slate-700 font-serif text-sm text-gray-700 dark:text-slate-300 placeholder-gray-300 dark:placeholder-slate-600 resize-none focus:bg-white dark:focus:bg-slate-800 focus:border-blue-500 transition-all outline-none"
                            placeholder="Highlight key wins, competitive intelligence, or support required..."
                        ></textarea>
                    </div>
                </div>
              </div>

              <div className="mt-16 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-10 text-sm text-gray-800 dark:text-slate-200 print-break-inside-avoid">
                  <div className="space-y-1 w-full sm:w-auto">
                      <div className="border-b-2 border-gray-900 dark:border-slate-700 w-full sm:w-64 h-1"></div>
                      <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest pt-2">Sales Manager Authorization</p>
                  </div>
                  <div className="space-y-1 w-full sm:w-auto text-right">
                      <div className="border-b-2 border-gray-900 dark:border-slate-700 w-full sm:w-32 h-1 ml-auto"></div>
                      <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest pt-2">Filing Date</p>
                  </div>
              </div>
          </div>
      </div>
      </div>
    </div>
  );
};
