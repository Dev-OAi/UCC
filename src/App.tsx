import React, { useState, useEffect, useMemo } from 'react';
import { fetchManifest, loadCsv, FileManifest, DataRow } from './lib/dataService';
import { Table } from './components/Table';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { RightSidebar } from './components/RightSidebar';
import { Dashboard } from './components/Dashboard';
import { ColumnToggle } from './components/ColumnToggle';
import { DownloadSecurityModal } from './components/DownloadSecurityModal';
import { ProductsSecurityModal } from './components/ProductsSecurityModal';
import { Insights } from './components/Insights';
import { SmbCheckingSelector } from './components/SmbCheckingSelector';
import { TreasuryGuide } from './components/TreasuryGuide';
import { Products } from './components/Products';
import { TerritoryMap } from './components/TerritoryMap';
import { ActionHub } from './components/ActionHub';
import { ActivityLog } from './components/ActivityLog';
import { Playbook } from './components/Playbook';
import { Scorecard } from './components/Scorecard';
import { ScorecardRightSidebar } from './components/ScorecardRightSidebar';
import ProductGuideRenderer from './components/ProductGuideRenderer';
import { ProductGuide, BusinessLead, LeadStatus, LeadType, ScorecardMetric, CallEntry, EmailEntry, MeetingEntry } from './types';
import { SearchResult } from './components/SearchDropdown';
import { productData } from './lib/productData';
import { calculateScore } from './lib/scoring';
import { Search, Filter, Database, MapPin, Download, FilterX, Copy } from 'lucide-react';
import Papa from 'papaparse';

export type Page = 'Home' | 'Insights' | 'Territory Map' | 'Action Hub' | 'SMB Selector' | 'Product Guide' | 'Products' | 'Activity Log' | 'treasury-guide' | 'Playbook' | string;

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

const initialCallEntries: CallEntry[] = [
  { id: 'call-1', time: '09:30', client: 'Innovate Inc.', contact: 'John Smith', callType: 'Follow-up', outcome: 'Confirmed interest, scheduled demo for Friday.', nextAction: 'Send demo confirmation email.', followUpDate: '2026-11-14' }
];
const initialEmailEntries: EmailEntry[] = [
  { id: 'email-1', timeSent: '11:00', client: 'Solutions LLC', subject: 'Re: Proposal', emailType: 'Proposal', responseReceived: true, nextStep: 'Follow up call tomorrow.' }
];
const initialMeetingEntries: MeetingEntry[] = [
  { id: 'meeting-1', time: '14:00', client: 'Global Tech', attendees: 'Sarah Brown, Mike Lee', meetingType: 'Closing', summary: 'Finalized contract terms. Positive outcome.', outcome: 'Deal closed.', nextAction: 'Send final contract for signature.', followUpDate: '2026-11-11' }
];

const DEFAULT_METRICS: ScorecardMetric[] = [
  { id: 'new-accts', name: 'New Accts', target: 50, type: 'built-in', isVisible: true },
  { id: 'cards-sold', name: 'Cards Sold', target: 100, type: 'built-in', isVisible: true },
  { id: 'meetings', name: 'Meetings (Completed)', target: 150, type: 'built-in', isVisible: true },
  { id: 'pipeline-total', name: 'Pipeline Total', target: 100, type: 'built-in', isVisible: true },
  { id: 'emails-collected', name: 'Emails Collected', target: 100, type: 'built-in', isVisible: true },
  { id: 'outreach', name: 'Outreach', target: 100, type: 'built-in', isVisible: true },
];

