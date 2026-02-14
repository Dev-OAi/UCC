import React, { useRef, useLayoutEffect } from 'react';
import type { CallEntry, EmailEntry, MeetingEntry } from '../types';
import { PlusIcon, TrashIcon } from './icons';

export type Entry = CallEntry | EmailEntry | MeetingEntry;
type EntryType = 'call' | 'email' | 'meeting';

interface LogSectionProps<T extends Entry> {
  title: string;
  entries: T[];
  setEntries: React.Dispatch<React.SetStateAction<T[]>>;
  entryType: EntryType;
  summaryItems: { label: string; value: number | string }[];
}

const getEntryColumns = (entryType: EntryType): string[] => {
    switch (entryType) {
        case 'call': return ['Time', 'Client/Company', 'Contact Person', 'Call Type', 'Outcome', 'Next Action', 'Follow-up Date'];
        case 'email': return ['Time Sent', 'Client/Company', 'Subject', 'Email Type', 'Response', 'Next Step'];
        case 'meeting': return ['Time', 'Client/Company', 'Attendees', 'Meeting Type', 'Summary', 'Outcome', 'Next Action', 'Follow-up Date'];
        default: return [];
    }
};

const getEmptyEntry = (entryType: EntryType): Entry => {
    const id = Date.now().toString();
    const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    const today = new Date().toISOString().split('T')[0];

    switch (entryType) {
        case 'call': return { id, time, client: '', contact: '', callType: 'New', outcome: '', nextAction: '', followUpDate: today };
        case 'email': return { id, timeSent: time, client: '', subject: '', emailType: 'Intro', responseReceived: false, nextStep: '' };
        case 'meeting': return { id, time, client: '', attendees: '', meetingType: 'Intro', summary: '', outcome: '', nextAction: '', followUpDate: today };
    }
}

const baseInputClasses = "w-full text-sm px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-slate-100";

// Helper component for auto-sizing textareas
const AutoSizingTextarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = (props) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // useLayoutEffect to measure and adjust height synchronously after DOM mutations
    useLayoutEffect(() => {
        if (textareaRef.current) {
            const textarea = textareaRef.current;
            textarea.style.height = 'auto'; // Reset height to recalculate
            textarea.style.height = `${textarea.scrollHeight}px`;
        }
    }, [props.value]);

    return <textarea ref={textareaRef} {...props} />;
};


