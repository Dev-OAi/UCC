import { describe, it, expect } from 'vitest';
import { generateLeadIntelligence } from './aiUtils';
import { replacePlaceholders } from './outreachUtils';
import { BusinessLead, LeadStatus, LeadType } from '../types';

describe('AI Strategy & Outreach Intelligence', () => {
  const constructionLead: BusinessLead = {
    id: 'test-1',
    businessName: 'Build It Construction LLC',
    industry: 'Construction & Development',
    keyPrincipal: 'John Builder',
    status: LeadStatus.NEW,
    type: LeadType.PROSPECT,
    phone: '555-0123',
    email: 'john@buildit.com',
    website: 'www.buildit.com',
    location: 'West Palm Beach',
    zip: '33401',
    score: 85,
    lastUpdated: new Date().toISOString(),
    activities: []
  };

  it('generates growth strategy with focus on deposits and appointments', () => {
    const intelligence = generateLeadIntelligence(constructionLead, 'growth');
    expect(intelligence.strategy).toContain('Secured Lines of Credit');
    expect(intelligence.strategy).toContain('schedule a branch appointment');
    expect(intelligence.strategy).toContain('Construction & Development');
  });

  it('replaces placeholders with construction-specific context', () => {
    const templateBody = 'Hi {{contactName}},\n\nI’d be happy to walk through growth strategies for {{recentProject}}. Your primary need is {{primaryNeed}}.';
    const result = replacePlaceholders(templateBody, constructionLead);

    expect(result).toContain('John Builder');
    expect(result).toContain('expansion into new developments and construction projects');
    expect(result).toContain('financing to support materials, equipment, and project milestone payments');
  });

  it('recommends SBA and Business Bundles for construction leads', () => {
    const intelligence = generateLeadIntelligence(constructionLead, 'growth');
    expect(intelligence.strategy).toContain('SBA 7(a) Financing');
    expect(intelligence.strategy).toContain('SMB Bundle 3 (AT 552)');
  });

  it('includes the new topics list and schedule CTA in the email draft', () => {
    const intelligence = generateLeadIntelligence(constructionLead, 'growth');
    expect(intelligence.email).toContain('Topics We Can Review on Our Call:');
    expect(intelligence.email).toContain('SBA Financing: Overview of SBA programs');
    expect(intelligence.email).toContain('Can you give me a few days and times you are available');
  });
});
