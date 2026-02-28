import { BusinessLead } from '../types';
import { DataRow } from './dataService';
import { getInsightForCategory } from './industryKnowledge';

export interface OutreachTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  category: 'Email' | 'SMS' | 'Script';
}

export const DEFAULT_TEMPLATES: OutreachTemplate[] = [
  {
    id: 'temp-0',
    name: 'Reconnection & Scheduling',
    subject: 'Supporting the Growth of {{businessName}}',
    body: 'Hi {{contactName}},\n\nIt was a pleasure {{recentTalk}}. {{bankName}} offers a wide range of business accounts and banking services designed to support small and medium-sized businesses. From what you shared, it sounds like your primary need is {{primaryNeed}}. I want to ensure we recommend the best solutions for your goals.\n\nAfter speaking with my business banking partners, they suggested that the next best step is to schedule a call so we can better understand your financial needs. In general, they may ask a few key questions around revenue, project plans, and long‑term business objectives to determine the right product fit.\n\nThank you again for the connecting—exciting to hear about {{recentProject}}. I’d be happy to walk through growth strategies and financing options that can support this next phase.\n\nTopics We Can Review on Our Call:\n{{topicsList}}\n\nCan you give me a few days and times you are available. I’ll coordinate a meeting with my business banker at your convenience.\n\nLooking forward to connecting and supporting your continued growth.\n\nBest regards,\n[My Name]',
    category: 'Email'
  },
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

  const insight = getInsightForCategory(industry || '');

  const primaryNeed = insight?.overview?.toLowerCase().includes('construction')
    ? "financing to support materials, equipment, and project milestone payments"
    : insight?.overview?.toLowerCase().includes('real estate')
    ? "capital for property acquisition, renovation, and development timelines"
    : "financing to support operations and upcoming projects";

  const recentProject = insight?.overview?.toLowerCase().includes('construction')
    ? "your expansion into new developments and construction projects"
    : insight?.overview?.toLowerCase().includes('real estate')
    ? "your recent property acquisitions and development plans"
    : "your expansion and recent business developments";

  const recentTalk = "reconnecting with you";
  const topicsList = "• SBA Financing: Overview of SBA programs, qualification criteria, and timelines.\n• Business Lines of Credit: Flexible options to support cash flow, materials, and project timelines.\n• Term Loans & Business Funding: Solutions for equipment, property acquisition, or working capital for construction or renovation.\n• Growth Planning: Banking tools and structures designed for expanding development-focused businesses.";

  return text
    .replace(/{{businessName}}/g, businessName)
    .replace(/{{contactName}}/g, contactName || 'Business Owner')
    .replace(/{{industry}}/g, industry || 'local')
    .replace(/{{primaryNeed}}/g, primaryNeed)
    .replace(/{{recentProject}}/g, recentProject)
    .replace(/{{recentTalk}}/g, recentTalk)
    .replace(/{{topicsList}}/g, topicsList)
    .replace(/{{bankName}}/g, '[Bank Name]')
    .replace(/\[Bank Name\]/g, '[Bank Name]');
};

export const autoSelectTemplate = (data: DataRow | BusinessLead, templates: OutreachTemplate[]): string => {
  const expiry = (data as any).Expires || (data as any).expires;
  if (expiry && expiry !== 'N/A') return 'temp-1'; // UCC

  const type = (data as any)._type || (data as any).source;
  if (type === 'Last 90 Days') return 'temp-2'; // New Entity

  return templates[0]?.id || '';
};
