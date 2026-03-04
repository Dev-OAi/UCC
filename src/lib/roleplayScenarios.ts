export interface RoleplayScenario {
  id: string;
  title: string;
  description: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
  category: 'Credit' | 'Deposits' | 'Treasury';
}

export const roleplayScenarios: RoleplayScenario[] = [
  {
    id: '1',
    title: 'Scenario 1: Seasonal Wholesale',
    description: "Marty owns and operates a successful Halloween costume wholesale business with an annual revenue of $10,000,000 and net income of $450,000. Peak selling season is the fall, but Marty needs buying power before then to buy from overseas manufacturers and is looking for $1,500,000 to support the business.\n\nWhich product best meets Marty's needs?",
    options: [
      'Working Capital Line of Credit',
      'EZ Line of Credit',
      'Equipment Line of Credit'
    ],
    correctAnswerIndex: 0,
    explanation: 'Wholesale businesses with high seasonal inventory needs typically require larger Working Capital Lines of Credit to bridge the gap between purchasing from manufacturers and collecting from retailers. At $1.5M, this exceeds most EZ Line limits.',
    category: 'Credit'
  },
  {
    id: '2',
    title: 'Scenario 2: Commercial Horticulture',
    description: "Harriet owns and operates a successful horticultural business selling primarily to commercial clients, such as grocery chains and large commercial businesses, but also has a small retail store for walk-ins. Annual sales are $2,000,000 and net profits are $200,000. She has seasonal financing needs but is concerned about the burden of an annual cleanup. She is looking for a $300,000 loan.\n\nWhat product best meets Harriet's needs?",
    options: [
      'Working Capital Line of Credit',
      'EZ Line of Credit',
      'Equipment Line of Credit'
    ],
    correctAnswerIndex: 1,
    explanation: 'The EZ Line of Credit is designed for smaller borrowing needs (like $300,000) and often offers more flexibility regarding the "annual cleanup" requirement compared to traditional standard lines.',
    category: 'Credit'
  },
  {
    id: '3',
    title: 'Scenario 3: Construction Expansion',
    description: "For 10 years, Carlos has owned and operated a very successful construction company with an annual revenue of $7,000,000 and net profits of $500,000. In order to meet the demands of some upcoming contracts, Carlos is in need of a new cement truck which has an average sale price of $70,000 but he's unsure of when he will need to make the purchase.\n\nWhich product is the best fit for Carlos?",
    options: [
      'Working Capital Line of Credit',
      'EZ Line of Credit',
      'Equipment Line of Credit'
    ],
    correctAnswerIndex: 2,
    explanation: "Since Carlos knows he needs equipment but isn't sure exactly when the purchase will happen, an Equipment Line of Credit allows him to have the approval in place and draw down the funds only when the specific truck is found.",
    category: 'Credit'
  },
  {
    id: '4',
    title: 'Scenario 4: Real Estate Acquisition',
    description: "Tian has owned Trinity Textiles for 10 years and has the opportunity to purchase the building they are currently operating out of from its current owner. Trinity Textiles will establish an LLC to hold the property. The seller has an asking price of $5,000,000. Trinity Textiles LLC is asking to borrow $3,500,000.\n\nWhat product is best suited for Tian's needs?",
    options: [
      'Investor Commercial Mortgage',
      'Owner Occupied Commercial Mortgage',
      'Commercial Mortgage'
    ],
    correctAnswerIndex: 1,
    explanation: 'Since the business (Trinity Textiles) will be operating out of the building, an Owner Occupied Commercial Mortgage is the best fit. These often offer more favorable terms, such as lower down payments, compared to investor or general commercial mortgages.',
    category: 'Credit'
  }
];
