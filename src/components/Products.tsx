import React, { useState, useMemo } from 'react';
import { Search } from 'lucide-react';

// --- Interfaces ---

export interface Tier {
  tier: string;
  points: number | string;
}

export interface Product {
  name: string;
  points?: number | string;
  minBalance?: string;
  tiers?: Tier[];
}

export interface SubCategory {
  title: string;
  products: Product[];
}

export interface Category {
  title: string;
  subCategories: SubCategory[];
}

export interface MainSection {
  title: string;
  categories: Category[];
}

// --- Data Constants ---

const consumerCheckingTiers: Tier[] = [
  { tier: '$250 - $999.99', points: 10 },
  { tier: '$1,000 - $9,999.99', points: 20 },
  { tier: '$10,000 +', points: 30 },
];

const moneyMarketTiers: Tier[] = [
  { tier: '$10,000 - $24,999.99', points: 5 },
  { tier: '$25,000 - $99,999.99', points: 10 },
  { tier: '$100,000 +', points: 15 },
];

const savingsTiers: Tier[] = [
  { tier: '$300 - $9,999.99', points: 5 },
  { tier: '$10,000 +', points: 10 },
];

const cdIraTiers: Tier[] = [
  { tier: '$500 - $9,999.99', points: 1 },
  { tier: '$10,000 - $99,999.99', points: 3 },
  { tier: '$100,000 +', points: 5 },
];

const commercialCheckingTiers: Tier[] = [
  { tier: '$1,000 - $9,999.99', points: 20 },
  { tier: '$10,000 - $99,999.99', points: 30 },
  { tier: '$100,000 +', points: 40 },
];

const smbBundleTiers: Tier[] = [
  { tier: '$1,000 - $9,999.99', points: 'Bundle Points Designated' },
  { tier: '$10,000 - $99,999.99', points: 50 },
  { tier: '$100,000 +', points: 60 },
];

const businessSavingsTiers: Tier[] = [
  { tier: '$500 - $9,999.99', points: 5 },
  { tier: '$10,000 +', points: 10 },
];

const businessCdTiers: Tier[] = [
  { tier: '$500 - $9,999.99', points: 1 },
  { tier: '$10,000 - $99,999.99', points: 3 },
  { tier: '$100,000 +', points: 5 },
];

