import React, { useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';

export interface SearchResult {
    id: string;
    name: string;
    context: string;
    page: string;
}

interface SearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    query: string;
    setQuery: (query: string) => void;
    results: SearchResult[];
    onResultClick: (result: SearchResult) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose, query, setQuery, results, onResultClick }) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) {
            inputRef.current?.focus();
        }
    }, [isOpen]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);

    if (!isOpen) {
        return null;
    }

    return (
        <div
            className="fixed inset-0 z-[9999] flex items-start justify-center pt-20 bg-gray-900/60 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            onClick={onClose}
        >
            <div
                ref={modalRef}
                className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl shadow-2xl w-full max-w-2xl transform transition-all overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="relative border-b border-gray-100 dark:border-slate-800">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Search products and services..."
                        className="w-full bg-transparent p-4 pl-12 text-lg text-gray-900 dark:text-slate-100 focus:outline-none"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        aria-label="Search"
                    />
                    <button onClick={onClose} className="absolute inset-y-0 right-0 pr-4 flex items-center" aria-label="Close search">
                        <X className="h-6 w-6 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200" />
                    </button>
                </div>
                <div className="max-h-[60vh] overflow-y-auto">
                    {results.length > 0 ? (
                        <ul className="divide-y divide-gray-50 dark:divide-slate-800/50">
                            {results.map((result) => (
                                <li key={result.id}>
                                    <button
                                        onClick={() => onResultClick(result)}
                                        className="w-full text-left p-4 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors focus:bg-blue-50 dark:focus:bg-blue-900/20 focus:outline-none group"
                                    >
                                        <p className="font-bold text-gray-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{result.name}</p>
                                        <p className="text-xs text-gray-500 dark:text-slate-500 mt-1 uppercase tracking-wider font-medium">{result.context}</p>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        query && (
                            <div className="p-12 text-center">
                                <Search className="w-12 h-12 text-gray-200 dark:text-slate-800 mx-auto mb-4" />
                                <p className="text-gray-500 dark:text-slate-400 font-medium">No results found for "{query}".</p>
                                <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">Try searching for something else</p>
                            </div>
                        )
                    )}
                </div>
                <div className="bg-gray-50 dark:bg-slate-800/50 px-4 py-2 flex items-center justify-between text-[10px] text-gray-400 uppercase tracking-widest font-bold border-t border-gray-100 dark:border-slate-800">
                    <span>{results.length} results</span>
                    <span>ESC to close</span>
                </div>
            </div>
        </div>
    );
};
