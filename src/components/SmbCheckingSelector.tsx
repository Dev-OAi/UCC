import React, { useState, useEffect } from 'react';
import { Page } from '../App';

type AccountType = 'Basic Business Checking' | 'Advantage Business Checking' | 'Premier Business Checking';

interface ComparisonRow {
    feature: string;
    basic: string | React.ReactNode;
    advantage: string | React.ReactNode;
    premier: string | React.ReactNode;
    highlight?: boolean;
}

interface SmbCheckingSelectorProps {
    setActivePage?: (page: Page) => void;
}

export const SmbCheckingSelector: React.FC<SmbCheckingSelectorProps> = ({ setActivePage }) => {
    // Qualification State
    const [qualifierQuestions, setQualifierQuestions] = useState({
        analysisAccount: false,
        highBalance: false,
        highCheckVol: false,
        highAchPay: false,
        achCollect: false
    });

    const [showMatrix, setShowMatrix] = useState(false);
    const [showBookingGuide, setShowBookingGuide] = useState(false);

    const isTreasury = Object.values(qualifierQuestions).some(v => v);

    // Selector Inputs
    const [avgBalance, setAvgBalance] = useState<string>('');
    const [transactions, setTransactions] = useState<string>('');
    const [cashDeposits, setCashDeposits] = useState<string>('');
    const [needsAch, setNeedsAch] = useState<boolean>(false);
    const [needsWires, setNeedsWires] = useState<boolean>(false);
    const [needsFraud, setNeedsFraud] = useState<boolean>(false);
    const [needsMultiUser, setNeedsMultiUser] = useState<boolean>(false);

    // Selector Output
    const [recommendation, setRecommendation] = useState<AccountType>('Basic Business Checking');
    const [reason, setReason] = useState<string>('Best for new businesses with low transaction volumes.');

    useEffect(() => {
        const bal = parseFloat(avgBalance.replace(/,/g, '')) || 0;
        const tx = parseFloat(transactions.replace(/,/g, '')) || 0;
        const cash = parseFloat(cashDeposits.replace(/,/g, '')) || 0;

        let rec: AccountType = 'Basic Business Checking';
        let recReason = 'Best starting point for low activity.';

        // Logic for upgrading to Advantage
        let upgradeToAdvantage = false;
        const advantageReasons: string[] = [];

        if (tx > 100) { upgradeToAdvantage = true; advantageReasons.push('Transaction volume > 100'); }
        if (cash > 10000) { upgradeToAdvantage = true; advantageReasons.push('Cash deposits > $10k'); }
        if (needsAch) { upgradeToAdvantage = true; advantageReasons.push('ACH Origination needed'); }
        if (needsFraud) { upgradeToAdvantage = true; advantageReasons.push('Fraud Protection tools needed'); }
        if (needsMultiUser) { upgradeToAdvantage = true; advantageReasons.push('Multiple user access needed'); }
        if (needsWires) { upgradeToAdvantage = true; advantageReasons.push('Online wire transfer capabilities'); }
        // If balance is high enough to waive Advantage fee but likely incur fees on Basic (unlikely as Basic waiver is lower),
        // but often if balance is > 5k, Advantage offers more value for free.
        if (bal >= 5000) { upgradeToAdvantage = true; advantageReasons.push('Balance qualifies for fee waiver'); }

        if (upgradeToAdvantage) {
            rec = 'Advantage Business Checking';
            recReason = `Recommended due to: ${advantageReasons.join(', ')}.`;
        }

        // Logic for upgrading to Premier
        let upgradeToPremier = false;
        const premierReasons: string[] = [];

        if (tx > 300) { upgradeToPremier = true; premierReasons.push('Transaction volume > 300'); }
        if (cash > 15000) { upgradeToPremier = true; premierReasons.push('Cash deposits > $15k'); }
        if (bal >= 10000) { upgradeToPremier = true; premierReasons.push('High balance ($10k+) maximizes benefits'); }

        if (upgradeToPremier) {
            rec = 'Premier Business Checking';
            recReason = `Recommended due to: ${premierReasons.join(', ')}.`;
        }

        setRecommendation(rec);
        setReason(recReason);

    }, [avgBalance, transactions, cashDeposits, needsAch, needsWires, needsFraud, needsMultiUser]);

    const comparisonData: ComparisonRow[] = [
        { feature: 'Minimum Opening Deposit', basic: '$100', advantage: '$1,000', premier: '$5,000' },
        { feature: 'Monthly Maintenance Fee', basic: '$15', advantage: '$45', premier: '$55' },
        { feature: 'Fee Waiver Requirement', basic: '$1,500 Avg Daily Balance', advantage: '$5,000 Avg Daily Balance', premier: '$10,000 Avg Daily Balance', highlight: true },
        { feature: 'Free Transactions / Mo', basic: '100', advantage: '300', premier: '600', highlight: true },
        { feature: 'Cash Processing Limit', basic: '$10,000', advantage: '$15,000', premier: '$25,000', highlight: true },
        { feature: 'Outgoing ACH Origination', basic: <span className="text-red-500">Not Included</span>, advantage: 'Single Included', premier: 'Single Included (Batch Avail)' },
        { feature: 'Outgoing Wires (Online)', basic: <span className="text-red-500">In-branch only</span>, advantage: 'First 5 Free', premier: 'First 5 Free' },
        { feature: 'Fraud Mitigation Tools', basic: <span className="text-red-500">Not Included</span>, advantage: 'Included', premier: 'Included' },
        { feature: 'Online Banking Users', basic: 'Single User', advantage: 'Multiple Users', premier: 'Multiple Users' },
    ];

    const matrixData = [
        { criteria: 'Balance', bundle: '< $100,000', treasury: '> $100,000' },
        { criteria: 'Checks Volume', bundle: 'Low', treasury: 'High' },
        { criteria: 'ACH Payments', bundle: <span>Single payments (typically)<br/><span className="text-xs italic text-gray-500">Batch enabled in Premier Bundle</span></span>, treasury: 'Batch payments' },
        { criteria: 'ACH Collections', bundle: 'Not supported', treasury: 'Supported' },
        { criteria: 'Service Preference', bundle: 'Basic bundle or simple payment needs', treasury: 'A la carte or complex payment needs' },
        { criteria: 'Cost', bundle: 'Lower base cost, streamlined options', treasury: <span>Higher base cost, customized options<br/><span className="text-xs italic text-gray-500">*Relationship based</span></span> },
    ];

    const toggleQuestion = (key: keyof typeof qualifierQuestions) => {
        setQualifierQuestions(prev => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <div className="themed-bg-surface themed-text-primary p-4 sm:p-6 lg:p-8 rounded-lg shadow-sm space-y-8 relative overflow-y-auto h-full">

            {/* Booking Guide Modal */}
            {showBookingGuide && (
                <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 rounded-lg" onClick={() => setShowBookingGuide(false)}>
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 max-w-lg w-full border border-gray-200 dark:border-gray-700" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">How to Book: SMB Bundle</h3>
                            <button onClick={() => setShowBookingGuide(false)} className="text-gray-500 hover:text-gray-700" aria-label="Close modal"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
                        </div>
                        <div className="prose prose-sm dark:prose-invert">
                            <ul className="list-disc pl-5 space-y-2">
                                <li><strong>Action Type:</strong> Retail Opportunity (Do not use Referral)</li>
                                <li><strong>Timing:</strong> Open the account in branch & complete DocuSign treasury enrollment first.</li>
                                <li><strong>In Salesforce:</strong>
                                    <ul className="list-circle pl-5 mt-1">
                                        <li>Search Business Name {'->'} New Opportunity</li>
                                        <li><strong>Product/Service Line:</strong> Deposit</li>
                                        <li><strong>Product Interest:</strong> Treasury Solutions</li>
                                        <li><strong>Product/Service Type:</strong> Small Business Bundle</li>
                                        <li><strong>Product/Service:</strong> Select specific bundle (Basic/Advantage/Premier)</li>
                                    </ul>
                                </li>
                                <li><strong>Note:</strong> New customer enrollment is captured through Terafina. No further action needed in Salesforce.</li>
                                <li className="text-indigo-600 font-bold">One Opportunity per Bundle opened.</li>
                            </ul>
                        </div>
                        <div className="mt-6 text-right">
                            <button onClick={() => setShowBookingGuide(false)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium">Close</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Qualification Section */}
            <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900 rounded-xl p-6 shadow-sm">
                <div className="flex flex-col lg:flex-row gap-8">
                    <div className="flex-1">
                        <h2 className="text-2xl font-bold text-[#c0392b] dark:text-red-400 mb-2">Is my client a Bundle client or not?</h2>
                        <p className="text-gray-700 dark:text-gray-300 mb-6 font-medium">Ask these questions to determine the right path:</p>

                        <div className="space-y-3">
                            <label className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded border border-red-100 dark:border-red-800/50 cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                                <span className="text-gray-800 dark:text-gray-200 font-medium">Is the client currently in an analysis account?</span>
                                <input type="checkbox" checked={qualifierQuestions.analysisAccount} onChange={() => toggleQuestion('analysisAccount')} className="w-5 h-5 text-[#c0392b] rounded focus:ring-[#c0392b]" />
                            </label>
                            <label className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded border border-red-100 dark:border-red-800/50 cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                                <span className="text-gray-800 dark:text-gray-200 font-medium">Do they maintain balances greater than $100,000?</span>
                                <input type="checkbox" checked={qualifierQuestions.highBalance} onChange={() => toggleQuestion('highBalance')} className="w-5 h-5 text-[#c0392b] rounded focus:ring-[#c0392b]" />
                            </label>
                            <label className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded border border-red-100 dark:border-red-800/50 cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                                <span className="text-gray-800 dark:text-gray-200 font-medium">Do they have a large volume of outgoing checks?</span>
                                <input type="checkbox" checked={qualifierQuestions.highCheckVol} onChange={() => toggleQuestion('highCheckVol')} className="w-5 h-5 text-[#c0392b] rounded focus:ring-[#c0392b]" />
                            </label>
                            <label className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded border border-red-100 dark:border-red-800/50 cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                                <span className="text-gray-800 dark:text-gray-200 font-medium">Do they utilize outgoing ACH for a high volume of payments?</span>
                                <input type="checkbox" checked={qualifierQuestions.highAchPay} onChange={() => toggleQuestion('highAchPay')} className="w-5 h-5 text-[#c0392b] rounded focus:ring-[#c0392b]" />
                            </label>
                            <label className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded border border-red-100 dark:border-red-800/50 cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                                <span className="text-gray-800 dark:text-gray-200 font-medium">Do they collect funds from others via ACH?</span>
                                <input type="checkbox" checked={qualifierQuestions.achCollect} onChange={() => toggleQuestion('achCollect')} className="w-5 h-5 text-[#c0392b] rounded focus:ring-[#c0392b]" />
                            </label>
                        </div>

                        <button
                            onClick={() => setShowMatrix(!showMatrix)}
                            className="mt-6 text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 flex items-center focus:outline-none"
                        >
                            <svg className={`w-4 h-4 mr-1 transform transition-transform ${showMatrix ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            {showMatrix ? 'Hide' : 'Show'} Decision Matrix & Payment Details
                        </button>
                    </div>

                    <div className="lg:w-1/3 flex flex-col">
                        <div className={`flex-1 p-6 rounded-xl text-center border-2 transition-all flex flex-col justify-center items-center shadow-md ${isTreasury ? 'bg-[#c0392b] border-[#a93226] text-white' : 'bg-green-600 border-green-700 text-white'}`}>
                            <h3 className="text-2xl font-bold mb-2 uppercase tracking-wider">{isTreasury ? 'Traditional Treasury' : 'Business Bundle'}</h3>
                            <div className="h-px w-full bg-white/30 my-3"></div>
                            <p className="text-sm font-medium mb-6 leading-relaxed">
                                {isTreasury
                                    ? "This client fits the profile for Traditional Treasury: Higher balances and more complex cash management needs."
                                    : "This client fits the profile for Business Bundles: Aimed toward smaller businesses with lower balances and simpler needs."}
                            </p>

                            {isTreasury ? (
                                setActivePage ? (
                                    <button onClick={() => setActivePage('treasury-guide')} className="bg-white text-[#c0392b] hover:bg-gray-100 px-6 py-3 rounded-lg text-sm font-bold shadow-sm transition-colors w-full uppercase tracking-wide">
                                        View Treasury Guide
                                    </button>
                                ) : (
                                    <div className="bg-white/20 p-2 rounded text-sm font-bold">Refer to Treasury Team</div>
                                )
                            ) : (
                                <div className="flex flex-col items-center animate-pulse">
                                    <span className="font-bold mb-1 uppercase tracking-wide text-sm">Proceed Below</span>
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path></svg>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Collapsible Matrix & Details */}
                {showMatrix && (
                    <div className="mt-6 pt-6 border-t border-red-200 dark:border-red-900/50 animate-fade-in">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4">Treasury Package Decision Matrix</h3>
                        <div className="overflow-x-auto bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 mb-6">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold">
                                    <tr>
                                        <th className="p-3 border-b border-gray-200 dark:border-gray-700 w-1/4">Criteria</th>
                                        <th className="p-3 border-b border-gray-200 dark:border-gray-700 w-1/3">Business Bundle</th>
                                        <th className="p-3 border-b border-gray-200 dark:border-gray-700">Traditional Treasury</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {matrixData.map((row, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                            <td className="p-3 font-medium text-gray-900 dark:text-gray-100 border-r border-gray-100 dark:border-gray-800">{row.criteria}</td>
                                            <td className="p-3 text-gray-700 dark:text-gray-300 border-r border-gray-100 dark:border-gray-800">{row.bundle}</td>
                                            <td className="p-3 text-gray-700 dark:text-gray-300 bg-red-50/50 dark:bg-red-900/10 font-medium">{row.treasury}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                                <h4 className="font-bold text-indigo-700 dark:text-indigo-400 mb-2">SMB Bundle Payment Products</h4>
                                <ul className="list-disc ml-4 text-sm text-gray-600 dark:text-gray-300 space-y-2">
                                    <li><strong>ACH Origination:</strong> Single, outgoing payments only (e.g., payroll, vendor payments). <span className="italic">Batch ACH available in Premier Bundle.</span></li>
                                    <li><strong>Wires:</strong> Wire Module included for domestic & international transfers.</li>
                                    <li><strong>Structure:</strong> Streamlined online banking profile.</li>
                                </ul>
                            </div>
                            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                                <h4 className="font-bold text-[#c0392b] dark:text-red-400 mb-2">Traditional Treasury Payment Products</h4>
                                <ul className="list-disc ml-4 text-sm text-gray-600 dark:text-gray-300 space-y-2">
                                    <li><strong>ACH Capabilities:</strong> Single or Batch transactions. Both Credits (payments) and Debits (collections) supported.</li>
                                    <li><strong>Advanced Input:</strong> Supports standard templates, NACHA format upload, or Secure File Transfer Protocol (SFTP).</li>
                                    <li><strong>Wires:</strong> Bulk wire payment file uploads supported.</li>
                                </ul>
                            </div>
                        </div>

                        <div className="mt-4 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                            <h4 className="font-bold text-gray-800 dark:text-gray-200 mb-2 text-sm uppercase">Other Treasury Products (SMB & Treasury)</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <span className="font-bold text-sm text-gray-900 dark:text-gray-100">Remote Deposit Capture (RDC)</span>
                                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Scan & deposit checks electronically. 7PM EST cutoff. <br/>$30/mo + scanner fee.</p>
                                </div>
                                <div>
                                    <span className="font-bold text-sm text-gray-900 dark:text-gray-100">Universal Payment ID (UPIC)</span>
                                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Masked account number for safe incoming ACH credits. Prevents unauthorized debits. $5/mo.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className={`transition-opacity duration-500 ${isTreasury ? 'opacity-50 pointer-events-none filter grayscale' : 'opacity-100'}`}>
                <div className="text-center max-w-4xl mx-auto mb-8 border-t border-gray-200 dark:border-gray-700 pt-12">
                    <h1 id="smb-checking-selector" className="text-3xl font-bold mb-4">Small Business Bundle Selector</h1>
                    <p className="themed-text-secondary text-lg">
                        Evaluate client needs to recommend the most cost-effective and feature-rich checking solution.
                    </p>
                </div>

                {/* Recommendation Tool */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Inputs */}
                    <div className="lg:col-span-1 themed-bg-secondary p-6 rounded-xl border themed-border shadow-sm bg-gray-50 dark:bg-slate-800/50">
                        <h2 className="text-lg font-bold mb-4 flex items-center">
                            <svg className="w-5 h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            Client Profile
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium themed-text-secondary mb-1">Avg. Monthly Balance ($)</label>
                                <input type="text" value={avgBalance} onChange={e => setAvgBalance(e.target.value)} className="w-full p-2 rounded border themed-border bg-white dark:bg-gray-800" placeholder="e.g. 5000" aria-label="Average Monthly Balance" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium themed-text-secondary mb-1">Monthly Transactions (#)</label>
                                <input type="text" value={transactions} onChange={e => setTransactions(e.target.value)} className="w-full p-2 rounded border themed-border bg-white dark:bg-gray-800" placeholder="e.g. 150" aria-label="Monthly Transactions" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium themed-text-secondary mb-1">Monthly Cash Deposits ($)</label>
                                <input type="text" value={cashDeposits} onChange={e => setCashDeposits(e.target.value)} className="w-full p-2 rounded border themed-border bg-white dark:bg-gray-800" placeholder="e.g. 2000" aria-label="Monthly Cash Deposits" />
                            </div>

                            <div className="pt-4 border-t themed-border">
                                <label className="block text-sm font-medium themed-text-secondary mb-2">Required Features:</label>
                                <div className="space-y-2">
                                    <label className="flex items-center space-x-2 cursor-pointer">
                                        <input type="checkbox" checked={needsAch} onChange={e => setNeedsAch(e.target.checked)} className="rounded text-indigo-600 focus:ring-indigo-500" />
                                        <span className="text-sm">ACH Origination</span>
                                    </label>
                                    <label className="flex items-center space-x-2 cursor-pointer">
                                        <input type="checkbox" checked={needsWires} onChange={e => setNeedsWires(e.target.checked)} className="rounded text-indigo-600 focus:ring-indigo-500" />
                                        <span className="text-sm">Online Wires (5 Free)</span>
                                    </label>
                                    <label className="flex items-center space-x-2 cursor-pointer">
                                        <input type="checkbox" checked={needsFraud} onChange={e => setNeedsFraud(e.target.checked)} className="rounded text-indigo-600 focus:ring-indigo-500" />
                                        <span className="text-sm">Fraud Protection Tools</span>
                                    </label>
                                    <label className="flex items-center space-x-2 cursor-pointer">
                                        <input type="checkbox" checked={needsMultiUser} onChange={e => setNeedsMultiUser(e.target.checked)} className="rounded text-indigo-600 focus:ring-indigo-500" />
                                        <span className="text-sm">Multiple Users</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Recommendation Output */}
                    <div className="lg:col-span-2 flex flex-col">
                        <div className="flex-1 bg-gradient-to-br from-indigo-600 to-blue-700 rounded-xl shadow-lg p-8 text-white flex flex-col justify-center items-center text-center relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zm0 9l2.5-1.25L12 8.5l-2.5 1.25L12 11zm0 2.5l-5-2.5-5 2.5L12 22l10-8.5-5-2.5-5 2.5z"></path></svg>
                            </div>

                            <h3 className="text-lg uppercase tracking-widest font-semibold opacity-90 mb-2">Recommended Bundle</h3>
                            <h2 className="text-4xl font-bold mb-4">{recommendation}</h2>
                            <p className="text-indigo-100 text-lg max-w-lg bg-white/10 p-3 rounded-lg border border-white/20">
                                {reason}
                            </p>

                            <div className="mt-8 grid grid-cols-3 gap-4 w-full max-w-2xl">
                                <div className="bg-white/20 rounded p-3 text-center">
                                    <span className="block text-2xl font-bold">
                                        {recommendation === 'Basic Business Checking' ? '100' : recommendation === 'Advantage Business Checking' ? '300' : '600'}
                                    </span>
                                    <span className="text-xs uppercase opacity-80">Free Txns</span>
                                </div>
                                <div className="bg-white/20 rounded p-3 text-center">
                                    <span className="block text-2xl font-bold">
                                        ${recommendation === 'Basic Business Checking' ? '1.5k' : recommendation === 'Advantage Business Checking' ? '5k' : '10k'}
                                    </span>
                                    <span className="text-xs uppercase opacity-80">Waiver Bal</span>
                                </div>
                                <div className="bg-white/20 rounded p-3 text-center">
                                    <span className="block text-2xl font-bold">
                                        {recommendation === 'Basic Business Checking' ? 'N/A' : 'Incl.'}
                                    </span>
                                    <span className="text-xs uppercase opacity-80">Fraud Tools</span>
                                </div>
                            </div>

                            <button onClick={() => setShowBookingGuide(true)} className="mt-6 text-xs text-white/80 hover:text-white underline uppercase tracking-wide">
                                View Booking Instructions
                            </button>
                        </div>
                    </div>
                </div>

                {/* Comparison Table */}
                <div className="mt-12 pb-12">
                    <h2 className="text-2xl font-bold mb-6 themed-text-primary border-b themed-border pb-2">Bundle Comparison</h2>
                    <div className="overflow-x-auto themed-border border rounded-lg shadow-sm">
                        <table className="w-full text-sm text-left border-collapse">
                            <thead>
                                <tr className="themed-bg-secondary text-center">
                                    <th className="p-4 themed-border border-b border-r text-left w-1/4 bg-gray-50 dark:bg-slate-800">Features</th>
                                    <th className={`p-4 themed-border border-b border-r w-1/4 ${recommendation === 'Basic Business Checking' ? 'bg-indigo-50 dark:bg-indigo-900/30 ring-2 ring-inset ring-indigo-500' : 'bg-gray-50 dark:bg-slate-800'}`}>
                                        <span className="block text-lg font-bold">Basic</span>
                                        <span className="text-xs font-normal opacity-75">Simple & Streamlined</span>
                                    </th>
                                    <th className={`p-4 themed-border border-b border-r w-1/4 ${recommendation === 'Advantage Business Checking' ? 'bg-indigo-50 dark:bg-indigo-900/30 ring-2 ring-inset ring-indigo-500' : 'bg-gray-50 dark:bg-slate-800'}`}>
                                        <span className="block text-lg font-bold">Advantage</span>
                                        <span className="text-xs font-normal opacity-75">Speed & Efficiency</span>
                                    </th>
                                    <th className={`p-4 themed-border border-b w-1/4 ${recommendation === 'Premier Business Checking' ? 'bg-indigo-50 dark:bg-indigo-900/30 ring-2 ring-inset ring-indigo-500' : 'bg-gray-50 dark:bg-slate-800'}`}>
                                        <span className="block text-lg font-bold">Premier</span>
                                        <span className="text-xs font-normal opacity-75">Scale & Reach</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {comparisonData.map((row, idx) => (
                                    <tr key={idx} className="hover:themed-bg-tertiary transition-colors">
                                        <td className="p-3 themed-border border-r font-semibold themed-text-primary">{row.feature}</td>
                                        <td className={`p-3 themed-border border-r text-center ${recommendation === 'Basic Business Checking' ? 'bg-indigo-50/50 dark:bg-indigo-900/10 font-bold' : ''}`}>
                                            {row.basic}
                                        </td>
                                        <td className={`p-3 themed-border border-r text-center ${recommendation === 'Advantage Business Checking' ? 'bg-indigo-50/50 dark:bg-indigo-900/10 font-bold' : ''}`}>
                                            {row.advantage}
                                        </td>
                                        <td className={`p-3 themed-border text-center ${recommendation === 'Premier Business Checking' ? 'bg-indigo-50/50 dark:bg-indigo-900/10 font-bold' : ''}`}>
                                            {row.premier}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="mt-4 text-xs themed-text-secondary italic">
                        * Per item fee applies after free transaction limit ($0.50 each). Cash processing fee applies after limit ($0.30/$100).
                    </div>
                </div>
            </div>
        </div>
    );
};
