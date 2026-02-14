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

const baseInputClasses = "w-full text-sm px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900";

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
                        className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
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
                className={`${baseInputClasses} min-h-12`}
                style={{ overflowY: 'hidden', resize: 'vertical' }}
            />
        );
    };

    return (
        <div className="mt-8 pt-6 border-t-2 border-dashed border-gray-200 print-break-inside-avoid">
            <div className="flex justify-between items-center mb-4">
                <h2 id={sectionId} className="text-xl font-bold text-gray-700">{title}</h2>
                <button onClick={handleAddEntry} className="no-print inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                    <PlusIcon className="w-5 h-5 mr-2" />
                    Add Entry
                </button>
            </div>

            {entries.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left border-collapse table-fixed">
                        <thead>
                            <tr className="bg-gray-100">
                                {columns.map(col => <th key={col} className={`p-2 border border-gray-200 font-bold text-gray-700 uppercase text-[10px] tracking-tight ${widths[col] || ''}`}>{col}</th>)}
                                <th className="p-2 border border-gray-200 w-12 no-print"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {entries.map((entry) => (
                                <tr key={entry.id} className="hover:bg-gray-50">
                                    {Object.keys(getEmptyEntry(entryType)).filter(key => key !== 'id').map(key => (
                                        <td key={key} className="p-1 border border-gray-200 align-top">
                                            {renderInput(entry, key)}
                                        </td>
                                    ))}
                                    <td className="p-1 border border-gray-200 text-center align-middle no-print">
                                        <button onClick={() => handleRemoveEntry(entry.id)} className="text-gray-400 hover:text-red-600 p-2 rounded-full hover:bg-red-100 transition-colors">
                                            <TrashIcon className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <p className="text-gray-500">No entries added yet. Click "Add Entry" to start logging.</p>
                </div>
            )}

            <div className="mt-4 bg-gray-50 p-4 rounded-md text-sm">
                <h4 className="font-semibold text-gray-700 mb-2">Summary of {title.split('. ')[1]}:</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {summaryItems.map(item => (
                    <div key={item.label}>
                        <span className="text-gray-600">{item.label}:</span>
                        <span className="font-bold ml-2 text-gray-800">{item.value}</span>
                    </div>
                ))}
                </div>
            </div>
        </div>
    );
};
