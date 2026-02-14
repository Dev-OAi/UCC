import React, { useEffect, useRef } from 'react';
import { Search, ChevronRight, Zap } from 'lucide-react';
import { productData } from '../lib/productData';

export interface SearchResult {
    id: string;
    name: string;
    context: string;
    page: string;
}

interface SearchDropdownProps {
    isOpen: boolean;
    onClose: () => void;
    query: string;
    results: SearchResult[];
    onResultClick: (result: SearchResult) => void;
    onQuickLinkClick: (id: string) => void;
}

export const SearchDropdown: React.FC<SearchDropdownProps> = ({
    isOpen,
    onClose,
    query,
    results,
    onResultClick,
    onQuickLinkClick
}) => {
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const showQuickLinks = !query.trim();

    return (
        <div
            ref={dropdownRef}
            className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl shadow-2xl z-[100] overflow-hidden transform transition-all"
        >
            <div className="max-h-[60vh] overflow-y-auto">
                {showQuickLinks ? (
                    <div className="p-2">
                        <div className="px-3 py-2 text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest flex items-center">
                            <Zap className="w-3 h-3 mr-2 text-amber-500" />
                            Quick Links
                        </div>
                        <div className="grid grid-cols-1 gap-1">
                            {productData.map((section, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => onQuickLinkClick(section.title)}
                                    className="flex items-center justify-between w-full text-left px-3 py-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800/50 group transition-colors"
                                >
                                    <span className="text-sm font-medium text-gray-700 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                                        {section.title}
                                    </span>
                                    <ChevronRight className="w-4 h-4 text-gray-300 dark:text-slate-700 group-hover:text-blue-500 transition-all opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0" />
                                </button>
                            ))}
                        </div>
                    </div>
                ) : results.length > 0 ? (
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
                    <div className="p-12 text-center">
                        <Search className="w-12 h-12 text-gray-200 dark:text-slate-800 mx-auto mb-4" />
                        <p className="text-gray-500 dark:text-slate-400 font-medium">No results found for "{query}".</p>
                        <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">Try searching for something else</p>
                    </div>
                )}
            </div>
            {results.length > 0 && !showQuickLinks && (
                <div className="bg-gray-50 dark:bg-slate-800/50 px-4 py-2 flex items-center justify-between text-[10px] text-gray-400 uppercase tracking-widest font-bold border-t border-gray-100 dark:border-slate-800">
                    <span>{results.length} results</span>
                    <span>ESC to close</span>
                </div>
            )}
        </div>
    );
};
