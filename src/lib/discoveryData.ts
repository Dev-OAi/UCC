export interface DiscoveryPoint {
  title: string;
  items: string[];
  icon?: string;
}

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
      "Tight Cashflow"
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
