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
]

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
]

const businessSavingsTiers: Tier[] = [
    { tier: '$500 - $9,999.99', points: 5 },
    { tier: '$10,000 +', points: 10 },
];

const businessCdTiers: Tier[] = [
    { tier: '$500 - $9,999.99', points: 1 },
    { tier: '$10,000 - $99,999.99', points: 3 },
    { tier: '$100,000 +', points: 5 },
];


export const getAllProducts = (): Product[] => {
  const products: Product[] = [];
  productData.forEach(section => {
    section.categories.forEach(category => {
      category.subCategories.forEach(sub => {
        sub.products.forEach(product => {
          products.push(product);
        });
      });
    });
  });
  return products;
};

export const getProductPoints = (productName: string): number => {
  const products = getAllProducts();
  const product = products.find(p => p.name === productName);
  if (!product) return 0;

  if (typeof product.points === 'number') return product.points;
  if (typeof product.points === 'string' && !isNaN(parseInt(product.points))) return parseInt(product.points);

  if (product.tiers && product.tiers.length > 0) {
    const firstTierPoints = product.tiers[0].points;
    if (typeof firstTierPoints === 'number') return firstTierPoints;
    if (typeof firstTierPoints === 'string' && !isNaN(parseInt(firstTierPoints))) return parseInt(firstTierPoints);
  }

  return 0;
};

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
                            { name: 'Journey Checking', points: 'N/A', minBalance: '$250', tiers: consumerCheckingTiers },
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
                            { name: 'IRA Savings', points: 'N/A', minBalance: '$500', tiers: cdIraTiers },
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
                        title: '',
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
                { name: 'National Title Service', points: 25 },
                { name: 'Insurance Services', points: 25 },
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
