import React, { useState } from 'react';
import { feeTableData, documentationRequirements } from '../lib/lendingData';
import { Search, DollarSign, FileText, CheckCircle2, AlertCircle, Info } from 'lucide-react';

interface LendingResourcesProps {
  initialTab?: 'fees' | 'docs';
}

export const LendingResources: React.FC<LendingResourcesProps> = ({ initialTab = 'fees' }) => {
  const [activeTab, setActiveTab] = useState<'fees' | 'docs'>(initialTab);
  const [loanAmount, setLoanAmount] = useState<string>('');

  const numericAmount = loanAmount ? parseInt(loanAmount.replace(/[^0-9]/g, '')) : 0;

  const isHighlighted = (min: number, max: number) => {
    if (numericAmount === 0) return false;
    return numericAmount >= min && numericAmount <= max;
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900">
      <div className="border-b border-gray-200 dark:border-slate-800">
        <div className="flex space-x-8 px-6">
          <button
            onClick={() => setActiveTab('fees')}
            className={`py-4 px-1 text-sm font-bold uppercase tracking-widest border-b-2 transition-colors ${
              activeTab === 'fees'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            Lending Fee Schedule
          </button>
          <button
            onClick={() => setActiveTab('docs')}
            className={`py-4 px-1 text-sm font-bold uppercase tracking-widest border-b-2 transition-colors ${
              activeTab === 'docs'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            Documentation Checklist
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {activeTab === 'fees' ? (
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="bg-blue-50 dark:bg-blue-900/10 rounded-xl p-4 border border-blue-100 dark:border-blue-900/30 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <DollarSign className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <div>
                  <h4 className="text-sm font-bold text-blue-900 dark:text-blue-100">Interactive Highlighting</h4>
                  <p className="text-xs text-blue-700 dark:text-blue-300">Enter a loan amount to see applicable fees.</p>
                </div>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500">$</span>
                <input
                  type="text"
                  placeholder="Enter amount (e.g. 150000)"
                  className="pl-7 pr-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 w-48"
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(e.target.value)}
                />
              </div>
            </div>

            <div className="border border-gray-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm bg-white dark:bg-slate-900">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-50 dark:bg-slate-800/50 text-gray-500 dark:text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                    <th className="px-4 py-3 text-left border-b border-gray-200 dark:border-slate-800">Product</th>
                    <th className="px-4 py-3 text-center border-b border-gray-200 dark:border-slate-800">Loan Amount Range</th>
                    <th className="px-4 py-3 text-center border-b border-gray-200 dark:border-slate-800">App Fee</th>
                    <th className="px-4 py-3 text-center border-b border-gray-200 dark:border-slate-800">Doc Fee</th>
                    <th className="px-4 py-3 text-center border-b border-gray-200 dark:border-slate-800">Annual Renewal</th>
                    <th className="px-4 py-3 text-center border-b border-gray-200 dark:border-slate-800">UCC Filing</th>
                    <th className="px-4 py-3 text-center border-b border-gray-200 dark:border-slate-800">Stamps (FL)</th>
                    <th className="px-4 py-3 text-left border-b border-gray-200 dark:border-slate-800">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                  {feeTableData.map((row, idx) => (
                    <tr
                      key={idx}
                      className={`transition-all duration-300 ${
                        isHighlighted(row.minAmount, row.maxAmount)
                          ? 'bg-blue-100 dark:bg-blue-900/40 ring-2 ring-blue-500 ring-inset scale-[1.002] z-10'
                          : 'hover:bg-gray-50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <td className="px-4 py-4 font-semibold text-gray-900 dark:text-white border-r border-gray-100 dark:border-slate-800">
                        {row.product}
                      </td>
                      <td className="px-4 py-4 text-center text-gray-600 dark:text-slate-300 border-r border-gray-100 dark:border-slate-800">
                        {row.displayAmount}
                      </td>
                      <td className="px-4 py-4 text-center font-medium text-gray-900 dark:text-white border-r border-gray-100 dark:border-slate-800">
                        {row.appFee}
                      </td>
                      <td className="px-4 py-4 text-center text-gray-600 dark:text-slate-300 border-r border-gray-100 dark:border-slate-800">
                        {row.docFee}
                      </td>
                      <td className="px-4 py-4 text-center text-gray-600 dark:text-slate-300 border-r border-gray-100 dark:border-slate-800">
                        {row.renewalFee}
                      </td>
                      <td className="px-4 py-4 text-center text-gray-600 dark:text-slate-300 border-r border-gray-100 dark:border-slate-800">
                        {row.uccFee}
                      </td>
                      <td className="px-4 py-4 text-center text-gray-600 dark:text-slate-300 border-r border-gray-100 dark:border-slate-800">
                        {row.stamps}
                      </td>
                      <td className="px-4 py-4 text-xs italic text-gray-500 dark:text-slate-400">
                        {row.notes}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="flex items-center space-x-2 pb-2 border-b border-gray-100 dark:border-slate-800">
                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-black text-gray-800 dark:text-slate-100 uppercase tracking-tight">Unsecured & ALL Requests</h3>
              </div>
              <ul className="space-y-3">
                {documentationRequirements.allRequests.map((req, idx) => (
                  <li key={idx} className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-800 group hover:border-blue-200 dark:hover:border-blue-900/50 transition-colors">
                    <CheckCircle2 className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
                    <span className="text-sm text-gray-700 dark:text-slate-300 font-medium">{req}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-6">
              <div className="space-y-6">
                <div className="flex items-center space-x-2 pb-2 border-b border-gray-100 dark:border-slate-800">
                  <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <h3 className="text-lg font-black text-gray-800 dark:text-slate-100 uppercase tracking-tight">Secured Loans</h3>
                </div>
                <ul className="space-y-3">
                  {documentationRequirements.securedRequests.map((req, idx) => (
                    <li key={idx} className="flex items-start space-x-3 p-3 rounded-lg bg-emerald-50/30 dark:bg-emerald-900/10 border border-emerald-100/50 dark:border-emerald-900/30 group hover:border-emerald-200 dark:hover:border-emerald-800 transition-colors">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
                      <span className="text-sm text-gray-700 dark:text-slate-300 font-medium">{req}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-6 space-y-4">
                <div className="flex items-center space-x-2 text-amber-600 dark:text-amber-400">
                  <AlertCircle className="w-5 h-5" />
                  <h4 className="text-sm font-bold uppercase tracking-wider">Additional Documentation</h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {documentationRequirements.additionalDocumentation.map((req, idx) => (
                    <div key={idx} className="flex items-center space-x-2 p-2 rounded bg-amber-50/50 dark:bg-amber-900/5 border border-amber-100/50 dark:border-amber-900/20">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      <span className="text-xs font-medium text-amber-800 dark:text-amber-200">{req}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
