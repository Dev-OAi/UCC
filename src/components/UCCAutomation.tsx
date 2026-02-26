import React, { useState, useEffect, useRef } from 'react';
import { Settings, Play, CheckCircle2, AlertCircle, Loader2, Info, ChevronRight, BarChart3, Clock, FileText, Upload, Plus, Search, Server, RefreshCw, Zap, ShieldCheck, Cloud, Github, Globe } from 'lucide-react';
import { fetchPendingJobs, fetchJobStatus, startScrape, uploadCsv, triggerManualSearch, fetchSystemStatus, restartSystem, PendingJob, JobStatus, dispatchUccAction, getGithubConfig, saveGithubConfig, GithubConfig } from '../lib/dataService';
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
  const [mode, setMode] = useState<'standard' | 'lite'>('standard');
  const [automationMode, setAutomationMode] = useState<'local' | 'cloud'>('local');
  const [manualTerm, setManualTerm] = useState('');
  const [systemStatus, setSystemStatus] = useState<{ bridge: string; watcher: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isGithubModalOpen, setIsGithubModalOpen] = useState(false);

  // GitHub Config State
  const [githubToken, setGithubToken] = useState('');
  const [githubOwner, setGithubOwner] = useState('');
  const [githubRepo, setGithubRepo] = useState('');
  const [githubBranch, setGithubBranch] = useState('main');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Load GitHub Config
    const config = getGithubConfig();
    if (config) {
      setGithubToken(config.token);
      setGithubOwner(config.owner);
      setGithubRepo(config.repo);
      setGithubBranch(config.branch);
    }

    refreshPending();
    checkSystem();
    const interval = setInterval(() => {
      refreshPending();
      checkSystem();
    }, 5000);
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

  const checkSystem = async () => {
    const status = await fetchSystemStatus();
    setSystemStatus(status);
  };

  const handleRestart = async () => {
    setLoading(true);
    const success = await restartSystem();
    if (success) {
      setTimeout(checkSystem, 2000);
    } else {
      alert('Failed to trigger restart. Bridge might be down.');
    }
    setLoading(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      alert('Please upload a CSV file.');
      return;
    }

    setUploading(true);
    const result = await uploadCsv(file);
    if (result.success) {
      setTimeout(refreshPending, 1500); // Give watcher a moment to move it to staging
    } else {
      alert(`Failed to upload file: ${result.error || 'Unknown error'}. Is the bridge running?`);
    }
    setUploading(false);
    e.target.value = '';
  };

  const handleManualSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!manualTerm.trim() || loading) return;

    const names = manualTerm.trim().split('\n').map(n => n.trim()).filter(n => n);

    setLoading(true);
    try {
      if (automationMode === 'cloud') {
        const success = await dispatchUccAction(names, mode, threshold);
        if (success) {
          alert('Scraper Action dispatched successfully! Results will appear in the UCC Results hub in a few minutes once the GitHub Action completes.');
          setManualTerm('');
        } else {
          alert('Failed to dispatch GitHub Action. Please check your GitHub Configuration.');
        }
      } else {
        const jobId = await triggerManualSearch(names, mode);
        if (jobId) {
          setActiveJobId(jobId);
          setManualTerm('');
        } else {
          alert('Failed to start manual search. Is the bridge running?');
        }
      }
    } catch (err) {
      alert('Error starting manual search. Check console for details.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartScrape = async () => {
    if (!selectedFile || !selectedColumn) return;
    setLoading(true);

    try {
      if (automationMode === 'cloud') {
        alert('File-based scraping in Cloud Mode is not yet supported. Please use Manual Search or switch to Local Bridge.');
      } else {
        const jobId = await startScrape(selectedFile.filename, selectedColumn, threshold, mode);
        if (jobId) {
          setActiveJobId(jobId);
          setIsConfigModalOpen(false);
        } else {
          alert('Failed to start scrape. Is the bridge running?');
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGithubConfig = () => {
    saveGithubConfig({
      token: githubToken,
      owner: githubOwner,
      repo: githubRepo,
      branch: githubBranch
    });
    setIsGithubModalOpen(false);
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
          <button
            onClick={() => setIsGithubModalOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:border-blue-300 hover:text-blue-600 transition-all shadow-sm"
          >
            <Settings className="w-4 h-4" />
            Config
          </button>
          <div className="h-6 w-px bg-slate-200 mx-1" />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${
              uploading ? 'bg-slate-100 text-slate-400' : 'bg-white border border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-600'
            }`}
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {uploading ? 'Uploading...' : 'Upload CSV'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleFileUpload}
            disabled={uploading}
          />
          <button
            onClick={refreshPending}
            className="p-2 hover:bg-white rounded-md transition-colors border border-transparent hover:border-slate-200 text-slate-400"
          >
            <Clock className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="p-4">
        {/* Mode Selector */}
        <div className="mb-6 grid grid-cols-2 gap-4">
          <button
            onClick={() => setAutomationMode('local')}
            className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
              automationMode === 'local'
                ? 'bg-blue-50 border-blue-600 shadow-md'
                : 'bg-white border-slate-100 hover:border-slate-300'
            }`}
          >
            <div className={`p-3 rounded-lg ${automationMode === 'local' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
              <Server className="w-6 h-6" />
            </div>
            <div className="text-left">
              <h3 className={`font-bold ${automationMode === 'local' ? 'text-blue-900' : 'text-slate-600'}`}>Local Bridge</h3>
              <p className="text-xs text-slate-500">Fast, local scraping via Python bridge</p>
            </div>
          </button>

          <button
            onClick={() => setAutomationMode('cloud')}
            className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
              automationMode === 'cloud'
                ? 'bg-emerald-50 border-emerald-600 shadow-md'
                : 'bg-white border-slate-100 hover:border-slate-300'
            }`}
          >
            <div className={`p-3 rounded-lg ${automationMode === 'cloud' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
              <Cloud className="w-6 h-6" />
            </div>
            <div className="text-left">
              <h3 className={`font-bold ${automationMode === 'cloud' ? 'text-emerald-900' : 'text-slate-600'}`}>Cloud Scraper</h3>
              <p className="text-xs text-slate-500">Automated via GitHub Actions</p>
            </div>
          </button>
        </div>

        {/* System Health Dashboard (Local Only) */}
        {automationMode === 'local' && (
          <div className="mb-6 flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 animate-in fade-in duration-300">
            <div className="flex items-center gap-3 pr-4 border-r border-slate-200">
              <div className={`p-2 rounded-lg ${systemStatus?.bridge === 'online' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                <Server className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Bridge Status</p>
                <p className={`text-xs font-bold ${systemStatus?.bridge === 'online' ? 'text-green-600' : 'text-red-600'}`}>
                  {systemStatus?.bridge === 'online' ? 'CONNECTED' : 'OFFLINE'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-1">
              <div className={`p-2 rounded-lg ${systemStatus?.watcher === 'online' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Watcher Service</p>
                <p className={`text-xs font-bold ${systemStatus?.watcher === 'online' ? 'text-green-600' : 'text-red-600'}`}>
                  {systemStatus?.watcher === 'online' ? 'ACTIVE' : 'STOPPED'}
                </p>
              </div>
            </div>
            <button
              onClick={handleRestart}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 hover:border-blue-300 hover:text-blue-600 transition-all shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Restart Services
            </button>
          </div>
        )}

        {/* Cloud Status (Cloud Only) */}
        {automationMode === 'cloud' && (
          <div className="mb-6 p-4 bg-emerald-50 rounded-xl border border-emerald-100 animate-in fade-in duration-300">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-600 rounded-lg text-white">
                <Globe className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-emerald-900 uppercase tracking-wider">GitHub Actions Ready</p>
                <p className="text-[10px] text-emerald-700 font-medium">
                  Scrapes will run in the cloud. Results sync back via commit.
                </p>
              </div>
              {!githubToken && (
                <div className="ml-auto flex items-center gap-2 text-[10px] font-bold text-amber-600 bg-amber-100 px-3 py-1 rounded-lg">
                  <AlertCircle className="w-3.5 h-3.5" />
                  GitHub Token Required
                </div>
              )}
            </div>
          </div>
        )}

        {/* Manual Search Bar */}
        <div className="mb-6 p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
              Quick Manual Search
            </label>
            <div className="flex bg-slate-100 p-1 rounded-lg">
              <button
                onClick={() => setMode('standard')}
                className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${mode === 'standard' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Standard
              </button>
              <button
                onClick={() => setMode('lite')}
                className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${mode === 'lite' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Lite (v6)
              </button>
            </div>
          </div>
          <form onSubmit={handleManualSearch} className="space-y-3">
            <div className="relative">
              <textarea
                value={manualTerm}
                onChange={(e) => setManualTerm(e.target.value)}
                placeholder="Enter business names (one per line)..."
                rows={3}
                className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all resize-none"
                disabled={loading}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {mode === 'lite' ? (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
                    <Zap className="w-3 h-3" />
                    Faster Mode & Dynamic Thresholds
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                    <ShieldCheck className="w-3 h-3" />
                    Standard Deep Scraping
                  </span>
                )}
              </div>
              <button
                type="submit"
                disabled={!manualTerm.trim() || loading || (automationMode === 'local' && !!activeJobId)}
                className={`px-6 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-all ${
                  !manualTerm.trim() || loading || (automationMode === 'local' && !!activeJobId)
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    : automationMode === 'cloud'
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95 shadow-sm'
                      : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95 shadow-sm'
                }`}
              >
                {loading && !uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : automationMode === 'cloud' ? <Cloud className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                {automationMode === 'cloud' ? 'Dispatch Cloud Scrape' : 'Run Scraper'}
              </button>
            </div>
          </form>
          <p className="text-[10px] text-slate-400 mt-3 italic border-t border-slate-100 pt-2">
            Paste multiple names to search immediately. Results will be saved to <span className="font-bold">all_results.csv</span>.
          </p>
        </div>

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

            {/* Live Results Table */}
            {jobStatus.results && jobStatus.results.length > 0 && (
              <div className="mt-4 overflow-hidden rounded-lg border border-blue-200 bg-white">
                <div className="px-3 py-2 bg-blue-100/50 border-b border-blue-200 flex items-center gap-2">
                  <Play className="w-3 h-3 text-blue-600 fill-current" />
                  <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider">Live Results Found</span>
                </div>
                <div className="max-h-48 overflow-y-auto">
                  <table className="w-full text-left text-[10px]">
                    <thead className="bg-slate-50 text-slate-500 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 font-bold">Business Name</th>
                        <th className="px-3 py-2 font-bold">UCC Number</th>
                        <th className="px-3 py-2 font-bold">Status</th>
                        <th className="px-3 py-2 font-bold">Score</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {jobStatus.results.map((res, i) => (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="px-3 py-2 font-medium text-slate-700 truncate max-w-[150px]">{res['Search Term']}</td>
                          <td className="px-3 py-2 text-slate-600">{res['UCC Number'] || 'N/A'}</td>
                          <td className="px-3 py-2">
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                              res['Status']?.includes('FILED') ? 'bg-green-100 text-green-700' :
                              res['Status']?.includes('LAPSED') ? 'bg-slate-100 text-slate-700' : 'bg-red-50 text-red-600'
                            }`}>
                              {res['Status'] || 'NOT FOUND'}
                            </span>
                          </td>
                          <td className="px-3 py-2 font-mono text-blue-600 font-bold">{res['Match Score']}</td>
                        </tr>
                      )).reverse()}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

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
            <p className="text-xs text-slate-400 mt-1">Upload a CSV using the button above to start.</p>
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

      {/* GitHub Configuration Modal */}
      {isGithubModalOpen && (
        <Modal
          isOpen={isGithubModalOpen}
          onClose={() => setIsGithubModalOpen(false)}
          title="GitHub Configuration"
        >
          <div className="space-y-4 py-2">
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 mb-4">
              <div className="flex gap-3">
                <Github className="w-5 h-5 text-blue-600 shrink-0" />
                <div className="text-xs text-blue-800 leading-relaxed">
                  <p className="font-bold mb-1">How to connect GitHub Actions:</p>
                  <ol className="list-decimal ml-4 space-y-1">
                    <li>Create a <span className="font-bold">Fine-grained Personal Access Token</span> on GitHub.</li>
                    <li>Grant <span className="font-bold">Actions: Read & Write</span> and <span className="font-bold">Contents: Read & Write</span> permissions for this repository.</li>
                    <li>Paste the token and repository details below.</li>
                  </ol>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Personal Access Token
              </label>
              <input
                type="password"
                value={githubToken}
                onChange={(e) => setGithubToken(e.target.value)}
                placeholder="ghp_xxxxxxxxxxxx"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Repo Owner
                </label>
                <input
                  type="text"
                  value={githubOwner}
                  onChange={(e) => setGithubOwner(e.target.value)}
                  placeholder="e.g. username"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Repo Name
                </label>
                <input
                  type="text"
                  value={githubRepo}
                  onChange={(e) => setGithubRepo(e.target.value)}
                  placeholder="e.g. data-explorer"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Branch
              </label>
              <input
                type="text"
                value={githubBranch}
                onChange={(e) => setGithubBranch(e.target.value)}
                placeholder="main"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-100 mt-6">
              <button
                onClick={() => setIsGithubModalOpen(false)}
                className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-600 rounded-lg font-bold hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveGithubConfig}
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-all shadow-md"
              >
                Save Connection
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Configuration Modal */}
      {isConfigModalOpen && selectedFile && (
        <Modal
          isOpen={isConfigModalOpen}
          onClose={() => setIsConfigModalOpen(false)}
          title="Configure UCC Scrape"
        >
          <div className="space-y-6 py-2">
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Scraper Mode
                </label>
                <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
                  <button
                    onClick={() => setMode('standard')}
                    className={`flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${mode === 'standard' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Standard
                  </button>
                  <button
                    onClick={() => setMode('lite')}
                    className={`flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${mode === 'lite' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    <Zap className="w-3.5 h-3.5" />
                    Lite (v6)
                  </button>
                </div>
              </div>
            </div>

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
