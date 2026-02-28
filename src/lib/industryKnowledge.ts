export interface IndustryInsight {
  overview?: string;
  quickFacts?: string[];
  currentConditions?: string;
  industryStructure?: string;
  profitsAndOperations?: string;
  geographicBreakdown?: string;
  financialBenchmarks?: string;
  capitalFinancing?: string;
  businessValuation?: string;
  webLinks?: string[];
  relatedProfiles?: string[];
}

export const INDUSTRY_KNOWLEDGE: Record<string, IndustryInsight> = {
  "Construction & Development": {
    overview: "The construction industry involves the design, development, and building of residential, commercial, and industrial structures. Current trends show a shift toward sustainable building and high-demand multi-family developments.",
    quickFacts: [
      "Requires significant working capital for materials and milestone payments.",
      "SBA 7(a) and 504 loans are primary financing vehicles for expansion.",
      "High insurance and bonding requirements are standard."
    ]
  },
  "Real Estate Development": {
    overview: "Real estate development involves purchasing land, developing it into housing or commercial buildings, and selling or leasing it. Property flipping and renovation projects are significant sub-sectors.",
    quickFacts: [
      "Flexible lines of credit are critical for managing acquisition timelines.",
      "Property acquisition usually requires specialized term loans.",
      "Merchant services for lease/sale deposits improve liquidity."
    ]
  },
  "Abrasive Product Manufacturers": {
    overview: "This industry comprises establishments primarily engaged in manufacturing abrasive grinding wheels of natural or synthetic materials, abrasive-coated products, and other abrasive products.",
    quickFacts: [
      "There are 220 firms in the Abrasive Product Manufacturers industry.",
      "Abrasive Product Manufacturers employs 10,900 people.",
      "The Abrasive Product Manufacturers industry generates $3.8 billion in annual revenue."
    ]
  },
  "Acupuncturists": {
    overview: "Acupuncturists provide alternative medical treatments involving the insertion of needles into specific points on the body to alleviate pain or treat various physical, mental, and emotional conditions.",
    quickFacts: [
      "The acupuncture market is projected to grow significantly as more health insurance plans cover treatments.",
      "Most practices are small, owner-operated clinics.",
      "Growing consumer interest in holistic and non-pharmacological pain management is a key driver."
    ]
  },
  "Commercial Printing": {
    overview: "The commercial printing industry includes establishments primarily engaged in printing on paper, metal, glass, or plastic, often providing related services like prepress and finishing.",
    quickFacts: [
      "Digital printing technology continues to replace traditional offset methods for shorter runs.",
      "Industry consolidation is high as companies seek scale to invest in expensive new technology.",
      "Packaging and wide-format printing are currently the fastest-growing segments."
    ]
  }
};

export function getInsightForCategory(category: string): IndustryInsight | null {
  if (!category) return null;

  // Try exact match
  if (INDUSTRY_KNOWLEDGE[category]) return INDUSTRY_KNOWLEDGE[category];

  // Try case-insensitive match
  const lowerCategory = category.toLowerCase().trim();
  for (const [key, value] of Object.entries(INDUSTRY_KNOWLEDGE)) {
    if (key.toLowerCase() === lowerCategory) return value;
  }

  // Try partial match
  for (const [key, value] of Object.entries(INDUSTRY_KNOWLEDGE)) {
    if (lowerCategory.includes(key.toLowerCase()) || key.toLowerCase().includes(lowerCategory)) {
      return value;
    }
  }

  return null;
}
