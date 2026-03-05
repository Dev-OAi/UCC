export interface FeeRow {
  product: string;
  minAmount: number;
  maxAmount: number;
  displayAmount: string;
  appFee: string;
  docFee: string;
  renewalFee: string;
  uccFee: string;
  stamps: string;
  notes?: string;
}

export const feeTableData: FeeRow[] = [
  {
    product: 'Unsecured Line of Credit (LOC)',
    minAmount: 10000,
    maxAmount: 100000,
    displayAmount: '$10M–$100M',
    appFee: '$250',
    docFee: '$250',
    renewalFee: '$100',
    uccFee: 'N/A',
    stamps: 'N/A'
  },
  {
    product: 'Unsecured Term Loan',
    minAmount: 10000,
    maxAmount: 100000,
    displayAmount: '$10M–$100M',
    appFee: '$250',
    docFee: '$250',
    renewalFee: '—',
    uccFee: 'N/A',
    stamps: 'N/A'
  },
  {
    product: 'Secured Line of Credit (LOC)',
    minAmount: 101000,
    maxAmount: 250000,
    displayAmount: '$101M–$250M',
    appFee: '$500',
    docFee: '$250',
    renewalFee: '$100',
    uccFee: '$150',
    stamps: '.35 cents/$100 of loan amount'
  },
  {
    product: 'Secured Term Loan',
    minAmount: 101000,
    maxAmount: 250000,
    displayAmount: '$101M–$250M',
    appFee: '$500',
    docFee: '$250',
    renewalFee: '—',
    uccFee: '$150',
    stamps: '.35 cents/$100 of loan amount'
  },
  {
    product: 'Secured Line of Credit (LOC)',
    minAmount: 251000,
    maxAmount: 750000,
    displayAmount: '$251M–$750M',
    appFee: '$1,000',
    docFee: '$250',
    renewalFee: '$250',
    uccFee: '$150',
    stamps: '.35 cents/$100 of loan amount'
  },
  {
    product: 'Secured Term Loan',
    minAmount: 251000,
    maxAmount: 1000000,
    displayAmount: '$251M–$1MM',
    appFee: '$1,000',
    docFee: '$250',
    renewalFee: '—',
    uccFee: '$150',
    stamps: '.35 cents/$100 of loan amount'
  },
  {
    product: 'Cash Secured Line of Credit',
    minAmount: 10000,
    maxAmount: 1000000,
    displayAmount: '$10M–$1MM',
    appFee: '$250',
    docFee: '$250',
    renewalFee: '$100',
    uccFee: 'N/A',
    stamps: '.35 cents/$100 of loan amount'
  },
  {
    product: 'OOCRE (Owner-Occupied CRE)',
    minAmount: 10000,
    maxAmount: 500000,
    displayAmount: '$10M–$500M',
    appFee: '$2,500',
    docFee: '$250',
    renewalFee: '—',
    uccFee: '$150',
    stamps: '.35 cents/$100 of loan amount',
    notes: 'Additional Closing Cost Apply'
  },
  {
    product: 'OOCRE (Owner-Occupied CRE)',
    minAmount: 501000,
    maxAmount: 999000,
    displayAmount: '$501M–$999M',
    appFee: '$5,000',
    docFee: '$250',
    renewalFee: '—',
    uccFee: '$150',
    stamps: '.35 cents/$100 of loan amount',
    notes: 'Additional Closing Cost Apply'
  },
  {
    product: 'OOCRE (Owner-Occupied CRE)',
    minAmount: 1000000,
    maxAmount: 1999000,
    displayAmount: '$1MM–$1.999MM',
    appFee: '$7,500',
    docFee: '$250',
    renewalFee: '—',
    uccFee: '$150',
    stamps: '.35 cents/$100 of loan amount',
    notes: 'Additional Closing Cost Apply'
  },
  {
    product: 'OOCRE (Owner-Occupied CRE)',
    minAmount: 2000000,
    maxAmount: 2500000,
    displayAmount: '$2MM–$2.5MM',
    appFee: '$10,000',
    docFee: '$250',
    renewalFee: '—',
    uccFee: '$150',
    stamps: '.35 cents/$100 of loan amount',
    notes: 'Additional Closing Cost Apply'
  }
];

export const documentationRequirements = {
  allRequests: [
    'Business Organization Documentation (see formal checklist)',
    'Most Recent 3 Months Bank Statements',
    'Valid Driver\'s License',
    'Business Profile (Next 5 before Terafina)',
    'Business Account Profile Form',
    'Certified Copy of Resolution/Authorization for Accounts and Loans',
    'Business Customer Information Form',
    'For Term Loans: Authorized Auto Debit Form',
    'Taxpayer ID Number Cert (Next 3 After Terafina)',
    'Beneficial Ownership Certification Section',
    'Business Customer Information (If resolution doesn\'t match)',
    'Site Visit (SalesForce)'
  ],
  securedRequests: [
    '2 Years Business Tax Returns of the borrower',
    '2 Years Personal Tax Returns (Guarantor who own > 25%)',
    'Copy of Business Insurance',
    'Business Debt Schedule ( Loans >$250M)'
  ],
  additionalDocumentation: [
    'Personal Financial Statement',
    'Interim Financial Statements',
    'Accounts Receivable Summary Report',
    'Inventory Report'
  ]
};
