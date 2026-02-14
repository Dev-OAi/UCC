import React, { useState } from 'react';

export const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`custom-card ${className}`}>
    {children}
  </div>
);

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}
export const Input: React.FC<InputProps> = ({ label, id, ...props }) => (
  <div>
    {label && <label htmlFor={id} className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">{label}</label>}
    <input
      id={id}
      className="form-control"
      {...props}
    />
  </div>
);

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
}

export const Select: React.FC<SelectProps> = ({ label, id, options, ...props }) => (
  <div>
    {label && <label htmlFor={id} className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">{label}</label>}
    <select id={id} className="form-control" {...props}>
      {options.map(option => (
        <option key={option.value} value={option.value}>{option.label}</option>
      ))}
    </select>
  </div>
);


interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  rows?: number;
}
export const Textarea: React.FC<TextareaProps> = ({ label, id, rows = 3, ...props }) => (
  <div>
    {label && <label htmlFor={id} className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">{label}</label>}
    <textarea
      id={id}
      rows={rows}
      className="form-control"
      {...props}
    />
  </div>
);

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'ghost';
    size?: 'sm' | 'md';
    isLoading?: boolean;
}
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ children, variant = 'primary', size = 'md', isLoading = false, className, ...props }, ref) => {

        const variantClasses = {
            primary: 'btn-primary',
            ghost: 'btn-ghost',
        };

        const sizeClasses = {
            sm: 'btn-sm',
            md: '',
        };

        return (
            <button
                ref={ref}
                className={`btn ${variantClasses[variant]} ${sizeClasses[size]} ${className || ''}`}
                disabled={isLoading || props.disabled}
                {...props}
            >
                {isLoading && <Spinner className="mr-2"/>}
                {children}
            </button>
        );
    }
);
Button.displayName = 'Button';


export const Spinner: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={`animate-spin h-5 w-5 text-current ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);


export const MagicWandIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M5 3v4"></path><path d="M19 17v4"></path><path d="M3 5h4"></path><path d="M17 19h4"></path><path d="M16.4 3.6a9 9 0 0 1 0 12.8"></path><path d="M7.6 7.6a9 9 0 0 1 12.8 0"></path><path d="m12 12 4 4"></path><path d="M16 12h4"></path><path d="M3 8v4"></path><path d="M12 16v4"></path>
  </svg>
);

export const Accordion: React.FC<{ title: React.ReactNode; children: React.ReactNode; asCard?: boolean }> = ({ title, children, asCard = false }) => {
    const [isOpen, setIsOpen] = useState(false);

    const containerClasses = asCard
        ? "custom-card p-0"
        : "border-b border-[var(--color-border-light)]";

    const buttonClasses = asCard
        ? "w-full flex justify-between items-start p-4 text-left font-medium text-[var(--color-text-primary)]"
        : "w-full flex justify-between items-center py-3 text-left font-medium text-[var(--color-text-primary)]";

    const contentClasses = asCard
        ? "border-t border-[var(--color-border-light)]"
        : "pb-4 pt-2";

    return (
        <div className={containerClasses}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={buttonClasses}
                aria-expanded={isOpen}
            >
                <div className="flex-grow mr-2">{title}</div>
                <svg className={`transform transition-transform duration-200 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </button>
            {isOpen && (
                <div className={contentClasses}>
                    {children}
                </div>
            )}
        </div>
    );
};


export const ProgressBar: React.FC<{ value: number; className?: string }> = ({ value, className = '' }) => (
    <div className={`progress-bar-container ${className}`}>
        <div className="progress-bar-fill" style={{ width: `${value}%` }}></div>
    </div>
);

export const ProgressRing: React.FC<{ value: number; size?: number; strokeWidth?: number }> = ({ value, size = 24, strokeWidth = 3 }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (value / 100) * circumference;

    return (
        <svg width={size} height={size} className="progress-ring">
            <circle
                className="progress-ring-bg"
                cx={size / 2}
                cy={size / 2}
                r={radius}
                strokeWidth={strokeWidth}
                fill="transparent"
            />
            <circle
                className="progress-ring-fg"
                cx={size / 2}
                cy={size / 2}
                r={radius}
                strokeWidth={strokeWidth}
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
            />
        </svg>
    );
};

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, footer }) => {
    if (!isOpen) return null;

    return (
        <>
            <div className="modal-overlay" onClick={onClose} />
            <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
                <div className="modal-header">
                    <h3 id="modal-title" className="modal-title-text">{title}</h3>
                    <button onClick={onClose} className="modal-close-btn" aria-label="Close modal">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </div>
                <div className="modal-body">
                    {children}
                </div>
                {footer && (
                    <div className="modal-footer">
                        {footer}
                    </div>
                )}
            </div>
        </>
    );
};

// --- Icon Components ---
export const PrintIcon: React.FC<{ className?: string }> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
);

export const FileDownIcon: React.FC<{ className?: string }> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><polyline points="15 15 12 18 9 15"></polyline></svg>
);

export const PresentationIcon: React.FC<{ className?: string }> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h20"/><path d="M21 3v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V3"/><path d="M7 21h10"/><path d="M12 16v5"/></svg>
);

export const SunIcon: React.FC<{ className?: string }> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
);

export const MoonIcon: React.FC<{ className?: string }> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
);

export const ChatIcon: React.FC<{ className?: string }> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
);

export const PaperAirplaneIcon: React.FC<{ className?: string }> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13" /><path d="M22 2L15 22L11 13L2 9L22 2Z" /></svg>
);

export const CloseIcon: React.FC<{ className?: string }> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
);

export const SparklesIcon: React.FC<{ className?: string }> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3L9.27 9.27L3 12L9.27 14.73L12 21L14.73 14.73L21 12L14.73 9.27L12 3Z"/><path d="M3 21L9.27 14.73"/><path d="M21 3L14.73 9.27"/></svg>
);

export const PlusIcon: React.FC<{ className?: string }> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
);

export const PencilIcon: React.FC<{ className?: string }> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
);

export const TrashIcon: React.FC<{ className?: string }> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
);

export const MicrophoneIcon: React.FC<{ className?: string }> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line></svg>
);

export const Volume2Icon: React.FC<{ className?: string }> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path></svg>
);

export const VolumeXIcon: React.FC<{ className?: string }> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>
);

export const RefreshCwIcon: React.FC<{ className?: string }> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
);
