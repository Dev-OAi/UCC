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
        documentClone.querySelectorAll('input, textarea, select').forEach(el => {
            const input = el as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
            const staticEl = documentClone.createElement('div');
            staticEl.style.cssText = window.getComputedStyle(input).cssText;
            staticEl.style.color = 'black';
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
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-8 pb-20 p-4 md:p-8">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 no-print">
         <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Manager's Daily Brief</h1>
            <p className="text-sm text-gray-500 font-medium">Record and analyze daily performance benchmarks.</p>
         </div>
         <div className="flex gap-3">
             <button onClick={handleReset} className="bg-white hover:bg-gray-50 text-gray-700 px-6 py-2.5 rounded-lg text-sm font-bold border border-gray-200 flex items-center gap-2 transition-all active:scale-95">
                 <RefreshIcon className="w-4 h-4" />
                 Reset Log
             </button>
             <button onClick={handlePrintAndSave} disabled={isSaving} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg text-sm font-bold shadow-lg shadow-indigo-100 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50">
                 {isSaving ? <LoadingIcon className="w-4 h-4" /> : <PrintIcon className="w-4 h-4" />}
                 {isSaving ? 'Saving...' : 'Export Manager Report'}
             </button>
         </div>
      </div>

      <div className="p-4 md:p-10 bg-white rounded-3xl shadow-xl border border-gray-100" ref={printContainerRef}>
          <header className="flex flex-col lg:flex-row justify-between items-start mb-10 border-b-2 border-gray-900 pb-8 gap-10">
              <div className="flex-1 w-full">
                  <h1 id="daily-sales-activity-log" className="text-3xl font-black text-gray-900 uppercase tracking-tighter mb-2">Daily Sales Activity Report</h1>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 mt-8 text-sm font-bold text-gray-600 w-full">
                      <div className="flex items-center gap-3 border-b border-gray-100 pb-1 min-w-0">
                          <span className="text-gray-400 uppercase text-[10px] tracking-widest whitespace-nowrap w-16">Region:</span>
                          <input type="text" aria-label="Region" value={headerInfo.region} onChange={e => setHeaderInfo(p => ({...p, region: e.target.value}))} className="bg-transparent focus:border-indigo-500 p-0 text-gray-900 outline-none flex-1 min-w-0" />
                      </div>
                      <div className="flex items-center gap-3 border-b border-gray-100 pb-1 min-w-0">
                          <span className="text-gray-400 uppercase text-[10px] tracking-widest whitespace-nowrap w-16">Manager:</span>
                          <input type="text" aria-label="Manager" placeholder="Enter name..." value={headerInfo.manager} onChange={e => setHeaderInfo(p => ({...p, manager: e.target.value}))} className="bg-transparent focus:border-indigo-500 p-0 text-gray-900 outline-none flex-1 min-w-0" />
                      </div>
                      <div className="flex items-center gap-3 border-b border-gray-100 pb-1 min-w-0">
                          <span className="text-gray-400 uppercase text-[10px] tracking-widest whitespace-nowrap w-16">Date:</span>
                          <input type="date" aria-label="Date" value={headerInfo.date} onChange={e => setHeaderInfo(p => ({...p, date: e.target.value}))} className="bg-transparent focus:border-indigo-500 p-0 text-gray-900 outline-none flex-1 min-w-0" />
                      </div>
                      <div className="flex items-center gap-3 border-b border-gray-100 pb-1 min-w-0">
                          <span className="text-gray-400 uppercase text-[10px] tracking-widest whitespace-nowrap w-16">Dept:</span>
                          <input type="text" aria-label="Dept" placeholder="Enter department..." value={headerInfo.dept} onChange={e => setHeaderInfo(p => ({...p, dept: e.target.value}))} className="bg-transparent focus:border-indigo-500 p-0 text-gray-900 outline-none flex-1 min-w-0" />
                      </div>
                  </div>
              </div>
              <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 text-center min-w-[200px] self-center lg:self-start">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Impact Score</span>
                  <div className="text-4xl font-black text-indigo-600">{(callSummary.total + emailSummary.total + meetingSummary.total * 2)}</div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase block mt-1">Weighted Activity</span>
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

              <div className="pt-10 border-t-2 border-gray-900 print-break-inside-avoid">
                <div className="flex items-center gap-3 mb-6">
                    <SparklesIcon className="w-6 h-6 text-indigo-600" />
                    <h2 id="daily-summary-and-metrics" className="text-xl font-black text-gray-900 uppercase tracking-tight">4. Key Metrics & Strategic Summary</h2>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-7">
                        <table className="w-full text-sm text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50">
                                    <th className="p-3 border border-gray-100 font-black text-gray-400 uppercase text-[10px] tracking-widest">Benchmark Metric</th>
                                    <th className="p-3 border border-gray-100 font-black text-gray-400 uppercase text-[10px] tracking-widest w-24">Actual</th>
                                    <th className="p-3 border border-gray-100 font-black text-gray-400 uppercase text-[10px] tracking-widest">Notes</th>
                                </tr>
                            </thead>
                            <tbody>
                                {metrics.map((metric, index) => (
                                    <tr key={metric.metric} className="hover:bg-gray-50/50">
                                        <td className="p-3 border border-gray-100 font-bold text-gray-700">{metric.metric}</td>
                                        <td className="p-1 border border-gray-100">
                                            <input
                                                type="number"
                                                value={metric.number}
                                                onChange={(e) => handleMetricChange(index, 'number', parseInt(e.target.value) || 0)}
                                                className="w-full p-2 bg-transparent font-black text-indigo-600 text-center outline-none"
                                            />
                                        </td>
                                        <td className="p-1 border border-gray-100">
                                            <input
                                                type="text"
                                                value={metric.comments}
                                                onChange={(e) => handleMetricChange(index, 'comments', e.target.value)}
                                                className="w-full p-2 bg-transparent text-gray-600 outline-none italic text-xs"
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="lg:col-span-5 flex flex-col h-full">
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Strategic Briefing / Roadblocks</label>
                        <textarea
                            rows={10}
                            value={strategicBrief}
                            onChange={e => setStrategicBrief(e.target.value)}
                            className="flex-grow w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 font-serif text-sm text-gray-700 placeholder-gray-300 resize-none focus:bg-white focus:border-indigo-500 transition-all outline-none"
                            placeholder="Highlight key wins, competitive intelligence, or support required..."
                        ></textarea>
                    </div>
                </div>
              </div>

              <div className="mt-16 flex justify-between items-end text-sm text-gray-800 print-break-inside-avoid">
                  <div className="space-y-1">
                      <div className="border-b-2 border-gray-900 w-64 h-1"></div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest pt-2">Sales Manager Authorization</p>
                  </div>
                  <div className="space-y-1">
                      <div className="border-b-2 border-gray-900 w-32 h-1"></div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest pt-2">Filing Date</p>
                  </div>
              </div>
          </div>
      </div>
      </div>
    </div>
  );
};
