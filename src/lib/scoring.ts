import { DataRow } from './dataService';
import { BusinessLead } from '../types';

/**
 * Calculates a lead priority score from 0-100 based on urgency, freshness, and contactability.
 *
 * Scoring Model:
 * - UCC Expiration: <30 days (+40), 30-60 days (+25), 60-90 days (+10)
 * - Freshness: Registered in last 90 days (+30)
 * - Contactability: Phone (+15), Website (+5)
 * - Completeness: Key Principal identified (+10)
 */
export interface ScoreInsight {
  label: string;
  points: number;
}

export interface ScoreResult {
  total: number;
  insights: ScoreInsight[];
}

/**
 * Caches for O(1) lookups of learned insights to avoid millions of iterations during data ingestion.
 * Using WeakMap ensures we don't leak memory if the metadata objects are garbage collected.
 * Expected performance impact: Reduces scoring time from O(N*M) to O(N+M) for bulk ingestion.
 */
const learnedTrendsCache = new WeakMap<any, {
  hotIndustries: Map<string, any>;
}>();

const learnedInsightsCache = new WeakMap<any, {
  winningIndustries: Map<string, any>;
  hotZips: Map<string, any>;
}>();

// Helper to get value from either DataRow or BusinessLead, moved to top level to avoid repeated closure creation
const getVal = (item: any, keys: string[]) => {
  for (const key of keys) {
    const val = item[key];
    if (val && val !== 'N/A' && val !== '') return val;
  }
  return null;
};

export function calculateScore(item: DataRow | BusinessLead, learnedTrends?: any, now?: Date): number {
  return getScoreDetails(item, learnedTrends, now).total;
}

/**
 * Calculates a lead priority score from 0-100 and provides a breakdown of reasons.
 */
export function getScoreDetails(item: DataRow | BusinessLead, learnedTrends?: any, passedNow?: Date): ScoreResult {
  let total = 0;
  const insights: ScoreInsight[] = [];
  const now = passedNow || new Date();

  // 1. UCC Expiration (Max 40 points)
  const expiryStr = getVal(item, ['Expires', 'expires']);
  if (expiryStr) {
    const expiryDate = new Date(expiryStr);
    if (!isNaN(expiryDate.getTime())) {
      const diffDays = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays > 0 && diffDays < 30) {
        total += 40;
        insights.push({ label: `UCC expires in ${diffDays} days`, points: 40 });
      }
      else if (diffDays >= 30 && diffDays < 60) {
        total += 25;
        insights.push({ label: `UCC expires in ${diffDays} days`, points: 25 });
      }
      else if (diffDays >= 60 && diffDays < 90) {
        total += 10;
        insights.push({ label: `UCC expires in ${diffDays} days`, points: 10 });
      }
    }
  }

  // 2. Freshness / New Entity (Max 30 points)
  const type = (item as any)._type || (item as any).source;
  const isNewType = type === 'Last 90 Days';

  const establishedStr = getVal(item, ['Date Filed', 'establishedDate', 'Record Date']);
  let isRecentReg = false;
  let recentDays = 0;
  if (establishedStr) {
    const estDate = new Date(establishedStr);
    if (!isNaN(estDate.getTime())) {
      recentDays = Math.ceil((now.getTime() - estDate.getTime()) / (1000 * 60 * 60 * 24));
      if (recentDays <= 90 && recentDays >= 0) isRecentReg = true;
    }
  }

  if (isNewType || isRecentReg) {
    total += 30;
    insights.push({ label: isRecentReg ? `Newly registered (${recentDays} days ago)` : 'New market entry', points: 30 });
  }

  // 3. Contactability (Max 20 points)
  const phone = getVal(item, ['Phone', 'phone']);
  if (phone) {
    total += 15;
    insights.push({ label: 'Phone number available', points: 15 });
  }

  const website = getVal(item, ['Website', 'website']);
  if (website) {
    total += 5;
    insights.push({ label: 'Website available', points: 5 });
  }

  // 4. Data Completeness (Max 10 points)
  const principal = getVal(item, ['Key Principal', 'Officer/Director', 'keyPrincipal', 'DirectName', 'CONTACTNAMECOMP']);
  if (principal) {
    total += 10;
    insights.push({ label: 'Key principal identified', points: 10 });
  }

  const industry = getVal(item, ['Category', 'Category ', 'industry']);

  // 5. Recursive Intelligence Boost (Max 15 points) - Optimized O(1) Lookup
  if (learnedTrends) {
    let trendsMap = learnedTrendsCache.get(learnedTrends);
    if (!trendsMap) {
      const hotIndustries = new Map();
      learnedTrends.hot_industries?.forEach((h: any) => hotIndustries.set(h.name, h));
      trendsMap = { hotIndustries };
      learnedTrendsCache.set(learnedTrends, trendsMap);
    }
    if (trendsMap.hotIndustries.has(industry)) {
      total += 15;
      insights.push({ label: 'Strategic vertical momentum boost', points: 15 });
    }
  }

  // 6. Outcome-Driven Learning Boost (Max 20 points) - Optimized O(1) Lookup
  const learnedInsights = typeof window !== 'undefined' ? (window as any)._learnedInsights : null;
  if (learnedInsights) {
    let insightMap = learnedInsightsCache.get(learnedInsights);
    if (!insightMap) {
      const winningIndustries = new Map();
      const hotZips = new Map();
      learnedInsights.winning_industries?.forEach((i: any) => winningIndustries.set(i.industry, i));
      learnedInsights.hot_zips?.forEach((z: any) => hotZips.set(z.zip, z));
      insightMap = { winningIndustries, hotZips };
      learnedInsightsCache.set(learnedInsights, insightMap);
    }

    const industryMatch = insightMap.winningIndustries.get(industry);
    if (industryMatch) {
      const boost = Math.round(industryMatch.weight * 20);
      total += boost;
      insights.push({ label: `Learned success factor: ${industry} (+${boost})`, points: boost });
    }

    const zip = getVal(item, ['Zip', 'zip']);
    const zipMatch = insightMap.hotZips.get(zip);
    if (zipMatch) {
      const boost = Math.round(zipMatch.momentum * 15);
      total += boost;
      insights.push({ label: `Hot conversion zone: ${zip} (+${boost})`, points: boost });
    }
  }

  return {
    total: Math.min(total, 100),
    insights
  };
}
