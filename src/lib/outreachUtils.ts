import { BusinessLead } from '../types';
import { DataRow } from './dataService';

export interface OutreachTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  category: 'Email' | 'SMS' | 'Script';
}

export const DEFAULT_TEMPLATES: OutreachTemplate[] = [
  {
    id: 'temp-1',
    name: 'UCC Renewal Intro',
    subject: 'Expiring UCC Filing - Action Required for {{businessName}}',
    body: 'Hello {{contactName}},\n\nI noticed that your current UCC filing for {{businessName}} is set to expire soon. Ensuring this remains active is critical for your current lending relationships.\n\nI would love to discuss how [Bank Name] can help you manage this renewal and explore potential refinancing options.\n\nBest regards,\n[My Name]',
    category: 'Email'
  },
  {
    id: 'temp-2',
    name: 'New Entity Welcome',
    subject: 'Supporting the Growth of {{businessName}}',
    body: 'Hi {{contactName}},\n\nCongratulations on your recent filing for {{businessName}}! Starting a new venture is an exciting milestone.\n\nAt [Bank Name], we specialize in supporting emerging businesses in the {{industry}} sector with tailored treasury and credit solutions.\n\nAre you available for a brief 5-minute intro call next week?',
    category: 'Email'
  },
  {
    id: 'temp-3',
    name: 'General Follow-up',
    subject: 'Checking in - {{businessName}}',
    body: 'Hi {{contactName}},\n\nI wanted to follow up on my previous message regarding {{businessName}}. We have some new solutions that might be relevant to your current operations.\n\nBest,\n[My Name]',
    category: 'Email'
  },
  {
    id: 'temp-4',
    name: 'Industry Intel Hook',
    subject: 'Efficiency Insights for {{businessName}}',
    body: 'Hello {{contactName}},\n\nI was recently reviewing industry benchmarks for the {{industry}} sector and noticed some interesting trends in operational efficiency that could impact {{businessName}}.\n\nI\'d love to share these insights with you and discuss how [Bank Name] is helping similar firms optimize their cash flow.\n\nBest regards,\n[My Name]',
    category: 'Email'
  }
];

export const getStoredTemplates = (): OutreachTemplate[] => {
  const saved = localStorage.getItem('outreach_templates');
  return saved ? JSON.parse(saved) : DEFAULT_TEMPLATES;
};

export const replacePlaceholders = (text: string, data: DataRow | BusinessLead) => {
  const isLead = 'businessName' in data && typeof (data as any).status === 'string';
  const businessName = isLead ? (data as BusinessLead).businessName : (data['businessName'] || data['Entity Name'] || 'Unknown Business');
  const contactName = isLead ? (data as BusinessLead).keyPrincipal : (data['Key Principal'] || data['Officer/Director'] || 'Business Owner');
  const industry = isLead ? (data as BusinessLead).industry : (data['Category'] || data['Category '] || 'local');

  return text
    .replace(/{{businessName}}/g, businessName)
    .replace(/{{contactName}}/g, contactName || 'Business Owner')
    .replace(/{{industry}}/g, industry || 'local');
};

export const autoSelectTemplate = (data: DataRow | BusinessLead, templates: OutreachTemplate[]): string => {
  const expiry = (data as any).Expires || (data as any).expires;
  if (expiry && expiry !== 'N/A') return 'temp-1'; // UCC

  const type = (data as any)._type || (data as any).source;
  if (type === 'Last 90 Days') return 'temp-2'; // New Entity

  return templates[0]?.id || '';
};
