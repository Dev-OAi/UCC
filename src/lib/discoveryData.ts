export interface DiscoveryPoint {
  title: string;
  items: string[];
  icon?: string;
}

export const PRODUCT_DISCOVERY_MAPPING: Record<string, string[]> = {
  'ADP': [
    "How many employees do you currently have on payroll?",
    "Are you planning to hire more staff in the next 6-12 months?",
    "How much time does your team spend manually processing payroll each week?",
    "Are you satisfied with your current tax filing and compliance support?"
  ],
  'Fiserv': [
    "How do your customers currently prefer to pay (Credit Card, Cash, ACH)?",
    "What is your average monthly credit card processing volume?",
    "Are you looking for a more integrated way to handle online and in-store payments?",
    "Does your current processor provide detailed reporting and next-day funding?"
  ],
  'SBA': [
    "Are you currently leasing your space or do you have plans to purchase a building?",
    "Do you have any major equipment purchases planned for this year?",
    "Is business acquisition part of your growth strategy for the next 24 months?",
    "How would a long-term, low-down-payment loan impact your cash flow?"
  ],
  'Treasury': [
    "How many checks do you typically deposit in a month?",
    "Do you have multiple locations that need to deposit funds into a central account?",
    "What protocols do you have in place to prevent ACH or check fraud?",
    "Would automated sweep accounts help you manage your daily liquidity better?"
  ],
  'Merchant Services': [
    "Are you currently accepting mobile payments or digital wallets?",
    "How do you handle your point-of-sale inventory tracking?",
    "Is your current payment system integrated with your accounting software?"
  ],
  'Business Line of Credit': [
    "How do you typically manage seasonal fluctuations in your cash flow?",
    "Do you ever have to pass on opportunities because you don't have immediate access to capital?",
    "How are you currently financing your raw materials or inventory?"
  ],
  'ACH Positive Pay': [
    "How many ACH transactions do you process monthly?",
    "Have you experienced any unauthorized ACH attempts in the past year?",
    "How do you currently reconcile your daily bank activity?"
  ],
  'Remote Deposit Capture': [
    "How often do you or your staff physically go to the branch to make deposits?",
    "Would depositing checks directly from your office improve your team's productivity?",
    "Do you have multiple deposit locations that need to be centralized?"
  ],
  'Merchant Services': [
    "How do your customers currently prefer to pay (Credit Card, Cash, ACH)?",
    "What is your average monthly credit card processing volume?",
    "Are you looking for a more integrated way to handle online and in-store payments?",
    "Does your current processor provide detailed reporting and next-day funding?"
  ],
  'Business Checking': [
    "How many employees do you currently have on payroll?",
    "How many transactions do you process in a typical month?",
    "What is your average monthly cash deposit volume?",
    "Are you satisfied with your current online and mobile banking tools?"
  ],
  'Business Line of Credit': [
    "How do you typically manage seasonal fluctuations in your cash flow?",
    "Do you ever have to pass on opportunities because you don't have immediate access to capital?",
    "How are you currently financing your raw materials or inventory?"
  ],
  'Term Loans': [
    "Are you planning any major equipment or technology purchases this year?",
    "Is business acquisition or expansion part of your 12-month strategy?",
    "Would predictable, structured financing help you manage your long-term growth?"
  ],
  'Business Credit Card': [
    "How do you currently manage and track employee business expenses?",
    "Are you interested in earning rewards or cash back on your daily business spending?",
    "Would 0% introductory APR help you manage initial establishment costs?"
  ]
};

export const DISCOVERY_GUIDE = {
  triggerPhrases: {
    title: "Trigger Phrases",
    items: [
      "We're running out of space...",
      "Tired of paying high-interest credit card/loan",
      "Need new equipment, software, hardware...",
      "Business is seasonal",
      "Hiring more staff",
      "Expanding into a new territory",
      "Offering new products/services",
      "Working Capital needs",
      "Tight Cashflow",
      "Receivables process is a pain point",
      "Manually reconciling accounts",
      "Looking to reduce fraud exposure",
      "Building business credit"
    ]
  },
  financialBehaviors: {
    title: "Financial Behaviors",
    items: [
      "Large deposits from a single customer",
      "Overdrafts or frequent transfers",
      "High business credit card balances",
      "Consistently growing deposit balances"
    ]
  },
  discoveryQuestions: {
    title: "Discovery Questions",
    items: [
      "How's business going this year compared to last year?",
      "Do you have any big plans for your business in the next 12 months?",
      "How are you currently financing equipment?",
      "How do you manage seasonal cash flow?"
    ]
  },
  operationalCues: {
    title: "Operational Cues",
    items: [
      "New delivery trucks, vans, equipment",
      "Hiring signs or construction/expansion",
      "Busy lobby/storefront that signals growth",
      "Owners mentioning long hours or 'being stretched thin'"
    ]
  },
  partnerPositioning: {
    title: "Partner Positioning",
    items: [
      "Many of our business clients use a line of credit for flexibility – Is that something you’ve considered?",
      "Many business owners use a line of credit to support inventory and payroll during busy seasons. Does that ever come up for you?",
      "Many business owners tell us upgrading equipment make them more efficient – is that something you’ve been thinking about?",
      "When businesses are growing, we often help them with expansion financing. What’s growth look like for you right now?",
      "We’ve seen businesses refinance high-interest loans or credit cards to free up cash flow. Is that something you’ve considered?",
      "Sometimes business can save significantly by restructuring debt. Would you like us to take a look at current financing?",
      "We have a dedicated team that specializes in business under $5MM in revenue. They're great at finding solutions that most owners don’t realize exist.",
      "Even if you do not have any current borrowing needs, it’s good to know what options are available to you before you need them. Would you like me to introduce you to our small business banking team?"
    ]
  }
};
