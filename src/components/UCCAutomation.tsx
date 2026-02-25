import React, { useState, useEffect } from 'react';
import { Settings, Play, CheckCircle2, AlertCircle, Loader2, Info, ChevronRight, BarChart3, Clock, FileText, Upload, Plus } from 'lucide-react';
import { fetchPendingJobs, fetchJobStatus, startScrape, uploadCsv, PendingJob, JobStatus } from '../lib/dataService';
import { Modal } from './ui';

interface UCCAutomationProps {
  onComplete: () => void;
}

export const UCCAutomation: React.FC<UCCAutomationProps> = ({ onComplete }) => {
  const [pendingJobs, setPendingJobs] = useState<PendingJob[]>([]);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const [selectedFile, setSelectedFile] = useState<PendingJob | null>(null);
  const [selectedColumn, setSelectedColumn] = useState<string>('');
  const [threshold, setThreshold] = useState<number>(0.7);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

  useEffect(() => {
    refreshPending();
    const interval = setInterval(refreshPending, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (activeJobId) {
      const interval = setInterval(async () => {
        const status = await fetchJobStatus(activeJobId);
        setJobStatus(status);
        if (status?.status === 'Completed') {
          setActiveJobId(null);
          refreshPending();
          onComplete();
        }
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [activeJobId]);

  const refreshPending = async () => {
    const jobs = await fetchPendingJobs();
    setPendingJobs(jobs);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      alert('Please upload a CSV file.');
      return;
    }

    setUploading(true);
    const success = await uploadCsv(file);
    if (success) {
      setTimeout(refreshPending, 1500); // Give watcher a moment to move it to staging
    } else {
      alert('Failed to upload file. Is the bridge running?');
    }
    setUploading(false);
    e.target.value = '';
  };

  const handleStartScrape = async () => {
    if (!selectedFile || !selectedColumn) return;
    setLoading(true);
    const jobId = await startScrape(selectedFile.filename, selectedColumn, threshold);
    if (jobId) {
      setActiveJobId(jobId);
      setIsConfigModalOpen(false);
    } else {
      alert('Failed to start scrape. Is the bridge running?');
    }
    setLoading(false);
  };

  const openConfig = (job: PendingJob) => {
    setSelectedFile(job);
    // Auto-detect column if possible
    const possibleNames = ["business name", "entity name", "name", "business", "company", "directname", "debtor"];
    const autoDetected = job.headers.find(h =>
      possibleNames.some(p => h.toLowerCase().includes(p))
    );
    setSelectedColumn(autoDetected || job.headers[0] || '');
    setIsConfigModalOpen(true);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-6 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-600 rounded-lg text-white">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">UCC Automation Center</h2>
            <p className="text-xs text-slate-500">Manage and monitor Florida UCC API scraping tasks</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <label className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold cursor-pointer transition-all ${
            uploading ? 'bg-slate-100 text-slate-400' : 'bg-white border border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-600'
          }`}>
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {uploading ? 'Uploading...' : 'Upload CSV'}
            <input
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFileUpload}
              disabled={uploading}
            />
          </label>
          <button
            onClick={refreshPending}
            className="p-2 hover:bg-white rounded-md transition-colors border border-transparent hover:border-slate-200 text-slate-400"
          >
            <Clock className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="p-4">
        {/* Active Job Progress */}
        {jobStatus && (
          <div className="mb-8 p-4 bg-blue-50 rounded-xl border border-blue-100">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-sm animate-pulse">
                  <Loader2 className="w-5 h-5 animate-spin" />
                </div>
                <div>
                  <h3 className="font-bold text-blue-900">Scraping in Progress...</h3>
                  <p className="text-sm text-blue-700 truncate max-w-[300px]">{jobStatus.filename}</p>
                </div>
              </div>
              <span className="px-3 py-1 bg-blue-200 text-blue-800 rounded-full text-xs font-bold uppercase tracking-wider">
                {Math.round(jobStatus.progress)}%
              </span>
            </div>

            <div className="w-full bg-blue-200 rounded-full h-2.5 mb-3">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(37,99,235,0.4)]"
                style={{ width: `${jobStatus.progress}%` }}
              ></div>
            </div>

            <div className="flex items-center justify-between text-xs text-blue-600 font-medium">
              <span>Processing: {jobStatus.current_name || '...'}</span>
              <span>{Math.round(jobStatus.total * (jobStatus.progress / 100))} / {jobStatus.total} Records</span>
            </div>

            {jobStatus.errors.length > 0 && (
              <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-lg max-h-32 overflow-y-auto">
                <div className="flex items-center gap-2 text-red-700 font-bold text-xs mb-2">
                  <AlertCircle className="w-3.5 h-3.5" />
                  System Logs / Errors
                </div>
                {jobStatus.errors.map((err, i) => (
                  <div key={i} className="text-[10px] text-red-600 font-mono mb-1 border-l-2 border-red-200 pl-2">
                    {err}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Pending Uploads */}
        <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2 uppercase tracking-wider">
          <FileText className="w-4 h-4 text-blue-600" />
          Pending Scrapes ({pendingJobs.length})
        </h3>

        {pendingJobs.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-6 h-6 text-slate-300" />
            </div>
            <p className="text-slate-500 font-medium">All caught up! No pending uploads.</p>
            <p className="text-xs text-slate-400 mt-1">Upload a CSV to the 'Uploads' folder to start.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {pendingJobs.map((job) => (
              <div
                key={job.filename}
                className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:border-blue-300 hover:bg-blue-50/30 transition-all group shadow-sm bg-white"
              >
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-slate-100 rounded-lg text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 group-hover:text-blue-900 transition-colors">{job.filename}</h4>
                    <p className="text-xs text-slate-500">
                      Detected {job.headers.length} columns • Added {new Date(job.added_at * 1000).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => openConfig(job)}
                  disabled={!!activeJobId}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all shadow-sm ${
                    activeJobId
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md active:scale-95'
                  }`}
                >
                  <Play className="w-4 h-4" />
                  Configure & Start
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Configuration Modal */}
      {isConfigModalOpen && selectedFile && (
        <Modal
          isOpen={isConfigModalOpen}
          onClose={() => setIsConfigModalOpen(false)}
          title="Configure UCC Scrape"
        >
          <div className="space-y-6 py-2">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Business Name Column
              </label>
              <select
                value={selectedColumn}
                onChange={(e) => setSelectedColumn(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              >
                {selectedFile.headers.map((h, i) => (
                  <option key={i} value={h}>{h}</option>
                ))}
              </select>
              <p className="text-[10px] text-slate-400 mt-2 italic px-1">
                Select the column containing the business or debtor names to search.
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Similarity Threshold
                </label>
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-bold">
                  {Math.round(threshold * 100)}% Match
                </span>
              </div>
              <input
                type="range"
                min="0.4"
                max="0.95"
                step="0.05"
                value={threshold}
                onChange={(e) => setThreshold(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-medium mt-1">
                <span>Broader (40%)</span>
                <span>Stricter (95%)</span>
              </div>
            </div>

            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 flex gap-3">
              <Info className="w-5 h-5 text-blue-500 shrink-0" />
              <div className="text-xs text-blue-700 leading-relaxed">
                <span className="font-bold">Recommendation:</span>
                For typical banker lists, <strong>70-80%</strong> provides the best balance between accuracy and coverage.
                All results will be appended to the <span className="font-bold italic">UCC Results</span> hub.
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-100">
              <button
                onClick={() => setIsConfigModalOpen(false)}
                className="flex-1 px-4 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleStartScrape}
                disabled={loading}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-md hover:shadow-lg active:scale-95 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
                Start Scraper
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