export const LogSection = <T extends Entry>({ title, entries, setEntries, entryType, summaryItems }: LogSectionProps<T>) => {
    const sectionId = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const columnConfig: Record<EntryType, Record<string, string>> = {
        call: {
            'Time': 'w-[8%]',
            'Client/Company': 'w-[15%]',
            'Contact Person': 'w-[14%]',
            'Call Type': 'w-[12%]',
            'Outcome': 'w-[20%]',
            'Next Action': 'w-[19%]',
            'Follow-up Date': 'w-[12%]',
        },
        email: {
            'Time Sent': 'w-[10%]',
            'Client/Company': 'w-[20%]',
            'Subject': 'w-[25%]',
            'Email Type': 'w-[15%]',
            'Response': 'w-[10%]',
            'Next Step': 'w-[20%]',
        },
        meeting: {
            'Time': 'w-[8%]',
            'Client/Company': 'w-[12%]',
            'Attendees': 'w-[12%]',
            'Meeting Type': 'w-[10%]',
            'Summary': 'w-[17%]',
            'Outcome': 'w-[15%]',
            'Next Action': 'w-[14%]',
            'Follow-up Date': 'w-[12%]',
        }
    };

    const handleAddEntry = () => {
        setEntries(prev => [...prev, getEmptyEntry(entryType) as T]);
    };

    const handleRemoveEntry = (id: string) => {
        setEntries(prev => prev.filter(entry => entry.id !== id));
    };

    const handleInputChange = (id: string, field: string, value: string | boolean) => {
        setEntries(prev => prev.map(entry => entry.id === id ? { ...entry, [field]: value } : entry));
    };

    const columns = getEntryColumns(entryType);
    const widths = columnConfig[entryType];

    const renderInput = (entry: T, key: string) => {
        const value = (entry as any)[key];
        const commonProps = {
            value: value,
            onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => handleInputChange(entry.id, key, e.target.value),
            className: baseInputClasses,
        };

        if (typeof value === 'boolean') {
            return (
                <div className="flex items-center justify-center h-full">
                    <input
                        type="checkbox"
                        checked={value}
                        onChange={e => handleInputChange(entry.id, key, e.target.checked)}
                        className="h-5 w-5 rounded border-gray-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 dark:bg-slate-700"
                    />
                </div>
            );
        }

        if (key.toLowerCase().includes('date')) {
            return <input type="date" {...commonProps} />;
        }

        if (key.toLowerCase().includes('time')) {
            return <input type="time" {...commonProps} />;
        }

        if (key.toLowerCase().includes('type')) {
            let options: string[] = [];
            if (entryType === 'call') options = ['New', 'Follow-up'];
            if (entryType === 'email') options = ['Intro', 'Follow-up', 'Proposal', 'Other'];
            if (entryType === 'meeting') options = ['Intro', 'Follow-up', 'Closing'];
            return (
                <select {...commonProps}>
                    <option value=""></option>
                    {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
            );
        }

        return (
            <AutoSizingTextarea
                value={value}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange(entry.id, key, e.target.value)}
                className={`${baseInputClasses} min-h-[3rem]`}
                style={{ overflowY: 'hidden', resize: 'vertical' }}
            />
        );
    };

    return (
        <div className="mt-8 pt-6 border-t-2 border-dashed border-gray-200 dark:border-slate-800 print-break-inside-avoid">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h2 id={sectionId} className="text-xl font-bold text-gray-800 dark:text-white">{title}</h2>
                <button
                    onClick={handleAddEntry}
                    className="no-print w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-bold rounded-xl shadow-lg shadow-blue-500/20 text-white bg-blue-600 hover:bg-blue-700 transition-all active:scale-95"
                >
                    <PlusIcon className="w-5 h-5 mr-2" />
                    Add Entry
                </button>
            </div>

            {entries.length > 0 ? (
                <>
                    {/* Desktop Table View */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-sm text-left border-collapse table-fixed">
                            <thead>
                                <tr className="bg-gray-50 dark:bg-slate-800/50">
                                    {columns.map(col => <th key={col} className={`p-2 border border-gray-200 dark:border-slate-700 font-black text-gray-400 dark:text-slate-500 uppercase text-[10px] tracking-tight ${widths[col] || ''}`}>{col}</th>)}
                                    <th className="p-2 border border-gray-200 dark:border-slate-700 w-12 no-print"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {entries.map((entry) => (
                                    <tr key={entry.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/30">
                                        {Object.keys(getEmptyEntry(entryType)).filter(key => key !== 'id').map(key => (
                                            <td key={key} className="p-1 border border-gray-200 dark:border-slate-700 align-top">
                                                {renderInput(entry, key)}
                                            </td>
                                        ))}
                                        <td className="p-1 border border-gray-200 dark:border-slate-700 text-center align-middle no-print">
                                            <button
                                                onClick={() => handleRemoveEntry(entry.id)}
                                                className="text-gray-400 hover:text-red-600 p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
                                                aria-label="Remove entry"
                                            >
                                                <TrashIcon className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="md:hidden space-y-4">
                        {entries.map((entry) => (
                            <div key={entry.id} className="p-4 bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-2xl shadow-sm space-y-4 relative">
                                <button
                                    onClick={() => handleRemoveEntry(entry.id)}
                                    className="absolute top-2 right-2 text-gray-400 hover:text-red-600 p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors no-print"
                                    aria-label="Remove entry"
                                >
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                                {Object.keys(getEmptyEntry(entryType)).filter(key => key !== 'id').map((key, idx) => (
                                    <div key={key} className="space-y-1">
                                        <label className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest block">
                                            {columns[idx]}
                                        </label>
                                        <div className="w-full">
                                            {renderInput(entry, key)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </>
            ) : (
                <div className="text-center py-10 bg-gray-50 dark:bg-slate-800/30 rounded-2xl border-2 border-dashed border-gray-200 dark:border-slate-700">
                    <p className="text-gray-500 dark:text-slate-400 text-sm">No entries added yet. Click "Add Entry" to start logging.</p>
                </div>
            )}

            <div className="mt-6 bg-blue-50 dark:bg-blue-900/10 p-5 rounded-2xl border border-blue-100 dark:border-blue-900/20 text-sm">
                <h4 className="font-bold text-blue-900 dark:text-blue-300 mb-3 uppercase tracking-wider text-xs">Summary of {title.split('. ')[1]}</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {summaryItems.map(item => (
                    <div key={item.label} className="flex flex-col">
                        <span className="text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-tight">{item.label}</span>
                        <span className="font-black text-lg text-blue-900 dark:text-blue-100">{item.value}</span>
                    </div>
                ))}
                </div>
            </div>
        </div>
    );
};
