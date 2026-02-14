import React, { useState } from 'react';

interface TreasuryProduct {
    id: string;
    name: string;
    description: string;
    idealFor: string;
    keyBenefit: string;
}

const products: TreasuryProduct[] = [
    {
        id: 'rdc',
        name: 'Remote Deposit Capture (RDC)',
        description: 'Allows businesses to scan checks and deposit them electronically from their office.',
        idealFor: 'Businesses receiving > 10 checks/week or located far from a branch.',
        keyBenefit: 'Saves time, extends deposit deadline to 7pm ET.'
    },
    {
        id: 'pos-pay',
        name: 'Positive Pay (Check & ACH)',
        description: 'Automated fraud detection tool that matches presented checks/ACH against a list of issued payments.',
        idealFor: 'Any business writing checks or allowing ACH debits.',
        keyBenefit: 'Prevents fraud before money leaves the account.'
    },
    {
        id: 'ach',
        name: 'ACH Origination',
        description: 'Electronic payment system for direct deposit payroll, vendor payments, and collecting customer dues.',
        idealFor: 'Businesses with employees or recurring customer billing.',
        keyBenefit: 'Faster, cheaper than checks, and more predictable cash flow.'
    },
    {
        id: 'wire',
        name: 'Wire Transfers',
        description: 'Real-time fund transfers domestically or internationally.',
        idealFor: 'Large, urgent, or international payments.',
        keyBenefit: 'Immediate availability of funds for the recipient.'
    },
    {
        id: 'merchant',
        name: 'Merchant Services',
        description: 'Credit card processing capabilities for accepting customer payments.',
        idealFor: 'Retail, Restaurants, Service businesses.',
        keyBenefit: 'Seamless integration with POS systems and next-day funding.'
    },
    {
        id: 'lockbox',
        name: 'Lockbox Services',
        description: 'Bank receives mail, processes payments, and deposits funds directly.',
        idealFor: 'High volume receivables (Medical, Property Mgmt).',
        keyBenefit: 'Accelerates receivables and reduces internal processing work.'
    }
];

export const TreasuryGuide: React.FC = () => {
    const [openId, setOpenId] = useState<string | null>(null);

    return (
        <div className="themed-bg-surface themed-text-primary p-4 sm:p-6 lg:p-8 rounded-lg shadow-sm overflow-y-auto h-full">
            <h1 id="treasury-product-guide" className="text-3xl font-bold mb-6 text-[#003459] dark:text-blue-300">Treasury Product Guide</h1>
            <p className="mb-8 text-lg themed-text-secondary">Quick reference for identifying and selling Cash Management solutions.</p>

            <div className="grid grid-cols-1 gap-4 pb-12">
                {products.map((prod) => (
                    <div key={prod.id} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800 shadow-sm transition-all">
                        <button
                            onClick={() => setOpenId(openId === prod.id ? null : prod.id)}
                            className="w-full flex justify-between items-center p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none"
                            aria-expanded={openId === prod.id}
                        >
                            <div className="flex items-center">
                                <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 p-2 rounded mr-4">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                                </span>
                                <span className="text-lg font-semibold text-gray-900 dark:text-white">{prod.name}</span>
                            </div>
                            <svg className={`w-5 h-5 text-gray-500 transform transition-transform ${openId === prod.id ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </button>

                        {openId === prod.id && (
                            <div className="p-4 pt-0 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30">
                                <p className="text-gray-700 dark:text-gray-300 mb-3 mt-2">{prod.description}</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded border border-green-100 dark:border-green-800">
                                        <span className="block text-xs font-bold text-green-700 dark:text-green-300 uppercase mb-1">Ideal Client</span>
                                        <p className="text-sm text-gray-800 dark:text-gray-200">{prod.idealFor}</p>
                                    </div>
                                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded border border-blue-100 dark:border-blue-800">
                                        <span className="block text-xs font-bold text-blue-700 dark:text-blue-300 uppercase mb-1">Selling Point</span>
                                        <p className="text-sm text-gray-800 dark:text-gray-200">{prod.keyBenefit}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};