function App() {
  const [manifest, setManifest] = useState<FileManifest[]>([]);
  const [productGuides, setProductGuides] = useState<ProductGuide[]>(() => {
    const saved = localStorage.getItem('productGuides');
    return saved ? JSON.parse(saved) : [];
  });
  const [scorecardLeads, setScorecardLeads] = useState<BusinessLead[]>(() => {
    const saved = localStorage.getItem('scorecardLeads');
    return saved ? JSON.parse(saved) : [];
  });
  const [scorecardMetrics, setScorecardMetrics] = useState<ScorecardMetric[]>(() => {
    const saved = localStorage.getItem('scorecardMetrics');
    return saved ? JSON.parse(saved) : DEFAULT_METRICS;
  });

  // Activity Log State
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

  const [allData, setAllData] = useState<DataRow[]>([]);
  const [debouncedAllData, setDebouncedAllData] = useState<DataRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState({ current: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);

  // State Management
  const [activeTab, setActiveTab] = useState<string>('Home');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [highlightedProductId, setHighlightedProductId] = useState<string | null>(null);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [columnFilters, setColumnFilters] = useState<Record<string, string[]>>({});
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);
  const [visibleColumns, setVisibleColumns] = useState<string[]>([]);
  const [rightSidebarWidth, setRightSidebarWidth] = useState(() => {
    return Number(localStorage.getItem('rightSidebarWidth')) || 400;
  });
  const [isResizing, setIsResizing] = useState(false);

  const startResizing = React.useCallback((e: React.MouseEvent | React.TouchEvent) => {
    // Prevent default for mouse to avoid text selection during resize
    if (!('touches' in e)) {
      e.preventDefault();
    }
    setIsResizing(true);
  }, []);

  const stopResizing = React.useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = React.useCallback((e: MouseEvent | TouchEvent) => {
    if (isResizing) {
      let clientX: number;
      if ('touches' in e) {
        if (e.touches.length === 0) return;
        clientX = e.touches[0].clientX;
        // Prevent scrolling while resizing on touch
        if (e.cancelable) e.preventDefault();
      } else {
        clientX = e.clientX;
      }

      const newWidth = window.innerWidth - clientX;
      const minWidth = 320;
      const maxWidth = window.innerWidth * 0.8;

      const clampedWidth = Math.max(minWidth, Math.min(newWidth, maxWidth));
      setRightSidebarWidth(clampedWidth);
    }
  }, [isResizing]);

  React.useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', resize);
      window.addEventListener('mouseup', stopResizing);
      window.addEventListener('touchmove', resize, { passive: false });
      window.addEventListener('touchend', stopResizing);
    } else {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
      window.removeEventListener('touchmove', resize);
      window.removeEventListener('touchend', stopResizing);
    }
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
      window.removeEventListener('touchmove', resize);
      window.removeEventListener('touchend', stopResizing);
    };
  }, [isResizing, resize, stopResizing]);

  React.useEffect(() => {
    if (!isResizing) {
      localStorage.setItem('rightSidebarWidth', String(rightSidebarWidth));
    }
  }, [rightSidebarWidth, isResizing]);

  const [customColumnOrders, setCustomColumnOrders] = useState<Record<string, string[]>>({
    '3. UCC': [

      "businessName",
      "Document Number",
      "Sunbiz Status",
      "Phone",
      "Sunbiz Link",
      "Florida UCC Link",
      "Location",
      "Zip",
      "UCC Status",
      "Date Filed",
      "Expires",
      "Filings Completed Through",
      "Summary For Filing"
    ],
    '1. SB': [

      "businessName",
      "Document Number",
      "Sunbiz Status",
      "Column 14",
      "Column 4",
      "FEI/EIN Number",
      "Sunbiz Link",
      "Entity Type",
      "Location",
      "UCC Status",
      "Column 41",
      "Date Filed",
      "Expires",
      "Filings Completed Through",
      "Summary For Filing",
      "Column 54",
      "Column 55",
      "Florida UCC Link",
      "Category",
      "Phone",
      "Website"
    ],
    '2. YP': [

      "businessName",
      "Category",
      "Phone",
      "Website",
      "Location",
      "Zip"
    ],
    'Last 90 Days': [
      "UCC Status",
      "businessName",
      "Reverse Name",
      "Record Date",
      "Doc Type",
      "Instrument Number",
      "Legal Description"
    ],
    '33027': [
      "businessName",
      "Phone",
      "Website",
      "UCC Status",
      "Date Filed",
      "Expires",
      "Florida UCC Link",
      "Category"
    ],
    '33301': [
      "businessName",
      "Phone",
      "Website",
      "UCC Status",
      "Date Filed",
      "Expires",
      "Florida UCC Link",
      "Category"
    ],
    '33401': [
      "businessName",
      "Sunbiz Status",
      "FEI/EIN Number",
      "Sunbiz Link",
      "UCC Status",
      "Date Filed",
      "Expires",
      "Florida UCC Link"
    ],
    'Search Results': [
      "DirectName",
      "IndirectName",
      "RecordDate",
      "DocTypeDescription",
      "InstrumentNumber",
      "BookType",
      "BookPage",
      "DocLegalDescription",
      "Consideration",
      "CaseNumber"
    ],
    'B UCC': [
      "DirectName",
      "IndirectName",
      "RecordDate",
      "DocTypeDescription",
      "InstrumentNumber",
      "BookType",
      "BookPage",
      "DocLegalDescription",
      "Consideration",
      "CaseNumber"
    ],
    '33480': [
      "businessName",
      "Sunbiz Status",
      "FEI/EIN Number",
      "Sunbiz Link",
      "UCC Status",
      "Date Filed",
      "Expires",
      "Florida UCC Link"
    ],
    'All': [

      "businessName",
      "Category",
      "Document Number",
      "Sunbiz Status",
      "Phone",
      "Website",
      "Sunbiz Link",
      "Florida UCC Link",
      "Location",
      "Zip",
      "UCC Status",
      "Date Filed",
      "Expires",
      "Filings Completed Through",
      "Summary For Filing"
    ]
  });
  const [selectedRow, setSelectedRow] = useState<DataRow | null>(null);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(window.innerWidth >= 1024);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [isProductsUnlocked, setIsProductsUnlocked] = useState(false);
  const [isProductsModalOpen, setIsProductsModalOpen] = useState(false);
  const [pendingSearchAction, setPendingSearchAction] = useState<(() => void) | null>(null);

  // Auto-lock Products after 1 minute
  useEffect(() => {
    let timer: any;
    if (isProductsUnlocked) {
      timer = setTimeout(() => {
        setIsProductsUnlocked(false);
      }, 60000); // 1 minute
    }
    return () => clearTimeout(timer);
  }, [isProductsUnlocked]);

  // Dark Mode
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchTerm(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem('darkMode', String(isDarkMode));
  }, [isDarkMode]);

  useEffect(() => {
    if (productGuides.length > 0) {
      localStorage.setItem('productGuides', JSON.stringify(productGuides));
    }
  }, [productGuides]);

  useEffect(() => {
    localStorage.setItem('scorecardLeads', JSON.stringify(scorecardLeads));
  }, [scorecardLeads]);

  useEffect(() => {
    localStorage.setItem('scorecardMetrics', JSON.stringify(scorecardMetrics));
  }, [scorecardMetrics]);

  useEffect(() => { localStorage.setItem('sales_callEntries', JSON.stringify(callEntries)); }, [callEntries]);
  useEffect(() => { localStorage.setItem('sales_emailEntries', JSON.stringify(emailEntries)); }, [emailEntries]);
  useEffect(() => { localStorage.setItem('sales_meetingEntries', JSON.stringify(meetingEntries)); }, [meetingEntries]);

  const addCallEntry = (client: string, contact: string) => {
    const newEntry: CallEntry = {
      id: `call-${Date.now()}`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
      client: client || '',
      contact: contact || '',
      callType: 'Follow-up',
      outcome: 'Auto-logged from Scorecard',
      nextAction: '',
      followUpDate: '',
    };
    setCallEntries(prev => [newEntry, ...prev]);
  };

  const addEmailEntry = (client: string, subject: string) => {
    const newEntry: EmailEntry = {
      id: `email-${Date.now()}`,
      timeSent: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
      client: client || '',
      subject: subject || '',
      emailType: 'Outreach',
      responseReceived: false,
      nextStep: '',
    };
    setEmailEntries(prev => [newEntry, ...prev]);
  };

  const addMeetingEntry = (client: string, attendees: string) => {
    const newEntry: MeetingEntry = {
      id: `meeting-${Date.now()}`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
      client: client || '',
      attendees: attendees || '',
      meetingType: 'Discovery',
      summary: 'Scheduled from Scorecard',
      outcome: '',
      nextAction: '',
      followUpDate: '',
    };
    setMeetingEntries(prev => [newEntry, ...prev]);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedAllData(allData);
    }, 100);
    return () => clearTimeout(timer);
  }, [allData]);

  const handleTabChange = (tab: string) => {
    if (tab === 'Products' && !isProductsUnlocked) {
      setIsProductsModalOpen(true);
      return;
    }

    setActiveTab(tab);

    // Always close right sidebar when navigating to Home
    if (tab === 'Home') {
      setIsRightSidebarOpen(false);
    }

    // Auto-close sidebars on tab change for small screens
    if (window.innerWidth < 1024) {
      setIsLeftSidebarOpen(false);
    }
  };

  useEffect(() => {
    setSelectedRow(null);
    setSelectedLeadId(null);
    if (activeTab !== 'Scorecard') {
      setIsRightSidebarOpen(false);
    }
    if (activeTab === 'Last 90 Days') {
      setSortConfig({ key: 'Record Date', direction: 'desc' });
    } else {
      setSortConfig(null);
    }
  }, [activeTab]);

  // Auto-open right sidebar on selection
  useEffect(() => {
    if (selectedRow || selectedLeadId) {
      setIsRightSidebarOpen(true);
      // Auto-close left sidebar on desktop to reduce clutter
      if (window.innerWidth >= 1024) {
        setIsLeftSidebarOpen(false);
      }
    }
  }, [selectedRow, selectedLeadId]);

  // Data Loading
  useEffect(() => {
    async function init() {
      try {
        const m = await fetchManifest();
        setManifest(m);

        // Load Product Guide if not in localStorage
        const savedGuides = localStorage.getItem('productGuides');
        if (!savedGuides) {
          const guideFile = m.find(f => f.path.includes('initial.json'));
          if (guideFile) {
            const response = await fetch(`./${guideFile.path}`);
            if (response.ok) {
              const initialGuides = await response.json();
              setProductGuides(initialGuides);
            }
          }
        }

        // Exclude PDFs and JSON from CSV loading
        const csvFiles = m.filter(f => f.type !== 'PDF' && f.type !== 'JSON');
        setLoadProgress({ current: 0, total: csvFiles.length });
        setLoading(false); // Enable immediate interaction

        // Load incrementally in small batches
        const batchSize = 2;
        for (let i = 0; i < csvFiles.length; i += batchSize) {
          try {
            const batch = csvFiles.slice(i, i + batchSize);
            const batchResults = await Promise.all(batch.map(file => loadCsv(file)));
            setAllData(prev => [...prev, ...batchResults.flat()]);
            setLoadProgress(prev => ({ ...prev, current: Math.min(csvFiles.length, i + batchSize) }));
          } catch (err) {
            console.warn(`Failed to load a batch starting at index ${i}`, err);
          }
        }
      } catch (err) {
        console.error(err);
        setError('Failed to load data. Please check manifest.json.');
        setLoading(false);
      }
    }
    init();
  }, []);

  // Column Management
  const allColumns = useMemo(() => {
    if (allData.length === 0) return [];
    const keys = new Set<string>();
    const samples = new Map<string, DataRow>();
    const expectedTypesCount = new Set(manifest.filter(m => !['PDF', 'JSON'].includes(m.type)).map(m => m.type)).size;

    for (let i = 0; i < allData.length; i++) {
      const row = allData[i];
      if (row._type && !samples.has(row._type)) {
        samples.set(row._type, row);
        if (samples.size === expectedTypesCount) break;
      }
    }

    samples.forEach(sample => {
      Object.keys(sample).forEach(key => {
        if (!key.startsWith('_') && key !== 'Zip' && key !== 'Location') keys.add(key);
      });
    });

    return [...Array.from(keys), 'Location', 'Zip'];
  }, [allData, manifest]);

  const nonEmptyColumns = useMemo(() => {
    if (allData.length === 0) return new Set<string>();
    const found = new Set<string>();
    const cols = allColumns;

    for (let i = 0; i < allData.length; i++) {
      const row = allData[i];
      for (let j = 0; j < cols.length; j++) {
        const col = cols[j];
        if (found.has(col)) continue;
        const val = col === 'Location' ? row._location : col === 'Zip' ? row._zip : row[col];
        if (val !== undefined && val !== null && val !== '' && val !== 'N/A') {
          found.add(col);
        }
      }
      if (found.size === cols.length) break;
    }
    return found;
  }, [allData, allColumns]);

  const currentColumnOrder = useMemo(() => {
    const customOrder = customColumnOrders[activeTab];
    if (!customOrder) return allColumns;

    const remainingColumns = allColumns.filter(col => !customOrder.includes(col));
    return [...customOrder, ...remainingColumns];
  }, [customColumnOrders, activeTab, allColumns]);

  const sortedVisibleColumns = useMemo(() => {
    return [...visibleColumns].sort((a, b) => {
      const idxA = currentColumnOrder.indexOf(a);
      const idxB = currentColumnOrder.indexOf(b);
      if (idxA === -1) return 1;
      if (idxB === -1) return -1;
      return idxA - idxB;
    });
  }, [visibleColumns, currentColumnOrder]);

  useEffect(() => {
    if (allData.length === 0) return;
    if (['Home', 'All', 'Insights'].includes(activeTab)) {
      const activeCols = currentColumnOrder.filter(col => nonEmptyColumns.has(col));
      setVisibleColumns(activeCols);
    } 
    else if (customColumnOrders[activeTab]) {
      setVisibleColumns(customColumnOrders[activeTab]);
    } else {
      const sample = allData.find(d => d._type === activeTab);
      if (sample) {
        const keys = Object.keys(sample).filter(k => !k.startsWith('_') && k !== 'Zip' && k !== 'Location');
        setVisibleColumns([...keys, 'Location', 'Zip']);
      }
    }
  }, [activeTab, allColumns, allData, customColumnOrders, nonEmptyColumns, currentColumnOrder]);

  const toggleColumn = (col: string) => {
    setVisibleColumns(prev => prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col]);
  };

  const handleColumnReorder = (col: string, direction: 'up' | 'down') => {
    const currentOrder = currentColumnOrder;
    const index = currentOrder.indexOf(col);
    if (index === -1) return;

    const newOrder = [...currentOrder];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newOrder.length) return;

    [newOrder[index], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[index]];
    setCustomColumnOrders(prev => ({ ...prev, [activeTab]: newOrder }));
  };

  const copyLayoutConfig = () => {
    const config = {
      tab: activeTab,
      visibleColumns: sortedVisibleColumns,
      allColumnsOrder: currentColumnOrder
    };
    navigator.clipboard.writeText(JSON.stringify(config, null, 2));
  };

  const clearFilters = () => {
    setSearchTerm('');
    setColumnFilters({});
    setSortConfig(null);
    setActiveTab('Home');
  };

  const isFiltered = searchTerm !== '' || Object.values(columnFilters).some(v => v.length > 0) || !['All', 'Home', 'Insights'].includes(activeTab);

  const types = useMemo(() => {
    const discovered = Array.from(new Set(debouncedAllData.map(d => d._type).filter(Boolean) as string[])).sort();
    return ['All', ...discovered];
  }, [debouncedAllData]);

  const zips = useMemo(() => {
    const discovered = Array.from(new Set(debouncedAllData.map(d => d._zip).filter(Boolean) as string[])).sort();
    return ['All', ...discovered];
  }, [debouncedAllData]);

  const locations = useMemo(() => {
    const discovered = Array.from(new Set(debouncedAllData.map(d => d._location).filter(Boolean) as string[])).sort();
    return ['All', ...discovered];
  }, [debouncedAllData]);

  const onFilterChange = (col: string, val: string[]) => {
    setColumnFilters(p => ({ ...p, [col]: val }));
  };

  const categoryData = useMemo(() => {
    if (activeTab === 'All' || activeTab === 'Home' || activeTab === 'Insights') {
      return allData;
    }
    return allData.filter(row => row._type === activeTab);
  }, [allData, activeTab]);

  const filteredData = useMemo(() => {
    const s = debouncedSearchTerm.toLowerCase();
    const activeFilters = Object.entries(columnFilters).filter(([_, values]) => values && values.length > 0);

    let data = categoryData.filter(row => {
      for (let i = 0; i < activeFilters.length; i++) {
        const [col, values] = activeFilters[i];
        const rowValue = col === 'Location' ? row._location : col === 'Zip' ? row._zip : row[col];
        if (!values.includes(String(rowValue || ''))) return false;
      }
      if (!s) return true;
      for (const key in row) {
        if (key[0] === '_') continue;
        if (String(row[key] || '').toLowerCase().includes(s)) return true;
      }
      return String(row._location || '').toLowerCase().includes(s) || String(row._zip || '').toLowerCase().includes(s);
    });

    if (sortConfig) {
      const { key, direction } = sortConfig;
      const dateRegex = /^\d{1,2}\/\d{1,2}\/\d{4}$/;

      data = [...data].sort((a, b) => {
        const aVal = key === 'Location' ? a._location : key === 'Zip' ? a._zip : a[key];
        const bVal = key === 'Location' ? b._location : key === 'Zip' ? b._zip : b[key];

        const aStr = String(aVal || '');
        const bStr = String(bVal || '');

        if (dateRegex.test(aStr) && dateRegex.test(bStr)) {
          const aTime = new Date(aStr).getTime();
          const bTime = new Date(bStr).getTime();
          if (!isNaN(aTime) && !isNaN(bTime)) {
            return direction === 'asc' ? aTime - bTime : bTime - aTime;
          }
        }

        const comp = collator.compare(aStr, bStr);
        return direction === 'asc' ? comp : -comp;
      });
    }
    return data;
  }, [categoryData, debouncedSearchTerm, columnFilters, sortConfig]);

  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const query = searchTerm.toLowerCase();
    const results: SearchResult[] = [];

    productData.forEach((section, sIdx) => {
      section.categories.forEach((category, cIdx) => {
        category.subCategories.forEach((sub, subIdx) => {
          sub.products.forEach((product, pIdx) => {
            if (product.name.toLowerCase().includes(query)) {
              results.push({
                id: `${sIdx}-${cIdx}-${subIdx}-${pIdx}`,
                name: product.name,
                context: `${section.title} > ${category.title}${sub.title ? ` > ${sub.title}` : ''}`,
                page: 'Products'
              });
            }
          });
        });
      });
    });

    return results.slice(0, 10);
  }, [searchTerm]);

  const handleResultClick = (result: SearchResult) => {
    const action = () => {
      setActiveTab(result.page);
      setHighlightedProductId(result.id);
      setIsSearchOpen(false);
      setSearchTerm('');
      setTimeout(() => setHighlightedProductId(null), 3000);
    };

    if (result.page === 'Products' && !isProductsUnlocked) {
      setPendingSearchAction(() => action);
      setIsProductsModalOpen(true);
    } else {
      action();
    }
  };

  const handleQuickLinkClick = (sectionTitle: string) => {
    const action = () => {
      setActiveTab('Products');
      setIsSearchOpen(false);
      setSearchTerm('');

      setTimeout(() => {
        const sections = document.querySelectorAll('h2');
        const sectionElement = Array.from(sections).find(h => h.textContent === sectionTitle);
        if (sectionElement) {
          sectionElement.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    };

    if (!isProductsUnlocked) {
      setPendingSearchAction(() => action);
      setIsProductsModalOpen(true);
    } else {
      action();
    }
  };

  const handleProductsUnlockSuccess = () => {
    setIsProductsUnlocked(true);
    setIsProductsModalOpen(false);
    if (pendingSearchAction) {
      pendingSearchAction();
      setPendingSearchAction(null);
    }
  };

  const handleAddToScorecard = (row: DataRow) => {
    const exists = scorecardLeads.find(l => l.businessName === (row.businessName || row['Entity Name']));
    if (exists) {
      return;
    }

    const newLead: BusinessLead = {
      id: Math.random().toString(36).substr(2, 9),
      businessName: row.businessName || row['Entity Name'] || 'Unknown Business',
      address: row.address || row['Location'] || '',
      city: row.city || '',
      state: row.state || '',
      zip: row._zip || row.Zip || '',
      phone: row.phone || row.Phone || '',
      website: row.website || row.Website || '',
      email: row.email || '',
      source: row._type || 'Manual',
      status: LeadStatus.NEW,
      type: LeadType.PROSPECT,
      industry: row.Category || row['Category '] || '',
      keyPrincipal: row['Key Principal'] || row['Officer/Director'] || '',
      notes: '',
      activities: [],
      lastUpdated: new Date().toISOString(),
      score: row.Score || calculateScore(row),
      ein: row['FEI/EIN Number'] || row.ein || '',
      entityType: row['Entity Type'] || row.entityType || '',
      establishedDate: row['Date Filed'] || '',
    };

    setScorecardLeads(prev => [newLead, ...prev]);
    setActiveTab('Scorecard');
  };

  const downloadCSV = () => {
    const dataToExport = filteredData.map(row => {
      const exportRow: any = {};
      visibleColumns.forEach(col => {
        exportRow[col] = col === 'Location' ? row._location : col === 'Zip' ? row._zip : row[col];
      });
      return exportRow;
    });
    const csv = Papa.unparse(dataToExport);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (error) return <div className="p-8 text-red-500">{error}</div>;

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-slate-100 transition-colors">
      {loadProgress.current < loadProgress.total && (
        <div className="w-full shrink-0">
          <div className="h-1 bg-blue-100 dark:bg-blue-900/30 w-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-500 ease-out"
              style={{ width: `${(loadProgress.current / loadProgress.total) * 100}%` }}
            />
          </div>
          <div className="bg-blue-50/50 dark:bg-blue-900/10 px-4 py-1 flex justify-between items-center border-b border-blue-100/50 dark:border-blue-900/20">
            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
              System Sync: {loadProgress.current} / {loadProgress.total} Data Streams Loaded
            </span>
            <span className="text-[9px] text-blue-400 animate-pulse font-bold italic">Optimizing Tables...</span>
          </div>
        </div>
      )}
      <Header
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        isSearchOpen={isSearchOpen}
        setIsSearchOpen={setIsSearchOpen}
        searchResults={searchResults}
        onResultClick={handleResultClick}
        onQuickLinkClick={handleQuickLinkClick}
        isProductsUnlocked={isProductsUnlocked}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        onToggleLeftSidebar={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)}
        onToggleRightSidebar={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
        isRightSidebarOpen={isRightSidebarOpen}
      />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          types={types}
          activeTab={activeTab}
          setActiveTab={handleTabChange}
          isProductsUnlocked={isProductsUnlocked}
          onToggleProductsLock={() => setIsProductsUnlocked(!isProductsUnlocked)}
          zips={zips}
          selectedZip={columnFilters['Zip']?.[0] || 'All'}
          setSelectedZip={(z) => onFilterChange('Zip', z === 'All' ? [] : [z])}
          locations={locations}
          selectedLocation={columnFilters['Location']?.[0] || 'All'}
          setSelectedLocation={(l) => onFilterChange('Location', l === 'All' ? [] : [l])}
          isOpen={isLeftSidebarOpen}
          onClose={() => setIsLeftSidebarOpen(false)}
          onGoHome={() => handleTabChange('Home')}
          allDataCount={allData.length}
          isSyncing={loadProgress.current < loadProgress.total}
        />

        <main className="flex-1 flex flex-col min-w-0 bg-white dark:bg-slate-900 md:rounded-tl-2xl border-l dark:border-slate-800">
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center space-y-4">
              <div className="w-12 h-12 border-4 border-t-blue-600 rounded-full animate-spin"></div>
              <div className="text-center">
                <p className="text-gray-600 dark:text-slate-400 font-medium">Please wait while we load the data streams...</p>
                <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">Preparing your business intelligence workspace</p>
              </div>
            </div>
          ) : activeTab === 'Home' && !searchTerm ? (
            <Dashboard types={types} onSelectCategory={setActiveTab} rowCount={allData.length} />
          ) : activeTab === 'Insights' ? (
            <Insights
              data={allData}
              types={types}
              onNavigate={handleTabChange}
              onFilterChange={onFilterChange}
            />
          ) : activeTab === 'Territory Map' ? (
            <TerritoryMap
              data={allData}
              onSelectZip={(zip) => {
                setActiveTab(zip);
                onFilterChange('Zip', [zip]);
              }}
            />
          ) : activeTab === 'Action Hub' ? (
            <ActionHub
              leads={scorecardLeads}
              onUpdateLeads={setScorecardLeads}
              onSelectLead={(lead) => {
                setSelectedLeadId(lead.id);
                setIsRightSidebarOpen(true);
              }}
            />
          ) : activeTab === 'SMB Selector' ? (
            <SmbCheckingSelector setActivePage={setActiveTab} />
          ) : activeTab === 'Product Guide' ? (
            productGuides.length > 0 ? (
              <ProductGuideRenderer
                guide={productGuides[0]}
                setProductGuides={setProductGuides}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-t-blue-600 rounded-full animate-spin"></div>
              </div>
            )
          ) : activeTab === 'Products' ? (
            isProductsUnlocked ? (
              <Products highlightedProductId={highlightedProductId} />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-4">
                <div className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-full text-blue-600 dark:text-blue-400">
                  <Database className="w-12 h-12" />
                </div>
                <div className="max-w-md space-y-2">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Products Tool Locked</h2>
                  <p className="text-gray-500 dark:text-slate-400">
                    This section contains sensitive product and service data. Please use the authorization code to gain access.
                  </p>
                </div>
                <button
                  onClick={() => setIsProductsModalOpen(true)}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-colors shadow-lg shadow-blue-500/20"
                >
                  Unlock Access
                </button>
              </div>
            )
          ) : activeTab === 'treasury-guide' ? (
            <TreasuryGuide />
          ) : activeTab === 'Activity Log' ? (
            <ActivityLog
              callEntries={callEntries}
              setCallEntries={setCallEntries}
              emailEntries={emailEntries}
              setEmailEntries={setEmailEntries}
              meetingEntries={meetingEntries}
              setMeetingEntries={setMeetingEntries}
              leads={scorecardLeads}
            />
          ) : activeTab === 'Playbook' ? (
            <Playbook
              allData={allData}
              scorecardLeads={scorecardLeads}
              onSelectLead={(lead) => {
                setActiveTab('Scorecard');
                setSelectedLeadId(lead.id);
                setIsRightSidebarOpen(true);
              }}
              onSelectRow={(row) => {
                // If it's a prospect, we might want to show it in the context of its source hub
                // but for now, let's just show the detail view
                setSelectedRow(row);
                setIsRightSidebarOpen(true);
              }}
              onAddToScorecard={handleAddToScorecard}
            />
          ) : activeTab === 'Scorecard' ? (
            <Scorecard
              leads={scorecardLeads}
              setLeads={setScorecardLeads}
              metrics={scorecardMetrics}
              setMetrics={setScorecardMetrics}
              onSelectLead={(lead) => {
                if (selectedLeadId === lead?.id) {
                  setSelectedLeadId(null);
                  setIsRightSidebarOpen(false);
                } else {
                  setSelectedLeadId(lead?.id || null);
                  if (lead) setIsRightSidebarOpen(true);
                }
              }}
              selectedLeadId={selectedLeadId}
            />
          ) : (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="px-6 py-4 flex items-center justify-between shrink-0">
                <div>
                  <h2 className="text-lg font-bold">{activeTab} Hub</h2>
                  <p className="text-xs text-gray-500">{filteredData.length.toLocaleString()} records found</p>
                </div>
                <div className="flex items-center space-x-3">
                  <button onClick={() => setIsSecurityModalOpen(true)} className="flex items-center space-x-2 px-3 py-1.5 bg-blue-600 text-white rounded-md text-xs font-semibold">
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>
                  <div className="flex items-center space-x-2">
                    <ColumnToggle
                      columns={currentColumnOrder}
                      visibleColumns={visibleColumns}
                      onToggle={toggleColumn}
                      onReorder={handleColumnReorder}
                    />
                   {['3. UCC', '1. SB', '2. YP'].includes(activeTab) && (
                      <button
                        onClick={copyLayoutConfig}
                        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:text-slate-400 dark:hover:text-blue-400 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                        title="Copy Layout Configuration"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  {isFiltered && (
                    <button onClick={clearFilters} className="text-xs font-semibold text-red-600 flex items-center">
                      <FilterX className="w-3.5 h-3.5 mr-1" /> Clear
                    </button>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-hidden">
                <Table
                  data={filteredData} allData={debouncedAllData} visibleColumns={sortedVisibleColumns}
                  selectedRow={selectedRow}
                  onRowSelect={(row) => {
                    if (selectedRow === row) {
                      setSelectedRow(null);
                      setIsRightSidebarOpen(false);
                    } else {
                      setSelectedRow(row);
                      setIsRightSidebarOpen(true);
                    }
                  }}
                  columnFilters={columnFilters} onFilterChange={onFilterChange}
                  sortConfig={sortConfig} onSortChange={setSortConfig}
                />
              </div>
            </div>
          )}
        </main>

        {activeTab === 'Scorecard' ? (
          <ScorecardRightSidebar
            selectedLead={scorecardLeads.find(l => l.id === selectedLeadId) || null}
            metrics={scorecardMetrics}
            onClose={() => {
              setSelectedLeadId(null);
              setIsRightSidebarOpen(false);
            }}
            isOpen={isRightSidebarOpen}
            onUpdateLead={(updatedLead) => {
              setScorecardLeads(prev => prev.map(l => l.id === updatedLead.id ? updatedLead : l));
            }}
            onAddCallLog={addCallEntry}
            onAddEmailLog={addEmailEntry}
            onAddMeetingLog={addMeetingEntry}
            width={rightSidebarWidth}
            isResizing={isResizing}
            onResizeStart={startResizing}
            onToggle={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
          />
        ) : (
          <RightSidebar
            selectedRow={selectedRow}
            onClose={() => {
              setSelectedRow(null);
              setIsRightSidebarOpen(false);
            }}
            manifest={manifest}
            activeTab={activeTab}
            productGuide={productGuides[0]}
            isOpen={isRightSidebarOpen}
            onAddToScorecard={handleAddToScorecard}
            width={rightSidebarWidth}
            isResizing={isResizing}
            onResizeStart={startResizing}
            onToggle={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
          />
        )}
      </div>

      <DownloadSecurityModal isOpen={isSecurityModalOpen} onClose={() => setIsSecurityModalOpen(false)} onSuccess={() => { setIsSecurityModalOpen(false); downloadCSV(); }} />
      <ProductsSecurityModal isOpen={isProductsModalOpen} onClose={() => setIsProductsModalOpen(false)} onSuccess={handleProductsUnlockSuccess} />
    </div>
  );
}

export default App;
