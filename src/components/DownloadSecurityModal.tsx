import React, { useState, useEffect, useRef } from 'react';
import { Lock, ShieldAlert, Timer, X, ArrowRight } from 'lucide-react';

interface DownloadSecurityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const DownloadSecurityModal: React.FC<DownloadSecurityModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [passcode, setPasscode] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const CORRECT_PASSCODE = import.meta.env.VITE_DOWNLOAD_PASSCODE || 'ABCD';

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
    if (!isOpen) {
      setPasscode('');
      setError(null);
    }
  }, [isOpen]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (lockoutUntil) {
      const updateTimer = () => {
        const remaining = Math.max(0, Math.ceil((lockoutUntil - Date.now()) / 1000));
        setTimeLeft(remaining);
        if (remaining === 0) {
          setLockoutUntil(null);
        }
      };
      updateTimer();
      timer = setInterval(updateTimer, 1000);
    }
    return () => clearInterval(timer);
  }, [lockoutUntil]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutUntil) return;

    if (passcode === CORRECT_PASSCODE) {
      setAttempts(0);
      setPasscode('');
      setError(null);
      onSuccess();
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setPasscode('');

      if (newAttempts >= 3) {
        const waitMinutes = 3 + (newAttempts - 3);
        const lockUntil = Date.now() + waitMinutes * 60 * 1000;
        setLockoutUntil(lockUntil);
        setError(`Too many attempts. Locked for ${waitMinutes} minutes.`);
      } else {
        setError(`Incorrect passcode. ${3 - newAttempts} attempts remaining.`);
      }
    }
  };

  if (!isOpen) return null;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-300 transition-all">
      <div
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden transform transition-all animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative p-6 sm:p-8">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col items-center text-center space-y-4">
            <div className={`p-4 rounded-full ${lockoutUntil ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'}`}>
              {lockoutUntil ? <ShieldAlert className="w-8 h-8" /> : <Lock className="w-8 h-8" />}
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                {lockoutUntil ? 'Access Temporarily Locked' : 'Secure Data Export'}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                {lockoutUntil
                  ? 'For security reasons, your access has been temporarily restricted.'
                  : 'Please enter the authorization code to proceed with the CSV download.'
                }
              </p>
            </div>

            <form onSubmit={handleSubmit} className="w-full space-y-4 pt-2">
              {lockoutUntil ? (
                <div className="flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700 space-y-3">
                  <div className="flex items-center text-red-600 dark:text-red-400 font-mono text-3xl font-bold">
                    <Timer className="w-6 h-6 mr-2 animate-pulse" />
                    {formatTime(timeLeft)}
                  </div>
                  <p className="text-sm font-medium text-red-600 dark:text-red-400">
                    Too many attempts. Locked for {3 + (attempts - 3)} minutes.
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 font-medium uppercase tracking-widest">Wait before retry</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative group">
                    <input
                      ref={inputRef}
                      type="password"
                      value={passcode}
                      onChange={(e) => setPasscode(e.target.value.toUpperCase())}
                      placeholder="ENTER PASSCODE"
                      className={`w-full px-4 py-4 bg-slate-50 dark:bg-slate-800 border-2 rounded-xl text-center text-xl font-mono tracking-[0.5em] focus:ring-4 focus:ring-blue-500/10 outline-none transition-all placeholder:tracking-normal placeholder:text-sm placeholder:font-sans dark:text-white ${
                        error ? 'border-red-200 dark:border-red-900 focus:border-red-500' : 'border-slate-100 dark:border-slate-700 focus:border-blue-500'
                      }`}
                    />
                  </div>

                  {error && (
                    <p className={`text-sm font-medium ${attempts >= 3 ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`}>
                      {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    className="w-full flex items-center justify-center space-x-2 py-4 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20 active:scale-[0.98]"
                  >
                    <span>Unlock & Download</span>
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>

        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-center">
          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest flex items-center">
            <ShieldAlert className="w-3 h-3 mr-1.5" />
            Authorized Personnel Only
          </p>
        </div>
      </div>
    </div>
  );
};