export const productData: MainSection[] = [
  {
    title: 'GROSS DEPOSITS',
    categories: [
      {
        title: 'CONSUMER ACCOUNTS',
        subCategories: [
          {
            title: 'NON-INTEREST BEARING CHECKING',
            products: [
              { name: 'All Access Checking', points: 'N/A', minBalance: '$250', tiers: consumerCheckingTiers },
              { name: 'My Teen Checking', points: 'N/A', minBalance: '$250', tiers: consumerCheckingTiers },
              { name: 'Valley Journey Checking', points: 'N/A', minBalance: '$250', tiers: consumerCheckingTiers },
              { name: 'Milestone Checking', points: 'N/A', minBalance: '$250', tiers: consumerCheckingTiers },
            ]
          },
          {
            title: 'MONEY MARKETS & INTEREST BEARING CHECKING',
            products: [
              { name: 'Money Market Savings', points: 'N/A', minBalance: '$10,000', tiers: moneyMarketTiers },
              { name: 'Tiered Money Market Savings', points: 'N/A', minBalance: '$10,000', tiers: moneyMarketTiers },
              { name: 'Choice Money Market', points: 'N/A', minBalance: '$10,000', tiers: moneyMarketTiers },
              { name: 'Premium Money Market', points: 'N/A', minBalance: '$10,000', tiers: moneyMarketTiers },
              { name: 'Consumer Interest Checking', points: 'N/A', minBalance: '$10,000', tiers: moneyMarketTiers },
            ]
          },
          {
            title: 'SAVINGS',
            products: [
              { name: 'Kids First Savings Club', points: 'N/A', minBalance: '$300', tiers: savingsTiers },
              { name: 'All Access Savings', points: 'N/A', minBalance: '$300', tiers: savingsTiers },
              { name: 'Community Savings', points: 'N/A', minBalance: '$300', tiers: savingsTiers },
              { name: 'Growth Savings', points: 'N/A', minBalance: '$300', tiers: savingsTiers },
            ]
          },
          {
            title: `CD's & IRA's`,
            products: [
              { name: 'Jumbo Single Maturity - Personal CD', points: 'N/A', minBalance: '$500', tiers: cdIraTiers },
              { name: 'Jumbo Multiple Maturity - Personal CD', points: 'N/A', minBalance: '$500', tiers: cdIraTiers },
              { name: 'Multiple Maturity - Personal CD', points: 'N/A', minBalance: '$500', tiers: cdIraTiers },
              { name: 'IRA CDs', points: 'N/A', minBalance: '$500', tiers: cdIraTiers },
              { name: 'Valley IRA Savings', points: 'N/A', minBalance: '$500', tiers: cdIraTiers },
            ]
          }
        ]
      },
      {
        title: 'COMMERCIAL ACCOUNTS',
        subCategories: [
          {
            title: 'NON-INTEREST BEARING CHECKING',
            products: [
              { name: 'Small Business Checking', points: 'N/A', minBalance: '$1,000', tiers: commercialCheckingTiers },
              { name: 'Business Banking Checking', points: 'N/A', minBalance: '$1,000', tiers: commercialCheckingTiers },
              { name: 'Business Checking Plus', points: 'N/A', minBalance: '$1,000', tiers: commercialCheckingTiers },
              { name: 'Business Analysis', points: 'N/A', minBalance: '$1,000', tiers: commercialCheckingTiers },
              { name: 'Women in Business', points: 'N/A', minBalance: '$1,000', tiers: commercialCheckingTiers },
              { name: 'Non-Profit Organization', points: 'N/A', minBalance: '$1,000', tiers: commercialCheckingTiers },
              { name: 'Estate Checking', points: 'N/A', minBalance: '$1,000', tiers: commercialCheckingTiers },
            ]
          },
          {
            title: 'BUSINESS BUNDLES',
            products: [
              { name: 'SMB Bundle 1 (AT 550) - Basic Business', points: '10 (1st Balance Tier)', tiers: smbBundleTiers },
              { name: 'SMB Bundle 2 (AT 551) - Advantage Business', points: '30 (1st Balance Tier)', tiers: smbBundleTiers },
              { name: 'SMB Bundle 3 (AT 552) - Premier Business', points: '40 (1st Balance Tier)', tiers: smbBundleTiers },
            ]
          },
          {
            title: 'BUSINESS SAVINGS',
            products: [
              { name: 'Business Savings', points: 'N/A', minBalance: '$500', tiers: businessSavingsTiers },
            ]
          },
          {
            title: `BUSINESS CD'S`,
            products: [
              { name: `BUSINESS CD'S (All Types)`, points: 'N/A', minBalance: '$500', tiers: businessCdTiers },
            ]
          },
          {
            title: `BUSINESS MONEY MARKET`,
            products: [
              { name: `Business Money Market`, points: 'N/A', minBalance: '$10,000', tiers: moneyMarketTiers },
              { name: `Business Choice Money Market`, points: 'N/A', minBalance: '$10,000', tiers: moneyMarketTiers },
            ]
          }
        ]
      },
    ],
  },
  {
    title: 'LOAN REFERRALS',
    categories: [
      {
        title: 'CONSUMER LOANS',
        subCategories: [
          { title: '', products: [
            { name: 'New Car Loans', points: 30 },
            { name: 'Used Car Loans', points: 30 },
            { name: 'Personal Loans', points: 30 },
            { name: 'Boat Loans', points: 30 },
            { name: 'Cash Secured Loans', points: 30 },
            { name: 'CVLC Loans', points: 30 },
            { name: 'Residential Mortgages', points: 45 },
            { name: 'Home Equity Line of Credit', points: 40 },
            { name: 'Home Equity Loan', points: 40 },
            { name: 'Consumer Credit Cards - Unsecured', points: 15 },
            { name: 'Consumer Credit Cards - Cash Secured', points: 15 },
            { name: 'Business Credit Cards / One Card - Unsecured', points: 25 },
            { name: 'Business Credit Cards / One Card - Cash Secured', points: 25 },
          ]}
        ]
      },
      {
        title: 'COMMERCIAL LOANS',
        subCategories: [
          { title: '', products: [
            { name: 'Business Line of Credit (Secured)', points: 50 },
            { name: 'Business Line of Credit (Unsecured)', points: 50 },
            { name: 'Business Term Loan', points: 40 },
            { name: 'SMB Loans *See VSBB Premium Points in partner referrals*', points: 50 },
            { name: 'Digital Business Banking Loans', points: 30 },
          ]}
        ]
      }
    ]
  },
  {
    title: 'NEW CIF GROWTH',
    categories: [
      { title: '', subCategories: [{ title: '', products: [
        { name: 'Personal', points: 5, minBalance: '$250.00' },
        { name: 'Business', points: 10, minBalance: '$1,000.00' },
      ]}]}
    ]
  },
  {
    title: 'NEW DIGITAL ENROLLMENTS',
    categories: [
      { title: '', subCategories: [{ title: '', products: [
        { name: 'Online Enrollment', points: 2 },
        { name: 'Mobile App', points: 2 },
        { name: 'Mobile Deposit', points: 2 },
        { name: 'Bill Pay', points: 2 },
        { name: 'E-Statements', points: 2 },
        { name: 'External Account Linking', points: 2 },
        { name: 'Zelle Usage', points: 2 },
        { name: 'Direct Deposit', points: 2 },
      ]}]}
    ]
  },
  {
    title: 'PARTNER REFERRALS',
    categories: [
      { title: 'REVENUE GENERATING PRODUCTS/SERVICES', subCategories: [{ title: '', products: [
        { name: 'ADP', points: 25 },
        { name: 'Fiserv', points: 25 },
        { name: 'Valley National Title Service', points: 25 },
        { name: 'Valley Insurance Services', points: 25 },
      ]}]},
      { title: 'DEPOSIT/LOANS ACCOUNT REFERRALS', subCategories: [{ title: '', products: [
        { name: 'International', points: 25 },
        { name: 'Cannabis', points: 25 },
        { name: 'HOA', points: 25 },
        { name: 'Government', points: 25 },
        { name: 'VSBB', points: 25 },
        { name: 'Other Non-Small Business Commercial Loans (Middle Market, Business Banking, etc.)', points: 25 },
      ]}]}
    ]
  },
  {
    title: 'TREASURY SOLUTIONS PRODUCTS/SERVICES',
    categories: [
      { title: '', subCategories: [{ title: '', products: [
        { name: 'ACH Origination', points: 10 },
        { name: 'ACH Positive Pay', points: 10 },
        { name: 'ACH Block', points: 10 },
        { name: 'ICS', points: 10 },
        { name: 'Check Block', points: 10 },
        { name: 'Check Positive Pay', points: 10 },
        { name: 'Payee Positive Pay', points: 10 },
        { name: 'Reverse Positive Pay', points: 10 },
        { name: 'Controlled Disbursement', points: 10 },
        { name: 'Corporate Payment Notification', points: 10 },
        { name: 'DACA (Deposit Account Controlled Agreement)', points: 10 },
        { name: 'Deposit Reconciliation', points: 10 },
        { name: 'Lockbox', points: 10 },
        { name: 'Quick Books Connect...', points: 10 },
        { name: 'Remote Deposit Capture', points: 10 },
        { name: 'UPIC', points: 10 },
        { name: 'VIS Coverage Policies', points: 10 },
        { name: 'Wire Module', points: 10 },
        { name: 'ZBA', points: 10 },
        { name: 'SMB Bundle 1 (AT 550) - Basic Business', points: 0 },
        { name: 'SMB Bundle 2 (AT 551) - Advantage Business', points: 30 },
        { name: 'SMB Bundle 3 (AT 552) - Premier Business', points: 30 },
      ]}]}
    ]
  }
];

