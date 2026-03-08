export interface IndustryInsight {
  name?: string;
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

// Global cache for loaded profiles
let INDUSTRY_CACHE: Record<string, IndustryInsight> = {};

/**
 * Initializes the industry knowledge by loading all "IndustryProfile" files from the manifest.
 */
export async function initIndustryKnowledge() {
  try {
    const response = await fetch('./manifest.json');
    if (!response.ok) return;
    const manifest = await response.json();

    const profiles = manifest.filter((m: any) => m.type === 'IndustryProfile');

    const loaded: Record<string, IndustryInsight> = {};
    for (const p of profiles) {
      try {
        const res = await fetch(p.path);
        if (res.ok) {
          const data: IndustryInsight = await res.json();
          const key = data.name || p.filename.replace('.json', '').replace(/_/g, ' ');
          loaded[key] = data;
        }
      } catch (err) {
        console.error(`Failed to load industry profile: ${p.path}`, err);
      }
    }
    INDUSTRY_CACHE = loaded;
    console.log(`[IndustryKnowledge] Loaded ${Object.keys(INDUSTRY_CACHE).length} industry profiles.`);
  } catch (err) {
    console.error('Failed to initialize industry knowledge:', err);
  }
}

export function getInsightForCategory(category: string): IndustryInsight | null {
  if (!category) return null;

  const lowerCategory = category.toLowerCase().trim();

  // 1. Try exact match in cache
  for (const [key, value] of Object.entries(INDUSTRY_CACHE)) {
    if (key.toLowerCase() === lowerCategory) return value;
  }

  // 2. Try partial match
  for (const [key, value] of Object.entries(INDUSTRY_CACHE)) {
    if (lowerCategory.includes(key.toLowerCase()) || key.toLowerCase().includes(lowerCategory)) {
      return value;
    }
  }

  // Fallback to basic profiles if cache is empty or no match
  return null;
}
