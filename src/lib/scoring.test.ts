import { describe, it, expect } from 'vitest';
import { getScoreDetails } from './scoring';

describe('Scoring Logic', () => {
  it('should calculate UCC expiration score correctly', () => {
    const mockData = {
      Expires: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toLocaleDateString(), // 15 days from now
    };
    const details = getScoreDetails(mockData as any);
    expect(details.total).toBeGreaterThanOrEqual(40);
    expect(details.insights.some(i => i.label.includes('UCC expires'))).toBe(true);
  });

  it('should calculate new entity score correctly', () => {
    const mockData = {
      'Date Filed': new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toLocaleDateString(), // 10 days ago
    };
    const details = getScoreDetails(mockData as any);
    expect(details.total).toBe(30);
    expect(details.insights.some(i => i.label.includes('Newly registered'))).toBe(true);
  });

  it('should accumulate scores correctly', () => {
    const mockData = {
      Phone: '555-555-5555',
      Website: 'example.com',
      'Key Principal': 'John Doe'
    };
    const details = getScoreDetails(mockData as any);
    expect(details.total).toBe(15 + 5 + 10);
    expect(details.insights).toHaveLength(3);
  });

  it('should cap score at 100', () => {
    const mockData = {
      Expires: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      'Date Filed': new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      Phone: '555-555-5555',
      Website: 'example.com',
      'Key Principal': 'John Doe'
    };
    const details = getScoreDetails(mockData as any);
    expect(details.total).toBe(100);
  });
});