// --- Component ---

export const Products: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [hoveredProductId, setHoveredProductId] = useState<string | null>(null);

  const filteredData = useMemo(() => {
    if (!searchTerm) return productData;
    const lowerSearch = searchTerm.toLowerCase();

    return productData.map(section => ({
      ...section,
      categories: section.categories.map(cat => ({
        ...cat,
        subCategories: cat.subCategories.map(sub => ({
          ...sub,
          products: sub.products.filter(p =>
            p.name.toLowerCase().includes(lowerSearch) ||
            (p.tiers && p.tiers.some(t => t.tier.toLowerCase().includes(lowerSearch))) ||
            (sub.title && sub.title.toLowerCase().includes(lowerSearch)) ||
            (cat.title && cat.title.toLowerCase().includes(lowerSearch))
          )
        })).filter(sub => sub.products.length > 0)
      })).filter(cat => cat.subCategories.length > 0)
    })).filter(section => section.categories.length > 0);
  }, [searchTerm]);

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-slate-900 overflow-hidden">
        {/* Search Bar */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-10">
            <div className="relative max-w-2xl mx-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search products and services..."
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 text-sm transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 scroll-smooth">
            <div className="max-w-6xl mx-auto space-y-12 pb-12">
                {filteredData.map((section, sIdx) => (
                    <div key={sIdx} className="space-y-6">
                        <div className="text-center border-b-2 border-blue-600/20 pb-4">
                             <h2 className="text-3xl font-black text-gray-800 dark:text-gray-100 uppercase tracking-[0.2em]">{section.title}</h2>
                        </div>

                        {section.categories.map((category, cIdx) => (
                            <div key={cIdx} className="space-y-4">
                                {category.title && (
                                    <div className="flex items-center space-x-4">
                                        <div className="h-px flex-1 bg-gray-200 dark:bg-slate-800"></div>
                                        <h3 className="text-sm font-black text-blue-600 dark:text-blue-500 uppercase tracking-widest px-4 py-1 bg-blue-50 dark:bg-blue-900/20 rounded-full border border-blue-100 dark:border-blue-900/50">
                                            {category.title}
                                        </h3>
                                        <div className="h-px flex-1 bg-gray-200 dark:bg-slate-800"></div>
                                    </div>
                                )}

                                <div className="border border-gray-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm bg-white dark:bg-slate-900">
                                    <table className="w-full text-sm border-collapse">
                                        <thead>
                                            <tr className="bg-gray-50 dark:bg-slate-800/50 text-gray-500 dark:text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                                                <th className="px-4 py-3 text-left border-b border-gray-200 dark:border-slate-800 w-1/4">Product Name</th>
                                                <th className="px-4 py-3 text-center border-b border-gray-200 dark:border-slate-800">Points</th>
                                                <th className="px-4 py-3 text-center border-b border-gray-200 dark:border-slate-800">Min Balance</th>
                                                <th className="px-4 py-3 text-left border-b border-gray-200 dark:border-slate-800 w-1/4">Tiers / Range</th>
                                                <th className="px-4 py-3 text-center border-b border-gray-200 dark:border-slate-800">Tier Points</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                                            {category.subCategories.map((sub, subIdx) => (
                                                <React.Fragment key={subIdx}>
                                                    {sub.title && (
                                                        <tr className="bg-gray-50/80 dark:bg-slate-800/80 backdrop-blur-sm">
                                                            <td colSpan={5} className="px-4 py-2.5 font-bold text-gray-800 dark:text-gray-200 uppercase text-[11px] tracking-[0.15em] text-center border-y border-gray-200 dark:border-slate-800">
                                                                {sub.title}
                                                            </td>
                                                        </tr>
                                                    )}
                                                    {sub.products.map((product, pIdx) => {
                                                        const hasTiers = product.tiers && product.tiers.length > 0;
                                                        const rowSpan = hasTiers ? product.tiers!.length : 1;
                                                        const productId = `${sIdx}-${cIdx}-${subIdx}-${pIdx}`;
                                                        const isHovered = hoveredProductId === productId;

                                                        return (
                                                            <React.Fragment key={pIdx}>
                                                                <tr
                                                                    onMouseEnter={() => setHoveredProductId(productId)}
                                                                    onMouseLeave={() => setHoveredProductId(null)}
                                                                    className={`${isHovered ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''} transition-colors`}
                                                                >
                                                                    <td rowSpan={rowSpan} className="px-4 py-4 font-semibold text-gray-900 dark:text-white border-r border-gray-100 dark:border-slate-800 align-middle">
                                                                        {product.name}
                                                                    </td>
                                                                    <td rowSpan={rowSpan} className="px-4 py-4 text-center text-gray-500 dark:text-slate-400 border-r border-gray-100 dark:border-slate-800 align-middle font-medium">
                                                                        {product.points ?? 'N/A'}
                                                                    </td>
                                                                    <td rowSpan={rowSpan} className="px-4 py-4 text-center text-gray-500 dark:text-slate-400 border-r border-gray-100 dark:border-slate-800 align-middle font-medium">
                                                                        {product.minBalance ?? '--'}
                                                                    </td>
                                                                    {hasTiers ? (
                                                                        <>
                                                                            <td className="px-4 py-4 text-gray-600 dark:text-slate-300 border-r border-gray-100 dark:border-slate-800">
                                                                                {product.tiers![0].tier}
                                                                            </td>
                                                                            <td className="px-4 py-4 text-center font-bold text-blue-600 dark:text-blue-400 bg-blue-50/30 dark:bg-blue-900/5">
                                                                                {product.tiers![0].points}
                                                                            </td>
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <td className="px-4 py-4 border-r border-gray-100 dark:border-slate-800"></td>
                                                                            <td className="px-4 py-4"></td>
                                                                        </>
                                                                    )}
                                                                </tr>
                                                                {hasTiers && product.tiers!.slice(1).map((tier, tIdx) => (
                                                                    <tr
                                                                        key={tIdx}
                                                                        onMouseEnter={() => setHoveredProductId(productId)}
                                                                        onMouseLeave={() => setHoveredProductId(null)}
                                                                        className={`${isHovered ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''} transition-colors`}
                                                                    >
                                                                        <td className="px-4 py-4 text-gray-600 dark:text-slate-300 border-r border-gray-100 dark:border-slate-800">
                                                                            {tier.tier}
                                                                        </td>
                                                                        <td className="px-4 py-4 text-center font-bold text-blue-600 dark:text-blue-400 bg-blue-50/30 dark:bg-blue-900/5">
                                                                            {tier.points}
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </React.Fragment>
                                                        );
                                                    })}
                                                </React.Fragment>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ))}
                    </div>
                ))}
            </div>

            {filteredData.length === 0 && (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                        <Search className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">No products found</h3>
                    <p className="text-gray-500 dark:text-slate-400 mt-1">Try adjusting your search terms</p>
                    <button
                        onClick={() => setSearchTerm('')}
                        className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 transition-colors"
                    >
                        Clear Search
                    </button>
                </div>
            )}
        </div>
    </div>
  );
};