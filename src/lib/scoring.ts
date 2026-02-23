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

export function calculateScore(item: DataRow | BusinessLead): number {
  return getScoreDetails(item).total;
}

/**
 * Calculates a lead priority score from 0-100 and provides a breakdown of reasons.
 */
export function getScoreDetails(item: DataRow | BusinessLead): ScoreResult {
  let total = 0;
  const insights: ScoreInsight[] = [];

  // Helper to get value from either DataRow or BusinessLead
  const getVal = (keys: string[]) => {
    for (const key of keys) {
      const val = (item as any)[key];
      if (val && val !== 'N/A' && val !== '') return val;
    }
    return null;
  };

  // 1. UCC Expiration (Max 40 points)
  const expiryStr = getVal(['Expires', 'expires']);
  if (expiryStr) {
    const expiryDate = new Date(expiryStr);
    if (!isNaN(expiryDate.getTime())) {
      const now = new Date();
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

  const establishedStr = getVal(['Date Filed', 'establishedDate', 'Record Date']);
  let isRecentReg = false;
  let recentDays = 0;
  if (establishedStr) {
    const estDate = new Date(establishedStr);
    if (!isNaN(estDate.getTime())) {
      const now = new Date();
      recentDays = Math.ceil((now.getTime() - estDate.getTime()) / (1000 * 60 * 60 * 24));
      if (recentDays <= 90 && recentDays >= 0) isRecentReg = true;
    }
  }

  if (isNewType || isRecentReg) {
    total += 30;
    insights.push({ label: isRecentReg ? `Newly registered (${recentDays} days ago)` : 'New market entry', points: 30 });
  }

  // 3. Contactability (Max 20 points)
  const phone = getVal(['Phone', 'phone']);
  if (phone) {
    total += 15;
    insights.push({ label: 'Phone number available', points: 15 });
  }

  const website = getVal(['Website', 'website']);
  if (website) {
    total += 5;
    insights.push({ label: 'Website available', points: 5 });
  }

  // 4. Data Completeness (Max 10 points)
  const principal = getVal(['Key Principal', 'Officer/Director', 'keyPrincipal', 'DirectName']);
  if (principal) {
    total += 10;
    insights.push({ label: 'Key principal identified', points: 10 });
  }

  return {
    total: Math.min(total, 100),
    insights
  };
}
